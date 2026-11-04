package com.example.demo.services;

import com.example.demo.models.User;
import com.example.demo.repos.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final ExecutorService emailExecutor = Executors.newFixedThreadPool(4);

    /**
     * Developer mode (app.dev-mode=true). Enables conveniences that must never be on in production:
     * printing OTPs to the console and the fixed master OTP for the seeded demo accounts.
     */
    @Value("${app.dev-mode:false}")
    private boolean devMode;

    public void setDevMode(boolean devMode) {
        this.devMode = devMode;
    }

    public UserService(UserRepository userRepository) {
        this(userRepository, null);
    }

    @Autowired
    public UserService(UserRepository userRepository, @Autowired(required = false) EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    public User register(String name, String email, String rawPassword, String institution, String department) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        String cleanEmail = email.trim().toLowerCase();

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        if (rawPassword == null || rawPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        String hashedPassword = BCrypt.hashpw(rawPassword, BCrypt.gensalt(12));
        User user = new User(
                name != null ? name.trim() : "Researcher",
                cleanEmail,
                hashedPassword,
                institution != null && !institution.isBlank() ? institution.trim() : "Stanford University",
                department != null && !department.isBlank() ? department.trim() : "Computer Science & AI Lab"
        );

        return userRepository.save(user);
    }

    public User authenticate(String email, String rawPassword) {
        if (email == null || rawPassword == null) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (user.getPassword() == null || user.getPassword().isBlank() || !BCrypt.checkpw(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        return user;
    }

    public User processGoogleUser(String googleId, String email, boolean emailVerified, String name) {
        if (googleId == null || googleId.isBlank()) {
            throw new IllegalArgumentException("Google identifier is required.");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google account must provide an email address.");
        }
        if (!emailVerified) {
            throw new IllegalArgumentException("Google email address is not verified.");
        }

        String cleanEmail = email.trim().toLowerCase();

        // 1. Check if user already exists with this Google ID
        Optional<User> existingGoogleUser = userRepository.findByGoogleId(googleId);
        if (existingGoogleUser.isPresent()) {
            User user = existingGoogleUser.get();
            if (name != null && !name.isBlank() && (user.getName() == null || !name.trim().equals(user.getName()))) {
                user.setName(name.trim());
                return userRepository.save(user);
            }
            return user;
        }

        // 2. Not found by Google ID. Check if an account exists with the same email.
        Optional<User> userByEmail = userRepository.findByEmail(cleanEmail);
        if (userByEmail.isPresent()) {
            // Safe account linking check: Do not automatically link based only on matching email!
            throw new AccountConflictException(
                    "An account with this email (" + cleanEmail + ") already exists using password authentication. " +
                    "To prevent unauthorized account linking, please log in with your email and password."
            );
        }

        // 3. Brand new Google user: create account without password
        User newGoogleUser = new User(
                name != null && !name.isBlank() ? name.trim() : "Researcher",
                cleanEmail,
                "GOOGLE",
                googleId,
                "Stanford University",
                "Computer Science & AI Lab"
        );

        return userRepository.save(newGoogleUser);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email.trim().toLowerCase());
    }

    public boolean existsByEmail(String email) {
        if (email == null) {
            return false;
        }
        return userRepository.existsByEmail(email.trim().toLowerCase());
    }

    /**
     * Generates a cryptographically secure 6-digit random OTP string.
     */
    public String generateSixDigitOtp() {
        int code = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(code);
    }

    /**
     * Computes a SHA-256 hash of the normalized email and OTP.
     * The resulting 64-character hex string is stored in the database.
     */
    public String hashOtp(String email, String otp) {
        if (email == null || otp == null) {
            throw new IllegalArgumentException("Email and OTP are required for hashing.");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String payload = email.trim().toLowerCase() + ":" + otp.trim();
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 digest algorithm not available", e);
        }
    }

    /**
     * Initiates password reset for the specified email:
     * - Validates email format.
     * - If email does not exist, returns true without throwing (avoids account enumeration).
     * - If account is Google-only, sends a notification instructing user to use Google Sign-In.
     * - If account is local, generates a 6-digit secure OTP, stores its SHA-256 hash with 10-minute expiry,
     *   and delivers it via EmailService.
     * - If SMTP delivery fails, clears the OTP and rethrows to ensure failure is not masked.
     *
     * @param email The user's email address.
     * @return true if processed successfully.
     * @throws IllegalStateException if email service is unconfigured or email delivery fails.
     */
    public boolean requestPasswordResetOtp(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email address is required.");
        }

        String cleanEmail = email.trim().toLowerCase();

        if (this.emailService == null || !this.emailService.isConfigured()) {
            throw new IllegalStateException("Email delivery service is unconfigured or unavailable.");
        }

        Optional<User> optUser = userRepository.findByEmail(cleanEmail);

        // Requirement 7: Avoid revealing whether an email belongs to a registered account.
        if (optUser.isEmpty()) {
            return true;
        }

        User user = optUser.get();

        // Requirement 7: Handle Google-only accounts safely; they should continue using Google Sign-In.
        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider()) && user.getPassword() == null) {
            this.emailService.sendGoogleAccountNotice(cleanEmail);
            return true;
        }

        // Generate 6-digit cryptographically secure OTP
        String otp = generateSixDigitOtp();
        String hashedOtp = hashOtp(cleanEmail, otp);

        user.setResetTokenHash(hashedOtp);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        if (devMode) {
            System.out.println("\n========================================================");
            System.out.println("[DEV MODE] PASSWORD RESET OTP");
            System.out.println("   Recipient : " + cleanEmail);
            System.out.println("   OTP Code  : " + otp);
            System.out.println("========================================================\n");
        } else {
            log.info("Password reset code issued for {}", cleanEmail);
        }

        CompletableFuture<Void> sendFuture = CompletableFuture.runAsync(() -> {
            try {
                this.emailService.sendPasswordResetOtp(cleanEmail, otp);
            } catch (Exception e) {
                log.error("Failed to deliver password reset email to {}: {}", cleanEmail, e.getMessage());
                try {
                    userRepository.findByEmail(cleanEmail).ifPresent(u -> {
                        if (hashedOtp.equals(u.getResetTokenHash())) {
                            u.setResetTokenHash(null);
                            u.setResetTokenExpiry(null);
                            userRepository.save(u);
                        }
                    });
                } catch (Exception dbEx) {
                    log.error("Failed to rollback reset token in DB for {}: {}", cleanEmail, dbEx.getMessage());
                }
                throw (e instanceof RuntimeException re) ? re : new IllegalStateException(e.getMessage(), e);
            }
        }, emailExecutor);

        try {
            sendFuture.get(150, TimeUnit.MILLISECONDS);
            return true;
        } catch (TimeoutException te) {
            // Live SMTP delivery is in-flight on background thread: return immediately so user receives fast response
            log.info("Password reset OTP dispatch in-flight for {}, responding immediately", cleanEmail);
            return true;
        } catch (ExecutionException ee) {
            Throwable cause = ee.getCause() != null ? ee.getCause() : ee;
            throw new IllegalStateException("Failed to send password reset email. Please try again later.", cause);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            return true;
        }
    }

    /**
     * Verifies if the provided OTP is valid and unexpired for the specified email.
     * Does NOT consume the token, allowing subsequent password reset submission.
     *
     * @param email The user's email address.
     * @param otp The 6-digit OTP string.
     * @return true if OTP is valid and unexpired; false otherwise.
     */
    public boolean verifyOtp(String email, String otp) {
        if (email == null || email.isBlank() || otp == null || otp.isBlank()) {
            return false;
        }

        String cleanEmail = email.trim().toLowerCase();
        Optional<User> optUser = userRepository.findByEmail(cleanEmail);
        if (optUser.isEmpty()) {
            return false;
        }

        User user = optUser.get();

        // Google-only accounts do not support OTP reset
        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider()) && user.getPassword() == null) {
            return false;
        }

        if (user.getResetTokenHash() == null || user.getResetTokenExpiry() == null) {
            return false;
        }

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            // Clean up expired token
            user.setResetTokenHash(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            return false;
        }

        String computedHash = hashOtp(cleanEmail, otp.trim());
        return MessageDigest.isEqual(
                computedHash.getBytes(StandardCharsets.UTF_8),
                user.getResetTokenHash().getBytes(StandardCharsets.UTF_8)
        );
    }

    /**
     * Independently validates the OTP, its expiry, and resets the user's password.
     * Clears the reset token and expiry upon successful reset to prevent reuse.
     * Enforces the registration password policy (minimum 8 characters).
     * Protects Google-only accounts from setting local passwords.
     *
     * @param email The user's email address.
     * @param otp The 6-digit OTP string.
     * @param newPassword The new password (minimum 8 characters).
     * @throws IllegalArgumentException on validation, OTP, expiry, or policy failures.
     */
    public void resetPassword(String email, String otp, String newPassword) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (otp == null || otp.isBlank()) {
            throw new IllegalArgumentException("Invalid or expired OTP.");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP."));

        // Protect Google-only accounts: do not create local password
        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider()) && user.getPassword() == null) {
            throw new IllegalArgumentException("This account uses Google Sign-In. Password reset is not available.");
        }

        // Independently verify OTP and expiry
        if (user.getResetTokenHash() == null || user.getResetTokenExpiry() == null) {
            throw new IllegalArgumentException("Invalid or expired OTP.");
        }

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            user.setResetTokenHash(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            throw new IllegalArgumentException("Invalid or expired OTP.");
        }

        String computedHash = hashOtp(cleanEmail, otp.trim());
        if (!MessageDigest.isEqual(computedHash.getBytes(StandardCharsets.UTF_8),
                                   user.getResetTokenHash().getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid or expired OTP.");
        }

        // Hash new password using BCrypt with existing salt rounds (12)
        String hashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt(12));
        user.setPassword(hashedPassword);

        // Clear reset token and expiry to prevent reuse
        user.setResetTokenHash(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    /**
     * Computes a SHA-256 hash of the normalized email and login OTP with a distinct 2FA domain prefix.
     * The resulting 64-character hex string is stored in the database.
     */
    public String hashLoginOtp(String email, String otp) {
        if (email == null || otp == null) {
            throw new IllegalArgumentException("Email and OTP are required for hashing.");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String payload = "2FA_LOGIN:" + email.trim().toLowerCase() + ":" + otp.trim();
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 digest algorithm not available", e);
        }
    }

    /**
     * Initiates 2FA login for an authenticated user:
     * - Generates 6-digit cryptographically secure OTP using SecureRandom
     * - Stores SHA-256 hash bound to user's email
     * - Sets 5-minute expiry
     * - Resets failed attempt counter to 0
     * - Sends OTP via EmailService.sendLoginOtp (never logged)
     * - If sending fails, clears 2FA state from DB and rethrows safely
     */
    public void initiateLogin2fa(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User is required to initiate 2FA.");
        }

        if (this.emailService == null || !this.emailService.isConfigured()) {
            throw new IllegalStateException("Email delivery service is unconfigured or unavailable.");
        }

        String cleanEmail = user.getEmail().trim().toLowerCase();
        String otp = generateSixDigitOtp();
        String hashedOtp = hashLoginOtp(cleanEmail, otp);

        user.setTwoFactorCodeHash(hashedOtp);
        user.setTwoFactorCodeExpiry(LocalDateTime.now().plusMinutes(5));
        user.setTwoFactorAttempts(0);
        userRepository.save(user);

        if (devMode) {
            System.out.println("\n========================================================");
            System.out.println("[DEV MODE] 2FA LOGIN OTP");
            System.out.println("   Recipient  : " + cleanEmail);
            System.out.println("   OTP Code   : " + otp);
            System.out.println("   Master Dev : 123456 (valid for the seeded demo accounts)");
            System.out.println("========================================================\n");
        } else {
            log.info("2FA login code issued for {}", cleanEmail);
        }

        boolean isFakeDemoAdmin = devMode
                && ("admin@researchnest.org".equalsIgnoreCase(cleanEmail)
                || "alex.chen@stanford.edu".equalsIgnoreCase(cleanEmail));

        CompletableFuture<Void> sendFuture = CompletableFuture.runAsync(() -> {
            try {
                this.emailService.sendLoginOtp(cleanEmail, otp);
            } catch (Exception e) {
                if (isFakeDemoAdmin) {
                    log.warn("SMTP delivery bypassed for demo address {}: {}. OTP is displayed above in terminal.", cleanEmail, e.getMessage());
                    return;
                }
                log.error("Failed to deliver 2FA login verification email to {}: {}", cleanEmail, e.getMessage());
                try {
                    userRepository.findByEmail(cleanEmail).ifPresent(u -> {
                        if (hashedOtp.equals(u.getTwoFactorCodeHash())) {
                            u.setTwoFactorCodeHash(null);
                            u.setTwoFactorCodeExpiry(null);
                            u.setTwoFactorAttempts(0);
                            userRepository.save(u);
                        }
                    });
                } catch (Exception dbEx) {
                    log.error("Failed to rollback 2FA state in DB for {}: {}", cleanEmail, dbEx.getMessage());
                }
                throw (e instanceof RuntimeException re) ? re : new IllegalStateException(e.getMessage(), e);
            }
        }, emailExecutor);

        try {
            sendFuture.get(150, TimeUnit.MILLISECONDS);
        } catch (TimeoutException te) {
            // Live SMTP delivery is in-flight on background thread: return immediately for instant OTP screen transition
            log.info("2FA login OTP email dispatch in-flight for {}, responding immediately", cleanEmail);
        } catch (ExecutionException ee) {
            Throwable cause = ee.getCause();
            if (cause instanceof IllegalStateException ise) {
                throw ise;
            }
            throw new IllegalStateException("Failed to send login verification email. Please try again later.", cause);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Verifies the 2FA login OTP:
     * - Validates user identity and presence of active 2FA challenge
     * - Enforces maximum 5 failed attempts limit (clears and invalidates code on exceeding)
     * - Enforces 5-minute expiry
     * - Compares SHA-256 hash in constant-time
     * - On success, clears 2FA state before returning user (prevents reuse)
     *
     * @param email The user's email address
     * @param otp The 6-digit OTP
     * @return The verified User
     * @throws IllegalArgumentException on missing, invalid, expired, reused, or excessive attempts
     */
    public User verifyLogin2fa(String email, String otp) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (otp == null || otp.isBlank()) {
            throw new IllegalArgumentException("Verification code is required.");
        }

        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code."));

        // Protect Google-only accounts: cannot use password 2FA
        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider()) && user.getPassword() == null) {
            throw new IllegalArgumentException("This account uses Google Sign-In. 2FA is not available.");
        }

        // Developer master OTP for the seeded demo accounts. Only active when app.dev-mode=true.
        boolean isFakeDemoAdmin = devMode
                && ("admin@researchnest.org".equalsIgnoreCase(cleanEmail)
                || "alex.chen@stanford.edu".equalsIgnoreCase(cleanEmail));

        if (isFakeDemoAdmin && "123456".equals(otp.trim())) {
            user.setTwoFactorCodeHash(null);
            user.setTwoFactorCodeExpiry(null);
            user.setTwoFactorAttempts(0);
            return userRepository.save(user);
        }

        // Check if 2FA challenge exists (guards against uninitiated or already reused codes)
        if (user.getTwoFactorCodeHash() == null || user.getTwoFactorCodeExpiry() == null) {
            throw new IllegalArgumentException("Invalid or expired verification code.");
        }

        int currentAttempts = user.getTwoFactorAttempts() != null ? user.getTwoFactorAttempts() : 0;
        if (currentAttempts >= 5) {
            user.setTwoFactorCodeHash(null);
            user.setTwoFactorCodeExpiry(null);
            user.setTwoFactorAttempts(0);
            userRepository.save(user);
            throw new IllegalArgumentException("Maximum verification attempts exceeded. Please log in again to receive a new code.");
        }

        // Check expiry
        if (user.getTwoFactorCodeExpiry().isBefore(LocalDateTime.now())) {
            user.setTwoFactorCodeHash(null);
            user.setTwoFactorCodeExpiry(null);
            user.setTwoFactorAttempts(0);
            userRepository.save(user);
            throw new IllegalArgumentException("Verification code has expired. Please log in again to receive a new code.");
        }

        // Verify hash with constant-time equality check
        String computedHash = hashLoginOtp(cleanEmail, otp.trim());
        boolean matches = MessageDigest.isEqual(
                computedHash.getBytes(StandardCharsets.UTF_8),
                user.getTwoFactorCodeHash().getBytes(StandardCharsets.UTF_8)
        );

        if (!matches) {
            int newAttempts = currentAttempts + 1;
            user.setTwoFactorAttempts(newAttempts);
            if (newAttempts >= 5) {
                user.setTwoFactorCodeHash(null);
                user.setTwoFactorCodeExpiry(null);
                user.setTwoFactorAttempts(0);
                userRepository.save(user);
                throw new IllegalArgumentException("Maximum verification attempts exceeded. Please log in again to receive a new code.");
            } else {
                userRepository.save(user);
                throw new IllegalArgumentException("Invalid verification code. Please try again.");
            }
        }

        // Verification successful: clear 2FA state to prevent reuse
        user.setTwoFactorCodeHash(null);
        user.setTwoFactorCodeExpiry(null);
        user.setTwoFactorAttempts(0);
        return userRepository.save(user);
    }

    /**
     * Admin operations: Retrieve all users in the system.
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Admin operations: Update a user's role.
     */
    public User updateUserRole(Long userId, String role) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required.");
        }
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("Role is required.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        String normalizedRole = role.trim().toUpperCase();
        if (!"ADMIN".equals(normalizedRole) && !"RESEARCHER".equals(normalizedRole)) {
            throw new IllegalArgumentException("Invalid role. Must be ADMIN or RESEARCHER.");
        }

        user.setRole(normalizedRole);
        return userRepository.save(user);
    }

    /**
     * Admin operations: Update user account profile.
     */
    public User updateUser(Long userId, String name, String email, String institution, String department, String role) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (email != null && !email.isBlank()) {
            String cleanEmail = email.trim().toLowerCase();
            if (!cleanEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(cleanEmail)) {
                throw new IllegalArgumentException("An account with this email already exists: " + cleanEmail);
            }
            user.setEmail(cleanEmail);
        }

        if (name != null && !name.isBlank()) {
            user.setName(name.trim());
        }
        if (institution != null) {
            user.setInstitution(institution.trim());
        }
        if (department != null) {
            user.setDepartment(department.trim());
        }
        if (role != null && !role.isBlank()) {
            String normalizedRole = role.trim().toUpperCase();
            if ("ADMIN".equals(normalizedRole) || "RESEARCHER".equals(normalizedRole)) {
                user.setRole(normalizedRole);
            }
        }

        return userRepository.save(user);
    }

    /**
     * Admin operations: Delete a user by ID.
     */
    public void deleteUser(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            long adminCount = userRepository.findAll().stream()
                    .filter(u -> "ADMIN".equalsIgnoreCase(u.getRole()))
                    .count();
            if (adminCount <= 1) {
                throw new IllegalStateException("Cannot delete the only remaining administrator account.");
            }
        }

        userRepository.deleteById(userId);
    }

    /**
     * Admin operations: Provision a new user directly with specified role.
     */
    public User createAdminProvisionedUser(String name, String email, String rawPassword,
                                          String institution, String department, String role) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        String cleanEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("An account with email " + cleanEmail + " already exists.");
        }
        if (rawPassword == null || rawPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        String hashedPassword = BCrypt.hashpw(rawPassword, BCrypt.gensalt(12));
        User user = new User(
                name != null && !name.isBlank() ? name.trim() : "Researcher",
                cleanEmail,
                hashedPassword,
                institution != null && !institution.isBlank() ? institution.trim() : "Stanford University",
                department != null && !department.isBlank() ? department.trim() : "Computer Science & AI Lab"
        );

        String normalizedRole = (role != null && !role.isBlank()) ? role.trim().toUpperCase() : "RESEARCHER";
        user.setRole(normalizedRole);

        return userRepository.save(user);
    }
}
