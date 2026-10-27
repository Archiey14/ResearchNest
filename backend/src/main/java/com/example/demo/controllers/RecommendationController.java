package com.example.demo.controllers;

import com.example.demo.services.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class RecommendationController {

    private final RecommendationService recommendationService;

    @Autowired
    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    public static class UserRecommendationRequest {
        public List<Long> savedPaperIds;
        public Integer topK;
    }

    /**
     * Get similar papers for a given paper ID using the AI similarity engine.
     * Example: GET /api/recommendations/similar/9?topK=3
     */
    @GetMapping("/similar/{paperId}")
    public ResponseEntity<?> getSimilarPapers(
            @PathVariable Long paperId,
            @RequestParam(defaultValue = "3") int topK) {
        return ResponseEntity.ok(recommendationService.getSimilarPapers(paperId, topK));
    }

    /**
     * Get personalized paper recommendations given the user's saved stack paper IDs.
     * Example: POST /api/recommendations/user with body { "savedPaperIds": [2, 9], "topK": 5 }
     */
    @PostMapping("/user")
    public ResponseEntity<?> getRecommendationsForUser(@RequestBody UserRecommendationRequest req) {
        List<Long> saved = req != null && req.savedPaperIds != null ? req.savedPaperIds : Collections.emptyList();
        int topK = req != null && req.topK != null ? req.topK : 5;
        return ResponseEntity.ok(recommendationService.getRecommendationsForUser(saved, topK));
    }

    /**
     * Convenient GET endpoint for the frontend dashboard.
     * Example: GET /api/recommendations/for-you?savedIds=2,9&topK=5
     */
    @GetMapping("/for-you")
    public ResponseEntity<?> getForYou(
            @RequestParam(required = false) String savedIds,
            @RequestParam(defaultValue = "5") int topK) {
        List<Long> parsedIds = new ArrayList<>();
        if (savedIds != null && !savedIds.isBlank()) {
            for (String part : savedIds.split(",")) {
                try {
                    parsedIds.add(Long.parseLong(part.trim()));
                } catch (NumberFormatException ignored) {}
            }
        }
        return ResponseEntity.ok(recommendationService.getRecommendationsForUser(parsedIds, topK));
    }
}
