package com.example.demo.services;

public class GoogleUserInfo {

    private final String googleId;
    private final String email;
    private final boolean emailVerified;
    private final String name;

    public GoogleUserInfo(String googleId, String email, boolean emailVerified, String name) {
        this.googleId = googleId;
        this.email = email;
        this.emailVerified = emailVerified;
        this.name = name;
    }

    public String getGoogleId() {
        return googleId;
    }

    public String getEmail() {
        return email;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public String getName() {
        return name;
    }
}
