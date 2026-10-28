package com.example.demo;

import com.example.demo.controllers.AuthController;
import com.example.demo.controllers.AuthController.LoginRequest;
import com.example.demo.controllers.AuthController.RegisterRequest;
import com.example.demo.controllers.AuthController.TokenClaims;
import com.example.demo.controllers.AuthController.TokenExpiredException;
import com.example.demo.controllers.AuthController.TokenInvalidException;
import com.example.demo.models.User;
import com.example.demo.services.UserService;
import com.example.demo.controllers.AuthController.Verify2faRequest;
import com.example.demo.services.EmailService;
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
import tools.jackson.databind.json.JsonMapper;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class AuthControllerTest {

    @Autowired
    private AuthController authController;

    @Autowired
    private UserService userService;

    private MockMvc mockMvc;
    private MockEmailService mockEmailService;

    static class MockEmailService implements EmailService {
        private String lastRecipient;
        private String lastOtp;

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
        userService.setEmailService(mockEmailService);
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    @DisplayName("Registration behavior is preserved and returns signed token")
    void testRegistrationPreserved() {
        String uniqueEmail = "researcher_" + System.currentTimeMillis() + "@mit.edu";
        RegisterRequest req = new RegisterRequest();
        req.name = "Ada Lovelace";
        req.email = uniqueEmail;
        req.password = "SecurePassword123!";
        req.institution = "MIT Media Lab";
        req.department = "Computing";

        ResponseEntity<?> response = authController.register(req);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("token"));
        assertTrue(body.containsKey("user"));
        assertEquals("Registration successful.", body.get("message"));

        String token = (String) body.get("token");
        assertNotNull(token);
        assertEquals(3, token.split("\\.").length, "Token should be in JWT format with 3 parts");
    }

    @Test
    @DisplayName("Login with valid credentials initiates 2FA: returns twoFactorRequired without JWT")
    void testLoginInitiatesTwoFactor() {
        LoginRequest req = new LoginRequest();
        req.email = "alex.chen@stanford.edu";
        req.password = "Password123!";

        ResponseEntity<?> response = authController.login(req);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals(Boolean.TRUE, body.get("twoFactorRequired"));
        assertEquals("alex.chen@stanford.edu", body.get("email"));
        assertFalse(body.containsKey("token"), "Password-only response must NEVER contain a JWT token");
        assertNotNull(mockEmailService.lastOtp, "Must generate and dispatch an OTP");
        assertEquals(6, mockEmailService.lastOtp.length());
    }

    @Test
    @DisplayName("Submitting verified 2FA OTP completes login and returns signed JWT")
    void testVerify2faSuccess() {
        LoginRequest req = new LoginRequest();
        req.email = "alex.chen@stanford.edu";
        req.password = "Password123!";
        authController.login(req);

        String otp = mockEmailService.lastOtp;
        assertNotNull(otp);

        Verify2faRequest verifyReq = new Verify2faRequest();
        verifyReq.email = "alex.chen@stanford.edu";
        verifyReq.otp = otp;

        ResponseEntity<?> verifyResp = authController.verify2fa(verifyReq);
        assertEquals(HttpStatus.OK, verifyResp.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) verifyResp.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("token"), "Successful 2FA verification must return a JWT token");
        assertTrue(body.containsKey("user"));
        assertEquals("Login successful.", body.get("message"));

        User user = (User) body.get("user");
        assertNotNull(user);
        assertEquals("alex.chen@stanford.edu", user.getEmail());
    }

    @Test
    @DisplayName("Login with invalid credentials returns 401 Unauthorized")
    void testLoginInvalidCredentials() {
        LoginRequest req = new LoginRequest();
        req.email = "alex.chen@stanford.edu";
        req.password = "WrongPassword999!";

        ResponseEntity<?> response = authController.login(req);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("Valid signed token parses successfully and extracts claims")
    void testValidSignedTokenAccepted() throws Exception {
        User user = userService.findByEmail("alex.chen@stanford.edu").orElseThrow();
        String token = authController.generateToken(user);

        TokenClaims claims = authController.validateAndParseToken(token);
        assertNotNull(claims);
        assertEquals("alex.chen@stanford.edu", claims.email);
        assertEquals(user.getId(), claims.userId);
        assertTrue(claims.expiresAt > System.currentTimeMillis());
    }

    @Test
    @DisplayName("Tampered token signature is rejected with TokenInvalidException")
    void testTamperedTokenRejected() {
        User user = userService.findByEmail("alex.chen@stanford.edu").orElseThrow();
        String validToken = authController.generateToken(user);

        // Tamper with signature by altering the last character
        char lastChar = validToken.charAt(validToken.length() - 1);
        char tamperedChar = (lastChar == 'a') ? 'b' : 'a';
        String tamperedToken = validToken.substring(0, validToken.length() - 1) + tamperedChar;

        assertThrows(TokenInvalidException.class, () -> authController.validateAndParseToken(tamperedToken));
    }

    @Test
    @DisplayName("Expired token is rejected with TokenExpiredException")
    void testExpiredTokenRejected() {
        User user = userService.findByEmail("alex.chen@stanford.edu").orElseThrow();
        // Generate a token expired 5 seconds ago
        String expiredToken = authController.generateToken(user, -5000L);

        assertThrows(TokenExpiredException.class, () -> authController.validateAndParseToken(expiredToken));
    }

    @Test
    @DisplayName("GET /api/auth/me succeeds with a valid Bearer token")
    void testMeWithValidBearerToken() throws Exception {
        User user = userService.findByEmail("alex.chen@stanford.edu").orElseThrow();
        String token = authController.generateToken(user);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("alex.chen@stanford.edu"));
    }

    @Test
    @DisplayName("GET /api/auth/me without token returns 401 Unauthorized")
    void testMeWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("GET /api/auth/me with ?email=... bypass attempt is blocked with 401")
    void testMeWithEmailParamOnlyBypassBlocked() throws Exception {
        mockMvc.perform(get("/api/auth/me?email=alex.chen@stanford.edu"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("GET /api/auth/me with tampered token returns 401 Unauthorized")
    void testMeWithTamperedTokenReturns401() throws Exception {
        User user = userService.findByEmail("alex.chen@stanford.edu").orElseThrow();
        String validToken = authController.generateToken(user);
        String tamperedToken = validToken.substring(0, validToken.length() - 2) + "xx";

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid or tampered authentication token."));
    }

    @Test
    @DisplayName("GET /api/auth/me with expired token returns 401 Unauthorized")
    void testMeWithExpiredTokenReturns401() throws Exception {
        User user = userService.findByEmail("alex.chen@stanford.edu").orElseThrow();
        String expiredToken = authController.generateToken(user, -1000L);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Authentication token has expired. Please log in again."));
    }
}
