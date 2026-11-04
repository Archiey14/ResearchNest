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
 * Writes under /api/papers must require an ADMIN (or the AI service key on /batch only).
 * Reads must stay public.
 *
 * Authorised calls use POST /api/papers/batch with an EMPTY list: a request that passes the auth guard
 * is answered 400 "No papers provided" by the controller, so no catalog data is ever modified by these tests.
 */
@SpringBootTest(properties = {
        "app.dev-mode=true",
        "app.internal-api-key=test-service-key-0123456789"
})
class PaperWriteSecurityTest {

    private static final String SERVICE_KEY = "test-service-key-0123456789";

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

    private String bearerFor(String role) {
        String email = "paper-sec-" + UUID.randomUUID().toString().substring(0, 8) + "@example.edu";
        User u = userService.createAdminProvisionedUser(
                "Paper Security " + role, email, "SecurePassword123!", "Test Univ", "Security", role);
        createdUserIds.add(u.getId());
        return "Bearer " + authController.generateToken(u);
    }

    @Test
    @DisplayName("Anonymous writes to /api/papers return 401")
    void anonymousWritesRejected() throws Exception {
        mockMvc.perform(post("/api/papers").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/papers/1").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/papers/1"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/papers/batch").contentType("application/json").content("[]"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("A logged-in non-admin cannot write papers (403)")
    void researcherCannotWrite() throws Exception {
        String researcher = bearerFor("RESEARCHER");
        mockMvc.perform(post("/api/papers/batch").header("Authorization", researcher)
                .contentType("application/json").content("[]"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/papers/1").header("Authorization", researcher))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/papers").header("Authorization", researcher)
                .contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("An admin passes the guard (controller then answers 400 for the empty batch)")
    void adminPassesGuard() throws Exception {
        mockMvc.perform(post("/api/papers/batch").header("Authorization", bearerFor("ADMIN"))
                .contentType("application/json").content("[]"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("AI service key is accepted on POST /api/papers/batch only")
    void serviceKeyScopedToBatch() throws Exception {
        // accepted: reaches the controller, which rejects the empty list with 400
        mockMvc.perform(post("/api/papers/batch").header("X-Service-Key", SERVICE_KEY)
                .contentType("application/json").content("[]"))
                .andExpect(status().isBadRequest());

        // wrong key
        mockMvc.perform(post("/api/papers/batch").header("X-Service-Key", "wrong-key-wrong-key-wrong")
                .contentType("application/json").content("[]"))
                .andExpect(status().isUnauthorized());

        // right key but not the batch endpoint: still rejected
        mockMvc.perform(delete("/api/papers/1").header("X-Service-Key", SERVICE_KEY))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/papers").header("X-Service-Key", SERVICE_KEY)
                .contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/papers/1").header("X-Service-Key", SERVICE_KEY)
                .contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("The service key does not unlock the admin API")
    void serviceKeyDoesNotUnlockAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/users").header("X-Service-Key", SERVICE_KEY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Reading papers stays public")
    void readsStayPublic() throws Exception {
        mockMvc.perform(get("/api/papers")).andExpect(status().isOk());
        mockMvc.perform(get("/api/papers/stats")).andExpect(status().isOk());
        mockMvc.perform(get("/api/papers/trending")).andExpect(status().isOk());
    }
}
