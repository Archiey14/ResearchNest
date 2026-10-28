package com.example.demo;

import com.example.demo.controllers.AuthController;
import com.example.demo.models.User;
import com.example.demo.repos.UserRepository;
import com.example.demo.services.EmailService;
import com.example.demo.services.EmailServiceImpl;
import com.example.demo.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class PasswordResetServiceTest {

    @Autowired
    private UserRepository userRepository;

    private MockEmailService mockEmailService;
    private UserService customUserService;
    private AuthController customAuthController;
    private MockMvc mockMvc;

    static class MockEmailService implements EmailService {
        private boolean configured = true;
        private boolean shouldFail = false;
        private String lastRecipient;
        private String lastOtp;
        private boolean googleNoticeSent = false;

        public void setConfigured(boolean configured) {
            this.configured = configured;
        }

        public void setShouldFail(boolean shouldFail) {
            this.shouldFail = shouldFail;
        }

        @Override
        public boolean isConfigured() {
            return configured;
        }

        @Override
        public void sendPasswordResetOtp(String toEmail, String otp) {
            if (shouldFail) {
                throw new IllegalStateException("Simulated SMTP delivery failure");
            }
            this.lastRecipient = toEmail;
            this.lastOtp = otp;
        }

        @Override
        public void sendLoginOtp(String toEmail, String otp) {
            if (shouldFail) {
                throw new IllegalStateException("Simulated SMTP delivery failure");
            }
            this.lastRecipient = toEmail;
            this.lastOtp = otp;
        }

        @Override
        public void sendGoogleAccountNotice(String toEmail) {
            if (shouldFail) {
                throw new IllegalStateException("Simulated SMTP delivery failure");
            }
            this.lastRecipient = toEmail;
            this.googleNoticeSent = true;
        }
    }

    @BeforeEach
    void setUp() {
        mockEmailService = new MockEmailService();
        customUserService = new UserService(userRepository, mockEmailService);
        customAuthController = new AuthController(customUserService);
        mockMvc = MockMvcBuilders.standaloneSetup(customAuthController).build();
    }

    @Test
    @DisplayName("OTP generation produces cryptographically secure 6-digit numeric strings")
    void testOtpGenerationIsSixDigits() {
        for (int i = 0; i < 50; i++) {
            String otp = customUserService.generateSixDigitOtp();
            assertNotNull(otp);
            assertEquals(6, otp.length(), "OTP must be exactly 6 digits");
            assertTrue(otp.matches("^[0-9]{6}$"), "OTP must contain only digits");
            int val = Integer.parseInt(otp);
            assertTrue(val >= 100000 && val <= 999999, "OTP must be in range 100000-999999");
        }
    }

    @Test
    @DisplayName("SHA-256 hash associates normalized email and OTP into 64-character hex string")
    void testSha256HashingAssociatesEmail() {
        String email = "Researcher@University.EDU";
        String otp = "123456";

        String hash1 = customUserService.hashOtp(email, otp);
        String hash2 = customUserService.hashOtp("researcher@university.edu", otp);

        assertNotNull(hash1);
        assertEquals(64, hash1.length(), "SHA-256 hex must be exactly 64 characters");
        assertTrue(hash1.matches("^[a-f0-9]{64}$"), "Hash must be lowercase hex characters");
        assertEquals(hash1, hash2, "Hashing must normalize email case");

        // Different OTP produces different hash
        String hashDifferentOtp = customUserService.hashOtp(email, "654321");
        assertNotEquals(hash1, hashDifferentOtp);

        // Different email produces different hash
        String hashDifferentEmail = customUserService.hashOtp("other@university.edu", otp);
        assertNotEquals(hash1, hashDifferentEmail);
    }

    @Test
    @DisplayName("Requesting OTP for local user generates hash, sets 10m expiry, and sends email")
    void testRequestOtpSuccessForLocalUser() {
        long timestamp = System.currentTimeMillis();
        String email = "reset_user_" + timestamp + "@stanford.edu";
        User user = customUserService.register("Marie Curie", email, "SecurePass123!", "Stanford", "Physics");

        boolean result = customUserService.requestPasswordResetOtp(email);
        assertTrue(result);

        // Verify email service captured dispatch
        assertEquals(email, mockEmailService.lastRecipient);
        assertNotNull(mockEmailService.lastOtp);
        assertEquals(6, mockEmailService.lastOtp.length());

        // Verify database state
        Optional<User> updatedUserOpt = userRepository.findByEmail(email);
        assertTrue(updatedUserOpt.isPresent());
        User updatedUser = updatedUserOpt.get();

        assertNotNull(updatedUser.getResetTokenHash());
        assertEquals(64, updatedUser.getResetTokenHash().length());
        assertEquals(customUserService.hashOtp(email, mockEmailService.lastOtp), updatedUser.getResetTokenHash());

        assertNotNull(updatedUser.getResetTokenExpiry());
        assertTrue(updatedUser.getResetTokenExpiry().isAfter(LocalDateTime.now().plusMinutes(8)));
        assertTrue(updatedUser.getResetTokenExpiry().isBefore(LocalDateTime.now().plusMinutes(11)));
    }

    @Test
    @DisplayName("Email delivery failure rolls back OTP fields in database and throws exception")
    void testEmailDeliveryFailureRollsBackOtpAndThrows() {
        long timestamp = System.currentTimeMillis();
        String email = "fail_user_" + timestamp + "@stanford.edu";
        customUserService.register("Niels Bohr", email, "SecurePass123!", "Stanford", "Physics");

        mockEmailService.setShouldFail(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            customUserService.requestPasswordResetOtp(email);
        });
        assertTrue(ex.getMessage().contains("Failed to send password reset email"));

        // Verify token was rolled back and not left in database
        Optional<User> userOpt = userRepository.findByEmail(email);
        assertTrue(userOpt.isPresent());
        assertNull(userOpt.get().getResetTokenHash(), "Token hash must be null after delivery failure");
        assertNull(userOpt.get().getResetTokenExpiry(), "Token expiry must be null after delivery failure");
    }

    @Test
    @DisplayName("Requesting OTP fails safely when email service is unconfigured")
    void testRequestOtpFailsWhenEmailServiceUnconfigured() {
        long timestamp = System.currentTimeMillis();
        String email = "unconfigured_" + timestamp + "@stanford.edu";
        customUserService.register("Max Planck", email, "SecurePass123!", "Stanford", "Physics");

        mockEmailService.setConfigured(false);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            customUserService.requestPasswordResetOtp(email);
        });
        assertTrue(ex.getMessage().contains("unconfigured or unavailable"));
    }

    @Test
    @DisplayName("Non-existent email does not reveal account presence and returns true cleanly")
    void testNonExistentEmailDoesNotRevealAccount() {
        boolean result = customUserService.requestPasswordResetOtp("nonexistent_researcher_xyz@nowhere.edu");
        assertTrue(result, "Should return true cleanly to avoid account enumeration");
        assertNull(mockEmailService.lastOtp, "No OTP should be dispatched for non-existent account");
    }

    @Test
    @DisplayName("Google-only account receives notice to use Google Sign-In and no password OTP is saved")
    void testGoogleOnlyAccountSendsNoticeInsteadOfOtp() {
        long timestamp = System.currentTimeMillis();
        String googleId = "gid_reset_" + timestamp;
        String email = "google_reset_" + timestamp + "@berkeley.edu";
        customUserService.processGoogleUser(googleId, email, true, "Barbara McClintock");

        boolean result = customUserService.requestPasswordResetOtp(email);
        assertTrue(result);
        assertTrue(mockEmailService.googleNoticeSent, "Should dispatch Google Sign-In notice");
        assertNull(mockEmailService.lastOtp, "No password reset OTP should be sent to Google account");

        // Verify no OTP was set on user
        Optional<User> userOpt = userRepository.findByEmail(email);
        assertTrue(userOpt.isPresent());
        assertNull(userOpt.get().getResetTokenHash(), "Google account must not have reset token hash");
    }

    @Test
    @DisplayName("Valid OTP verifies successfully via service and POST /api/auth/verify-otp endpoint")
    void testVerifyOtpValid() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "verify_valid_" + timestamp + "@stanford.edu";
        customUserService.register("Lise Meitner", email, "InitialPass123!", "Stanford", "Physics");

        customUserService.requestPasswordResetOtp(email);
        String otp = mockEmailService.lastOtp;
        assertNotNull(otp);

        // Test service
        assertTrue(customUserService.verifyOtp(email, otp), "Service should verify correct OTP");

        // Test REST endpoint
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP verified successfully."));
    }

    @Test
    @DisplayName("Incorrect OTP is rejected by service and returns 400 from POST /api/auth/verify-otp")
    void testVerifyOtpIncorrect() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "verify_bad_" + timestamp + "@stanford.edu";
        customUserService.register("Ernest Rutherford", email, "InitialPass123!", "Stanford", "Physics");

        customUserService.requestPasswordResetOtp(email);

        // Test service
        assertFalse(customUserService.verifyOtp(email, "000000"), "Service should reject incorrect OTP");

        // Test REST endpoint
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"000000\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired OTP."));
    }

    @Test
    @DisplayName("Expired OTP is rejected by service and returns 400 from POST /api/auth/verify-otp")
    void testVerifyOtpExpired() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "verify_expired_" + timestamp + "@stanford.edu";
        customUserService.register("Enrico Fermi", email, "InitialPass123!", "Stanford", "Physics");

        customUserService.requestPasswordResetOtp(email);
        String otp = mockEmailService.lastOtp;

        // Force expiry in database
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setResetTokenExpiry(LocalDateTime.now().minusMinutes(1));
        userRepository.save(user);

        // Test service
        assertFalse(customUserService.verifyOtp(email, otp), "Service should reject expired OTP");

        // Test REST endpoint
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired OTP."));
    }

    @Test
    @DisplayName("Successful password reset updates password, clears token & expiry, and permits authentication")
    void testSuccessfulPasswordReset() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "reset_success_" + timestamp + "@stanford.edu";
        customUserService.register("Rosalind Franklin", email, "OldPassword123!", "Stanford", "Biology");

        customUserService.requestPasswordResetOtp(email);
        String otp = mockEmailService.lastOtp;

        // Perform password reset via endpoint
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\",\"newPassword\":\"NewSecurePassword123!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password has been reset successfully. You can now log in with your new password."));

        // Verify user can log in with new password
        User authenticated = customUserService.authenticate(email, "NewSecurePassword123!");
        assertNotNull(authenticated);

        // Verify old password no longer works
        assertThrows(IllegalArgumentException.class, () -> customUserService.authenticate(email, "OldPassword123!"));

        // Verify reset token fields were cleared in DB
        User dbUser = userRepository.findByEmail(email).orElseThrow();
        assertNull(dbUser.getResetTokenHash(), "resetTokenHash must be cleared after reset");
        assertNull(dbUser.getResetTokenExpiry(), "resetTokenExpiry must be cleared after reset");
    }

    @Test
    @DisplayName("Password reset prevents OTP reuse: second attempt with same OTP is rejected")
    void testPasswordResetPreventsOtpReuse() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "reuse_otp_" + timestamp + "@stanford.edu";
        customUserService.register("Dorothy Hodgkin", email, "FirstPassword123!", "Stanford", "Chemistry");

        customUserService.requestPasswordResetOtp(email);
        String otp = mockEmailService.lastOtp;

        // First reset succeeds
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\",\"newPassword\":\"SecondPassword123!\"}"))
                .andExpect(status().isOk());

        // Reusing the same OTP must fail with 400 Bad Request
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\",\"newPassword\":\"ThirdPassword123!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired OTP."));

        // Verifying the consumed OTP must also fail
        assertFalse(customUserService.verifyOtp(email, otp));
    }

    @Test
    @DisplayName("Password reset rejects incorrect OTP and leaves original password intact")
    void testPasswordResetRejectsIncorrectOtp() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "bad_otp_reset_" + timestamp + "@stanford.edu";
        customUserService.register("James Maxwell", email, "MaxwellEquation123!", "Stanford", "Physics");

        customUserService.requestPasswordResetOtp(email);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"999999\",\"newPassword\":\"AttemptedPassword123!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired OTP."));

        // Original password must still authenticate
        assertNotNull(customUserService.authenticate(email, "MaxwellEquation123!"));
    }

    @Test
    @DisplayName("Password reset rejects expired OTP and leaves original password intact")
    void testPasswordResetRejectsExpiredOtp() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "expired_reset_" + timestamp + "@stanford.edu";
        customUserService.register("Chien-Shiung Wu", email, "PhysicsWu123!", "Stanford", "Physics");

        customUserService.requestPasswordResetOtp(email);
        String otp = mockEmailService.lastOtp;

        // Expire token in database
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setResetTokenExpiry(LocalDateTime.now().minusMinutes(5));
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\",\"newPassword\":\"AttemptedPassword123!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired OTP."));

        // Original password must still authenticate
        assertNotNull(customUserService.authenticate(email, "PhysicsWu123!"));
    }

    @Test
    @DisplayName("Password reset enforces registration password policy: rejects passwords shorter than 8 chars")
    void testPasswordResetEnforcesPasswordPolicy() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "short_pw_reset_" + timestamp + "@stanford.edu";
        customUserService.register("Richard Feynman", email, "FeynmanDiagrams123!", "Stanford", "Physics");

        customUserService.requestPasswordResetOtp(email);
        String otp = mockEmailService.lastOtp;

        // Attempt reset with 5-character password
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\",\"newPassword\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Password must be at least 8 characters long."));

        // Original password must still authenticate
        assertNotNull(customUserService.authenticate(email, "FeynmanDiagrams123!"));
    }

    @Test
    @DisplayName("Google-only accounts are protected: cannot verify OTP or reset password, password remains null")
    void testGoogleOnlyAccountProtectedFromPasswordReset() throws Exception {
        long timestamp = System.currentTimeMillis();
        String googleId = "gid_pwprotect_" + timestamp;
        String email = "google_protect_" + timestamp + "@caltech.edu";
        customUserService.processGoogleUser(googleId, email, true, "Linus Pauling");

        // Verify OTP call fails
        assertFalse(customUserService.verifyOtp(email, "123456"));

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"123456\"}"))
                .andExpect(status().isBadRequest());

        // Reset attempt fails
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"123456\",\"newPassword\":\"SneakyPassword123!\"}"))
                .andExpect(status().isBadRequest());

        // Verify database user still has null password and no reset token
        User user = userRepository.findByEmail(email).orElseThrow();
        assertNull(user.getPassword(), "Google-only account password must remain null");
        assertNull(user.getResetTokenHash(), "Google-only account must have null resetTokenHash");
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password handles valid, non-existent, and empty emails correctly")
    void testForgotPasswordEndpointBehaviors() throws Exception {
        long timestamp = System.currentTimeMillis();
        String validEmail = "forgot_endpoint_" + timestamp + "@stanford.edu";
        customUserService.register("Subrahmanyan Chandrasekhar", validEmail, "StellarMass123!", "Stanford", "Physics");

        // 1. Valid local account
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + validEmail + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an account with that email exists, a password reset OTP has been sent."));
        assertEquals(validEmail, mockEmailService.lastRecipient);
        assertNotNull(mockEmailService.lastOtp);

        // 2. Non-existent account (Anti-enumeration: returns 200 with same generic message)
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"unregistered_user_" + timestamp + "@nowhere.edu\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an account with that email exists, a password reset OTP has been sent."));

        // 3. Missing/blank email returns 400 Bad Request
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email is required."));
    }

    @Test
    @DisplayName("EmailServiceImpl logs and captures SMTP exception details without leaking OTP")
    void testEmailServiceImplDiagnosticLoggingAndWrappingOnSmtpFailure() {
        JavaMailSender failingSender = (JavaMailSender) Proxy.newProxyInstance(
                JavaMailSender.class.getClassLoader(),
                new Class<?>[]{JavaMailSender.class},
                (proxy, method, args) -> {
                    if ("send".equals(method.getName())) {
                        throw new MailSendException("535-5.7.8 Username and Password not accepted");
                    }
                    return null;
                }
        );

        EmailServiceImpl emailService = new EmailServiceImpl(failingSender, "no-reply@researchnest.org");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            emailService.sendPasswordResetOtp("researcher@stanford.edu", "789123");
        });

        assertNotNull(ex.getCause());
        assertInstanceOf(MailSendException.class, ex.getCause());
        assertTrue(ex.getMessage().contains("535-5.7.8 Username and Password not accepted"),
                "Exception message should include SMTP diagnostic error details");
        assertFalse(ex.getMessage().contains("789123"),
                "Exception message must never log or expose the OTP");
    }

    @Test
    @DisplayName("EmailServiceImpl wraps SMTP exception for Google account notice")
    void testEmailServiceImplGoogleNoticeSmtpFailure() {
        JavaMailSender failingSender = (JavaMailSender) Proxy.newProxyInstance(
                JavaMailSender.class.getClassLoader(),
                new Class<?>[]{JavaMailSender.class},
                (proxy, method, args) -> {
                    if ("send".equals(method.getName())) {
                        throw new MailSendException("Could not connect to SMTP host: smtp.gmail.com, port: 587");
                    }
                    return null;
                }
        );

        EmailServiceImpl emailService = new EmailServiceImpl(failingSender, "no-reply@researchnest.org");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            emailService.sendGoogleAccountNotice("google_researcher@stanford.edu");
        });

        assertNotNull(ex.getCause());
        assertTrue(ex.getMessage().contains("Could not connect to SMTP host"),
                "Exception message should include SMTP diagnostic error details");
    }
}
