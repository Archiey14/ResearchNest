import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Quote,
  Search,
  Sparkles,
  StickyNote,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  ANNOTATION_TAGS,
  STICKY_COLORS,
  getPaperManuscript,
  paperAnnotationService,
  resolveDirectPdfUrl,
} from "../services/paperContentService.js";
import { activityService } from "../services/activityService.js";
import "../styles/pdfReader.css";

export default function PdfReaderStudio({ paper, onClose, onToggleSave, isSaved }) {
  const manuscript = useMemo(() => getPaperManuscript(paper), [paper]);
  const directPdfUrl = useMemo(() => resolveDirectPdfUrl(paper), [paper]);

  // View state
  const [viewMode, setViewMode] = useState("manuscript"); // "manuscript" | "pdf"
  const [readerTheme, setReaderTheme] = useState("light"); // "light" | "sepia" | "dark"
  const [fontSize, setFontSize] = useState("medium"); // "small" | "medium" | "large"
  const [fontFamily, setFontFamily] = useState("serif"); // "serif" | "sans"
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Search in paper
  const [searchQuery, setSearchQuery] = useState("");

  // Annotations & Sticky Notes
  const [highlights, setHighlights] = useState(() =>
    paper ? paperAnnotationService.getHighlights(paper.id) : []
  );
  const [stickyNotes, setStickyNotes] = useState(() =>
    paper ? paperAnnotationService.getStickyNotes(paper.id) : []
  );
  const [activeFilter, setActiveFilter] = useState("all");

  // Selection toolbar state
  const [selectionRange, setSelectionRange] = useState(null);
  const [marginNoteInput, setMarginNoteInput] = useState("");
  const [pulsingHighlightId, setPulsingHighlightId] = useState(null);

  // New Sticky Note drawer
  const [showAddSticky, setShowAddSticky] = useState(false);
  const [newStickyColor, setNewStickyColor] = useState("yellow");
  const [newStickyTitle, setNewStickyTitle] = useState("");
  const [newStickyContent, setNewStickyContent] = useState("");
  const [newStickySection, setNewStickySection] = useState("sec-abstract");

  // Export notifications
  const [copiedExport, setCopiedExport] = useState(false);

  const manuscriptRef = useRef(null);

  // Sync annotations from storage if updated externally
  useEffect(() => {
    function onAnnotationsUpdated(e) {
      if (paper && String(e.detail?.paperId) === String(paper.id)) {
        setHighlights(paperAnnotationService.getHighlights(paper.id));
        setStickyNotes(paperAnnotationService.getStickyNotes(paper.id));
      }
    }
    window.addEventListener("researchnest:annotations_updated", onAnnotationsUpdated);
    return () => window.removeEventListener("researchnest:annotations_updated", onAnnotationsUpdated);
  }, [paper]);

  // Active learning reading depth timer: tracks seconds spent exploring this paper
  useEffect(() => {
    if (!paper?.id) return;
    const paperIdStr = String(paper.id);
    const startTime = Date.now();

    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem("researchnest_reading_durations");
        const durations = stored ? JSON.parse(stored) : {};
        durations[paperIdStr] = (durations[paperIdStr] || 0) + 5;
        localStorage.setItem("researchnest_reading_durations", JSON.stringify(durations));
      } catch (err) {
        // ignore
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      try {
        const stored = localStorage.getItem("researchnest_reading_durations");
        const durations = stored ? JSON.parse(stored) : {};
        const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
        durations[paperIdStr] = (durations[paperIdStr] || 0) + (elapsedSec % 5);
        localStorage.setItem("researchnest_reading_durations", JSON.stringify(durations));
        window.dispatchEvent(
          new CustomEvent("researchnest:reading_durations_updated", { detail: { paperId: paperIdStr } })
        );
      } catch (err) {
        // ignore
      }
    };
  }, [paper?.id]);

  // Keyboard navigation: Escape key closes selection toolbar or closes modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (selectionRange) {
          setSelectionRange(null);
          window.getSelection()?.removeAllRanges();
        } else if (isFullscreen) {
          setIsFullscreen(false);
        } else if (onClose) {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectionRange, isFullscreen, onClose]);

  // Handle text selection in manuscript
  function handleMouseUp() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !manuscriptRef.current) {
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setSelectionRange(null);
      return;
    }

    // Verify selection is within manuscript pane
    const anchorNode = selection.anchorNode;
    if (!manuscriptRef.current.contains(anchorNode)) {
      return;
    }

    // Identify parent section
    let element = anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode.parentElement;
    const sectionEl = element?.closest(".manuscript-section");
    const sectionId = sectionEl?.getAttribute("data-section-id") || "sec-abstract";
    const sectionTitle = sectionEl?.getAttribute("data-section-title") || "General Scope";

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = manuscriptRef.current.getBoundingClientRect();

      // Position relative to manuscript container
      const top = rect.top - containerRect.top + manuscriptRef.current.scrollTop;
      const left = rect.left - containerRect.left + rect.width / 2;

      setSelectionRange({
        text,
        sectionId,
        sectionTitle,
        top,
        left,
      });
    } catch (e) {
      console.warn("Could not calculate selection bounds:", e);
    }
  }

  // Create Highlight with Color Tag
  function handleApplyHighlight(tag) {
    if (!selectionRange || !paper) return;

    const newHl = paperAnnotationService.addHighlight(paper.id, {
      sectionId: selectionRange.sectionId,
      sectionTitle: selectionRange.sectionTitle,
      text: selectionRange.text,
      tagId: tag.id,
      tagName: tag.label,
      color: tag.color,
      note: marginNoteInput.trim(),
    });

    setHighlights(paperAnnotationService.getHighlights(paper.id));
    setSelectionRange(null);
    setMarginNoteInput("");
    window.getSelection()?.removeAllRanges();

    // Trigger pulse
    setPulsingHighlightId(newHl.id);
    setTimeout(() => setPulsingHighlightId(null), 1800);

    // Record activity
    activityService.logActivity(
      `Added ${tag.shortLabel} highlight`,
      paper.title?.length > 40 ? `${paper.title.slice(0, 40)}...` : paper.title,
      "highlight",
      "purple"
    );
  }

  // Delete Highlight
  function handleDeleteHighlight(id) {
    if (!paper) return;
    const updated = paperAnnotationService.deleteHighlight(paper.id, id);
    setHighlights(updated);
  }

  // Edit Margin Note
  function handleUpdateMarginNote(id, newNote) {
    if (!paper) return;
    const updated = paperAnnotationService.updateHighlight(paper.id, id, { note: newNote });
    setHighlights(updated);
  }

  // Scroll to highlighted section or passage
  function scrollToHighlight(hl) {
    const sectionEl = document.getElementById(hl.sectionId);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: "smooth", block: "center" });
      setPulsingHighlightId(hl.id);
      setTimeout(() => setPulsingHighlightId(null), 2000);
    }
  }

  // Add Sticky Note
  function handleCreateStickyNote(e) {
    e.preventDefault();
    if (!paper || !newStickyContent.trim()) return;

    paperAnnotationService.addStickyNote(paper.id, {
      title: newStickyTitle.trim() || "Research Hypothesis",
      content: newStickyContent.trim(),
      color: newStickyColor,
      pinnedSection: newStickySection,
    });

    setStickyNotes(paperAnnotationService.getStickyNotes(paper.id));
    setNewStickyTitle("");
    setNewStickyContent("");
    setShowAddSticky(false);

    activityService.logActivity(
      "Pinned research sticky note",
      paper.title?.length > 40 ? `${paper.title.slice(0, 40)}...` : paper.title,
      "note",
      "peach"
    );
  }

  // Delete Sticky Note
  function handleDeleteSticky(id) {
    if (!paper) return;
    const updated = paperAnnotationService.deleteStickyNote(paper.id, id);
    setStickyNotes(updated);
  }

  // Export Annotations to Markdown file
  function handleExportMarkdown() {
    if (!paper) return;
    const markdown = paperAnnotationService.generateMarkdownReport(paper, highlights, stickyNotes);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ResearchNest_${paper.id || "paper"}_Annotations.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    activityService.logActivity(
      "Exported Markdown annotation report",
      paper.title?.length > 40 ? `${paper.title.slice(0, 40)}...` : paper.title,
      "citation",
      "green"
    );
  }

  // Copy Markdown to clipboard
  function handleCopyMarkdown() {
    if (!paper) return;
    const markdown = paperAnnotationService.generateMarkdownReport(paper, highlights, stickyNotes);
    navigator.clipboard.writeText(markdown);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  }

  // Filtered highlights based on active tab
  const filteredHighlights = useMemo(() => {
    if (activeFilter === "all") return highlights;
    if (activeFilter === "sticky") return [];
    return highlights.filter((h) => h.tagId === activeFilter);
  }, [highlights, activeFilter]);

  const filteredStickies = useMemo(() => {
    if (activeFilter === "all" || activeFilter === "sticky") return stickyNotes;
    return [];
  }, [stickyNotes, activeFilter]);

  // Helper to render paragraph with embedded highlights & search matches
  function renderParagraphContent(paraText, sectionId) {
    if (!paraText) return null;

    // Find highlights belonging to this paragraph or containing parts of it
    const relevantHls = highlights.filter(
      (h) => h.text && paraText.toLowerCase().includes(h.text.toLowerCase().trim())
    );

    if (relevantHls.length === 0 && !searchQuery.trim()) {
      return paraText;
    }

    // Build segments for replacement
    const matches = [];

    // Add search query matches
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.toLowerCase();
      let pos = paraText.toLowerCase().indexOf(q);
      while (pos !== -1) {
        matches.push({
          start: pos,
          end: pos + q.length,
          type: "search",
          text: paraText.slice(pos, pos + q.length),
        });
        pos = paraText.toLowerCase().indexOf(q, pos + q.length);
      }
    }

    // Add highlight matches
    relevantHls.forEach((hl) => {
      const hText = hl.text.trim();
      const pos = paraText.toLowerCase().indexOf(hText.toLowerCase());
      if (pos !== -1) {
        matches.push({
          start: pos,
          end: pos + hText.length,
          type: "highlight",
          highlight: hl,
          text: paraText.slice(pos, pos + hText.length),
        });
      }
    });

    if (matches.length === 0) return paraText;

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Merge and build fragments
    const fragments = [];
    let lastIndex = 0;

    matches.forEach((m, idx) => {
      if (m.start < lastIndex) return; // avoid overlapping conflicts

      // Leading plain text
      if (m.start > lastIndex) {
        fragments.push(paraText.slice(lastIndex, m.start));
      }

      if (m.type === "highlight") {
        const hl = m.highlight;
        const isPulsing = pulsingHighlightId === hl.id;
        fragments.push(
          <mark
            key={`hl-${hl.id}-${idx}`}
            className={`scholar-highlight ${isPulsing ? "is-pulsing" : ""}`}
            data-tag={hl.tagId}
            onClick={() => {
              scrollToHighlight(hl);
            }}
            title={`${hl.tagName}${hl.note ? ` — Note: ${hl.note}` : " (Click to view in margin)"}`}
          >
            {m.text}
          </mark>
        );
      } else if (m.type === "search") {
        fragments.push(
          <mark
            key={`search-${idx}`}
            style={{
              backgroundColor: "#fef08a",
              color: "#854d0e",
              borderRadius: "3px",
              padding: "0 2px",
              fontWeight: "600",
            }}
          >
            {m.text}
          </mark>
        );
      }

      lastIndex = m.end;
    });

    if (lastIndex < paraText.length) {
      fragments.push(paraText.slice(lastIndex));
    }

    return fragments;
  }

  if (!paper) return null;

  return (
    <div
      className={`pdf-reader-studio ${isFullscreen ? "is-fullscreen" : ""}`}
      data-reader-theme={readerTheme}
      role="region"
      aria-label="Full-text Paper Reader & Annotation Studio"
    >
      {/* ---------------- Top Toolbar ---------------- */}
      <header className="pdf-reader-toolbar">
        {/* Title and Badge */}
        <div className="pdf-reader-title-area">
          <button
            type="button"
            className="reader-close-btn"
            onClick={onClose}
            title="Return to Overview (Esc)"
            aria-label="Return to overview"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="pdf-reader-oa-badge">
            <BookOpen size={12} />
            Open Access Full-Text
          </span>
          <h2 className="pdf-reader-paper-title" title={paper.title}>
            {paper.title}
          </h2>
        </div>

        {/* Mode Switcher: Interactive Manuscript vs Raw PDF */}
        <div className="reader-mode-segmented">
          <button
            type="button"
            className={`reader-mode-btn ${viewMode === "manuscript" ? "is-active" : ""}`}
            onClick={() => setViewMode("manuscript")}
          >
            <FileText size={14} />
            <span>Interactive Manuscript</span>
          </button>
          <button
            type="button"
            className={`reader-mode-btn ${viewMode === "pdf" ? "is-active" : ""}`}
            onClick={() => setViewMode("pdf")}
          >
            <BookOpen size={14} />
            <span>Direct PDF Embed</span>
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="reader-toolbar-controls">
          {/* In-text Search */}
          {viewMode === "manuscript" && (
            <div className="reader-search-box">
              <Search size={14} color="#7c3aed" />
              <input
                type="text"
                className="reader-search-input"
                placeholder="Find in text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  onClick={() => setSearchQuery("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* Theme Switcher */}
          <div className="reader-theme-picker">
            <button
              type="button"
              className={`reader-theme-btn ${readerTheme === "light" ? "is-active" : ""}`}
              onClick={() => setReaderTheme("light")}
              title="Light Paper Theme"
            >
              Light
            </button>
            <button
              type="button"
              className={`reader-theme-btn ${readerTheme === "sepia" ? "is-active" : ""}`}
              onClick={() => setReaderTheme("sepia")}
              title="Warm Sepia Reading Theme"
            >
              Sepia
            </button>
            <button
              type="button"
              className={`reader-theme-btn ${readerTheme === "dark" ? "is-active" : ""}`}
              onClick={() => setReaderTheme("dark")}
              title="Midnight Dark Theme"
            >
              Dark
            </button>
          </div>

          {/* Font Controls */}
          {viewMode === "manuscript" && (
            <>
              <div className="reader-font-controls">
                <button
                  type="button"
                  className="reader-font-btn"
                  onClick={() =>
                    setFontSize((prev) => (prev === "large" ? "medium" : "small"))
                  }
                  title="Decrease font size"
                >
                  A-
                </button>
                <button
                  type="button"
                  className="reader-font-btn"
                  onClick={() =>
                    setFontSize((prev) => (prev === "small" ? "medium" : "large"))
                  }
                  title="Increase font size"
                >
                  A+
                </button>
              </div>

              <button
                type="button"
                className="reader-action-btn"
                onClick={() =>
                  setFontFamily((prev) => (prev === "serif" ? "sans" : "serif"))
                }
                title="Toggle Serif/Sans font"
              >
                {fontFamily === "serif" ? "Serif" : "Sans"}
              </button>
            </>
          )}

          {/* Add Sticky Note Button */}
          <button
            type="button"
            className="reader-action-btn primary"
            onClick={() => setShowAddSticky((prev) => !prev)}
            title="Add Pinned Sticky Note"
          >
            <StickyNote size={14} />
            <span>+ Sticky Note</span>
          </button>

          {/* Export Report */}
          <button
            type="button"
            className="reader-action-btn"
            onClick={handleExportMarkdown}
            title="Download full Markdown study report with quotes and notes"
          >
            <Download size={14} />
            <span>Export Notes</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="reader-action-btn"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      {/* ---------------- Main Layout Body ---------------- */}
      <div className="pdf-reader-main-body">
        {/* Left / Center Manuscript Pane */}
        {viewMode === "manuscript" ? (
          <main
            ref={manuscriptRef}
            className="pdf-manuscript-pane"
            data-font-size={fontSize}
            data-font-family={fontFamily}
            onMouseUp={handleMouseUp}
          >
            {/* Paper Header */}
            <header className="manuscript-header">
              <div className="manuscript-venue-row">
                <span>{manuscript.venue}</span>
                <span>·</span>
                <span>{manuscript.year}</span>
                {paper.field && (
                  <>
                    <span>·</span>
                    <span>{paper.field}</span>
                  </>
                )}
              </div>
              <h1 className="manuscript-title">{manuscript.title}</h1>
              {manuscript.subTitle && (
                <p className="manuscript-subtitle">{manuscript.subTitle}</p>
              )}
              <p className="manuscript-authors">{manuscript.authors}</p>
              {manuscript.affiliation && (
                <p className="manuscript-affiliation">{manuscript.affiliation}</p>
              )}

              <div className="manuscript-meta-bar">
                <span className="manuscript-meta-item">
                  <Quote size={13} />
                  {paper.citationLabel || `${paper.citations || 0} citations`}
                </span>
                <span className="manuscript-meta-item">
                  <Clock size={13} />
                  {paper.readingTime || "16 min read"}
                </span>
                {manuscript.doi && (
                  <span className="manuscript-meta-item">
                    DOI:{" "}
                    <a
                      href={`https://doi.org/${manuscript.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#7c3aed", textDecoration: "underline" }}
                    >
                      {manuscript.doi}
                    </a>
                  </span>
                )}
              </div>
            </header>

            {/* Hint Banner: Select text to highlight */}
            <div className="manuscript-select-hint">
              <span>
                💡 <strong>Highlight & Annotate:</strong> Select any sentence or paragraph in the text to attach color-coded tags and margin notes.
              </span>
              <div className="tag-preview-dots">
                {ANNOTATION_TAGS.map((t) => (
                  <span
                    key={t.id}
                    className="tag-preview-dot"
                    style={{ background: t.bg, color: t.textColor, border: `1px solid ${t.color}` }}
                  >
                    {t.shortLabel}
                  </span>
                ))}
              </div>
            </div>

            {/* Scholarly Sections */}
            {manuscript.sections.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                data-section-id={sec.id}
                data-section-title={sec.title}
                className="manuscript-section"
              >
                <h3 className="manuscript-section-heading">
                  <span className="manuscript-section-number">{sec.number}</span>
                  <span>{sec.title}</span>
                </h3>
                {sec.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="manuscript-paragraph">
                    {renderParagraphContent(p, sec.id)}
                  </p>
                ))}
              </section>
            ))}

            {/* Floating Selection Toolbar */}
            {selectionRange && (
              <div
                className="floating-selection-toolbar"
                style={{
                  top: `${selectionRange.top}px`,
                  left: `${selectionRange.left}px`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="floating-tags-row">
                  {ANNOTATION_TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className="floating-tag-btn"
                      style={{
                        borderColor: tag.color,
                        background: `rgba(${tag.color === "#f59e0b" ? "245, 158, 11" : tag.color === "#10b981" ? "16, 185, 129" : tag.color === "#8b5cf6" ? "139, 92, 246" : tag.color === "#ef4444" ? "239, 68, 68" : "59, 130, 246"}, 0.25)`,
                      }}
                      onClick={() => handleApplyHighlight(tag)}
                      title={tag.description}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: tag.color,
                          display: "inline-block",
                        }}
                      />
                      <span>{tag.shortLabel}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: "2px 6px",
                    }}
                    onClick={() => {
                      setSelectionRange(null);
                      window.getSelection()?.removeAllRanges();
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="floating-note-row">
                  <input
                    type="text"
                    className="floating-note-input"
                    placeholder="Add margin note (optional)..."
                    value={marginNoteInput}
                    onChange={(e) => setMarginNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleApplyHighlight(ANNOTATION_TAGS[0]);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </main>
        ) : (
          /* Direct PDF Embed Mode */
          <div className="pdf-raw-embed-container">
            <div className="pdf-raw-banner">
              <span>
                📄 Embedded stream for open-access preprint:{" "}
                <strong>{paper.title?.slice(0, 50)}...</strong>
              </span>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {directPdfUrl && (
                  <a
                    href={directPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reader-action-btn"
                    style={{ background: "#7c3aed", color: "#fff", border: "none" }}
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink size={13} />
                  </a>
                )}
                <button
                  type="button"
                  className="reader-action-btn"
                  onClick={() => setViewMode("manuscript")}
                >
                  <span>Switch to Manuscript</span>
                </button>
              </div>
            </div>

            {directPdfUrl ? (
              <iframe
                title="Paper PDF Stream"
                src={directPdfUrl}
                className="pdf-raw-iframe"
                loading="lazy"
              />
            ) : (
              <div className="sidebar-empty-state" style={{ color: "#ffffff" }}>
                <AlertTriangle size={36} color="#f59e0b" style={{ marginBottom: 12 }} />
                <h3>Direct PDF stream is not freely embeddable by this publisher</h3>
                <p style={{ maxWidth: 460, opacity: 0.8 }}>
                  Due to third-party publisher frame security restrictions, please read via the{" "}
                  <strong>Interactive Manuscript</strong> view or open the original source directly.
                </p>
                <button
                  type="button"
                  className="reader-action-btn primary"
                  style={{ marginTop: 14 }}
                  onClick={() => setViewMode("manuscript")}
                >
                  Return to Interactive Manuscript
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- Right Sidebar: Margin Annotations & Sticky Notes ---------------- */}
        <aside className="pdf-annotations-sidebar">
          {/* Sidebar Header */}
          <div className="sidebar-header">
            <h3 className="sidebar-heading">
              <Tag size={16} color="#7c3aed" />
              <span>Annotations & Notes</span>
            </h3>
            <span className="sidebar-badge">
              {highlights.length + stickyNotes.length} Total
            </span>
          </div>

          {/* Tag Filter Chips Bar */}
          <div className="sidebar-filter-tabs">
            <button
              type="button"
              className={`sidebar-filter-chip ${activeFilter === "all" ? "is-active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All ({highlights.length + stickyNotes.length})
            </button>
            {ANNOTATION_TAGS.map((tag) => {
              const count = highlights.filter((h) => h.tagId === tag.id).length;
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`sidebar-filter-chip ${activeFilter === tag.id ? "is-active" : ""}`}
                  onClick={() => setActiveFilter(tag.id)}
                  style={
                    activeFilter === tag.id
                      ? { background: tag.color, borderColor: tag.color, color: "#fff" }
                      : {}
                  }
                >
                  {tag.shortLabel} ({count})
                </button>
              );
            })}
            <button
              type="button"
              className={`sidebar-filter-chip ${activeFilter === "sticky" ? "is-active" : ""}`}
              onClick={() => setActiveFilter("sticky")}
            >
              Stickies ({stickyNotes.length})
            </button>
          </div>

          {/* Scrollable Cards Container */}
          <div className="sidebar-cards-scrollable">
            {/* Add Sticky Note Form Drawer */}
            {showAddSticky && (
              <form onSubmit={handleCreateStickyNote} className="new-sticky-form">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.85rem", color: "var(--reader-heading)" }}>
                    New Sticky Note
                  </strong>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--reader-muted)" }}
                    onClick={() => setShowAddSticky(false)}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="sticky-color-row">
                  <span style={{ fontSize: "0.74rem", color: "var(--reader-muted)" }}>Color:</span>
                  {STICKY_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`sticky-color-radio ${newStickyColor === c.id ? "is-selected" : ""}`}
                      style={{ backgroundColor: c.bg, borderColor: c.border }}
                      onClick={() => setNewStickyColor(c.id)}
                      title={c.name}
                    />
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Note Title / Hypothesis..."
                  value={newStickyTitle}
                  onChange={(e) => setNewStickyTitle(e.target.value)}
                  style={{
                    background: "var(--reader-sidebar-bg)",
                    border: "1px solid var(--reader-border)",
                    borderRadius: "6px",
                    padding: "6px 8px",
                    fontSize: "0.82rem",
                    color: "var(--reader-heading)",
                  }}
                />

                <textarea
                  placeholder="Write your observation, question, or cross-reference here..."
                  rows={3}
                  value={newStickyContent}
                  onChange={(e) => setNewStickyContent(e.target.value)}
                  style={{
                    background: "var(--reader-sidebar-bg)",
                    border: "1px solid var(--reader-border)",
                    borderRadius: "6px",
                    padding: "6px 8px",
                    fontSize: "0.82rem",
                    color: "var(--reader-heading)",
                    resize: "vertical",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    type="button"
                    className="reader-action-btn"
                    onClick={() => setShowAddSticky(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="reader-action-btn primary">
                    Pin Note
                  </button>
                </div>
              </form>
            )}

            {/* Sticky Notes Cards */}
            {filteredStickies.map((sticky) => {
              const colorDef =
                STICKY_COLORS.find((c) => c.id === sticky.color) || STICKY_COLORS[0];
              return (
                <div
                  key={sticky.id}
                  className="sticky-note-card"
                  style={{
                    backgroundColor: colorDef.bg,
                    borderColor: colorDef.border,
                    color: colorDef.text,
                  }}
                >
                  <div className="sticky-note-header">
                    <span className="sticky-note-pin-badge">
                      <StickyNote size={12} />
                      Sticky Note
                    </span>
                    <div className="sticky-note-actions">
                      <button
                        type="button"
                        className="sticky-icon-btn"
                        onClick={() => handleDeleteSticky(sticky.id)}
                        title="Delete sticky note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {sticky.title && <h4 className="sticky-note-title">{sticky.title}</h4>}
                  <p className="sticky-note-content">{sticky.content}</p>
                </div>
              );
            })}

            {/* Margin Annotation Cards */}
            {filteredHighlights.map((hl) => {
              const tagDef =
                ANNOTATION_TAGS.find((t) => t.id === hl.tagId) || ANNOTATION_TAGS[0];
              const isPulsing = pulsingHighlightId === hl.id;

              return (
                <div
                  key={hl.id}
                  className={`margin-annotation-card ${isPulsing ? "is-pulsing" : ""}`}
                >
                  <div className="margin-card-header">
                    <span
                      className="margin-tag-badge"
                      style={{
                        backgroundColor: tagDef.bg,
                        borderColor: tagDef.color,
                        color: tagDef.textColor,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: tagDef.color,
                          display: "inline-block",
                        }}
                      />
                      {tagDef.shortLabel}
                    </span>
                    <span className="margin-section-anchor">
                      {hl.sectionTitle || hl.sectionId}
                    </span>
                  </div>

                  {/* Quoted Highlight text */}
                  <blockquote
                    className="margin-quoted-text"
                    onClick={() => scrollToHighlight(hl)}
                    title="Click to jump to passage in text"
                  >
                    "{hl.text}"
                  </blockquote>

                  {/* Margin remark / note */}
                  {hl.note ? (
                    <p className="margin-note-body">
                      ✍️ <strong>Note:</strong> {hl.note}
                    </p>
                  ) : null}

                  {/* Card Footer */}
                  <div className="margin-card-footer">
                    <button
                      type="button"
                      className="margin-jump-btn"
                      onClick={() => scrollToHighlight(hl)}
                    >
                      <Eye size={12} />
                      <span>Jump to text</span>
                    </button>
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--reader-muted)",
                        cursor: "pointer",
                        padding: "2px 4px",
                      }}
                      onClick={() => handleDeleteHighlight(hl.id)}
                      title="Remove highlight"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {filteredHighlights.length === 0 && filteredStickies.length === 0 && (
              <div className="sidebar-empty-state">
                <FileText size={32} className="sidebar-empty-icon" />
                <p style={{ fontWeight: 600, margin: "0 0 6px" }}>No annotations in this view</p>
                <p style={{ fontSize: "0.8rem", margin: 0 }}>
                  Select text in the manuscript to highlight, or click <strong>+ Sticky Note</strong> to pin a reflection!
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
