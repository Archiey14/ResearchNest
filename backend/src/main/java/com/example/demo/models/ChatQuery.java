package com.example.demo.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Audit record of a single question asked in the NestAI chatbot.
 * Shown to administrators in the Admin Console.
 */
@Entity
@Table(name = "chat_queries")
public class ChatQuery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 180)
    private String userEmail;

    @Column(length = 120)
    private String userName;

    @Column(nullable = false, length = 2000)
    private String query;

    @Column(length = 60)
    private String intent;

    /** AI_SERVICE (Python microservice answered) or FALLBACK (Spring Boot built-in answer). */
    @Column(length = 30)
    private String source;

    private Long paperId;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ChatQuery() {
    }

    public ChatQuery(String userEmail, String userName, String query, String intent, String source, Long paperId) {
        this.userEmail = userEmail;
        this.userName = userName;
        this.query = query;
        this.intent = intent;
        this.source = source;
        this.paperId = paperId;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Long getPaperId() { return paperId; }
    public void setPaperId(Long paperId) { this.paperId = paperId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
