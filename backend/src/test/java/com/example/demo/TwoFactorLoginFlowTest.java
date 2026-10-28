package com.example.demo;

import com.example.demo.controllers.AuthController;
import com.example.demo.controllers.AuthController.LoginRequest;
import com.example.demo.controllers.AuthController.Verify2faRequest;
import com.example.demo.models.User;
import com.example.demo.repos.UserRepository;
import com.example.demo.services.EmailService;
import com.example.demo.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class TwoFactorLoginFlowTest {

    @Autowired
    private UserRepository userRepository;

    private MockEmailService mockEmailService;
    private UserService customUserService;
    private AuthController customAuthController;
    private MockMvc mockMvc;

    static class MockEmailService implements EmailService {
        private String lastRecipient;
        private String lastOtp;
        private boolean shouldFail = false;

        public void setShouldFail(boolean shouldFail) {
            this.shouldFail = shouldFail;
        }

        @Override
        public boolean isConfigured() {
            return true;
        }

        @Override
        public void sendPasswordResetOtp(String toEmail, String otp) {
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
            this.lastRecipient = toEmail;
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
    @DisplayName("Password-only login initiates 2FA: sends OTP and NEVER issues a JWT token")
    void testLoginInitiationRequires2faAndNeverIssuesJwt() {
        long timestamp = System.currentTimeMillis();
        String email = "twofa_user_" + timestamp + "@stanford.edu";
        customUserService.register("Claude Shannon", email, "InformationTheory123!", "Stanford", "EE");

        LoginRequest req = new LoginRequest();
        req.email = email;
        req.password = "InformationTheory123!";

        ResponseEntity<?> response = customAuthController.login(req);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals(Boolean.TRUE, body.get("twoFactorRequired"));
        assertEquals(email, body.get("email"));
        assertFalse(body.containsKey("token"), "Password-only login response must NEVER issue a JWT token");

        // Verify OTP email dispatch
        assertEquals(email, mockEmailService.lastRecipient);
        assertNotNull(mockEmailService.lastOtp);
        assertEquals(6, mockEmailService.lastOtp.length());
        assertTrue(mockEmailService.lastOtp.matches("^\\d{6}$"));

        // Verify DB state
        User user = userRepository.findByEmail(email).orElseThrow();
        assertNotNull(user.getTwoFactorCodeHash());
        assertEquals(64, user.getTwoFactorCodeHash().length());
        assertEquals(customUserService.hashLoginOtp(email, mockEmailService.lastOtp), user.getTwoFactorCodeHash());
        assertNotNull(user.getTwoFactorCodeExpiry());
        assertTrue(user.getTwoFactorCodeExpiry().isAfter(LocalDateTime.now().plusMinutes(4)));
        assertTrue(user.getTwoFactorCodeExpiry().isBefore(LocalDateTime.now().plusMinutes(6)));
        assertEquals(0, user.getTwoFactorAttempts());

        // Password-reset fields must remain completely separate and null
        assertNull(user.getResetTokenHash());
        assertNull(user.getResetTokenExpiry());
    }

    @Test
    @DisplayName("Valid 2FA OTP verification issues signed JWT token and clears OTP state")
    void testVerify2faSuccessIssuesJwtAndClearsState() {
        long timestamp = System.currentTimeMillis();
        String email = "twofa_success_" + timestamp + "@stanford.edu";
        customUserService.register("Katherine Johnson", email, "OrbitalMechanics123!", "NASA", "Math");

        // 1. Initiate login
        LoginRequest req = new LoginRequest();
        req.email = email;
        req.password = "OrbitalMechanics123!";
        customAuthController.login(req);

        String otp = mockEmailService.lastOtp;
        assertNotNull(otp);

        // 2. Submit OTP
        Verify2faRequest verifyReq = new Verify2faRequest();
        verifyReq.email = email;
        verifyReq.otp = otp;

        ResponseEntity<?> verifyResp = customAuthController.verify2fa(verifyReq);
        assertEquals(HttpStatus.OK, verifyResp.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) verifyResp.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("token"), "Must return signed JWT upon successful 2FA verification");
        assertTrue(body.containsKey("user"));
        assertEquals("Login successful.", body.get("message"));

        String token = (String) body.get("token");
        assertEquals(3, token.split("\\.").length, "JWT must be 3 dot-separated Base64 parts");

        // 3. Verify OTP state was cleared from DB to prevent replay
        User user = userRepository.findByEmail(email).orElseThrow();
        assertNull(user.getTwoFactorCodeHash(), "twoFactorCodeHash must be cleared upon successful verification");
        assertNull(user.getTwoFactorCodeExpiry(), "twoFactorCodeExpiry must be cleared upon successful verification");
        assertEquals(0, user.getTwoFactorAttempts());
    }

    @Test
    @DisplayName("Incorrect 2FA OTP is rejected with 400 and increments attempt counter")
    void testVerify2faIncorrectOtpIncrementsCounter() {
        long timestamp = System.currentTimeMillis();
        String email = "twofa_bad_code_" + timestamp + "@stanford.edu";
        customUserService.register("Grace Hopper", email, "CompilerPioneer123!", "Vassar", "CS");

        // Initiate login
        LoginRequest req = new LoginRequest();
        req.email = email;
        req.password = "CompilerPioneer123!";
        customAuthController.login(req);

        // Submit wrong OTP
        Verify2faRequest verifyReq = new Verify2faRequest();
        verifyReq.email = email;
        verifyReq.otp = "000000";

        ResponseEntity<?> verifyResp = customAuthController.verify2fa(verifyReq);
        assertEquals(HttpStatus.BAD_REQUEST, verifyResp.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) verifyResp.getBody();
        assertNotNull(body);
        assertEquals("Invalid verification code. Please try again.", body.get("error"));

        // Verify DB attempt counter incremented
        User user = userRepository.findByEmail(email).orElseThrow();
        assertEquals(1, user.getTwoFactorAttempts());
        assertNotNull(user.getTwoFactorCodeHash(), "Hash must remain active for retry");
    }

    @Test
    @DisplayName("Exceeding 5 failed 2FA attempts invalidates OTP and locks out challenge")
    void testVerify2faAttemptLimitExceededBlocksCode() {
        long timestamp = System.currentTimeMillis();
        String email = "twofa_max_attempts_" + timestamp + "@stanford.edu";
        customUserService.register("Alan Turing", email, "EnigmaMachine123!", "Cambridge", "Math");

        // Initiate login
        LoginRequest req = new LoginRequest();
        req.email = email;
        req.password = "EnigmaMachine123!";
        customAuthController.login(req);

        String correctOtp = mockEmailService.lastOtp;
        assertNotNull(correctOtp);

        Verify2faRequest verifyReq = new Verify2faRequest();
        verifyReq.email = email;
        verifyReq.otp = "111111";

        // Attempts 1 through 4: reject with invalid code
        for (int i = 1; i <= 4; i++) {
            ResponseEntity<?> resp = customAuthController.verify2fa(verifyReq);
            assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        }

        // 5th attempt: exceeds maximum attempts limit
        ResponseEntity<?> resp5 = customAuthController.verify2fa(verifyReq);
        assertEquals(HttpStatus.BAD_REQUEST, resp5.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body5 = (Map<String, Object>) resp5.getBody();
        assertTrue(((String) body5.get("error")).contains("Maximum verification attempts exceeded"));

        // Verify DB state: OTP is completely invalidated
        User user = userRepository.findByEmail(email).orElseThrow();
        assertNull(user.getTwoFactorCodeHash(), "Hash must be cleared when limit exceeded");
        assertNull(user.getTwoFactorCodeExpiry(), "Expiry must be cleared when limit exceeded");

        // Subsequent attempt with even the CORRECT OTP must now fail
        verifyReq.otp = correctOtp;
        ResponseEntity<?> correctOtpAfterLockout = customAuthController.verify2fa(verifyReq);
        assertEquals(HttpStatus.BAD_REQUEST, correctOtpAfterLockout.getStatusCode());
    }

    @Test
    @DisplayName("Expired 2FA OTP is rejected and clears challenge state")
    void testVerify2faExpiredOtpRejection() {
        long timestamp = System.currentTimeMillis();
        String email = "twofa_expired_" + timestamp + "@stanford.edu";
        customUserService.register("Tim Berners-Lee", email, "WorldWideWeb123!", "CERN", "CS");

        // Initiate login
        LoginRequest req = new LoginRequest();
        req.email = email;
        req.password = "WorldWideWeb123!";
        customAuthController.login(req);

        String otp = mockEmailService.lastOtp;

        // Force expiry in DB
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setTwoFactorCodeExpiry(LocalDateTime.now().minusSeconds(1));
        userRepository.save(user);

        // Submit OTP
        Verify2faRequest verifyReq = new Verify2faRequest();
        verifyReq.email = email;
        verifyReq.otp = otp;

        ResponseEntity<?> verifyResp = customAuthController.verify2fa(verifyReq);
        assertEquals(HttpStatus.BAD_REQUEST, verifyResp.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) verifyResp.getBody();
        assertTrue(((String) body.get("error")).contains("expired"));

        // Verify DB was cleaned up
        User updatedUser = userRepository.findByEmail(email).orElseThrow();
        assertNull(updatedUser.getTwoFactorCodeHash());
        assertNull(updatedUser.getTwoFactorCodeExpiry());
    }

    @Test
    @DisplayName("Reusing an already-verified 2FA OTP is rejected")
    void testVerify2faOtpReusePrevented() {
        long timestamp = System.currentTimeMillis();
        String email = "twofa_reuse_" + timestamp + "@stanford.edu";
        customUserService.register("Margaret Hamilton", email, "ApolloGuidance123!", "MIT", "SE");

        // Initiate login
        LoginRequest req = new LoginRequest();
        req.email = email;
        req.password = "ApolloGuidance123!";
        customAuthController.login(req);

        String otp = mockEmailService.lastOtp;

        // First verification succeeds
        Verify2faRequest verifyReq = new Verify2faRequest();
        verifyReq.email = email;
        verifyReq.otp = otp;

        ResponseEntity<?> firstResp = customAuthController.verify2fa(verifyReq);
        assertEquals(HttpStatus.OK, firstResp.getStatusCode());

        // Reusing the same OTP must fail with 400
        ResponseEntity<?> secondResp = customAuthController.verify2fa(verifyReq);
        assertEquals(HttpStatus.BAD_REQUEST, secondResp.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) secondResp.getBody();
        assertEquals("Invalid or expired verification code.", body.get("error"));
    }

    @Test
    @DisplayName("Email dispatch failure during 2FA initiation rolls back DB state and returns 503")
    void testEmailDeliveryFailureRollsBackTwoFactorState() {
        long timestamp = System.currentTimeMillis();
        String email = "twofa_mail_fail_" + timestamp + "@stanford.edu";
        customUserService.register("John von Neumann", email, "GameTheory123!", "IAS", "Math");

        mockEmailService.setShouldFail(true);

        LoginRequest req = new LoginRequest();
        req.email = email;
        req.password = "GameTheory123!";

        ResponseEntity<?> resp = customAuthController.login(req);
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, resp.getStatusCode());

        // DB state must be rolled back
        User user = userRepository.findByEmail(email).orElseThrow();
        assertNull(user.getTwoFactorCodeHash());
        assertNull(user.getTwoFactorCodeExpiry());
    }

    @Test
    @DisplayName("MockMvc integration: POST /api/auth/login and POST /api/auth/login/verify-2fa")
    void testMockMvcEndToEndFlow() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "mockmvc_2fa_" + timestamp + "@stanford.edu";
        customUserService.register("John McCarthy", email, "LispLanguage123!", "Stanford", "AI");

        // 1. Password login returns 200 with twoFactorRequired and NO token
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"LispLanguage123!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.twoFactorRequired").value(true))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.token").doesNotExist());

        String otp = mockEmailService.lastOtp;
        assertNotNull(otp);

        // 2. Submit OTP to /api/auth/login/verify-2fa returns 200 with token and user
        mockMvc.perform(post("/api/auth/login/verify-2fa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.message").value("Login successful."));
    }
}
