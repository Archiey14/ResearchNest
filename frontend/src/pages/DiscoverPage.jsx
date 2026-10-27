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
import { mockPapers, trendingTopics } from "../data/mockPapers.js";
import { papersService } from "../services/papersService.js";

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
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedField, setSelectedField] = useState(searchParams.get("field") || "all");
  const [sortBy, setSortBy] = useState("relevance");
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [yearFilter, setYearFilter] = useState("all");
  const [papers, setPapers] = useState(mockPapers);
  const [isLoading, setIsLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(() => {
    const stored = localStorage.getItem("researchnest_saved_ids");
    return stored ? new Set(JSON.parse(stored).map(String)) : new Set(["1", "4", "8"]);
  });
  const [activeModalPaper, setActiveModalPaper] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    papersService
      .getPapers({ search: searchQuery, field: selectedField })
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
  }, [searchQuery, selectedField]);

  useEffect(() => {
    function onSavedUpdated() {
      const stored = localStorage.getItem("researchnest_saved_ids");
      if (stored) {
        setSavedIds(new Set(JSON.parse(stored).map(String)));
      }
    }
    window.addEventListener("researchnest:saved_updated", onSavedUpdated);
    window.addEventListener("storage", onSavedUpdated);
    return () => {
      window.removeEventListener("researchnest:saved_updated", onSavedUpdated);
      window.removeEventListener("storage", onSavedUpdated);
    };
  }, []);

  function toggleSavePaper(paperOrId) {
    const id = typeof paperOrId === "object" ? paperOrId.id : paperOrId;
    const strId = String(id);
    const targetPaper =
      typeof paperOrId === "object"
        ? paperOrId
        : papers.find((p) => String(p.id) === strId);

    setSavedIds((prev) => {
      const next = new Set(prev);
      const isSaving = !next.has(strId);
      if (isSaving) {
        next.add(strId);
      } else {
        next.delete(strId);
        next.delete(Number(id));
      }
      const arr = Array.from(next).map(String);
      localStorage.setItem("researchnest_saved_ids", JSON.stringify(arr));

      if (targetPaper) {
        try {
          const storedPool = localStorage.getItem("researchnest_saved_papers_pool");
          let pool = storedPool ? JSON.parse(storedPool) : [];
          if (isSaving) {
            if (!pool.some((p) => String(p.id) === strId)) {
              pool.push(targetPaper);
            }
          } else {
            pool = pool.filter((p) => String(p.id) !== strId);
          }
          localStorage.setItem("researchnest_saved_papers_pool", JSON.stringify(pool));
        } catch (e) {
          console.warn("Could not update saved papers pool:", e);
        }
      }

      window.dispatchEvent(
        new CustomEvent("researchnest:saved_updated", { detail: { id: strId, isSaving } })
      );
      return next;
    });
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const params = {};
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (selectedField !== "all") params.field = selectedField;
    setSearchParams(params);
  }

  function handlePromptClick(prompt) {
    setSearchQuery(prompt);
    setSearchParams({ q: prompt });
  }

  function handleFieldClick(fieldId) {
    setSelectedField(fieldId);
    const params = {};
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (fieldId !== "all") params.field = fieldId;
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

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
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
  }, [searchQuery, selectedField, openAccessOnly, yearFilter, sortBy]);

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search papers"
            />
            {searchQuery && (
              <button
                type="button"
                className="discover-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  setSearchParams({});
                }}
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
      <div className="discover-toolbar">
        <div className="toolbar-left">
          <span className="results-count-text">
            Showing <strong>{filteredPapers.length}</strong> scientific publications
          </span>
          {searchQuery && (
            <span className="active-query-badge">
              Query: "{searchQuery}"
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchParams({});
                }}
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
              setSearchQuery("");
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
        <div className="discover-papers-grid">
          {filteredPapers.map((paper) => {
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
                  <button
                    type="button"
                    className="card-read-action-btn"
                    onClick={() => setActiveModalPaper(paper)}
                  >
                    <span>Read Abstract & Takeaways →</span>
                  </button>
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
      )}

      {/* Interactive Paper Detail Modal */}
      {activeModalPaper && (
        <PaperModal
          paper={activeModalPaper}
          onClose={() => setActiveModalPaper(null)}
          isSaved={savedIds.has(String(activeModalPaper.id)) || savedIds.has(Number(activeModalPaper.id))}
          onToggleSave={() => toggleSavePaper(activeModalPaper)}
          onSelectPaper={(p) => setActiveModalPaper(p)}
        />
      )}
    </div>
  );
}
