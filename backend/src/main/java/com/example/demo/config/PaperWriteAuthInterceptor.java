package com.example.demo.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Guards every state-changing request under /api/papers (POST, PUT, PATCH, DELETE).
 * Reading papers (GET) stays public.
 *
 * Allowed callers:
 *  1. An authenticated ADMIN (Bearer token), same rules as {@link AdminAuthInterceptor}.
 *  2. The AI microservice's harvester, which has no user session: it may call ONLY
 *     POST /api/papers/batch and must send the shared secret in the X-Service-Key header.
 *     The secret comes from app.internal-api-key (env INTERNAL_API_KEY). If it is not configured
 *     (or shorter than 16 characters) the service-key path is disabled and only admins get through.
 */
@Component
public class PaperWriteAuthInterceptor implements HandlerInterceptor {

    public static final String SERVICE_KEY_HEADER = "X-Service-Key";
    private static final String BATCH_PATH = "/api/papers/batch";
    private static final int MIN_SERVICE_KEY_LENGTH = 16;

    private final AdminAuthInterceptor adminAuthInterceptor;
    private final String serviceKey;

    public PaperWriteAuthInterceptor(AdminAuthInterceptor adminAuthInterceptor,
                                     @Value("${app.internal-api-key:}") String serviceKey) {
        this.adminAuthInterceptor = adminAuthInterceptor;
        this.serviceKey = serviceKey == null ? "" : serviceKey.trim();
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {

        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        if (isBatchIngest(request) && hasValidServiceKey(request)) {
            return true;
        }

        return adminAuthInterceptor.preHandle(request, response, handler);
    }

    private boolean isBatchIngest(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String uri = request.getRequestURI();
        if (uri == null) {
            return false;
        }
        if (uri.length() > 1 && uri.endsWith("/")) {
            uri = uri.substring(0, uri.length() - 1);
        }
        return BATCH_PATH.equals(uri);
    }

    private boolean hasValidServiceKey(HttpServletRequest request) {
        if (serviceKey.length() < MIN_SERVICE_KEY_LENGTH) {
            return false;
        }
        String provided = request.getHeader(SERVICE_KEY_HEADER);
        if (provided == null || provided.isEmpty()) {
            return false;
        }
        return MessageDigest.isEqual(
                provided.getBytes(StandardCharsets.UTF_8),
                serviceKey.getBytes(StandardCharsets.UTF_8));
    }
}
