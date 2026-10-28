package com.example.demo.services;

public interface GoogleTokenVerifierService {

    /**
     * Cryptographically verifies a Google ID token and returns verified user claims.
     *
     * @param idTokenString The raw Google JWT ID token string from Google Identity Services.
     * @return GoogleUserInfo containing verified subject ID, email, emailVerified status, and name.
     * @throws IllegalArgumentException if token is missing, malformed, expired, or invalid.
     * @throws IllegalStateException if the server is not configured with a Google client ID.
     */
    GoogleUserInfo verifyToken(String idTokenString);
}
