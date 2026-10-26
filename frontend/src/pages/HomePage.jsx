import {
  Activity,
  ArrowRight,
  Bookmark,
  Check,
  FileText,
  Flame,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  DEMO_DISCLAIMER,
  mockPapers,
  mockPulseStats,
  trendingTopics,
} from "../data/mockPapers.js";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("for-you");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [savedPaperIds, setSavedPaperIds] = useState(new Set(["paper-1"]));
  const [statusMessage, setStatusMessage] = useState("");

  function handleSearchSubmit(event) {
    event.preventDefault();
    if (searchQuery.trim()) {
      setStatusMessage(
        `Search preview: filtering sample papers for "${searchQuery.trim()}". Live literature index is under development.`
      );
    } else {
      setStatusMessage("");
    }
  }

  function toggleSavePaper(id) {
    setSavedPaperIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleTopicClick(topicId) {
    setSelectedTopic((prev) => (prev === topicId ? null : topicId));
  }

  const displayedPapers = useMemo(() => {
    let list = [...mockPapers];

    // Filter by topic if selected
    if (selectedTopic) {
      list = list.filter((paper) => paper.fieldId === selectedTopic);
    }

    // Filter by search query if entered
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (paper) =>
          paper.title.toLowerCase().includes(query) ||
          paper.field.toLowerCase().includes(query) ||
          paper.authors.toLowerCase().includes(query) ||
          paper.topicTag.toLowerCase().includes(query)
      );
    }

    // Sort according to tab
    if (activeTab === "latest") {
      list.sort((a, b) => b.year - a.year);
    } else if (activeTab === "most-cited") {
      list.sort((a, b) => b.citations - a.citations);
    }

    return list;
  }, [activeTab, selectedTopic, searchQuery]);

  return (
    <div className="dashboard-container">
      {/* Prototype banner informing viewers of demo context */}
      <aside className="prototype-notice" aria-label="Prototype information">
        <span>{DEMO_DISCLAIMER}</span>
      </aside>

      {/* 1. Welcome / Discovery Hero */}
      <section className="dashboard-hero" aria-labelledby="hero-heading">
        <div className="dashboard-hero-content">
          <p className="hero-kicker">
            <Sparkles aria-hidden="true" size={18} />
            <span>A little curiosity. A world of possibilities.</span>
          </p>
          <h1 id="hero-heading">Discover Research That Inspires You</h1>
          <p className="hero-subtext">
            Welcome back, Alex. Your next breakthrough starts with the right paper.
          </p>

          <form
            className="hero-search-box"
            role="search"
            onSubmit={handleSearchSubmit}
          >
            <Search className="hero-search-icon" aria-hidden="true" size={22} />
            <label className="visually-hidden" htmlFor="dashboard-search-input">
              Search papers, topics, keywords, or authors
            </label>
            <input
              id="dashboard-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search papers, topics, keywords, or authors..."
            />
            <button className="hero-discover-btn" type="submit">
              <Sparkles aria-hidden="true" size={16} />
              <span>Discover</span>
            </button>
          </form>

          {statusMessage && (
            <p className="search-feedback" aria-live="polite">
              {statusMessage}
            </p>
          )}

          <div className="hero-footer-stat">
            <span className="stat-dot" aria-hidden="true" />
            <span>
              10 years worth of discovery across 250M+ research papers · Curated for your curiosity
            </span>
          </div>
        </div>

        {/* Hero Decorative Visual */}
        <div className="hero-visual" aria-hidden="true">
          <div className="orbital-ring orbital-ring-outer" />
          <div className="orbital-ring orbital-ring-inner" />
          <div className="orbital-core" />
          <div className="orbital-card orbital-card-left">
            <FileText size={18} />
          </div>
          <div className="orbital-card orbital-card-right">
            <Sparkles size={16} />
          </div>
        </div>
      </section>

      {/* 2. Trending Topics Section */}
      <section className="trending-section" aria-labelledby="trending-heading">
        <div className="trending-header">
          <div className="trending-title-group">
            <h2 id="trending-heading" className="trending-title">
              <Activity aria-hidden="true" size={18} />
              <span>Explore what&apos;s trending</span>
            </h2>
            <span className="trending-subtitle">Fresh ideas across disciplines</span>
          </div>
          {selectedTopic && (
            <button
              type="button"
              className="trending-clear-btn"
              onClick={() => setSelectedTopic(null)}
            >
              Clear topic filter
            </button>
          )}
        </div>

        <div className="topics-pill-list" role="group" aria-label="Trending research topics">
          {trendingTopics.map((topic) => {
            const isSelected = selectedTopic === topic.id;
            return (
              <button
                key={topic.id}
                type="button"
                className={`topic-pill topic-pill-${topic.color} ${
                  isSelected ? "topic-pill-active" : ""
                }`}
                onClick={() => handleTopicClick(topic.id)}
                aria-pressed={isSelected}
              >
                <span className="topic-dot" />
                <span>{topic.label}</span>
                {isSelected && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Grid: Left discovery feed (70%) + Right research widgets (30%) */}
      <div className="dashboard-grid">
        {/* 3. Curated Research Paper Section */}
        <section className="papers-feed-section" aria-labelledby="curated-heading">
          <div className="feed-header">
            <div>
              <h2 id="curated-heading" className="feed-heading">
                Handpicked for your next discovery
              </h2>
              <p className="feed-subtext">
                Research that connects with your interests, not just your keywords.
              </p>
            </div>
            <button
              type="button"
              className="feed-preferences-btn"
              onClick={() =>
                setStatusMessage("Preferences preview: Custom curation preferences will be configurable.")
              }
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
              <span>Preferences</span>
            </button>
          </div>

          {/* Feed Tabs & Controls */}
          <div className="feed-controls-bar">
            <div className="feed-tabs" role="tablist" aria-label="Curated feed categories">
              <button
                type="button"
                role="tab"
                id="tab-for-you"
                aria-selected={activeTab === "for-you"}
                className={`feed-tab ${activeTab === "for-you" ? "feed-tab-active" : ""}`}
                onClick={() => setActiveTab("for-you")}
              >
                For you
              </button>
              <button
                type="button"
                role="tab"
                id="tab-latest"
                aria-selected={activeTab === "latest"}
                className={`feed-tab ${activeTab === "latest" ? "feed-tab-active" : ""}`}
                onClick={() => setActiveTab("latest")}
              >
                Latest research
              </button>
              <button
                type="button"
                role="tab"
                id="tab-most-cited"
                aria-selected={activeTab === "most-cited"}
                className={`feed-tab ${activeTab === "most-cited" ? "feed-tab-active" : ""}`}
                onClick={() => setActiveTab("most-cited")}
              >
                Most cited
              </button>
            </div>

            <div className="feed-filter-info">
              <span className="feed-count">{displayedPapers.length} papers</span>
            </div>
          </div>

          {/* 2x2 Curated Papers Grid */}
          <div className="papers-grid">
            {displayedPapers.length === 0 ? (
              <div className="papers-empty">
                <p>No sample papers match your current filters.</p>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTopic(null);
                  }}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              displayedPapers.map((paper) => {
                const isSaved = savedPaperIds.has(paper.id);
                return (
                  <article key={paper.id} className="paper-card">
                    <header className="paper-card-header">
                      <span className="paper-field-badge">{paper.field}</span>
                      <button
                        type="button"
                        className={`paper-save-btn ${isSaved ? "paper-saved" : ""}`}
                        onClick={() => toggleSavePaper(paper.id)}
                        aria-label={isSaved ? `Remove ${paper.title} from saved` : `Save ${paper.title}`}
                      >
                        <Bookmark
                          size={18}
                          fill={isSaved ? "currentColor" : "none"}
                          aria-hidden="true"
                        />
                      </button>
                    </header>

                    <h3 className="paper-title">{paper.title}</h3>

                    <p className="paper-meta">
                      {paper.authors} · <span className="paper-venue">{paper.venue}</span> ·{" "}
                      {paper.year}
                    </p>

                    <p className="paper-abstract">{paper.abstract}</p>

                    <div className="paper-tag-row">
                      <span className="paper-topic-tag">
                        <Tag size={12} aria-hidden="true" />
                        <span>{paper.topicTag}</span>
                      </span>
                    </div>

                    <footer className="paper-card-footer">
                      <div className="paper-stats">
                        <span className="paper-citation-count">{paper.citationLabel}</span>
                        {paper.openAccess && (
                          <span className="paper-oa-badge">Open access</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="paper-read-link"
                        onClick={() =>
                          setStatusMessage(`Reading preview for "${paper.title}".`)
                        }
                      >
                        <span>Read paper</span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </footer>
                  </article>
                );
              })
            )}
          </div>

          <div className="feed-footer-note">
            <span>Students: your feed refreshes every day</span>
            <button
              type="button"
              className="explore-more-btn"
              onClick={() => setStatusMessage("Discovery archive will load additional papers.")}
            >
              Explore more papers <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* 4. Right-Hand Column: Research Widgets */}
        <aside className="dashboard-widgets-col" aria-label="Research activity and briefs">
          {/* Widget 1: Research Pulse */}
          <section className="widget-card widget-pulse" aria-labelledby="pulse-heading">
            <div className="widget-header">
              <h3 id="pulse-heading" className="widget-title">
                Your research pulse
              </h3>
              <Activity className="widget-icon" size={17} aria-hidden="true" />
            </div>

            <div className="pulse-stats-row">
              <div className="pulse-stat-box">
                <span className="pulse-stat-number">
                  {mockPulseStats.papersReadThisWeek}
                </span>
                <span className="pulse-stat-label">Papers read this week</span>
              </div>
              <div className="pulse-stat-box">
                <span className="pulse-stat-number">{mockPulseStats.papersSaved}</span>
                <span className="pulse-stat-label">Papers saved</span>
              </div>
            </div>

            <div className="pulse-streak-pill">
              <Flame size={16} aria-hidden="true" />
              <span>{mockPulseStats.streakMessage}</span>
            </div>

            <div className="pulse-interests-section">
              <div className="interests-header">
                <span className="interests-title">Your research interests</span>
                <span className="interests-sample-tag">Sample</span>
              </div>
              <div className="interests-bars">
                {mockPulseStats.interests.map((interest) => (
                  <div key={interest.name} className="interest-item">
                    <div className="interest-info">
                      <span className="interest-name">{interest.name}</span>
                      <span className="interest-pct">{interest.percentage}%</span>
                    </div>
                    <div className="interest-track">
                      <div
                        className="interest-fill"
                        style={{ width: `${interest.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Widget 2: The Brief */}
          <section className="widget-card widget-brief" aria-labelledby="brief-heading">
            <div className="brief-kicker">
              <Sparkles size={14} aria-hidden="true" />
              <span>THE RESEARCHNEST BRIEF</span>
            </div>
            <h3 id="brief-heading" className="brief-title">
              Big ideas. A small read.
            </h3>
            <p className="brief-body">
              Five breakthrough insights shaping AI this week, distilled into a
              5-minute briefing.
            </p>
            <button
              type="button"
              className="brief-action-btn"
              onClick={() => setStatusMessage("Weekly briefing modal preview.")}
            >
              <span>Read this week&apos;s brief</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </section>

          {/* Widget 3: Pick up where you left off */}
          <section className="widget-card widget-resume" aria-labelledby="resume-heading">
            <div className="widget-header">
              <h3 id="resume-heading" className="widget-title">
                Pick up where you left off
              </h3>
            </div>

            <div className="resume-paper-card">
              <div className="resume-icon-wrap" aria-hidden="true">
                <FileText size={18} />
              </div>
              <div className="resume-paper-details">
                <h4 className="resume-paper-title">
                  {mockPulseStats.recentResume.title}
                </h4>
                <p className="resume-paper-meta">
                  {mockPulseStats.recentResume.authors} · {mockPulseStats.recentResume.year}
                </p>
                <div className="resume-progress-track">
                  <div
                    className="resume-progress-fill"
                    style={{ width: `${mockPulseStats.recentResume.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
