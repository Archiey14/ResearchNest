import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Bookmark,
  Check,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Filter,
  FolderPlus,
  Layers,
  Plus,
  Quote,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import PaperModal from "../components/PaperModal.jsx";
import { mockPapers, mockStacks } from "../data/mockPapers.js";
import { papersService } from "../services/papersService.js";

export default function SavedPapersPage() {
  const [allPapers, setAllPapers] = useState(mockPapers);
  const [stacks, setStacks] = useState(() => {
    const saved = localStorage.getItem("researchnest_user_stacks");
    return saved ? JSON.parse(saved) : mockStacks;
  });
  const [selectedStackId, setSelectedStackId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState(() => {
    const stored = localStorage.getItem("researchnest_saved_ids");
    return stored ? new Set(JSON.parse(stored)) : new Set(mockPapers.map((p) => p.id));
  });
  const [activeModalPaper, setActiveModalPaper] = useState(null);
  const [showNewStackModal, setShowNewStackModal] = useState(false);
  const [newStackName, setNewStackName] = useState("");
  const [newStackDesc, setNewStackDesc] = useState("");
  const [exportNotice, setExportNotice] = useState(false);

  useEffect(() => {
    papersService.getPapers().then((data) => {
      if (data && data.length > 0) setAllPapers(data);
    });
  }, []);

  function toggleSavePaper(id) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem("researchnest_saved_ids", JSON.stringify([...next]));
      return next;
    });
  }

  function handleCreateStack(e) {
    e.preventDefault();
    if (!newStackName.trim()) return;
    const newStack = {
      id: `stack-${Date.now()}`,
      name: newStackName.trim(),
      description: newStackDesc.trim() || "Custom research collection.",
      color: "#7c3aed",
      count: 0,
      icon: "layers",
    };
    const updated = [...stacks, newStack];
    setStacks(updated);
    localStorage.setItem("researchnest_user_stacks", JSON.stringify(updated));
    setNewStackName("");
    setNewStackDesc("");
    setShowNewStackModal(false);
    setSelectedStackId(newStack.id);
  }

  function handleExportBibliography() {
    const bibtexList = savedPapers
      .map((p) => p.bibtex || `@article{${p.id},\n  title={${p.title}},\n  author={${p.authors}}\n}`)
      .join("\n\n");
    const blob = new Blob([bibtexList], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "researchnest_bibliography.bib";
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 2500);
  }

  // Get papers in user's saved library
  const savedPapers = useMemo(() => {
    return allPapers.filter((p) => savedIds.has(p.id));
  }, [allPapers, savedIds]);

  // Filtered papers based on active stack, status, and search query
  const displayedSavedPapers = useMemo(() => {
    let list = [...savedPapers];

    // Stack filter
    if (selectedStackId !== "all") {
      list = list.filter((p) => p.stackId === selectedStackId);
    }

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((p) => p.readingStatus === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.venue.toLowerCase().includes(q) ||
          p.topicTag.toLowerCase().includes(q)
      );
    }

    return list;
  }, [savedPapers, selectedStackId, statusFilter, searchQuery]);

  return (
    <div className="saved-page-shell">
      {/* Header Section */}
      <div className="saved-hero-header">
        <div className="saved-header-left">
          <div className="discover-kicker-pill">
            <Bookmark size={14} />
            <span>Personal Scholarly Stack</span>
          </div>
          <h1 className="saved-title">Saved Papers & Research Stacks</h1>
          <p className="saved-subtitle">
            Curate thematic literature collections, track reading milestones, and export publication-ready citations.
          </p>
        </div>
        <div className="saved-header-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={handleExportBibliography}
          >
            <Download size={15} />
            <span>{exportNotice ? "Exported .bib File!" : "Export BibTeX"}</span>
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => setShowNewStackModal(true)}
          >
            <Plus size={16} />
            <span>New Research Stack</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="saved-metrics-row">
        <div className="saved-metric-card">
          <span className="saved-metric-val">{savedPapers.length}</span>
          <span className="saved-metric-lbl">Total Saved Papers</span>
        </div>
        <div className="saved-metric-card">
          <span className="saved-metric-val">
            {savedPapers.filter((p) => p.readingStatus === "completed").length}
          </span>
          <span className="saved-metric-lbl">Completed Reviews</span>
        </div>
        <div className="saved-metric-card">
          <span className="saved-metric-val">
            {savedPapers.filter((p) => p.readingStatus === "in-progress").length}
          </span>
          <span className="saved-metric-lbl">Currently In Progress</span>
        </div>
        <div className="saved-metric-card">
          <span className="saved-metric-val">{stacks.length}</span>
          <span className="saved-metric-lbl">Active Thematic Stacks</span>
        </div>
      </div>

      {/* Main 2-Column Library Layout */}
      <div className="saved-library-layout">
        {/* Left Column: Stacks Directory */}
        <aside className="stacks-sidebar">
          <div className="stacks-sidebar-head">
            <h3 className="stacks-sidebar-title">
              <Layers size={16} />
              <span>Research Stacks</span>
            </h3>
            <button
              type="button"
              className="add-stack-icon-btn"
              onClick={() => setShowNewStackModal(true)}
              title="Create new stack"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="stacks-list">
            <button
              type="button"
              className={`stack-nav-item ${selectedStackId === "all" ? "stack-nav-item-active" : ""}`}
              onClick={() => setSelectedStackId("all")}
            >
              <div className="stack-item-meta">
                <span className="stack-item-title">All Saved Papers</span>
                <span className="stack-item-desc">Entire personal collection</span>
              </div>
              <span className="stack-item-count">{savedPapers.length}</span>
            </button>

            {stacks.map((stack) => {
              const countInStack = savedPapers.filter((p) => p.stackId === stack.id).length;
              return (
                <button
                  key={stack.id}
                  type="button"
                  className={`stack-nav-item ${selectedStackId === stack.id ? "stack-nav-item-active" : ""}`}
                  onClick={() => setSelectedStackId(stack.id)}
                >
                  <div className="stack-item-meta">
                    <span className="stack-item-title">{stack.name}</span>
                    <span className="stack-item-desc">{stack.description}</span>
                  </div>
                  <span className="stack-item-count">{countInStack}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Column: Papers Feed */}
        <main className="saved-papers-content">
          {/* Controls Bar */}
          <div className="saved-controls-bar">
            {/* Search inside saved */}
            <div className="saved-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search within this stack..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Reading Status Filter Tabs */}
            <div className="saved-status-tabs">
              {[
                { id: "all", label: "All Status" },
                { id: "want-to-read", label: "Want to Read" },
                { id: "in-progress", label: "In Progress" },
                { id: "completed", label: "Completed" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`status-tab-btn ${statusFilter === tab.id ? "status-tab-btn-active" : ""}`}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Papers Feed */}
          {displayedSavedPapers.length === 0 ? (
            <div className="saved-empty-state">
              <BookOpen size={44} className="empty-state-icon" />
              <h3>No papers found in this stack</h3>
              <p>Explore papers in the Discover catalog and click "Save to Stack" to bookmark them.</p>
            </div>
          ) : (
            <div className="saved-papers-list">
              {displayedSavedPapers.map((paper) => {
                const note = localStorage.getItem(`researchnest_note_${paper.id}`);
                return (
                  <article
                    key={paper.id}
                    className="saved-paper-row-card"
                    onClick={() => setActiveModalPaper(paper)}
                  >
                    <div className="saved-card-header">
                      <div className="saved-tags-wrap">
                        <span className="saved-field-badge">{paper.field}</span>
                        <span className={`reading-status-pill status-${paper.readingStatus || "want-to-read"}`}>
                          ● {paper.readingStatus === "completed" ? "Completed" : paper.readingStatus === "in-progress" ? "In Progress" : "Want to Read"}
                        </span>
                        {note && (
                          <span className="saved-has-note-badge" title="Has personal note">
                            📝 Note attached
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="saved-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSavePaper(paper.id);
                        }}
                        title="Remove from saved stack"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <h3 className="saved-paper-title">{paper.title}</h3>
                    <p className="saved-paper-authors">{paper.authors}</p>
                    <p className="saved-paper-venue">
                      <span>{paper.venue}</span>
                      <span>·</span>
                      <span>{paper.year}</span>
                      <span>·</span>
                      <span><Quote size={12} /> {paper.citationLabel}</span>
                    </p>

                    <p className="saved-paper-abstract">{paper.abstract}</p>

                    {note && (
                      <div className="saved-note-preview">
                        <strong>My Note:</strong> {note}
                      </div>
                    )}

                    <div className="saved-row-footer">
                      <button
                        type="button"
                        className="saved-open-btn"
                        onClick={() => setActiveModalPaper(paper)}
                      >
                        <span>Open Abstract, Takeaways & Citation →</span>
                      </button>
                      <span className="saved-time-indicator">
                        <Clock size={12} /> {paper.readingTime}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Interactive Paper Detail Modal */}
      {activeModalPaper && (
        <PaperModal
          paper={activeModalPaper}
          onClose={() => setActiveModalPaper(null)}
          isSaved={savedIds.has(activeModalPaper.id)}
          onToggleSave={toggleSavePaper}
        />
      )}

      {/* Create New Stack Modal */}
      {showNewStackModal && (
        <div className="paper-modal-overlay" onClick={() => setShowNewStackModal(false)}>
          <div className="create-stack-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="create-stack-header">
              <h3 className="create-stack-title">
                <FolderPlus size={18} />
                <span>Create Research Stack</span>
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowNewStackModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateStack} className="create-stack-form">
              <div className="form-group">
                <label htmlFor="stack-name">Stack Name</label>
                <input
                  id="stack-name"
                  type="text"
                  placeholder="e.g., Quantum Machine Learning 2026"
                  required
                  value={newStackName}
                  onChange={(e) => setNewStackName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="stack-desc">Description / Focus Area</label>
                <textarea
                  id="stack-desc"
                  rows={3}
                  placeholder="Notes on the theme of this literature review stack..."
                  value={newStackDesc}
                  onChange={(e) => setNewStackDesc(e.target.value)}
                />
              </div>
              <div className="create-stack-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowNewStackModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  <span>Create Stack</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
