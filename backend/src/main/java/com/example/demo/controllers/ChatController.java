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
import java.util.regex.Pattern;

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
        // Deprecated and IGNORED. Older frontends still send these, but the server never trusts
        // client-supplied identity: a query is attributed only to the account proven by a valid
        // Bearer token. The fields are kept so existing clients' JSON still deserializes.
        public String userEmail;
        public String userName;
    }

    /**
     * Persist one chatbot question for the Admin Console. Never lets a logging failure break the chat.
     *
     * The author is taken ONLY from a verified Bearer token whose account still exists in the database.
     * Anything else (no token, invalid/expired token, deleted account, forged userEmail in the body)
     * is recorded as "anonymous", so nobody can plant entries under another person's identity.
     */
    private void recordQuery(String authHeader, ChatRequestPayload req, String query, String intent, String source) {
        try {
            String email = null;
            String name = null;

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    AuthController.TokenClaims claims = authController.validateAndParseToken(authHeader.substring(7).trim());
                    User u = userRepository.findByEmail(claims.email).orElse(null);
                    if (u != null) {
                        email = u.getEmail();
                        name = u.getName();
                    }
                } catch (Exception ignored) {
                    // invalid/expired token: treat as anonymous
                }
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

    private static final Set<String> SEARCH_STOP_WORDS = Set.of(
            "suggest", "recommend", "recommended", "recommendation", "recommendations", "find", "show",
            "search", "give", "list", "me", "us", "some", "any", "a", "an", "the", "of", "on", "about",
            "for", "to", "in", "and", "or", "with", "papers", "paper", "related", "relevant", "literature",
            "publication", "publications", "article", "articles", "research", "please", "can", "could",
            "you", "i", "want", "need", "good", "best", "top", "latest", "new", "recent", "fresh", "more",
            "few", "similar", "topic", "topics", "regarding", "around", "from", "what", "are", "is", "my",
            "would", "like", "see", "get", "read", "reading", "study", "studies");

    private static final Map<String, String> TOPIC_SYNONYMS = Map.of(
            "ml", "machine learning",
            "nlp", "natural language",
            "cv", "computer vision",
            "llm", "language model",
            "llms", "language model",
            "dl", "deep learning",
            "rl", "reinforcement learning",
            "ai", "artificial intelligence");

    /** "suggest ml papers", "recommend papers on NLP", "find me papers about quantum" (but not algorithm questions). */
    private static boolean isPaperSearchRequest(String qLower) {
        boolean asksForPapers = qLower.contains("recommend") || qLower.contains("suggest")
                || qLower.contains("find me") || qLower.contains("show me") || qLower.contains("search for")
                || qLower.contains("papers on") || qLower.contains("papers about")
                || qLower.contains("related papers") || qLower.contains("literature on");
        boolean asksAboutPlatform = qLower.contains("algorithm") || qLower.contains("hybrid")
                || qLower.contains("rocchio") || qLower.contains("how does") || qLower.contains("how do ")
                || qLower.contains("model work");
        return asksForPapers && !asksAboutPlatform;
    }

    /** Word-boundary match for short terms (so "ml" doesn't match "html"), substring match otherwise. */
    private static boolean containsTerm(String haystack, String term) {
        if (haystack == null || haystack.isEmpty()) return false;
        if (term.length() <= 3) {
            return Pattern.compile("\\b" + Pattern.quote(term) + "\\b").matcher(haystack).find();
        }
        return haystack.contains(term);
    }

    private static Map<String, Object> paperToMap(Paper p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("title", p.getTitle());
        map.put("authors", p.getAuthors());
        map.put("year", p.getYear());
        map.put("field", p.getField());
        map.put("fieldId", p.getFieldId());
        map.put("venue", p.getVenue());
        map.put("topicTag", p.getTopicTag());
        map.put("citations", p.getCitations());
        map.put("citationLabel", p.getCitationLabel());
        map.put("abstract", p.getAbstractText());
        map.put("readingTime", p.getReadingTime());
        map.put("bibtex", p.getBibtex());
        map.put("takeaways", p.getTakeaways());
        map.put("pdfUrl", p.getPdfUrl());
        return map;
    }

    /** Keyword search over the paper catalog, used when the AI microservice is unavailable. */
    private Map<String, Object> buildPaperSearchResponse(String query, List<Paper> allPapers) {
        String qLower = query.toLowerCase();

        List<String> terms = new ArrayList<>();
        for (String tok : qLower.split("[^a-z0-9+#]+")) {
            if (tok.length() < 2 || SEARCH_STOP_WORDS.contains(tok)) continue;
            terms.add(tok);
            String synonym = TOPIC_SYNONYMS.get(tok);
            if (synonym != null) terms.add(synonym);
        }

        Map<Paper, Integer> scores = new LinkedHashMap<>();
        for (Paper p : allPapers) {
            String title = p.getTitle() != null ? p.getTitle().toLowerCase() : "";
            String field = p.getField() != null ? p.getField().toLowerCase() : "";
            String fieldId = p.getFieldId() != null ? p.getFieldId().toLowerCase() : "";
            String topic = p.getTopicTag() != null ? p.getTopicTag().toLowerCase() : "";
            String abs = p.getAbstractText() != null ? p.getAbstractText().toLowerCase() : "";

            int score = 0;
            for (String term : terms) {
                if (containsTerm(title, term)) score += 3;
                if (fieldId.equals(term) || containsTerm(field, term) || containsTerm(topic, term)) score += 2;
                if (containsTerm(abs, term)) score += 1;
            }
            if (score > 0) scores.put(p, score);
        }

        Comparator<Paper> byCitations = Comparator.comparingInt(
                (Paper p) -> p.getCitations() != null ? p.getCitations() : 0).reversed();

        List<Paper> picked = new ArrayList<>(scores.keySet());
        picked.sort(Comparator.comparingInt((Paper p) -> scores.get(p)).reversed().thenComparing(byCitations));

        boolean noMatch = picked.isEmpty();
        if (noMatch) {
            picked = new ArrayList<>(allPapers);
            picked.sort(byCitations);
        }
        if (picked.size() > 3) picked = new ArrayList<>(picked.subList(0, 3));

        StringBuilder reply = new StringBuilder();
        if (picked.isEmpty()) {
            reply.append("The paper catalog looks empty right now. Use **Harvest Literature** on the Discover page to load some papers.");
        } else {
            reply.append(noMatch && !terms.isEmpty()
                    ? "I couldn't find an exact match for **\"" + query.trim() + "\"**, so here are the most-cited papers in the catalog:\n\n"
                    : "Here are the top papers matching **\"" + query.trim() + "\"** from the catalog:\n\n");
            for (Paper p : picked) {
                reply.append("\u2022 **").append(p.getTitle()).append("** (")
                        .append(p.getField() != null ? p.getField() : "Science").append(", ")
                        .append(p.getYear() != null ? p.getYear() : "n/a").append(") by *")
                        .append(p.getAuthors() != null ? p.getAuthors() : "Unknown").append("* (")
                        .append(p.getCitationLabel()).append(")\n\n");
            }
            reply.append("Use the cards below to preview a paper or open it in the Reader Studio.");
        }

        List<Map<String, Object>> related = new ArrayList<>();
        for (Paper p : picked) related.add(paperToMap(p));

        Map<String, Object> res = new HashMap<>();
        res.put("reply", reply.toString());
        res.put("intent", "recommendation_search");
        res.put("suggestedQueries", List.of(
                "Recommend papers on Natural Language Processing",
                "How does the hybrid recommendation model work?",
                "How do research stacks work?"
        ));
        res.put("relatedPapers", related);
        return res;
    }

    private Map<String, Object> buildFallbackResponse(String query) {
        String qLower = query.toLowerCase();
        Map<String, Object> res = new HashMap<>();
        List<Paper> allPapers = paperRepository.findAll();

        if (isPaperSearchRequest(qLower)) {
            return buildPaperSearchResponse(query, allPapers);
        }

        if (qLower.contains("stack") || qLower.contains("save") || qLower.contains("bookmark")
                || qLower.contains("workspace") || qLower.contains("collection")) {
            res.put("reply", "**Organizing Research with Stacks & Workspace:**\n\n" +
                    "- **Save a paper:** Click the bookmark icon on any paper card to save it to your workspace.\n" +
                    "- **Custom Stacks:** Group saved papers into collections (e.g. *'Quantum Foundation Models'*, *'NeurIPS 2024 Shortlist'*).\n" +
                    "- **Reader Studio:** Click **Read Studio** to open a paper with a live reading timer and key takeaways.\n" +
                    "- **Citations:** Open any paper to copy BibTeX, APA, IEEE or MLA citations.");
            res.put("intent", "platform_help");
            res.put("suggestedQueries", List.of(
                    "How does the recommendation algorithm work?",
                    "How does reading duration boost recommendations?",
                    "Recommend papers on Machine Learning"
            ));
        } else if (qLower.contains("harvest") || qLower.contains("openalex")) {
            res.put("reply", "**Live OpenAlex Literature Harvester:** use **Harvest Literature** on the Discover page to pull fresh, high-impact papers from the OpenAlex API into the catalog.");
            res.put("intent", "platform_help");
            res.put("suggestedQueries", List.of(
                    "How does the recommendation algorithm work?",
                    "How do research stacks work?"
            ));
        } else if (qLower.contains("reading time") || qLower.contains("reading duration") || qLower.contains("studio")) {
            res.put("reply", "**Reading Duration Tracking:** time spent in the Reader Studio is recorded. Reads of 60s or more get a 1.5x boost and deep reads of 120s or more get a 2.0x boost in your personalised recommendations.");
            res.put("intent", "platform_help");
            res.put("suggestedQueries", List.of(
                    "How does the recommendation algorithm work?",
                    "How do research stacks work?"
            ));
        } else if (qLower.contains("algorithm") || qLower.contains("recommend") || qLower.contains("hybrid") || qLower.contains("rocchio")) {
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
        // Platform how-to answers don't need unrelated paper cards attached.
        boolean platformAnswer = "platform_help".equals(res.get("intent"));
        List<Map<String, Object>> matching = new ArrayList<>();
        for (Paper p : platformAnswer ? new ArrayList<Paper>() : allPapers) {
            String title = p.getTitle() != null ? p.getTitle().toLowerCase() : "";
            String field = p.getField() != null ? p.getField().toLowerCase() : "";
            // Only match papers the question actually mentions (previously Mamba/BERT were attached to every reply).
            boolean titleMatch = (qLower.contains("mamba") && title.contains("mamba"))
                    || (qLower.contains("transformer") && title.contains("transformer"))
                    || (qLower.contains("graphcast") && title.contains("graphcast"));
            if (titleMatch || (field.length() > 2 && qLower.contains(field))) {
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
