package com.example.demo;

import com.example.demo.controllers.AdminController;
import com.example.demo.controllers.AdminController.AdminRoleUpdateRequest;
import com.example.demo.controllers.AdminController.AdminUserCreateRequest;
import com.example.demo.controllers.AdminController.AdminUserUpdateRequest;
import com.example.demo.models.User;
import com.example.demo.repos.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "app.dev-mode=true")
class AdminControllerTest {

    @Autowired
    private AdminController adminController;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Admin stats returns populated user and paper telemetry")
    void testGetAdminStats() {
        ResponseEntity<Map<String, Object>> response = adminController.getAdminStats();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = response.getBody();
        assertTrue(body.containsKey("users"));
        assertTrue(body.containsKey("papers"));
        assertTrue(body.containsKey("aiEngine"));
        assertTrue(body.containsKey("system"));

        @SuppressWarnings("unchecked")
        Map<String, Object> usersMap = (Map<String, Object>) body.get("users");
        assertNotNull(usersMap.get("total"));
        assertNotNull(usersMap.get("admins"));
    }

    @Test
    @DisplayName("Admin can list and filter users by role")
    void testGetUsersFilter() {
        ResponseEntity<List<User>> allUsersResp = adminController.getUsers(null, "ALL");
        assertEquals(HttpStatus.OK, allUsersResp.getStatusCode());
        assertNotNull(allUsersResp.getBody());
        assertFalse(allUsersResp.getBody().isEmpty());

        ResponseEntity<List<User>> adminsResp = adminController.getUsers(null, "ADMIN");
        assertEquals(HttpStatus.OK, adminsResp.getStatusCode());
        assertNotNull(adminsResp.getBody());
        assertTrue(adminsResp.getBody().stream().allMatch(u -> "ADMIN".equalsIgnoreCase(u.getRole())));
    }

    @Test
    @DisplayName("Admin can provision, update role, and delete user")
    void testUserLifecycle() {
        String uniqueEmail = "test-" + UUID.randomUUID().toString().substring(0, 8) + "@stanford.edu";

        // 1. Provision user
        AdminUserCreateRequest createReq = new AdminUserCreateRequest();
        createReq.name = "Test Admin Created";
        createReq.email = uniqueEmail;
        createReq.password = "SecurePassword123!";
        createReq.role = "RESEARCHER";
        createReq.institution = "MIT";
        createReq.department = "CSAIL";

        ResponseEntity<?> createResp = adminController.createUser(createReq);
        assertEquals(HttpStatus.CREATED, createResp.getStatusCode());
        assertTrue(createResp.getBody() instanceof User);
        User createdUser = (User) createResp.getBody();
        assertEquals(uniqueEmail, createdUser.getEmail());

        // 2. Toggle role to ADMIN
        AdminRoleUpdateRequest roleReq = new AdminRoleUpdateRequest();
        roleReq.role = "ADMIN";
        ResponseEntity<?> roleResp = adminController.updateUserRole(createdUser.getId(), roleReq);
        assertEquals(HttpStatus.OK, roleResp.getStatusCode());
        User updatedRoleUser = (User) roleResp.getBody();
        assertEquals("ADMIN", updatedRoleUser.getRole());

        // 3. Update user details
        AdminUserUpdateRequest updateReq = new AdminUserUpdateRequest();
        updateReq.name = "Test Admin Renamed";
        updateReq.institution = "Harvard";
        ResponseEntity<?> updateResp = adminController.updateUser(createdUser.getId(), updateReq);
        assertEquals(HttpStatus.OK, updateResp.getStatusCode());
        User updatedDetailsUser = (User) updateResp.getBody();
        assertEquals("Test Admin Renamed", updatedDetailsUser.getName());

        // 4. Delete user
        ResponseEntity<?> deleteResp = adminController.deleteUser(createdUser.getId());
        assertEquals(HttpStatus.OK, deleteResp.getStatusCode());
        assertFalse(userRepository.findById(createdUser.getId()).isPresent());
    }

    @Test
    @DisplayName("Admin trigger AI sync returns confirmation")
    void testTriggerAiSync() {
        ResponseEntity<Map<String, Object>> response = adminController.triggerAiCatalogSync();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(Boolean.TRUE.equals(response.getBody().get("success")));
    }
}

