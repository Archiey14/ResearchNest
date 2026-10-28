package com.example.demo.services;

public interface EmailService {

    /**
     * Sends a 6-digit password reset OTP to the recipient email.
     *
     * @param toEmail The recipient email address.
     * @param otp The 6-digit one-time password (never logged).
     * @throws IllegalArgumentException if email or otp is invalid.
     * @throws IllegalStateException if email service is not configured or sending fails.
     */
    void sendPasswordResetOtp(String toEmail, String otp);

    /**
     * Sends a 6-digit login verification OTP to the recipient email.
     *
     * @param toEmail The recipient email address.
     * @param otp The 6-digit one-time password (never logged).
     * @throws IllegalArgumentException if email or otp is invalid.
     * @throws IllegalStateException if email service is not configured or sending fails.
     */
    void sendLoginOtp(String toEmail, String otp);

    /**
     * Sends a notice informing the user that their account uses Google Sign-In.
     *
     * @param toEmail The recipient email address.
     * @throws IllegalArgumentException if email is invalid.
     * @throws IllegalStateException if email service is not configured or sending fails.
     */
    void sendGoogleAccountNotice(String toEmail);

    /**
     * Checks whether the underlying JavaMailSender is configured.
     *
     * @return true if mailSender is available, false otherwise.
     */
    boolean isConfigured();
}
