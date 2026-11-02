package com.example.demo;

import com.example.demo.services.GoogleTokenVerifierServiceImpl;
import com.example.demo.services.GoogleUserInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class GoogleTokenVerifierServiceImplTest {

    @Test
    @DisplayName("Dev Google token resolves to valid default GoogleUserInfo")
    void testDevGoogleTokenDefault() {
        GoogleTokenVerifierServiceImpl service = new GoogleTokenVerifierServiceImpl("");
        GoogleUserInfo info = service.verifyToken("dev_google_token");

        assertNotNull(info);
        assertEquals("alex.chen.google@stanford.edu", info.getEmail());
        assertTrue(info.isEmailVerified());
        assertNotNull(info.getGoogleId());
        assertTrue(info.getName().contains("Alex Chen"));
    }

    @Test
    @DisplayName("Dev Google token with Base64 payload extracts custom claims")
    void testDevGoogleTokenWithCustomPayload() {
        GoogleTokenVerifierServiceImpl service = new GoogleTokenVerifierServiceImpl("");
        String json = "{\"sub\":\"gid_custom_777\",\"email\":\"custom.scholar@mit.edu\",\"name\":\"Prof. Claude Shannon\",\"email_verified\":true}";
        String b64 = Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        String token = "dev_google_token:" + b64;

        GoogleUserInfo info = service.verifyToken(token);

        assertNotNull(info);
        assertEquals("gid_custom_777", info.getGoogleId());
        assertEquals("custom.scholar@mit.edu", info.getEmail());
        assertEquals("Prof. Claude Shannon", info.getName());
        assertTrue(info.isEmailVerified());
    }

    @Test
    @DisplayName("Blank or null tokens throw IllegalArgumentException")
    void testBlankOrNullToken() {
        GoogleTokenVerifierServiceImpl service = new GoogleTokenVerifierServiceImpl("");
        assertThrows(IllegalArgumentException.class, () -> service.verifyToken(null));
        assertThrows(IllegalArgumentException.class, () -> service.verifyToken("   "));
    }

    @Test
    @DisplayName("Invalid token throws IllegalArgumentException")
    void testInvalidToken() {
        GoogleTokenVerifierServiceImpl service = new GoogleTokenVerifierServiceImpl("");
        assertThrows(IllegalArgumentException.class, () -> service.verifyToken("invalid_random_token_string"));
    }
}
