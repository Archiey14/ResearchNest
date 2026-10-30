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
        public List<Object> savedPaperIds;
        public List<Object> dismissedPaperIds;
        public Map<String, Double> readDurations;
        public Integer topK;
    }

    private List<Object> parseCsvIds(String csv) {
        List<Object> parsed = new ArrayList<>();
        if (csv != null && !csv.isBlank()) {
            for (String part : csv.split(",")) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty()) {
                    try {
                        parsed.add(Long.parseLong(trimmed));
                    } catch (NumberFormatException e) {
                        String digits = trimmed.replaceAll("[^0-9]", "");
                        if (!digits.isEmpty()) {
                            try {
                                parsed.add(Long.parseLong(digits));
                            } catch (NumberFormatException ignored) {}
                        } else {
                            parsed.add(trimmed);
                        }
                    }
                }
            }
        }
        return parsed;
    }

    /**
     * Get similar papers for a given paper ID using the AI similarity engine.
     * Example: GET /api/recommendations/similar/9?topK=3 or /api/recommendations/similar/paper-9?topK=3
     */
    @GetMapping("/similar/{paperId}")
    public ResponseEntity<?> getSimilarPapers(
            @PathVariable String paperId,
            @RequestParam(defaultValue = "3") int topK) {
        return ResponseEntity.ok(recommendationService.getSimilarPapers(paperId, topK));
    }

    /**
     * Get personalized paper recommendations given the user's saved stack paper IDs and active learning signals.
     * Example: POST /api/recommendations/user with body { "savedPaperIds": [2, 9], "dismissedPaperIds": [3], "topK": 5 }
     */
    @PostMapping("/user")
    public ResponseEntity<?> getRecommendationsForUser(@RequestBody UserRecommendationRequest req) {
        List<Object> saved = req != null && req.savedPaperIds != null ? req.savedPaperIds : Collections.emptyList();
        List<Object> dismissed = req != null && req.dismissedPaperIds != null ? req.dismissedPaperIds : Collections.emptyList();
        Map<String, Double> durations = req != null && req.readDurations != null ? req.readDurations : Collections.emptyMap();
        int topK = req != null && req.topK != null ? req.topK : 5;
        return ResponseEntity.ok(recommendationService.getRecommendationsForUser(saved, dismissed, durations, topK));
    }

    /**
     * Convenient GET endpoint for the frontend dashboard with active feedback support.
     * Example: GET /api/recommendations/for-you?savedIds=2,9&dismissedIds=3&topK=5
     */
    @GetMapping("/for-you")
    public ResponseEntity<?> getForYou(
            @RequestParam(required = false) String savedIds,
            @RequestParam(required = false) String dismissedIds,
            @RequestParam(defaultValue = "5") int topK) {
        List<Object> parsedSaved = parseCsvIds(savedIds);
        List<Object> parsedDismissed = parseCsvIds(dismissedIds);
        return ResponseEntity.ok(recommendationService.getRecommendationsForUser(
                parsedSaved,
                parsedDismissed,
                Collections.emptyMap(),
                topK));
    }
}
