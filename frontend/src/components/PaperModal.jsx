import { useEffect, useState } from "react";
import {
  Bookmark,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileCode,
  FileText,
  Quote,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

export default function PaperModal({ paper, onClose, isSaved, onToggleSave }) {
  const [citationTab, setCitationTab] = useState("bibtex");
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [userNote, setUserNote] = useState(() => {
    if (!paper) return "";
    return localStorage.getItem(`researchnest_note_${paper.id}`) || "";
  });
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!paper) return null;

  function generateCitation(format) {
    if (format === "bibtex") {
      return (
        paper.bibtex ||
        `@article{${paper.id},
  title={${paper.title}},
  author={${paper.authors}},
  journal={${paper.venue}},
  year={${paper.year}}
}`
      );
    }
    if (format === "apa") {
      return `${paper.authors} (${paper.year}). ${paper.title}. ${paper.venue}. https://doi.org/${paper.doi || "10.48550/arxiv"}`;
    }
    if (format === "mla") {
      return `${paper.authors}. "${paper.title}." ${paper.venue}, ${paper.year}.`;
    }
    return "";
  }

  function handleCopyCitation() {
    const text = generateCitation(citationTab);
    navigator.clipboard.writeText(text);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  }

  function handleSaveNote(e) {
    e.preventDefault();
    localStorage.setItem(`researchnest_note_${paper.id}`, userNote);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  return (
    <div
      className="paper-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paper-modal-title"
    >
      <div
        className="paper-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="paper-modal-header">
          <div className="paper-modal-badges">
            <span className="modal-field-badge">
              <Sparkles size={13} />
              {paper.field}
            </span>
            <span className="modal-match-badge">{paper.matchScore || "98% match"}</span>
            {paper.openAccess && (
              <span className="modal-oa-badge">Open Access</span>
            )}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close paper modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Paper Title & Authors */}
        <h2 id="paper-modal-title" className="paper-modal-title">
          {paper.title}
        </h2>
        <p className="paper-modal-authors">{paper.authors}</p>
        <p className="paper-modal-venue-row">
          <span className="modal-venue-name">{paper.venue}</span>
          <span className="modal-separator">·</span>
          <span>{paper.year}</span>
          {paper.doi && (
            <>
              <span className="modal-separator">·</span>
              <span className="modal-doi">DOI: {paper.doi}</span>
            </>
          )}
        </p>

        {/* Metadata Chips Bar */}
        <div className="paper-modal-chips-bar">
          <div className="modal-chip">
            <Quote size={13} />
            <span>{paper.citationLabel || `${paper.citations} citations`}</span>
          </div>
          <div className="modal-chip">
            <Clock size={13} />
            <span>{paper.readingTime || "15 min read"}</span>
          </div>
          <div className="modal-chip">
            <Tag size={13} />
            <span>{paper.topicTag}</span>
          </div>
          <div className="modal-actions-right">
            <button
              type="button"
              className={`modal-save-btn ${isSaved ? "modal-saved-active" : ""}`}
              onClick={() => onToggleSave(paper.id)}
            >
              <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
              <span>{isSaved ? "Saved in Stack" : "Save to Stack"}</span>
            </button>
            {paper.pdfUrl && (
              <a
                href={paper.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-pdf-link"
              >
                <span>Read Original</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="paper-modal-scrollable-body">
          {/* Abstract */}
          <section className="modal-section">
            <h3 className="modal-section-title">
              <FileText size={16} />
              <span>Abstract</span>
            </h3>
            <p className="modal-abstract-text">{paper.abstract}</p>
          </section>

          {/* AI Takeaways */}
          {paper.takeaways && paper.takeaways.length > 0 && (
            <section className="modal-section takeaways-section">
              <h3 className="modal-section-title">
                <Sparkles size={16} />
                <span>Key Academic Takeaways & Findings</span>
              </h3>
              <ul className="modal-takeaways-list">
                {paper.takeaways.map((point, idx) => (
                  <li key={idx} className="modal-takeaway-item">
                    <span className="takeaway-bullet-icon">
                      <Check size={13} />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Citation Generator */}
          <section className="modal-section citation-section">
            <div className="citation-header-row">
              <h3 className="modal-section-title">
                <FileCode size={16} />
                <span>Citation Export</span>
              </h3>
              <div className="citation-format-tabs">
                {["bibtex", "apa", "mla"].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    className={`citation-tab-btn ${citationTab === fmt ? "citation-tab-active" : ""}`}
                    onClick={() => setCitationTab(fmt)}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="citation-snippet-box">
              <pre className="citation-code-pre">
                <code>{generateCitation(citationTab)}</code>
              </pre>
              <button
                type="button"
                className="citation-copy-btn"
                onClick={handleCopyCitation}
                aria-label="Copy citation to clipboard"
              >
                {copiedCitation ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Personal Researcher Notes */}
          <section className="modal-section notes-section">
            <h3 className="modal-section-title">
              <Tag size={16} />
              <span>Personal Research Notes</span>
            </h3>
            <form onSubmit={handleSaveNote} className="modal-notes-form">
              <textarea
                className="modal-notes-textarea"
                rows={3}
                placeholder="Add critical annotations, thesis references, or discussion questions for this paper..."
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
              />
              <div className="modal-notes-footer">
                <span className="notes-hint">
                  {noteSaved ? "✓ Note saved to your local workspace!" : "Notes persist in your workspace library."}
                </span>
                <button type="submit" className="button button-primary modal-save-note-btn">
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
