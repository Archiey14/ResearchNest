package com.example.demo.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    @Autowired
    public EmailServiceImpl(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${mail.from.address:no-reply@researchnest.org}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = (fromAddress != null && !fromAddress.isBlank()) ? fromAddress.trim() : "no-reply@researchnest.org";
    }

    @Override
    public boolean isConfigured() {
        return this.mailSender != null;
    }

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new IllegalArgumentException("Recipient email address is required.");
        }
        if (otp == null || otp.isBlank()) {
            throw new IllegalArgumentException("OTP code is required.");
        }
        if (this.mailSender == null) {
            throw new IllegalStateException("Email delivery service is unconfigured. Missing JavaMailSender / SMTP configuration.");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(this.fromAddress);
            message.setTo(toEmail.trim());
            message.setSubject("ResearchNest Password Reset Code");
            message.setText("Hello,\n\n"
                    + "You requested to reset your password for your ResearchNest account.\n\n"
                    + "Your 6-digit verification code is: " + otp + "\n\n"
                    + "This code will expire in 10 minutes. If you did not request a password reset, please ignore this email or review your account security.\n\n"
                    + "Best regards,\n"
                    + "The ResearchNest Team");

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send password reset email via SMTP (exception: {}, message: {})",
                    e.getClass().getName(), e.getMessage(), e);
            throw new IllegalStateException("Failed to send password reset email via SMTP: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendLoginOtp(String toEmail, String otp) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new IllegalArgumentException("Recipient email address is required.");
        }
        if (otp == null || otp.isBlank()) {
            throw new IllegalArgumentException("OTP code is required.");
        }
        if (this.mailSender == null) {
            throw new IllegalStateException("Email delivery service is unconfigured. Missing JavaMailSender / SMTP configuration.");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(this.fromAddress);
            message.setTo(toEmail.trim());
            message.setSubject("ResearchNest Sign-In Verification Code");
            message.setText("Hello,\n\n"
                    + "You are signing in to your ResearchNest account.\n\n"
                    + "Your 6-digit verification code is: " + otp + "\n\n"
                    + "This code will expire in 5 minutes. If you did not attempt to sign in, please change your password immediately or review your account security.\n\n"
                    + "Best regards,\n"
                    + "The ResearchNest Team");

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send login verification email via SMTP (exception: {}, message: {})",
                    e.getClass().getName(), e.getMessage(), e);
            throw new IllegalStateException("Failed to send login verification email via SMTP: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendGoogleAccountNotice(String toEmail) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new IllegalArgumentException("Recipient email address is required.");
        }
        if (this.mailSender == null) {
            throw new IllegalStateException("Email delivery service is unconfigured. Missing JavaMailSender / SMTP configuration.");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(this.fromAddress);
            message.setTo(toEmail.trim());
            message.setSubject("ResearchNest Password Reset - Google Sign-In Account");
            message.setText("Hello,\n\n"
                    + "We received a password reset request for your ResearchNest account.\n\n"
                    + "However, your account is configured to authenticate with Google Sign-In and does not use a password.\n\n"
                    + "To access your workspace, please sign in using the 'Continue with Google' button.\n\n"
                    + "Best regards,\n"
                    + "The ResearchNest Team");

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send Google account notice via SMTP (exception: {}, message: {})",
                    e.getClass().getName(), e.getMessage(), e);
            throw new IllegalStateException("Failed to send Google account notice via SMTP: " + e.getMessage(), e);
        }
    }
}
