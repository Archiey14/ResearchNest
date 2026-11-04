package com.example.demo;

import com.example.demo.controllers.AuthController;
import com.example.demo.models.ChatQuery;
import com.example.demo.models.User;
import com.example.demo.repos.ChatQueryRepository;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The chat log must never record an identity the caller did not prove with a valid token.
 */
@SpringBootTest(properties = "app.dev-mode=true")
class ChatIdentityTest {

    private static final String FORGED_EMAIL = "victim@example.edu";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AuthController authController;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatQueryRepository chatQueryRepository;

    private MockMvc mockMvc;
    private final List<Long> createdUserIds = new ArrayList<>();
    private final List<String> usedMessages = new ArrayList<>();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @AfterEach
    void cleanUp() {
        chatQueryRepository.findTop500ByOrderByCreatedAtDesc().stream()
                .filter(c -> usedMessages.contains(c.getQuery()))
                .forEach(chatQueryRepository::delete);
        usedMessages.clear();
        createdUserIds.forEach(id -> userRepository.findById(id).ifPresent(userRepository::delete));
        createdUserIds.clear();
    }

    private String uniqueMessage() {
        String m = "identity-test-" + UUID.randomUUID();
        usedMessages.add(m);
        return m;
    }

    private String body(String message) {
        return "{\"message\":\"" + message + "\",\"userEmail\":\"" + FORGED_EMAIL + "\",\"userName\":\"Victim\"}";
    }

    private ChatQuery logged(String message) {
        return chatQueryRepository.findTop500ByOrderByCreatedAtDesc().stream()
                .filter(c -> message.equals(c.getQuery()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("chat query was not recorded"));
    }

    @Test
    @DisplayName("No token: a forged userEmail in the body is ignored, entry is anonymous")
    void forgedIdentityWithoutTokenIsIgnored() throws Exception {
        String message = uniqueMessage();
        mockMvc.perform(post("/api/chat/log").contentType("application/json").content(body(message)))
                .andExpect(status().isOk());

        ChatQuery row = logged(message);
        assertEquals("anonymous", row.getUserEmail());
        assertNotEquals(FORGED_EMAIL, row.getUserEmail());
        assertNotEquals("Victim", row.getUserName());
    }

    @Test
    @DisplayName("Invalid token plus forged userEmail is still anonymous")
    void forgedIdentityWithBadTokenIsIgnored() throws Exception {
        String message = uniqueMessage();
        mockMvc.perform(post("/api/chat/log")
                .header("Authorization", "Bearer not-a-real-token")
                .contentType("application/json").content(body(message)))
                .andExpect(status().isOk());

        assertEquals("anonymous", logged(message).getUserEmail());
    }

    @Test
    @DisplayName("Valid token: entry is attributed to the token's account, not the body's userEmail")
    void verifiedIdentityWins() throws Exception {
        String email = "chat-id-" + UUID.randomUUID().toString().substring(0, 8) + "@example.edu";
        User user = userService.createAdminProvisionedUser(
                "Real Author", email, "SecurePassword123!", "Test Univ", "Security", "RESEARCHER");
        createdUserIds.add(user.getId());

        String message = uniqueMessage();
        mockMvc.perform(post("/api/chat/log")
                .header("Authorization", "Bearer " + authController.generateToken(user))
                .contentType("application/json").content(body(message)))
                .andExpect(status().isOk());

        ChatQuery row = logged(message);
        assertEquals(email, row.getUserEmail());
        assertEquals("Real Author", row.getUserName());
    }

    @Test
    @DisplayName("Token of a deleted account is recorded as anonymous")
    void deletedAccountTokenIsAnonymous() throws Exception {
        String email = "chat-del-" + UUID.randomUUID().toString().substring(0, 8) + "@example.edu";
        User user = userService.createAdminProvisionedUser(
                "Ghost", email, "SecurePassword123!", "Test Univ", "Security", "RESEARCHER");
        String token = authController.generateToken(user);
        userRepository.deleteById(user.getId());

        String message = uniqueMessage();
        mockMvc.perform(post("/api/chat/log")
                .header("Authorization", "Bearer " + token)
                .contentType("application/json").content(body(message)))
                .andExpect(status().isOk());

        assertEquals("anonymous", logged(message).getUserEmail());
    }
}
