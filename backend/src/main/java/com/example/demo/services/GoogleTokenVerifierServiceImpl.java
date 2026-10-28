package com.example.demo.services;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class GoogleTokenVerifierServiceImpl implements GoogleTokenVerifierService {

    private final String googleClientId;
    private final GoogleIdTokenVerifier verifier;

    @Autowired
    public GoogleTokenVerifierServiceImpl(
            @Value("${google.client-id:}") String googleClientId) {
        this.googleClientId = (googleClientId != null) ? googleClientId.trim() : "";
        if (!this.googleClientId.isEmpty() && !this.googleClientId.startsWith("your-google-client-id")) {
            this.verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(this.googleClientId))
                    .build();
        } else {
            this.verifier = null;
        }
    }

    /**
     * Constructor allowing injection of custom verifier (useful for testing).
     */
    public GoogleTokenVerifierServiceImpl(String googleClientId, GoogleIdTokenVerifier verifier) {
        this.googleClientId = (googleClientId != null) ? googleClientId.trim() : "";
        this.verifier = verifier;
    }

    @Override
    public GoogleUserInfo verifyToken(String idTokenString) {
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new IllegalArgumentException("Google ID token is required.");
        }

        if (this.verifier == null) {
            throw new IllegalStateException("Google Sign-In is not configured on this server. Please set google.client-id in application.properties or GOOGLE_CLIENT_ID environment variable.");
        }

        try {
            GoogleIdToken idToken = this.verifier.verify(idTokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("Invalid Google ID token, audience mismatch, or expired token.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String subject = payload.getSubject();
            String email = payload.getEmail();
            Boolean emailVerified = payload.getEmailVerified();
            String name = (String) payload.get("name");

            if (subject == null || subject.isBlank()) {
                throw new IllegalArgumentException("Google token is missing the subject identifier.");
            }
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Google token is missing an email address.");
            }

            return new GoogleUserInfo(
                    subject,
                    email,
                    Boolean.TRUE.equals(emailVerified),
                    name
            );
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Cryptographic verification of Google ID token failed: " + e.getMessage(), e);
        }
    }
}
