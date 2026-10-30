import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  BookOpen,
  Bookmark,
  Check,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  Filter,
  Quote,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import PaperModal from "../components/PaperModal.jsx";
import Pagination from "../components/Pagination.jsx";
import { mockPapers, trendingTopics } from "../data/mockPapers.js";
import { papersService } from "../services/papersService.js";
import { getSavedIds, toggleSavedPaper } from "../services/savedPapersStore.js";

const quickPrompts = [
  "State Space Models",
  "AlphaFold",
  "Climate GNNs",
  "Transformers",
  "Quantum Supremacy",
  "Memory Engrams",
];

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const fieldParam = searchParams.get("field") || "all";
  const [searchInput, setSearchInput] = useState(queryParam);
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(queryParam);
  const [selectedField, setSelectedField] = useState(fieldParam);
  const [sortBy, setSortBy] = useState("relevance");
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [yearFilter, setYearFilter] = useState("all");
  const [papers, setPapers] = useState(mockPapers);
  const [isLoading, setIsLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set(getSavedIds()));
  const [activeModalPaper, setActiveModalPaper] = useState(null);
  const [modalInitialTab, setModalInitialTab] = useState("overview");
  const [copiedId, setCopiedId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  useEffect(() => {
    setSearchInput(queryParam);
    setAppliedSearchQuery(queryParam);
    setSelectedField(fieldParam);
  }, [queryParam, fieldParam]);

  // Reset to first page when any search, topic or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearchQuery, selectedField, yearFilter, openAccessOnly, sortBy]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    papersService
      .getPapers({ search: appliedSearchQuery, field: selectedField })
      .then((data) => {
        if (active && data) {
          setPapers(data);
        }
      })
      .catch((err) => console.warn("Failed to load papers:", err))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appliedSearchQuery, selectedField]);

  useEffect(() => {
    function onSavedUpdated() {
      setSavedIds(new Set(getSavedIds()));
    }
    window.addEventListener("researchnest:saved_updated", onSavedUpdated);
    window.addEventListener("storage", onSavedUpdated);
    return () => {
      window.removeEventListener("researchnest:saved_updated", onSavedUpdated);
      window.removeEventListener("storage", onSavedUpdated);
    };
  }, []);

  function toggleSavePaper(paperOrId) {
    toggleSavedPaper(paperOrId, papers);
    setSavedIds(new Set(getSavedIds()));
  }

  function handleSearchSubmit(e) {
    if (e) e.preventDefault();
    const query = searchInput.trim();
    setAppliedSearchQuery(query);
    const params = {};
    if (query) params.q = query;
    if (selectedField !== "all") params.field = selectedField;
    setSearchParams(params);
  }

  function handlePromptClick(prompt) {
    setSearchInput(prompt);
    setAppliedSearchQuery(prompt);
    setSearchParams({ q: prompt });
  }

  function handleFieldClick(fieldId) {
    setSelectedField(fieldId);
    const params = {};
    if (appliedSearchQuery.trim()) params.q = appliedSearchQuery.trim();
    if (fieldId !== "all") params.field = fieldId;
    setSearchParams(params);
  }

  function handleClearSearch() {
    setSearchInput("");
    setAppliedSearchQuery("");
    const params = {};
    if (selectedField !== "all") params.field = selectedField;
    setSearchParams(params);
  }

  function handleQuickCopyBibtex(paper, e) {
    e.stopPropagation();
    if (paper.bibtex) {
      navigator.clipboard.writeText(paper.bibtex);
      setCopiedId(paper.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  // Filter and sort papers
  const filteredPapers = useMemo(() => {
    let list = [...papers];

    // Field filter
    if (selectedField && selectedField !== "all") {
      list = list.filter((p) => p.fieldId === selectedField);
    }

    // Open Access filter
    if (openAccessOnly) {
      list = list.filter((p) => p.openAccess);
    }

    // Year filter
    if (yearFilter === "2024") {
      list = list.filter((p) => p.year === 2024);
    } else if (yearFilter === "2023") {
      list = list.filter((p) => p.year === 2023);
    } else if (yearFilter === "2020-2022") {
      list = list.filter((p) => p.year >= 2020 && p.year <= 2022);
    } else if (yearFilter === "pre-2020") {
      list = list.filter((p) => p.year < 2020);
    }

    // Text search query - applied only when Search button is clicked or submitted
    if (appliedSearchQuery.trim()) {
      const q = appliedSearchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.field.toLowerCase().includes(q) ||
          p.venue.toLowerCase().includes(q) ||
          p.topicTag.toLowerCase().includes(q) ||
          p.abstract.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === "citations") {
      list.sort((a, b) => b.citations - a.citations);
    } else if (sortBy === "year-desc") {
      list.sort((a, b) => b.year - a.year);
    } else if (sortBy === "year-asc") {
      list.sort((a, b) => a.year - b.year);
    }

    return list;
  }, [appliedSearchQuery, selectedField, openAccessOnly, yearFilter, sortBy]);

  // Paginated publications slice
  const paginatedPapers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPapers.slice(start, start + pageSize);
  }, [filteredPapers, currentPage, pageSize]);

  return (
    <div className="discover-page-shell">
      {/* Page Header */}
      <div className="discover-hero-header">
        <div className="discover-kicker-pill">
          <Sparkles size={14} />
          <span>Academic Discovery Engine</span>
        </div>
        <h1 className="discover-title">Explore Peer-Reviewed Literature</h1>
        <p className="discover-subtitle">
          Semantically search cross-disciplinary scientific breakthroughs, synthesize key takeaways, and curate your scholarly stack.
        </p>

        {/* Large Search Bar */}
        <form onSubmit={handleSearchSubmit} className="discover-search-form" role="search">
          <div className="discover-search-bar">
            <Search size={20} className="discover-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="discover-search-input"
              placeholder="Search across 12,000+ publications by concept, author, venue, or DOI..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search papers"
            />
            {searchInput && (
              <button
                type="button"
                className="discover-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <button type="submit" className="button button-primary discover-submit-btn">
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Quick Suggestion Prompts */}
        <div className="discover-prompts-row">
          <span className="prompts-label">Trending topics:</span>
          <div className="prompts-list">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="prompt-chip"
                onClick={() => handlePromptClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Discipline Filters Bar */}
      <div className="discover-disciplines-bar">
        {trendingTopics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className={`discipline-chip ${selectedField === topic.id ? "discipline-chip-active" : ""}`}
            onClick={() => handleFieldClick(topic.id)}
          >
            <span>{topic.label}</span>
          </button>
        ))}
      </div>

      {/* Controls & Facets Toolbar */}
      <div className="discover-toolbar" id="discover-catalog-results">
        <div className="toolbar-left">
          <span className="results-count-text">
            Showing <strong>{filteredPapers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> –{" "}
            <strong>{Math.min(filteredPapers.length, currentPage * pageSize)}</strong> of{" "}
            <strong>{filteredPapers.length}</strong> scientific publications
          </span>
          {appliedSearchQuery && (
            <span className="active-query-badge">
              Query: "{appliedSearchQuery}"
              <button
                type="button"
                onClick={handleClearSearch}
                title="Clear query"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>

        <div className="toolbar-right">
          {/* Year Range Filter */}
          <div className="toolbar-select-wrap">
            <label htmlFor="year-select" className="visually-hidden">Filter by Year</label>
            <select
              id="year-select"
              className="toolbar-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">All Years</option>
              <option value="2024">2024 (Recent)</option>
              <option value="2023">2023</option>
              <option value="2020-2022">2020 – 2022</option>
              <option value="pre-2020">Pre-2020 (Landmarks)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="toolbar-select-wrap">
            <label htmlFor="sort-select" className="visually-hidden">Sort results</label>
            <select
              id="sort-select"
              className="toolbar-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="relevance">Highest Relevance</option>
              <option value="citations">Most Cited</option>
              <option value="year-desc">Newest First</option>
              <option value="year-asc">Oldest First</option>
            </select>
          </div>

          {/* Open Access Toggle */}
          <label className="toolbar-checkbox-label">
            <input
              type="checkbox"
              checked={openAccessOnly}
              onChange={(e) => setOpenAccessOnly(e.target.checked)}
            />
            <span>Open Access Only</span>
          </label>
        </div>
      </div>

      {/* Papers Grid */}
      {filteredPapers.length === 0 ? (
        <div className="discover-empty-state">
          <Compass size={48} className="empty-state-icon" />
          <h3>No publications found matching your criteria</h3>
          <p>Try clearing your search term, adjusting the discipline filter, or resetting the year range.</p>
          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              setSearchInput("");
              setAppliedSearchQuery("");
              setSelectedField("all");
              setOpenAccessOnly(false);
              setYearFilter("all");
              setSearchParams({});
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="discover-papers-grid">
            {paginatedPapers.map((paper) => {
              const isSaved = savedIds.has(String(paper.id)) || savedIds.has(Number(paper.id));
              return (
                <article
                  key={paper.id}
                  className="discover-paper-card"
                  onClick={() => setActiveModalPaper(paper)}
                >
                  <div className="card-top-meta">
                    <div className="card-badges">
                      <span className="card-field-tag">{paper.field}</span>
                      <span className="card-match-badge">{paper.matchScore}</span>
                      {paper.openAccess && <span className="card-oa-tag">Open Access</span>}
                    </div>
                    <button
                      type="button"
                      className={`card-bookmark-btn ${isSaved ? "card-bookmark-saved card-bookmarked" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSavePaper(paper);
                      }}
                      aria-label={isSaved ? "Remove from stack" : "Save to stack"}
                      title={isSaved ? "Remove from stack" : "Save to stack"}
                    >
                      <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <h3 className="card-paper-title">{paper.title}</h3>
                  <p className="card-authors-line">{paper.authors}</p>
                  <div className="card-venue-row">
                    <span className="venue-pill">{paper.venue}</span>
                    <span className="venue-separator">·</span>
                    <span>{paper.year}</span>
                    <span className="venue-separator">·</span>
                    <span className="citation-count-text">
                      <Quote size={12} /> {paper.citationLabel}
                    </span>
                    <span className="venue-separator">·</span>
                    <span className="reading-time-text">
                      <Clock size={12} /> {paper.readingTime}
                    </span>
                  </div>

                  <p className="card-abstract-snippet">{paper.abstract}</p>

                  <div className="card-topic-tag-pill">
                    <Tag size={12} />
                    <span>{paper.topicTag}</span>
                  </div>

                  <div className="card-footer-actions">
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="card-read-action-btn"
                        onClick={() => {
                          setModalInitialTab("overview");
                          setActiveModalPaper(paper);
                        }}
                      >
                        <span>Overview →</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalInitialTab("reader");
                          setActiveModalPaper(paper);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(168, 85, 247, 0.12))",
                          color: "#7c3aed",
                          border: "1px solid rgba(124, 58, 237, 0.3)",
                          padding: "5px 10px",
                          borderRadius: "8px",
                          fontSize: "0.76rem",
                          fontWeight: "750",
                          cursor: "pointer",
                        }}
                        title="Read full-text PDF with color-coded highlight tags & sticky notes"
                      >
                        <BookOpen size={12} />
                        <span>Read PDF & Annotate</span>
                      </button>
                    </div>
                    <div className="card-quick-actions">
                      <button
                        type="button"
                        className="card-quick-btn"
                        title="Quick copy BibTeX citation"
                        onClick={(e) => handleQuickCopyBibtex(paper, e)}
                      >
                        {copiedId === paper.id ? (
                          <>
                            <Check size={13} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>BibTeX</span>
                          </>
                        )}
                      </button>
                      {paper.pdfUrl && (
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="card-quick-btn"
                          title="Open external publication"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Bottom Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredPapers.length}
            pageSize={pageSize}
            pageSizeOptions={[6, 9, 12, 18, 24]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="publications"
            scrollToElementId="discover-catalog-results"
          />
        </>
      )}

      {/* Interactive Paper Detail Modal */}
      {activeModalPaper && (
        <PaperModal
          paper={activeModalPaper}
          initialTab={modalInitialTab}
          onClose={() => setActiveModalPaper(null)}
          isSaved={savedIds.has(String(activeModalPaper.id)) || savedIds.has(Number(activeModalPaper.id))}
          onToggleSave={() => toggleSavePaper(activeModalPaper)}
          onSelectPaper={(p) => setActiveModalPaper(p)}
        />
      )}
    </div>
  );
}
