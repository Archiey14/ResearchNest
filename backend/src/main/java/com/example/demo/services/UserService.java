package com.example.demo.services;

import com.example.demo.models.User;
import com.example.demo.repos.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(String name, String email, String rawPassword, String institution, String department) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        String cleanEmail = email.trim().toLowerCase();

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        if (rawPassword == null || rawPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        String hashedPassword = BCrypt.hashpw(rawPassword, BCrypt.gensalt(12));
        User user = new User(
                name != null ? name.trim() : "Researcher",
                cleanEmail,
                hashedPassword,
                institution != null && !institution.isBlank() ? institution.trim() : "Stanford University",
                department != null && !department.isBlank() ? department.trim() : "Computer Science & AI Lab"
        );

        return userRepository.save(user);
    }

    public User authenticate(String email, String rawPassword) {
        if (email == null || rawPassword == null) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!BCrypt.checkpw(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        return user;
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email.trim().toLowerCase());
    }

    public boolean existsByEmail(String email) {
        if (email == null) {
            return false;
        }
        return userRepository.existsByEmail(email.trim().toLowerCase());
    }
}
