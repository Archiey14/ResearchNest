package com.example.demo.controllers;

import com.example.demo.models.User;
import com.example.demo.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
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
            error.put("error", "An error occurred during registration: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            User authenticated = userService.authenticate(req.email, req.password);
            String token = generateToken(authenticated);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", authenticated);
            response.put("message", "Login successful.");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "An error occurred during login: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "email", required = false) String emailParam) {

        String email = null;
        if (emailParam != null && !emailParam.isBlank()) {
            email = emailParam.trim();
        } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            email = extractEmailFromToken(token);
        }

        if (email == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Unauthorized or no researcher identity provided.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }

        return userService.findByEmail(email)
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

    private String generateToken(User user) {
        String payload = user.getId() + ":" + user.getEmail() + ":" + System.currentTimeMillis();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    private String extractEmailFromToken(String token) {
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(token);
            String raw = new String(decoded, StandardCharsets.UTF_8);
            String[] parts = raw.split(":");
            if (parts.length >= 2) {
                return parts[1];
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
