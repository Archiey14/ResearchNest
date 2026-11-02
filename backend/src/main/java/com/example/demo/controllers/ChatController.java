package com.example.demo.controllers;

import com.example.demo.models.Paper;
import com.example.demo.repos.PaperRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class ChatController {

    private final PaperRepository paperRepository;
    private final RestTemplate restTemplate;
    private final String aiServiceUrl = "http://127.0.0.1:8000/chat";

    @Autowired
    public ChatController(PaperRepository paperRepository) {
        this.paperRepository = paperRepository;
        this.restTemplate = new RestTemplate();
    }

    public static class ChatRequestPayload {
        public String message;
        public List<Map<String, String>> history;
        public Object currentPaperId;
    }

    @PostMapping
    public ResponseEntity<?> handleChat(@RequestBody ChatRequestPayload req) {
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
                return ResponseEntity.ok(resp.getBody());
            }
        } catch (Exception e) {
            System.err.println("ChatController: AI microservice fallback triggered: " + e.getMessage());
        }

        // Fallback response generated from Spring Boot repository
        return ResponseEntity.ok(buildFallbackResponse(userQuery));
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
