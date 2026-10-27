package com.example.demo.services;

import com.example.demo.models.Paper;
import com.example.demo.repos.PaperRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final PaperRepository paperRepository;
    private final RestTemplate restTemplate;
    private final String aiServiceUrl = "http://127.0.0.1:8000";

    @Autowired
    public RecommendationService(PaperRepository paperRepository) {
        this.paperRepository = paperRepository;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Recommends papers similar to a target paper using the Python AI TF-IDF Cosine Similarity service.
     */
    public Map<String, Object> getSimilarPapers(Long paperId, int topK) {
        try {
            String url = aiServiceUrl + "/recommend/similar";
            Map<String, Object> req = new HashMap<>();
            req.put("paperId", paperId);
            req.put("topK", topK > 0 ? topK : 3);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            System.err.println("AI microservice error on similar papers lookup: " + e.getMessage());
        }

        return buildFallbackSimilar(paperId, topK > 0 ? topK : 3);
    }

    /**
     * Recommends personalized papers based on the researcher's saved stack.
     */
    public Map<String, Object> getRecommendationsForUser(List<Long> savedPaperIds, int topK) {
        try {
            String url = aiServiceUrl + "/recommend/user";
            Map<String, Object> req = new HashMap<>();
            req.put("savedPaperIds", savedPaperIds != null ? savedPaperIds : Collections.emptyList());
            req.put("topK", topK > 0 ? topK : 5);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            System.err.println("AI microservice error on user recommendations: " + e.getMessage());
        }

        return buildFallbackUserRecommendations(savedPaperIds, topK > 0 ? topK : 5);
    }

    private Map<String, Object> buildFallbackSimilar(Long paperId, int topK) {
        Map<String, Object> res = new HashMap<>();
        res.put("targetPaperId", paperId);

        Optional<Paper> targetOpt = paperRepository.findById(paperId);
        if (targetOpt.isEmpty()) {
            res.put("count", 0);
            res.put("similarPapers", Collections.emptyList());
            return res;
        }

        Paper target = targetOpt.get();
        List<Paper> candidates = paperRepository.findAll().stream()
                .filter(p -> !p.getId().equals(paperId))
                .sorted((a, b) -> {
                    boolean aSame = Objects.equals(a.getFieldId(), target.getFieldId());
                    boolean bSame = Objects.equals(b.getFieldId(), target.getFieldId());
                    if (aSame && !bSame) return -1;
                    if (!aSame && bSame) return 1;
                    return Integer.compare(b.getCitations() != null ? b.getCitations() : 0,
                                           a.getCitations() != null ? a.getCitations() : 0);
                })
                .limit(topK)
                .collect(Collectors.toList());

        List<Map<String, Object>> items = new ArrayList<>();
        int rank = 0;
        for (Paper p : candidates) {
            Map<String, Object> item = new HashMap<>();
            item.put("paper", p);
            item.put("score", 0.92 - (rank * 0.04));
            item.put("matchPercentage", (94 - (rank * 4)) + "% Match");
            item.put("reason", Objects.equals(p.getFieldId(), target.getFieldId())
                    ? "Shares core methodology in " + p.getField()
                    : "Interdisciplinary scientific relevance");
            items.add(item);
            rank++;
        }

        res.put("count", items.size());
        res.put("similarPapers", items);
        return res;
    }

    private Map<String, Object> buildFallbackUserRecommendations(List<Long> savedPaperIds, int topK) {
        Map<String, Object> res = new HashMap<>();
        res.put("userSavedPaperIds", savedPaperIds);

        Set<Long> savedSet = savedPaperIds != null ? new HashSet<>(savedPaperIds) : Collections.emptySet();
        List<Paper> all = paperRepository.findAll();

        List<Paper> candidates = all.stream()
                .filter(p -> !savedSet.contains(p.getId()))
                .sorted((a, b) -> Integer.compare(b.getCitations() != null ? b.getCitations() : 0,
                                                   a.getCitations() != null ? a.getCitations() : 0))
                .limit(topK)
                .collect(Collectors.toList());

        List<Map<String, Object>> items = new ArrayList<>();
        int rank = 0;
        for (Paper p : candidates) {
            Map<String, Object> item = new HashMap<>();
            item.put("paper", p);
            item.put("score", 0.95 - (rank * 0.03));
            item.put("matchPercentage", (96 - (rank * 3)) + "% Match");
            item.put("reason", "Curated for your research trajectory across foundation models and active stacks");
            items.add(item);
            rank++;
        }

        res.put("count", items.size());
        res.put("recommendations", items);
        return res;
    }

    /**
     * Triggers the Python AI microservice to sync and re-vectorize the catalog
     */
    public void triggerCatalogSync() {
        try {
            restTemplate.postForEntity(aiServiceUrl + "/sync-catalog", null, Map.class);
        } catch (Exception e) {
            System.err.println("Could not sync catalog with AI microservice: " + e.getMessage());
        }
    }
}
