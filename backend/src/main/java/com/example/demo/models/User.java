package com.example.demo.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = true)
    private String password;

    @Column(length = 20)
    private String authProvider = "LOCAL";

    @JsonIgnore
    @Column(unique = true, length = 100)
    private String googleId;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(length = 64)
    private String resetTokenHash;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private LocalDateTime resetTokenExpiry;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(length = 64)
    private String twoFactorCodeHash;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private LocalDateTime twoFactorCodeExpiry;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer twoFactorAttempts = 0;

    private String institution = "Stanford University";

    private String department = "Computer Science & AI Lab";

    private String role = "RESEARCHER";

    private LocalDateTime createdAt = LocalDateTime.now();

    public User() {
    }

    public User(String name, String email, String password, String institution, String department) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.authProvider = "LOCAL";
        if (institution != null && !institution.isBlank()) {
            this.institution = institution;
        }
        if (department != null && !department.isBlank()) {
            this.department = department;
        }
        this.createdAt = LocalDateTime.now();
    }

    public User(String name, String email, String authProvider, String googleId, String institution, String department) {
        this.name = name;
        this.email = email;
        this.password = null;
        this.authProvider = authProvider != null ? authProvider : "GOOGLE";
        this.googleId = googleId;
        if (institution != null && !institution.isBlank()) {
            this.institution = institution;
        }
        if (department != null && !department.isBlank()) {
            this.department = department;
        }
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getInstitution() {
        return institution;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAuthProvider() {
        return authProvider != null ? authProvider : "LOCAL";
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider != null ? authProvider : "LOCAL";
    }

    public String getGoogleId() {
        return googleId;
    }

    public void setGoogleId(String googleId) {
        this.googleId = googleId;
    }

    public String getResetTokenHash() {
        return resetTokenHash;
    }

    public void setResetTokenHash(String resetTokenHash) {
        this.resetTokenHash = resetTokenHash;
    }

    public LocalDateTime getResetTokenExpiry() {
        return resetTokenExpiry;
    }

    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) {
        this.resetTokenExpiry = resetTokenExpiry;
    }

    @JsonIgnore
    public String getTwoFactorCodeHash() {
        return twoFactorCodeHash;
    }

    public void setTwoFactorCodeHash(String twoFactorCodeHash) {
        this.twoFactorCodeHash = twoFactorCodeHash;
    }

    @JsonIgnore
    public LocalDateTime getTwoFactorCodeExpiry() {
        return twoFactorCodeExpiry;
    }

    public void setTwoFactorCodeExpiry(LocalDateTime twoFactorCodeExpiry) {
        this.twoFactorCodeExpiry = twoFactorCodeExpiry;
    }

    @JsonIgnore
    public Integer getTwoFactorAttempts() {
        return twoFactorAttempts != null ? twoFactorAttempts : 0;
    }

    public void setTwoFactorAttempts(Integer twoFactorAttempts) {
        this.twoFactorAttempts = twoFactorAttempts;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
