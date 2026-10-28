package com.example.demo;

import com.example.demo.controllers.AuthController;
import com.example.demo.controllers.AuthController.GoogleLoginRequest;
import com.example.demo.controllers.AuthController.LoginRequest;
import com.example.demo.controllers.AuthController.RegisterRequest;
import com.example.demo.models.User;
import com.example.demo.repos.UserRepository;
import com.example.demo.services.GoogleTokenVerifierService;
import com.example.demo.services.GoogleUserInfo;
import com.example.demo.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class GoogleAuthTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    private MockGoogleVerifier mockGoogleVerifier;
    private AuthController customAuthController;

    static class MockGoogleVerifier implements GoogleTokenVerifierService {
        private boolean shouldFail = false;
        private GoogleUserInfo nextUserInfo;

        public void setNextUserInfo(GoogleUserInfo info) {
            this.nextUserInfo = info;
            this.shouldFail = false;
        }

        public void setShouldFail(boolean fail) {
            this.shouldFail = fail;
        }

        @Override
        public GoogleUserInfo verifyToken(String idTokenString) {
            if (shouldFail || "invalid_token".equals(idTokenString)) {
                throw new IllegalArgumentException("Invalid Google ID token signature or expired.");
            }
            if (nextUserInfo != null) {
                return nextUserInfo;
            }
            return new GoogleUserInfo("google-sub-default", "default-google@test.edu", true, "Default Google User");
        }
    }

    @BeforeEach
    void setUp() {
        mockGoogleVerifier = new MockGoogleVerifier();
        customAuthController = new AuthController(
                userService,
                mockGoogleVerifier,
                "dev-secret-key-for-researchnest-local-development-only-min32bytes!",
                86400000L,
                "dev"
        );
    }

    @Test
    @DisplayName("Valid Google ID token creates new user without password and issues valid JWT")
    void testGoogleLoginCreatesNewUserSafely() {
        long timestamp = System.currentTimeMillis();
        String googleId = "gid_" + timestamp;
        String googleEmail = "google_user_" + timestamp + "@berkeley.edu";
        mockGoogleVerifier.setNextUserInfo(new GoogleUserInfo(googleId, googleEmail, true, "Grace Hopper"));

        GoogleLoginRequest req = new GoogleLoginRequest();
        req.idToken = "valid_google_token_123";

        ResponseEntity<?> response = customAuthController.googleLogin(req);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("token"));
        assertTrue(body.containsKey("user"));
        assertEquals("Google sign-in successful.", body.get("message"));

        User returnedUser = (User) body.get("user");
        assertEquals(googleEmail, returnedUser.getEmail());
        assertEquals("Grace Hopper", returnedUser.getName());
        assertEquals("GOOGLE", returnedUser.getAuthProvider());
        assertNull(returnedUser.getPassword(), "Google-only account must NOT have a password saved");

        // Verify in database
        Optional<User> dbUser = userRepository.findByGoogleId(googleId);
        assertTrue(dbUser.isPresent());
        assertNull(dbUser.get().getPassword(), "Database password column must be null for Google-only users");
        assertEquals("GOOGLE", dbUser.get().getAuthProvider());
    }

    @Test
    @DisplayName("Existing Google user can log in again and retrieve existing account")
    void testExistingGoogleUserLogin() {
        long timestamp = System.currentTimeMillis();
        String googleId = "gid_repeat_" + timestamp;
        String googleEmail = "repeat_google_" + timestamp + "@oxford.ac.uk";
        mockGoogleVerifier.setNextUserInfo(new GoogleUserInfo(googleId, googleEmail, true, "Alan Turing"));

        GoogleLoginRequest req = new GoogleLoginRequest();
        req.idToken = "valid_google_token_repeat";

        // First login: creates account
        ResponseEntity<?> firstResp = customAuthController.googleLogin(req);
        assertEquals(HttpStatus.OK, firstResp.getStatusCode());
        User firstUser = (User) ((Map<?, ?>) firstResp.getBody()).get("user");

        // Second login: finds same account
        ResponseEntity<?> secondResp = customAuthController.googleLogin(req);
        assertEquals(HttpStatus.OK, secondResp.getStatusCode());
        User secondUser = (User) ((Map<?, ?>) secondResp.getBody()).get("user");

        assertEquals(firstUser.getId(), secondUser.getId(), "Must find and return the same user record");
        assertEquals(googleId, secondUser.getGoogleId());
    }

    @Test
    @DisplayName("Safe account linking: rejects Google sign-in if email already belongs to a local password account")
    void testRejectsAutomaticLinkingForExistingLocalAccount() {
        long timestamp = System.currentTimeMillis();
        String conflictEmail = "local_researcher_" + timestamp + "@cambridge.ac.uk";

        // Register local user first
        RegisterRequest regReq = new RegisterRequest();
        regReq.name = "Isaac Newton";
        regReq.email = conflictEmail;
        regReq.password = "StrongPassword987!";
        regReq.institution = "Cambridge";
        regReq.department = "Physics";
        ResponseEntity<?> regResp = customAuthController.register(regReq);
        assertEquals(HttpStatus.CREATED, regResp.getStatusCode());

        // Now attempt to sign in with Google using the same email but a new Google ID
        String googleId = "gid_conflict_" + timestamp;
        mockGoogleVerifier.setNextUserInfo(new GoogleUserInfo(googleId, conflictEmail, true, "Isaac Newton"));

        GoogleLoginRequest googleReq = new GoogleLoginRequest();
        googleReq.idToken = "valid_google_token_conflict";

        ResponseEntity<?> conflictResp = customAuthController.googleLogin(googleReq);
        assertEquals(HttpStatus.CONFLICT, conflictResp.getStatusCode(), "Must reject automatic linking with 409 Conflict");

        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) conflictResp.getBody();
        assertNotNull(body);
        assertEquals("ACCOUNT_CONFLICT", body.get("code"));
        assertTrue(body.get("error").contains("already exists using password authentication"));
    }

    @Test
    @DisplayName("Invalid Google token is rejected with 400 Bad Request")
    void testInvalidGoogleTokenRejection() {
        mockGoogleVerifier.setShouldFail(true);

        GoogleLoginRequest req = new GoogleLoginRequest();
        req.idToken = "tampered_or_invalid_id_token";

        ResponseEntity<?> response = customAuthController.googleLogin(req);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertTrue(body.get("error").contains("Invalid Google ID token"));
    }

    @Test
    @DisplayName("Empty or missing Google token is rejected with 400 Bad Request")
    void testEmptyGoogleTokenRejection() {
        GoogleLoginRequest req = new GoogleLoginRequest();
        req.idToken = "";

        ResponseEntity<?> response = customAuthController.googleLogin(req);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("Google user with null password cannot be authenticated via local password login")
    void testGoogleUserCannotLoginWithPassword() {
        long timestamp = System.currentTimeMillis();
        String googleId = "gid_nopw_" + timestamp;
        String googleEmail = "nopw_" + timestamp + "@princeton.edu";
        mockGoogleVerifier.setNextUserInfo(new GoogleUserInfo(googleId, googleEmail, true, "John Nash"));

        GoogleLoginRequest req = new GoogleLoginRequest();
        req.idToken = "valid_google_token_nopw";
        customAuthController.googleLogin(req);

        // Attempt password login on Google user
        LoginRequest loginReq = new LoginRequest();
        loginReq.email = googleEmail;
        loginReq.password = "AnyPassword123!";

        ResponseEntity<?> loginResp = customAuthController.login(loginReq);
        assertEquals(HttpStatus.UNAUTHORIZED, loginResp.getStatusCode(), "Must reject password login on account with null password");
    }
}
