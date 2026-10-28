package com.example.demo.controllers;

import com.example.demo.models.User;
import com.example.demo.services.AccountConflictException;
import com.example.demo.services.GoogleTokenVerifierService;
import com.example.demo.services.GoogleUserInfo;
import com.example.demo.services.UserService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final String jwtSecret;
    private final long jwtExpirationMs;
    private final String activeProfile;

    public AuthController(UserService userService) {
        this(userService,
             null,
             "dev-secret-key-for-researchnest-local-development-only-min32bytes!",
             86400000L,
             "dev");
    }

    public AuthController(UserService userService, GoogleTokenVerifierService googleTokenVerifierService) {
        this(userService,
             googleTokenVerifierService,
             "dev-secret-key-for-researchnest-local-development-only-min32bytes!",
             86400000L,
             "dev");
    }

    @Autowired
    public AuthController(
            UserService userService,
            @Autowired(required = false) GoogleTokenVerifierService googleTokenVerifierService,
            @Value("${jwt.secret:dev-secret-key-for-researchnest-local-development-only-min32bytes!}") String jwtSecret,
            @Value("${jwt.expiration-ms:86400000}") long jwtExpirationMs,
            @Value("${spring.profiles.active:dev}") String activeProfile) {
        this.userService = userService;
        this.googleTokenVerifierService = googleTokenVerifierService;
        this.jwtSecret = (jwtSecret != null && !jwtSecret.isBlank())
                ? jwtSecret
                : "dev-secret-key-for-researchnest-local-development-only-min32bytes!";
        this.jwtExpirationMs = jwtExpirationMs > 0 ? jwtExpirationMs : 86400000L;
        this.activeProfile = activeProfile != null ? activeProfile : "dev";
    }

    @PostConstruct
    public void validateConfiguration() {
        if ("prod".equalsIgnoreCase(activeProfile) || "production".equalsIgnoreCase(activeProfile)) {
            if (jwtSecret.contains("dev-secret")) {
                throw new IllegalStateException("Production environment requires a strong, non-default JWT_SECRET.");
            }
        }
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes (256 bits) for HMAC-SHA256 signing.");
        }
    }

    public static class RegisterRequest {
        public String name;
        public String email;
        public String password;
        public String institution;
        public String department;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class Verify2faRequest {
        public String email;
        public String otp;
    }

    public static class GoogleLoginRequest {
        public String idToken;
    }

    public static class ForgotPasswordRequest {
        public String email;
    }

    public static class VerifyOtpRequest {
        public String email;
        public String otp;
    }

    public static class ResetPasswordRequest {
        public String email;
        public String otp;
        public String newPassword;
    }

    public static class TokenExpiredException extends Exception {
        public TokenExpiredException(String message) {
            super(message);
        }
    }

    public static class TokenInvalidException extends Exception {
        public TokenInvalidException(String message) {
            super(message);
        }
    }

    public static class TokenClaims {
        public final Long userId;
        public final String email;
        public final long issuedAt;
        public final long expiresAt;

        public TokenClaims(Long userId, String email, long issuedAt, long expiresAt) {
            this.userId = userId;
            this.email = email;
            this.issuedAt = issuedAt;
            this.expiresAt = expiresAt;
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            User created = userService.register(
                    req.name,
                    req.email,
                    req.password,
                    req.institution,
                    req.department
            );

            String token = generateToken(created);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", created);
            response.put("message", "Registration successful.");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "An error occurred during registration. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req == null || req.email == null || req.email.isBlank() || req.password == null || req.password.isBlank()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Email and password are required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        try {
            User authenticated = userService.authenticate(req.email, req.password);
            userService.initiateLogin2fa(authenticated);

            Map<String, Object> response = new HashMap<>();
            response.put("twoFactorRequired", true);
            response.put("email", authenticated.getEmail());
            response.put("message", "A 6-digit verification code has been sent to your email.");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (IllegalStateException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "An error occurred during login. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/login/verify-2fa")
    public ResponseEntity<?> verify2fa(@RequestBody Verify2faRequest req) {
        if (req == null || req.email == null || req.email.isBlank()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Email is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
        if (req.otp == null || req.otp.isBlank()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Verification code is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        try {
            User authenticated = userService.verifyLogin2fa(req.email, req.otp);
            String token = generateToken(authenticated);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", authenticated);
            response.put("message", "Login successful.");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "An error occurred during verification. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest req) {
        if (req == null || req.idToken == null || req.idToken.isBlank()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Google ID token is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        if (this.googleTokenVerifierService == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Google authentication service is not configured or unavailable.");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(err);
        }

        try {
            GoogleUserInfo userInfo = googleTokenVerifierService.verifyToken(req.idToken);
            User user = userService.processGoogleUser(
                    userInfo.getGoogleId(),
                    userInfo.getEmail(),
                    userInfo.isEmailVerified(),
                    userInfo.getName()
            );

            String token = generateToken(user);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", user);
            response.put("message", "Google sign-in successful.");

            return ResponseEntity.ok(response);
        } catch (AccountConflictException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            err.put("code", "ACCOUNT_CONFLICT");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        } catch (IllegalStateException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "An error occurred during Google sign-in. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Authorization header missing or invalid. Please provide a Bearer token.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bearer token is empty.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }

        TokenClaims claims;
        try {
            claims = validateAndParseToken(token);
        } catch (TokenExpiredException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Authentication token has expired. Please log in again.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        } catch (TokenInvalidException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Invalid or tampered authentication token.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Could not validate authentication token.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }

        return userService.findByEmail(claims.email)
                .<ResponseEntity<?>>map(user -> {
                    Map<String, Object> res = new HashMap<>();
                    res.put("user", user);
                    return ResponseEntity.ok(res);
                })
                .orElseGet(() -> {
                    Map<String, String> err = new HashMap<>();
                    err.put("error", "User not found.");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
                });
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        if (req == null || req.email == null || req.email.isBlank()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Email is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        try {
            userService.requestPasswordResetOtp(req.email);
            Map<String, String> response = new HashMap<>();
            response.put("message", "If an account with that email exists, a password reset OTP has been sent.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        } catch (IllegalStateException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "An error occurred while processing your request. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest req) {
        if (req == null || req.email == null || req.email.isBlank()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Email is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
        if (req.otp == null || req.otp.isBlank()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "OTP is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        try {
            boolean valid = userService.verifyOtp(req.email, req.otp);
            if (!valid) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "Invalid or expired OTP.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "OTP verified successfully.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "An error occurred while verifying the OTP. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        if (req == null || req.email == null || req.email.isBlank()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Email is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
        if (req.otp == null || req.otp.isBlank()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "OTP is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
        if (req.newPassword == null || req.newPassword.isBlank()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "New password is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        try {
            userService.resetPassword(req.email, req.otp, req.newPassword);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password has been reset successfully. You can now log in with your new password.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "An error occurred while resetting your password. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    /**
     * Generates a cryptographically signed HMAC-SHA256 JWT token with standard expiration.
     */
    public String generateToken(User user) {
        return generateToken(user, this.jwtExpirationMs);
    }

    /**
     * Generates a cryptographically signed HMAC-SHA256 JWT token with custom expiration (used for testing).
     */
    public String generateToken(User user, long expirationMs) {
        try {
            long now = System.currentTimeMillis();
            long exp = now + expirationMs;

            String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
            String headerBase64 = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));

            ObjectNode payloadJson = JsonMapper.shared().createObjectNode();
            payloadJson.put("sub", user.getEmail());
            if (user.getId() != null) {
                payloadJson.put("userId", user.getId());
            }
            payloadJson.put("iat", now);
            payloadJson.put("exp", exp);

            String payloadString = JsonMapper.shared().writeValueAsString(payloadJson);
            String payloadBase64 = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(payloadString.getBytes(StandardCharsets.UTF_8));

            String signingInput = headerBase64 + "." + payloadBase64;
            String signatureBase64 = sign(signingInput);

            return signingInput + "." + signatureBase64;
        } catch (Exception e) {
            throw new RuntimeException("Error generating authentication token", e);
        }
    }

    /**
     * Validates HMAC-SHA256 signature (constant-time) and expiration timestamp, then returns token claims.
     */
    public TokenClaims validateAndParseToken(String token) throws TokenExpiredException, TokenInvalidException {
        if (token == null || token.isBlank()) {
            throw new TokenInvalidException("Token is empty or missing.");
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new TokenInvalidException("Token structure is invalid.");
        }

        String headerBase64 = parts[0];
        String payloadBase64 = parts[1];
        String providedSignature = parts[2];

        // 1. Decode and strictly validate header (alg must be HS256, typ must be JWT)
        try {
            byte[] headerBytes = Base64.getUrlDecoder().decode(headerBase64);
            JsonNode headerNode = JsonMapper.shared().readTree(new String(headerBytes, StandardCharsets.UTF_8));
            if (!headerNode.has("alg") || !"HS256".equals(headerNode.get("alg").asString())) {
                throw new TokenInvalidException("Unsupported or invalid token algorithm.");
            }
            if (!headerNode.has("typ") || !"JWT".equalsIgnoreCase(headerNode.get("typ").asString())) {
                throw new TokenInvalidException("Unsupported or invalid token type.");
            }
        } catch (TokenInvalidException e) {
            throw e;
        } catch (Exception e) {
            throw new TokenInvalidException("Malformed token header.");
        }

        // 2. Verify signature using constant-time comparison
        String expectedSignature;
        try {
            expectedSignature = sign(headerBase64 + "." + payloadBase64);
        } catch (Exception e) {
            throw new TokenInvalidException("Failed to verify token signature.");
        }

        byte[] expectedSigBytes = expectedSignature.getBytes(StandardCharsets.UTF_8);
        byte[] providedSigBytes = providedSignature.getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(expectedSigBytes, providedSigBytes)) {
            throw new TokenInvalidException("Invalid token signature or token has been tampered with.");
        }

        // 2. Decode and parse payload JSON
        JsonNode root;
        try {
            byte[] payloadBytes = Base64.getUrlDecoder().decode(payloadBase64);
            root = JsonMapper.shared().readTree(new String(payloadBytes, StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new TokenInvalidException("Malformed token payload.");
        }

        // 3. Verify expiration
        if (!root.has("exp")) {
            throw new TokenInvalidException("Token is missing expiration claim.");
        }
        long exp = root.get("exp").asLong();
        if (exp <= 0 || System.currentTimeMillis() > exp) {
            throw new TokenExpiredException("Authentication token has expired.");
        }

        // 4. Extract subject (email) and userId
        if (!root.has("sub")) {
            throw new TokenInvalidException("Token is missing subject claim.");
        }
        String email = root.get("sub").asString();
        if (email == null || email.isBlank()) {
            throw new TokenInvalidException("Token subject claim is empty.");
        }

        long userId = root.has("userId") ? root.get("userId").asLong() : 0L;
        long iat = root.has("iat") ? root.get("iat").asLong() : 0L;

        return new TokenClaims(userId, email, iat, exp);
    }

    private String sign(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
    }
}
