package com.example.demo;

import com.example.demo.controllers.AuthController;
import com.example.demo.models.User;
import com.example.demo.repos.UserRepository;
import com.example.demo.services.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that /api/admin/** is reachable only by an authenticated ADMIN.
 * Uses the real web application context, so the interceptor registration itself is under test.
 */
@SpringBootTest(properties = "app.dev-mode=true")
class AdminEndpointSecurityTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AuthController authController;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    private MockMvc mockMvc;
    private final List<Long> createdUserIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @AfterEach
    void cleanUp() {
        createdUserIds.forEach(id -> userRepository.findById(id).ifPresent(userRepository::delete));
        createdUserIds.clear();
    }

    private User createUser(String role) {
        String email = "sec-" + UUID.randomUUID().toString().substring(0, 8) + "@example.edu";
        User u = userService.createAdminProvisionedUser(
                "Security Test " + role, email, "SecurePassword123!", "Test Univ", "Security", role);
        createdUserIds.add(u.getId());
        return u;
    }

    private String bearer(User user) {
        return "Bearer " + authController.generateToken(user);
    }

    @Test
    @DisplayName("No token: every admin endpoint returns 401")
    void anonymousRequestsAreRejected() throws Exception {
        mockMvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/stats")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/activity")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/ai/status")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/chat-queries")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/ai/sync")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/admin/chat-queries")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/users")
                .contentType("application/json")
                .content("{\"email\":\"x@y.z\",\"password\":\"longenough1\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/admin/users/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/admin/users/1/role")
                .contentType("application/json")
                .content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Garbage, empty, wrong-scheme and tampered tokens return 401")
    void invalidTokensAreRejected() throws Exception {
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer "))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Basic dXNlcjpwYXNz"))
                .andExpect(status().isUnauthorized());

        User admin = createUser("ADMIN");
        String token = authController.generateToken(admin);
        char last = token.charAt(token.length() - 1);
        String tampered = token.substring(0, token.length() - 1) + (last == 'A' ? 'B' : 'A');
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + tampered))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Expired admin token returns 401")
    void expiredTokenIsRejected() throws Exception {
        User admin = createUser("ADMIN");
        String expired = authController.generateToken(admin, -1000L);
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Valid token of a non-admin returns 403")
    void researcherIsForbidden() throws Exception {
        User researcher = createUser("RESEARCHER");
        mockMvc.perform(get("/api/admin/users").header("Authorization", bearer(researcher)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/chat-queries").header("Authorization", bearer(researcher)))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/admin/chat-queries").header("Authorization", bearer(researcher)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Valid admin token is allowed")
    void adminIsAllowed() throws Exception {
        User admin = createUser("ADMIN");
        mockMvc.perform(get("/api/admin/users").header("Authorization", bearer(admin)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/chat-queries").header("Authorization", bearer(admin)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/stats").header("Authorization", bearer(admin)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Admin demoted after token issue loses access immediately")
    void demotedAdminLosesAccess() throws Exception {
        User admin = createUser("ADMIN");
        String header = bearer(admin);
        mockMvc.perform(get("/api/admin/users").header("Authorization", header)).andExpect(status().isOk());

        userService.updateUserRole(admin.getId(), "RESEARCHER");

        mockMvc.perform(get("/api/admin/users").header("Authorization", header))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Token of a deleted account returns 401")
    void deletedAccountIsRejected() throws Exception {
        User admin = createUser("ADMIN");
        String header = bearer(admin);
        userRepository.deleteById(admin.getId());

        mockMvc.perform(get("/api/admin/users").header("Authorization", header))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("CORS preflight is not blocked by the admin guard")
    void preflightIsNotBlocked() throws Exception {
        mockMvc.perform(options("/api/admin/users")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Public endpoints are unaffected")
    void publicEndpointsStillOpen() throws Exception {
        mockMvc.perform(get("/api/papers")).andExpect(status().isOk());
    }
}
