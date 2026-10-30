import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  Lock,
  Mail,
  Printer,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { legalDrafts } from "../data/legalDrafts.js";
import "../styles/legal.css";

const DOC_KEYS = ["terms", "privacy", "security"];

export default function LegalPage({ defaultDoc }) {
  const { document: paramDoc } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve active document key from prop, URL params, or pathname
  const activeDocKey = useMemo(() => {
    if (paramDoc && legalDrafts[paramDoc]) return paramDoc;
    if (defaultDoc && legalDrafts[defaultDoc]) return defaultDoc;
    if (location.pathname.includes("privacy")) return "privacy";
    if (location.pathname.includes("security")) return "security";
    if (location.pathname.includes("terms")) return "terms";
    return "terms";
  }, [paramDoc, defaultDoc, location.pathname]);

  const [activeDoc, setActiveDoc] = useState(activeDocKey);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setActiveDoc(activeDocKey);
  }, [activeDocKey]);

  // Current policy object
  const currentPolicy = legalDrafts[activeDoc] || legalDrafts.terms;

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return currentPolicy.sections;
    const q = searchQuery.toLowerCase().trim();
    return currentPolicy.sections.filter((sec) => {
      const matchHeading = sec.heading.toLowerCase().includes(q);
      const matchBody = sec.body.toLowerCase().includes(q);
      const matchSub = sec.subsections?.some(
        (sub) =>
          sub.title.toLowerCase().includes(q) || sub.text.toLowerCase().includes(q)
      );
      return matchHeading || matchBody || matchSub;
    });
  }, [currentPolicy, searchQuery]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll(".legal-section-block");
      let current = "";
      sections.forEach((sec) => {
        const top = sec.getBoundingClientRect().top;
        if (top <= 140) {
          current = sec.id;
        }
      });
      if (current) setActiveSectionId(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredSections]);

  function handleTabChange(key) {
    setActiveDoc(key);
    setSearchQuery("");
    navigate(`/${key}`, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleScrollToSection(e, id) {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSectionId(id);
    }
  }

  function handleCopyPolicyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  }

  function handlePrint() {
    window.print();
  }

  const tabIcons = {
    terms: Scale,
    privacy: ShieldCheck,
    security: Lock,
  };

  return (
    <div className="legal-ambient-wrapper">
      <div className="legal-container">
        {/* ---------------- Hero Section ---------------- */}
        <header className="legal-hero">
          <div className="legal-badge-pill">
            <Shield size={14} />
            <span>ResearchNest Trust & Legal Center</span>
          </div>
          <h1 className="legal-title">{currentPolicy.title}</h1>
          <p className="legal-lead">{currentPolicy.summary}</p>

          <div className="legal-meta-strip">
            <span className="legal-meta-item">
              <FileCheck size={14} />
              <span>
                Version <strong>{currentPolicy.version}</strong>
              </span>
            </span>
            <span className="legal-meta-divider" />
            <span className="legal-meta-item">
              <Clock size={14} />
              <span>
                Updated <strong>{currentPolicy.lastUpdated}</strong>
              </span>
            </span>
            <span className="legal-meta-divider" />
            <span className="legal-meta-item">
              <BookOpen size={14} />
              <span>
                Effective <strong>{currentPolicy.effectiveDate}</strong>
              </span>
            </span>
            <span className="legal-meta-divider" />
            <span className="legal-meta-item">
              <span>{currentPolicy.readingTime}</span>
            </span>
          </div>
        </header>

        {/* ---------------- Tab Switcher & Actions ---------------- */}
        <div className="legal-tabs-row">
          <nav className="legal-tab-pills" aria-label="Policy selection tabs">
            {DOC_KEYS.map((key) => {
              const doc = legalDrafts[key];
              const Icon = tabIcons[key];
              const isActive = activeDoc === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`legal-tab-btn ${isActive ? "active" : ""}`}
                  onClick={() => handleTabChange(key)}
                >
                  <Icon size={16} />
                  <span>{doc.shortTitle}</span>
                </button>
              );
            })}
          </nav>

          <div className="legal-action-group">
            <button
              type="button"
              className="legal-btn-ghost"
              onClick={handleCopyPolicyLink}
              title="Copy shareable link to this policy"
            >
              {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
            </button>
            <button
              type="button"
              className="legal-btn-ghost"
              onClick={handlePrint}
              title="Print or export as PDF"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* ---------------- Key Highlights Banner ---------------- */}
        {currentPolicy.highlights && currentPolicy.highlights.length > 0 && (
          <section className="legal-highlights-banner" aria-label="Key highlights">
            <div className="highlights-header">
              <Sparkles size={18} color="#7c3aed" />
              <h3>Key Highlights in Plain English</h3>
              <span className="highlights-badge">Executive Summary</span>
            </div>
            <div className="highlights-grid">
              {currentPolicy.highlights.map((h, idx) => (
                <div key={idx} className="highlight-card">
                  <div className="highlight-icon-box">
                    <CheckCircle2 size={16} />
                  </div>
                  <h4>{h.title}</h4>
                  <p>{h.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- Main Content Grid ---------------- */}
        <div className="legal-content-grid">
          {/* Left Sticky Sidebar */}
          <aside className="legal-sidebar" aria-label="Table of contents & search">
            {/* Search Input */}
            <div className="legal-search-box">
              <Search size={15} className="legal-search-icon" />
              <input
                type="search"
                className="legal-search-input"
                placeholder="Search clauses or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter legal clauses"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="legal-search-clear"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Table of Contents */}
            <div className="legal-toc-panel">
              <h4 className="legal-toc-title">Table of Contents</h4>
              <nav className="legal-toc-nav" aria-label="Document sections">
                {currentPolicy.sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={(e) => handleScrollToSection(e, sec.id)}
                    className={`legal-toc-link ${activeSectionId === sec.id ? "active" : ""}`}
                  >
                    <span className="toc-num">{sec.number}.</span>
                    <span>{sec.heading}</span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Contact / Inquiries Box */}
            <div className="legal-contact-card">
              <h5>Have Legal Questions?</h5>
              <p>
                Our Data Protection Officer and legal team are available to assist with inquiries, data export requests, and academic licensing.
              </p>
              <a href="mailto:privacy@researchnest.org" className="legal-contact-link">
                <Mail size={14} />
                <span>privacy@researchnest.org</span>
              </a>
            </div>
          </aside>

          {/* Right Main Body */}
          <main className="legal-main-body">
            {filteredSections.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px 20px",
                  background: "var(--canvas-bg, #ffffff)",
                  borderRadius: "16px",
                  border: "1px solid var(--canvas-border, #e2e8f0)",
                }}
              >
                <Search size={36} color="#94a3b8" style={{ marginBottom: "12px" }} />
                <h3>No matching clauses found</h3>
                <p style={{ color: "var(--color-muted, #64748b)", margin: "8px 0 16px" }}>
                  We couldn't find any section matching "{searchQuery}".
                </p>
                <button
                  type="button"
                  className="legal-btn-ghost"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search query
                </button>
              </div>
            ) : (
              filteredSections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="legal-section-block"
                >
                  <div className="legal-section-header">
                    <span className="section-num-pill">{section.number}</span>
                    <h2>{section.heading}</h2>
                  </div>
                  <p className="legal-section-p">{section.body}</p>

                  {section.subsections && section.subsections.length > 0 && (
                    <div className="legal-subsections-grid">
                      {section.subsections.map((sub, idx) => (
                        <div key={idx} className="legal-subcard">
                          <h4>
                            <span className="subcard-dot" />
                            <span>{sub.title}</span>
                          </h4>
                          <p>{sub.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}

            {/* Bottom Signoff Callout */}
            <div className="legal-footer-signoff">
              <div className="signoff-content">
                <h4>Ready to start your research journey?</h4>
                <p>Explore thousands of peer-reviewed papers with full-text annotations and citation stacks.</p>
              </div>
              <div className="signoff-actions">
                <Link to="/" className="legal-btn-ghost">
                  <span>Return Home</span>
                </Link>
                <Link to="/auth?mode=register" className="legal-btn-primary">
                  <span>Get Started Free</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
