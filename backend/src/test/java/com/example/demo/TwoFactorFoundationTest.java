package com.example.demo;

import com.example.demo.models.User;
import com.example.demo.services.EmailServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import tools.jackson.databind.json.JsonMapper;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class TwoFactorFoundationTest {

    @Test
    @DisplayName("User entity stores 2FA fields and @JsonIgnore ensures they are never serialized in API responses")
    void testUserEntityTwoFactorFieldsAndSerialization() throws Exception {
        User user = new User(
                "Ada Lovelace",
                "ada@computing.org",
                "HashPassword123!",
                "MIT",
                "Computing"
        );

        // 1. Initial state
        assertNull(user.getTwoFactorCodeHash());
        assertNull(user.getTwoFactorCodeExpiry());

        // 2. Set 2FA values
        String sampleHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);

        user.setTwoFactorCodeHash(sampleHash);
        user.setTwoFactorCodeExpiry(expiry);

        assertEquals(sampleHash, user.getTwoFactorCodeHash());
        assertEquals(expiry, user.getTwoFactorCodeExpiry());

        // 3. Verify serialization exclusion
        String json = JsonMapper.shared().writeValueAsString(user);

        assertFalse(json.contains("twoFactorCodeHash"), "twoFactorCodeHash must be excluded from serialized JSON");
        assertFalse(json.contains("twoFactorCodeExpiry"), "twoFactorCodeExpiry must be excluded from serialized JSON");
        assertFalse(json.contains("twoFactorAttempts"), "twoFactorAttempts must be excluded from serialized JSON");
        assertFalse(json.contains("resetTokenHash"), "resetTokenHash must be excluded from serialized JSON");
        assertFalse(json.contains("resetTokenExpiry"), "resetTokenExpiry must be excluded from serialized JSON");
        assertFalse(json.contains("password"), "password must be excluded from serialized JSON");
        assertTrue(json.contains("ada@computing.org"), "Public user fields must remain serialized");
    }

    @Test
    @DisplayName("EmailServiceImpl.sendLoginOtp dispatches with sign-in verification subject and 5-minute expiry")
    void testSendLoginOtpDispatchesProperMessage() {
        AtomicReference<SimpleMailMessage> captured = new AtomicReference<>();

        JavaMailSender mockSender = (JavaMailSender) Proxy.newProxyInstance(
                JavaMailSender.class.getClassLoader(),
                new Class<?>[]{JavaMailSender.class},
                (proxy, method, args) -> {
                    if ("send".equals(method.getName()) && args.length == 1 && args[0] instanceof SimpleMailMessage msg) {
                        captured.set(msg);
                    }
                    return null;
                }
        );

        EmailServiceImpl emailService = new EmailServiceImpl(mockSender, "security@researchnest.org");

        emailService.sendLoginOtp("researcher@stanford.edu", "482910");

        SimpleMailMessage sent = captured.get();
        assertNotNull(sent, "Email message should have been sent to JavaMailSender");
        assertArrayEquals(new String[]{"researcher@stanford.edu"}, sent.getTo());
        assertEquals("security@researchnest.org", sent.getFrom());
        assertEquals("ResearchNest Sign-In Verification Code", sent.getSubject());
        assertNotNull(sent.getText());
        assertTrue(sent.getText().contains("482910"), "Email body must contain the OTP");
        assertTrue(sent.getText().contains("5 minutes"), "Email body must explain that code expires in 5 minutes");
        assertTrue(sent.getText().contains("signing in to your ResearchNest account"));
    }

    @Test
    @DisplayName("EmailServiceImpl.sendLoginOtp validates parameters and rejects unconfigured service")
    void testSendLoginOtpValidationAndUnconfigured() {
        EmailServiceImpl unconfiguredService = new EmailServiceImpl(null, "no-reply@researchnest.org");

        // Reject null / empty email
        assertThrows(IllegalArgumentException.class, () ->
                unconfiguredService.sendLoginOtp(null, "123456"));
        assertThrows(IllegalArgumentException.class, () ->
                unconfiguredService.sendLoginOtp("   ", "123456"));

        // Reject null / empty OTP
        assertThrows(IllegalArgumentException.class, () ->
                unconfiguredService.sendLoginOtp("user@test.edu", null));
        assertThrows(IllegalArgumentException.class, () ->
                unconfiguredService.sendLoginOtp("user@test.edu", ""));

        // Reject when JavaMailSender is null
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                unconfiguredService.sendLoginOtp("user@test.edu", "123456"));
        assertTrue(ex.getMessage().contains("unconfigured"));
    }

    @Test
    @DisplayName("EmailServiceImpl.sendLoginOtp wraps SMTP exceptions safely without leaking OTP in exception message")
    void testSendLoginOtpSmtpFailureHandling() {
        JavaMailSender failingSender = (JavaMailSender) Proxy.newProxyInstance(
                JavaMailSender.class.getClassLoader(),
                new Class<?>[]{JavaMailSender.class},
                (proxy, method, args) -> {
                    if ("send".equals(method.getName())) {
                        throw new MailSendException("535-5.7.8 Username and Password not accepted");
                    }
                    return null;
                }
        );

        EmailServiceImpl emailService = new EmailServiceImpl(failingSender, "security@researchnest.org");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                emailService.sendLoginOtp("researcher@stanford.edu", "938201"));

        assertNotNull(ex.getCause());
        assertInstanceOf(MailSendException.class, ex.getCause());
        assertTrue(ex.getMessage().contains("535-5.7.8 Username and Password not accepted"));
        assertFalse(ex.getMessage().contains("938201"), "Exception message must never expose the OTP");
    }
}
