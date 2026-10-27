package com.example.demo.controllers;

import com.example.demo.models.Paper;
import com.example.demo.services.PaperService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/papers")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class PaperController {

    private final PaperService paperService;

    public PaperController(PaperService paperService) {
        this.paperService = paperService;
    }

    /**
     * Get papers with optional query parameter filtering.
     * Examples:
     *   GET /api/papers
     *   GET /api/papers?search=neural
     *   GET /api/papers?field=ai
     */
    @GetMapping
    public ResponseEntity<List<Paper>> getPapers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String field) {
        String searchTerm = search != null ? search : (query != null ? query : q);
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            return ResponseEntity.ok(paperService.searchPapers(searchTerm.trim()));
        }
        if (field != null && !field.trim().isEmpty()) {
            return ResponseEntity.ok(paperService.getPapersByField(field.trim()));
        }
        return ResponseEntity.ok(paperService.getAllPapers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Paper> getPaperById(@PathVariable Long id) {
        return ResponseEntity.ok(paperService.getPaperById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Paper>> searchPapers(
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "search", required = false) String search) {
        String searchTerm = query != null ? query : (q != null ? q : search);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return ResponseEntity.ok(paperService.getAllPapers());
        }
        return ResponseEntity.ok(paperService.searchPapers(searchTerm.trim()));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<Paper>> getTrendingPapers() {
        return ResponseEntity.ok(paperService.getTrendingPapers());
    }

    @GetMapping("/field/{fieldId}")
    public ResponseEntity<List<Paper>> getPapersByField(@PathVariable String fieldId) {
        return ResponseEntity.ok(paperService.getPapersByField(fieldId));
    }

    @PostMapping
    public ResponseEntity<Paper> createPaper(@RequestBody Paper paper) {
        Paper saved = paperService.savePaper(paper);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Paper> updatePaper(@PathVariable Long id, @RequestBody Paper paperDetails) {
        Paper existing = paperService.getPaperById(id);
        existing.setTitle(paperDetails.getTitle());
        existing.setAuthors(paperDetails.getAuthors());
        existing.setYear(paperDetails.getYear());
        existing.setAbstractText(paperDetails.getAbstractText());
        existing.setDoi(paperDetails.getDoi());
        existing.setField(paperDetails.getField());
        existing.setFieldId(paperDetails.getFieldId());
        existing.setVenue(paperDetails.getVenue());
        existing.setTopicTag(paperDetails.getTopicTag());
        existing.setCitations(paperDetails.getCitations());
        existing.setCitationLabel(paperDetails.getCitationLabel());
        existing.setOpenAccess(paperDetails.getOpenAccess());
        existing.setPdfUrl(paperDetails.getPdfUrl());

        Paper updated = paperService.savePaper(existing);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePaper(@PathVariable Long id) {
        paperService.deletePaper(id);
        return ResponseEntity.noContent().build();
    }
}
