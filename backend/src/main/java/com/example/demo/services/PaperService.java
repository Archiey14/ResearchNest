package com.example.demo.services;

import com.example.demo.models.Paper;
import com.example.demo.repos.PaperRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaperService {

    private final PaperRepository paperRepository;

    public PaperService(PaperRepository paperRepository) {
        this.paperRepository = paperRepository;
    }

    public List<Paper> getAllPapers() {
        return paperRepository.findAll();
    }

    public Paper getPaperById(Long id) {
        return paperRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Paper not found with id: " + id));
    }

    public Paper savePaper(Paper paper) {
        return paperRepository.save(paper);
    }

    public List<Paper> saveAll(List<Paper> papers) {
        return paperRepository.saveAll(papers);
    }

    public void deletePaper(Long id) {
        paperRepository.deleteById(id);
    }

    public List<Paper> searchPapers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return paperRepository.findAll();
        }
        return paperRepository.searchAcrossFields(query.trim());
    }

    public List<Paper> getPapersByField(String fieldId) {
        if (fieldId == null || fieldId.trim().isEmpty() || fieldId.equalsIgnoreCase("all")) {
            return paperRepository.findAll();
        }
        return paperRepository.findByFieldIdIgnoreCase(fieldId.trim());
    }

    public List<Paper> getTrendingPapers() {
        return paperRepository.findTop5ByOrderByCitationsDesc();
    }

    public long count() {
        return paperRepository.count();
    }
}
