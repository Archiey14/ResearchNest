package com.example.demo.config;

import com.example.demo.controllers.AuthController;
import com.example.demo.models.User;
import com.example.demo.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Guards every /api/admin/** endpoint.
 *
 * A request is allowed only when it carries a valid, unexpired Bearer token AND the account the token
 * belongs to currently has the ADMIN role in the database. The role is re-read from the database on
 * every call (not trusted from the token claim) so that a demoted or deleted admin loses access
 * immediately instead of keeping it until the token expires.
 *
 *   no / malformed / expired / tampered token -> 401 Unauthorized
 *   valid token but not an ADMIN              -> 403 Forbidden
 */
@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    /** Request attribute holding the authenticated admin {@link User}, for controllers that need it. */
    public static final String ADMIN_USER_ATTRIBUTE = "researchnest.adminUser";

    private final AuthController authController;
    private final UserService userService;

    public AdminAuthInterceptor(AuthController authController, UserService userService) {
        this.authController = authController;
        this.userService = userService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {

        // CORS preflight requests never carry credentials; the CORS layer answers them.
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        String header = request.getHeader("Authorization");
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return reject(response, 401, "Authentication required. Please log in.");
        }

        String token = header.substring(7).trim();
        if (token.isEmpty()) {
            return reject(response, 401, "Authentication required. Please log in.");
        }

        AuthController.TokenClaims claims;
        try {
            claims = authController.validateAndParseToken(token);
        } catch (AuthController.TokenExpiredException e) {
            return reject(response, 401, "Authentication token has expired. Please log in again.");
        } catch (AuthController.TokenInvalidException e) {
            return reject(response, 401, "Invalid or tampered authentication token.");
        } catch (Exception e) {
            return reject(response, 401, "Could not validate authentication token.");
        }

        Optional<User> account = userService.findByEmail(claims.email);
        if (account.isEmpty()) {
            return reject(response, 401, "Account no longer exists. Please log in again.");
        }

        if (!"ADMIN".equalsIgnoreCase(account.get().getRole())) {
            return reject(response, 403, "Administrator privileges are required.");
        }

        request.setAttribute(ADMIN_USER_ATTRIBUTE, account.get());
        return true;
    }

    private boolean reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader("Cache-Control", "no-store");
        String safe = message.replace("\\", "\\\\").replace("\"", "\\\"");
        response.getWriter().write("{\"error\":\"" + safe + "\"}");
        return false;
    }
}
