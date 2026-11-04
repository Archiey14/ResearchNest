package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Registers request interceptors.
 *  - Everything under /api/admin requires an authenticated ADMIN.
 *  - Any write (POST/PUT/PATCH/DELETE) under /api/papers requires an ADMIN,
 *    or the AI service's service key on POST /api/papers/batch only. Reads stay public.
 */
@Configuration
public class WebSecurityConfig implements WebMvcConfigurer {

    private final AdminAuthInterceptor adminAuthInterceptor;
    private final PaperWriteAuthInterceptor paperWriteAuthInterceptor;

    public WebSecurityConfig(AdminAuthInterceptor adminAuthInterceptor,
                             PaperWriteAuthInterceptor paperWriteAuthInterceptor) {
        this.adminAuthInterceptor = adminAuthInterceptor;
        this.paperWriteAuthInterceptor = paperWriteAuthInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminAuthInterceptor)
                .addPathPatterns("/api/admin", "/api/admin/**");

        registry.addInterceptor(paperWriteAuthInterceptor)
                .addPathPatterns("/api/papers", "/api/papers/**");
    }
}
