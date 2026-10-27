package com.example.demo.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "papers")
public class Paper {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 500)
    private String authors;

    private Integer year;

    @Column(columnDefinition = "TEXT")
    private String abstractText;

    private String doi;

    // Academic field / discipline (e.g., "Artificial Intelligence", "Neuroscience")
    private String field;

    // Slug identifier for category filtering (e.g., "ai", "ml", "climate", "neuro", "quantum")
    private String fieldId;

    // Publication venue or conference (e.g., "NeurIPS", "Science", "Nature")
    private String venue;

    // Specific sub-topic / tag (e.g., "Dense retrieval for open-domain NLP")
    private String topicTag;

    // Citation metric
    private Integer citations = 0;

    // Human-readable citation badge (e.g., "3.2k citations")
    private String citationLabel;

    // Open Access indicator
    private Boolean openAccess = true;

    // Direct PDF or paper link
    private String pdfUrl;

    // Estimated reading time (e.g., "14 min read")
    private String readingTime;

    // Formatted BibTeX citation
    @Column(columnDefinition = "TEXT")
    private String bibtex;

    // AI synthesized key takeaways
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "paper_takeaways", joinColumns = @JoinColumn(name = "paper_id"))
    @Column(name = "takeaway", length = 1000)
    private List<String> takeaways = new ArrayList<>();

    public Paper() {
    }

    public Paper(String title, String authors, Integer year, String abstractText,
                 String doi, String field, String fieldId, String venue,
                 String topicTag, Integer citations, String citationLabel,
                 Boolean openAccess, String pdfUrl) {
        this.title = title;
        this.authors = authors;
        this.year = year;
        this.abstractText = abstractText;
        this.doi = doi;
        this.field = field;
        this.fieldId = fieldId;
        this.venue = venue;
        this.topicTag = topicTag;
        this.citations = citations != null ? citations : 0;
        this.citationLabel = citationLabel;
        this.openAccess = openAccess != null ? openAccess : true;
        this.pdfUrl = pdfUrl;
    }

    public Paper(String title, String authors, Integer year, String abstractText,
                 String doi, String field, String fieldId, String venue,
                 String topicTag, Integer citations, String citationLabel,
                 Boolean openAccess, String pdfUrl, String readingTime,
                 String bibtex, List<String> takeaways) {
        this(title, authors, year, abstractText, doi, field, fieldId, venue,
             topicTag, citations, citationLabel, openAccess, pdfUrl);
        this.readingTime = readingTime;
        this.bibtex = bibtex;
        if (takeaways != null) {
            this.takeaways = new ArrayList<>(takeaways);
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthors() {
        return authors;
    }

    public void setAuthors(String authors) {
        this.authors = authors;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getAbstractText() {
        return abstractText;
    }

    public void setAbstractText(String abstractText) {
        this.abstractText = abstractText;
    }

    /**
     * Frontend alias getter for 'abstract' property in JSON.
     */
    @JsonProperty("abstract")
    public String getAbstract() {
        return abstractText;
    }

    /**
     * Frontend alias setter for 'abstract' property in JSON.
     */
    @JsonProperty("abstract")
    public void setAbstract(String abstractVal) {
        this.abstractText = abstractVal;
    }

    public String getDoi() {
        return doi;
    }

    public void setDoi(String doi) {
        this.doi = doi;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getFieldId() {
        return fieldId;
    }

    public void setFieldId(String fieldId) {
        this.fieldId = fieldId;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public String getTopicTag() {
        return topicTag;
    }

    public void setTopicTag(String topicTag) {
        this.topicTag = topicTag;
    }

    public Integer getCitations() {
        return citations;
    }

    public void setCitations(Integer citations) {
        this.citations = citations;
    }

    public String getCitationLabel() {
        if (citationLabel != null && !citationLabel.isBlank()) {
            return citationLabel;
        }
        if (citations != null) {
            if (citations >= 1000) {
                return String.format("%.1fk citations", citations / 1000.0);
            }
            return citations + " citations";
        }
        return "0 citations";
    }

    public void setCitationLabel(String citationLabel) {
        this.citationLabel = citationLabel;
    }

    public Boolean getOpenAccess() {
        return openAccess;
    }

    public void setOpenAccess(Boolean openAccess) {
        this.openAccess = openAccess;
    }

    public String getPdfUrl() {
        return pdfUrl;
    }

    public void setPdfUrl(String pdfUrl) {
        this.pdfUrl = pdfUrl;
    }

    public String getReadingTime() {
        return readingTime;
    }

    public void setReadingTime(String readingTime) {
        this.readingTime = readingTime;
    }

    public String getBibtex() {
        return bibtex;
    }

    public void setBibtex(String bibtex) {
        this.bibtex = bibtex;
    }

    public List<String> getTakeaways() {
        return takeaways;
    }

    public void setTakeaways(List<String> takeaways) {
        this.takeaways = takeaways != null ? takeaways : new ArrayList<>();
    }
}
