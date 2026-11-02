package com.example.demo.controllers;

import com.example.demo.models.ChatQuery;
import com.example.demo.models.Paper;
import com.example.demo.models.User;
import com.example.demo.repos.ChatQueryRepository;
import com.example.demo.repos.PaperRepository;
import com.example.demo.repos.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"})
public class ChatController {

    private final PaperRepository paperRepository;
    private final ChatQueryRepository chatQueryRepository;
    private final UserRepository userRepository;
    private final AuthController authController;
    private final RestTemplate restTemplate;
    private final String aiServiceUrl = "http://127.0.0.1:8000/chat";

    @Autowired
    public ChatController(PaperRepository paperRepository,
                          ChatQueryRepository chatQueryRepository,
                          UserRepository userRepository,
                          AuthController authController) {
        this.paperRepository = paperRepository;
        this.chatQueryRepository = chatQueryRepository;
        this.userRepository = userRepository;
        this.authController = authController;
        this.restTemplate = new RestTemplate();
    }

    public static class ChatRequestPayload {
        public String message;
        public List<Map<String, String>> history;
        public Object currentPaperId;
        // Optional identity hints from the frontend (used only when the bearer token cannot be verified,
        // e.g. local demo admin sessions).
        public String userEmail;
        public String userName;
    }

    /**
     * Persist one chatbot question for the Admin Console. Never lets a logging failure break the chat.
     */
    private void recordQuery(String authHeader, ChatRequestPayload req, String query, String intent, String source) {
        try {
            String email = null;
            String name = null;

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    AuthController.TokenClaims claims = authController.validateAndParseToken(authHeader.substring(7).trim());
                    email = claims.email;
                    User u = userRepository.findByEmail(email).orElse(null);
                    if (u != null) {
                        name = u.getName();
                    }
                } catch (Exception ignored) {
                    // invalid/demo token: fall through to client-supplied hints
                }
            }

            if (email == null && req != null && req.userEmail != null && !req.userEmail.isBlank()) {
                email = req.userEmail.trim().toLowerCase();
                name = req.userName;
            }

            Long paperId = null;
            if (req != null && req.currentPaperId != null) {
                try {
                    paperId = Long.valueOf(String.valueOf(req.currentPaperId));
                } catch (NumberFormatException ignored) {
                    // non-numeric paper ids are not stored
                }
            }

            String trimmed = query.length() > 2000 ? query.substring(0, 2000) : query;
            ChatQuery saved = chatQueryRepository.save(new ChatQuery(
                    email != null ? email : "anonymous",
                    name != null && !name.isBlank() ? name : (email != null ? email : "Anonymous visitor"),
                    trimmed,
                    intent,
                    source,
                    paperId
            ));
            System.out.println("ChatController: recorded chat query #" + saved.getId()
                    + " from " + saved.getUserEmail() + " [" + source + "]");
        } catch (Exception e) {
            System.err.println("ChatController: could not record chat query: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private static String intentOf(Object body) {
        if (body instanceof Map<?, ?> m && m.get("intent") != null) {
            return String.valueOf(m.get("intent"));
        }
        return "general";
    }

    /**
     * Lightweight logging-only endpoint. The frontend calls it when the chat request itself could not be
     * answered through this controller (e.g. it fell back to the AI microservice or offline mode), so the
     * question still shows up in the Admin Console.
     */
    @PostMapping("/log")
    public ResponseEntity<?> logQuery(
            @RequestBody ChatRequestPayload req,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String q = (req != null && req.message != null) ? req.message.trim() : "";
        if (q.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required."));
        }
        recordQuery(authHeader, req, q, "general", "CLIENT_FALLBACK");
        return ResponseEntity.ok(Map.of("logged", true));
    }

    @PostMapping
    public ResponseEntity<?> handleChat(
            @RequestBody ChatRequestPayload req,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String userQuery = (req != null && req.message != null) ? req.message.trim() : "";
        if (userQuery.isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("reply", "Please provide a question or topic so I can assist your literature research.");
            err.put("intent", "general");
            err.put("suggestedQueries", List.of(
                    "How does the hybrid recommendation model work?",
                    "Recommend papers on Mamba & State Space Models",
                    "How do research stacks work?"
            ));
            err.put("relatedPapers", Collections.emptyList());
            return ResponseEntity.ok(err);
        }

        // Try Python AI microservice first
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("message", userQuery);
            body.put("history", req.history != null ? req.history : Collections.emptyList());
            body.put("currentPaperId", req.currentPaperId);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> resp = restTemplate.postForEntity(aiServiceUrl, entity, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                recordQuery(authHeader, req, userQuery, intentOf(resp.getBody()), "AI_SERVICE");
                return ResponseEntity.ok(resp.getBody());
            }
        } catch (Exception e) {
            System.err.println("ChatController: AI microservice fallback triggered: " + e.getMessage());
        }

        // Fallback response generated from Spring Boot repository
        Map<String, Object> fallback = buildFallbackResponse(userQuery);
        recordQuery(authHeader, req, userQuery, intentOf(fallback), "FALLBACK");
        return ResponseEntity.ok(fallback);
    }

    private Map<String, Object> buildFallbackResponse(String query) {
        String qLower = query.toLowerCase();
        Map<String, Object> res = new HashMap<>();
        List<Paper> allPapers = paperRepository.findAll();

        if (qLower.contains("algorithm") || qLower.contains("recommend") || qLower.contains("hybrid") || qLower.contains("rocchio")) {
            res.put("reply", "**ResearchNest's Hybrid Recommendation Engine** combines:\n\n" +
                    "1. **Semantic Content Matching:** TF-IDF vector space with cosine similarity against your research profile.\n" +
                    "2. **Logarithmic Citation Impact:** 0.15 * log(1 + citations) balancing classics with preprints.\n" +
                    "3. **Exponential Recency Decay:** Prioritizes fresh research.\n" +
                    "4. **Active Relevance Feedback (Rocchio):** Likes (thumbs up) anchor your preferences with 2.5x weight, while dislikes subtract unwanted coordinates.");
            res.put("intent", "platform_help");
            res.put("suggestedQueries", List.of(
                    "How does reading duration boost recommendations?",
                    "Recommend papers on Machine Learning",
                    "How do research stacks work?"
            ));
        } else {
            res.put("reply", "I am **NestAI Copilot**, your research literature and platform assistant. " +
                    "I can help explain paper methodologies, recommend fresh publications, or guide you through creating research stacks and tracking reading time.");
            res.put("intent", "general");
            res.put("suggestedQueries", List.of(
                    "How does the recommendation algorithm work?",
                    "Recommend papers on Transformers & Attention",
                    "How do I save papers to my stack?"
            ));
        }

        // Find papers matching any keywords
        List<Map<String, Object>> matching = new ArrayList<>();
        for (Paper p : allPapers) {
            String title = p.getTitle() != null ? p.getTitle().toLowerCase() : "";
            String field = p.getField() != null ? p.getField().toLowerCase() : "";
            if (title.contains("mamba") || title.contains("transformer") || title.contains("graphcast") ||
                    qLower.contains("all") || (field.length() > 2 && qLower.contains(field))) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", p.getId());
                map.put("title", p.getTitle());
                map.put("authors", p.getAuthors());
                map.put("year", p.getYear());
                map.put("field", p.getField());
                map.put("citations", p.getCitations());
                map.put("abstract", p.getAbstractText());
                map.put("pdfUrl", p.getPdfUrl());
                matching.add(map);
                if (matching.size() >= 2) break;
            }
        }
        res.put("relatedPapers", matching);
        return res;
    }
}
