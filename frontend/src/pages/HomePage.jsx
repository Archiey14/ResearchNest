import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flame,
  Layers,
  Quote,
  Search,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import PaperModal from "../components/PaperModal.jsx";
import {
  kpiMetrics,
  mockPapers,
  monthlyReadTrends,
  readingQueue,
  recentActivityFeed,
  topicStages,
  trendingTopics,
} from "../data/mockPapers.js";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("for-you");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [savedPaperIds, setSavedPaperIds] = useState(() => {
    const stored = localStorage.getItem("researchnest_saved_ids");
    return stored ? new Set(JSON.parse(stored)) : new Set(["paper-1", "paper-4", "paper-8"]);
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [calendarMonth, setCalendarMonth] = useState("October 2026");
  const [activeModalPaper, setActiveModalPaper] = useState(null);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setStatusMessage(`Filtered preview for "${searchQuery.trim()}".`);
      setSearchParams({ q: searchQuery.trim() });
    } else {
      setStatusMessage("");
      setSearchParams({});
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
      localStorage.setItem("researchnest_saved_ids", JSON.stringify([...next]));
      return next;
    });
  }

  function handleTopicClick(topicId) {
    setSelectedTopic((prev) => (prev === topicId ? null : topicId));
  }

  const displayedPapers = useMemo(() => {
    let list = [...mockPapers];

    if (selectedTopic) {
      list = list.filter((paper) => paper.fieldId === selectedTopic);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (paper) =>
          paper.title.toLowerCase().includes(q) ||
          paper.field.toLowerCase().includes(q) ||
          paper.authors.toLowerCase().includes(q) ||
          paper.topicTag.toLowerCase().includes(q)
      );
    }

    if (activeTab === "latest") {
      list.sort((a, b) => b.year - a.year);
    } else if (activeTab === "most-cited") {
      list.sort((a, b) => b.citations - a.citations);
    }

    return list;
  }, [activeTab, selectedTopic, searchQuery]);

  return (
    <div className="natural-dashboard">
      {/* 1. Human Greeting & Micro Date Banner matching Reference */}
      <section className="dashboard-greeting-banner" aria-label="Greeting">
        <div className="greeting-meta-row">
          <span className="greeting-date">Thursday, 26 October</span>
          <span className="greeting-meta-separator">·</span>
          <span className="greeting-tag">Academic Discovery Stack</span>
        </div>
        <div className="greeting-main-row">
          <div className="greeting-text-wrap">
            <h1 className="greeting-headline">
              Good Evening! <span className="greeting-name">Alex,</span>
            </h1>
            <p className="greeting-subtext">
              Welcome back. Here is your curated literature overview and active research queue for today.
            </p>
          </div>
        </div>
      </section>

      {/* 2. KPI Metrics Ribbon (6-column row inspired by SaaSrooms) */}
      <section className="kpi-metrics-ribbon" aria-label="Key research metrics">
        {kpiMetrics.map((item) => (
          <div key={item.id} className="kpi-metric-card">
            <div className="kpi-header-row">
              <span className="kpi-value">{item.value}</span>
              <span className={`kpi-trend-badge kpi-trend-${item.trendType}`}>
                {item.trendType === "up" ? (
                  <TrendingUp size={13} aria-hidden="true" />
                ) : item.trendType === "down" ? (
                  <TrendingDown size={13} aria-hidden="true" />
                ) : null}
                <span>{item.trend}</span>
              </span>
            </div>
            <div className="kpi-label-row">
              {item.id === "saved" && <Bookmark size={14} className="kpi-icon" />}
              {item.id === "read" && <BookOpen size={14} className="kpi-icon" />}
              {item.id === "match" && <Sparkles size={14} className="kpi-icon" />}
              {item.id === "streak" && <Flame size={14} className="kpi-icon" />}
              {item.id === "citations" && <Quote size={14} className="kpi-icon" />}
              {item.id === "stacks" && <Layers size={14} className="kpi-icon" />}
              <span className="kpi-label">{item.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Analytics & Progress Row (Directly inspired by Reference 1: Savings by Month, Stages, Renewals) */}
      <section className="analytics-trio-row" aria-label="Research progress charts">
        {/* Card 1: SVG Sparkline Curve Chart (Reading Velocity) */}
        <article className="chart-card chart-card-trend">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Reading Activity</h2>
              <div className="chart-total-stat">
                <span className="chart-stat-number">142</span>
                <span className="chart-stat-unit">Papers Explored</span>
              </div>
            </div>
            <div className="chart-pill-dropdown">
              <span>Last 6 Months</span>
              <span className="dropdown-caret">⌵</span>
            </div>
          </div>

          <div className="sparkline-wrapper" aria-hidden="true">
            <svg
              className="sparkline-svg"
              viewBox="0 0 320 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid guide lines */}
              <line x1="0" y1="25" x2="320" y2="25" stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <line x1="0" y1="55" x2="320" y2="55" stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <line x1="0" y1="85" x2="320" y2="85" stroke="var(--chart-grid)" strokeDasharray="3 3" />

              {/* Filled Area Under Curve */}
              <path
                d="M 20 72 Q 48 58, 76 52 T 132 60 T 188 32 T 244 44 T 300 16 L 300 95 L 20 95 Z"
                fill="url(#curveGradient)"
              />

              {/* Smooth Spline Line Curve */}
              <path
                d="M 20 72 Q 48 58, 76 52 T 132 60 T 188 32 T 244 44 T 300 16"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Marker Dots */}
              {monthlyReadTrends.map((pt) => (
                <circle
                  key={pt.month}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  className="sparkline-dot"
                />
              ))}
            </svg>

            {/* Month Axis Labels */}
            <div className="chart-months-axis">
              {monthlyReadTrends.map((pt) => (
                <span key={pt.month} className="month-axis-label">
                  {pt.month}
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* Card 2: Research Topic Distribution Stages */}
        <article className="chart-card chart-card-stages">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Topic Focus</h2>
              <p className="chart-card-sub">Active disciplines in stack</p>
            </div>
            <div className="chart-pill-dropdown">
              <span>All Disciplines</span>
              <span className="dropdown-caret">⌵</span>
            </div>
          </div>

          <div className="topic-stages-list">
            {topicStages.map((stage) => (
              <div key={stage.label} className="topic-stage-item">
                <div className="topic-stage-meta">
                  <span className="topic-stage-label">{stage.label}</span>
                  <span className="topic-stage-count">{stage.papers}</span>
                </div>
                <div className="topic-stage-track">
                  <div
                    className="topic-stage-fill"
                    style={{
                      width: `${stage.pct}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Card 3: Reading Queue & Pending Reviews (Inspired by Renewals Pending) */}
        <article className="chart-card chart-card-queue">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Reading Queue</h2>
              <p className="chart-card-sub">Upcoming paper reviews</p>
            </div>
            <div className="queue-filter-pill">
              <span className="queue-pill-opt queue-pill-active">All</span>
              <span className="queue-pill-opt">Priority</span>
            </div>
          </div>

          <div className="reading-queue-list">
            {readingQueue.map((item) => (
              <div
                key={item.id}
                className="queue-item-row"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const match = mockPapers.find(
                    (p) => p.id === item.paperId || p.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 15))
                  );
                  if (match) setActiveModalPaper(match);
                }}
                title="Click to inspect paper details & abstract"
              >
                <div className="queue-item-left">
                  <h3 className="queue-item-title">{item.title}</h3>
                  <p className="queue-item-venue">{item.venue}</p>
                </div>
                <div className="queue-item-right">
                  <span className={`queue-days-badge queue-badge-${item.tagType}`}>
                    {item.daysTag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* 4. Main Literature Discovery Section + Right-Hand Utility Widgets */}
      <div className="dashboard-content-split">
        {/* Left Primary Feed Column (70%) */}
        <div className="feed-primary-column">
          {/* Topic Pills Strip */}
          <section className="topics-filter-strip" aria-label="Filter by research field">
            <button
              type="button"
              className={`topic-tag-chip ${selectedTopic === null ? "topic-tag-active" : ""}`}
              onClick={() => setSelectedTopic(null)}
            >
              <span>All Fields</span>
              {selectedTopic === null && <Check size={13} aria-hidden="true" />}
            </button>
            {trendingTopics.map((topic) => {
              const isSelected = selectedTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  className={`topic-tag-chip topic-tag-${topic.color} ${
                    isSelected ? "topic-tag-active" : ""
                  }`}
                  onClick={() => handleTopicClick(topic.id)}
                  aria-pressed={isSelected}
                >
                  <span className="topic-indicator-dot" />
                  <span>{topic.label}</span>
                  {isSelected && <Check size={13} aria-hidden="true" />}
                </button>
              );
            })}
          </section>

          {/* Feed Controls: Segmented Tabs + Results count */}
          <div className="feed-controls-header">
            <div className="feed-segmented-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "for-you"}
                className={`feed-seg-tab ${activeTab === "for-you" ? "feed-seg-tab-active" : ""}`}
                onClick={() => setActiveTab("for-you")}
              >
                For you
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "latest"}
                className={`feed-seg-tab ${activeTab === "latest" ? "feed-seg-tab-active" : ""}`}
                onClick={() => setActiveTab("latest")}
              >
                Latest research
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "most-cited"}
                className={`feed-seg-tab ${activeTab === "most-cited" ? "feed-seg-tab-active" : ""}`}
                onClick={() => setActiveTab("most-cited")}
              >
                Most cited
              </button>
            </div>

            <div className="feed-meta-count">
              <span>{displayedPapers.length} curated papers</span>
            </div>
          </div>

          {statusMessage && (
            <div className="feed-status-notice" aria-live="polite">
              <span>{statusMessage}</span>
            </div>
          )}

          {/* 2-Column Curated Paper Cards Grid */}
          <div className="curated-papers-grid">
            {displayedPapers.map((paper) => {
              const isSaved = savedPaperIds.has(paper.id);
              return (
                <article
                  key={paper.id}
                  className="refined-paper-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => setActiveModalPaper(paper)}
                >
                  <div className="card-top-row">
                    <span className="card-discipline-pill">{paper.field}</span>
                    <div className="card-top-actions">
                      <span className="card-match-pill">{paper.matchScore || "98% match"}</span>
                      <button
                        type="button"
                        className={`card-bookmark-btn ${isSaved ? "card-bookmark-saved" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSavePaper(paper.id);
                        }}
                        aria-label={isSaved ? "Remove from saved" : "Save paper"}
                        title={isSaved ? "Remove from saved" : "Save paper"}
                      >
                        <Bookmark
                          size={16}
                          fill={isSaved ? "currentColor" : "none"}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>

                  <h3 className="card-paper-title">{paper.title}</h3>

                  <p className="card-paper-authors">
                    {paper.authors} · <span className="card-venue">{paper.venue}</span> · {paper.year}
                  </p>

                  <p className="card-paper-abstract">{paper.abstract}</p>

                  <div className="card-tag-wrapper">
                    <span className="card-topic-tag">
                      <Tag size={11} aria-hidden="true" />
                      <span>{paper.topicTag}</span>
                    </span>
                  </div>

                  <div className="card-footer-row">
                    <div className="card-badges-left">
                      <span className="card-citations-badge">
                        <Quote size={11} aria-hidden="true" />
                        {paper.citationLabel}
                      </span>
                      {paper.openAccess && (
                        <span className="card-oa-pill">Open Access</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="card-read-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalPaper(paper);
                      }}
                    >
                      <span>Read paper</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Right Utility Widgets Column (30% - inspired by GATHER) */}
        <aside className="feed-utility-column" aria-label="Calendar and recent activity">
          {/* Widget 1: Interactive Research Calendar */}
          <div className="utility-widget calendar-widget">
            <div className="calendar-widget-header">
              <h3 className="calendar-widget-title">Research Schedule</h3>
              <div className="calendar-nav-controls">
                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={() => setCalendarMonth("September 2026")}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="calendar-month-name">{calendarMonth}</span>
                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={() => setCalendarMonth("November 2026")}
                  aria-label="Next month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* 7-day header */}
            <div className="calendar-weekdays-row" aria-hidden="true">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>

            {/* Days Grid */}
            <div className="calendar-days-grid" role="grid" aria-label="October 2026 calendar">
              {/* Previous month leading days */}
              <span className="cal-day cal-day-muted">28</span>
              <span className="cal-day cal-day-muted">29</span>
              <span className="cal-day cal-day-muted">30</span>
              <span className="cal-day">1</span>
              <span className="cal-day">2</span>
              <span className="cal-day">3</span>
              <span className="cal-day">4</span>
              <span className="cal-day">5</span>
              <span className="cal-day">6</span>
              <span className="cal-day">7</span>
              <span className="cal-day cal-day-has-note">8</span>
              <span className="cal-day">9</span>
              <span className="cal-day">10</span>
              <span className="cal-day">11</span>
              <span className="cal-day">12</span>
              <span className="cal-day">13</span>
              <span className="cal-day">14</span>
              <span className="cal-day cal-day-has-note">15</span>
              <span className="cal-day">16</span>
              <span className="cal-day">17</span>
              <span className="cal-day">18</span>
              <span className="cal-day">19</span>
              <span className="cal-day">20</span>
              <span className="cal-day">21</span>
              <span className="cal-day">22</span>
              <span className="cal-day cal-day-has-note">23</span>
              <span className="cal-day">24</span>
              <span className="cal-day">25</span>
              <span className="cal-day cal-day-today" aria-current="date">
                26
              </span>
              <span className="cal-day">27</span>
              <span className="cal-day">28</span>
              <span className="cal-day">29</span>
              <span className="cal-day">30</span>
              <span className="cal-day">31</span>
              <span className="cal-day cal-day-muted">1</span>
            </div>

            <div className="calendar-footer-legend">
              <span className="legend-item">
                <span className="legend-dot legend-dot-today" />
                <span>Today</span>
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-dot-note" />
                <span>Reading notes</span>
              </span>
            </div>
          </div>

          {/* Widget 2: Recent Activity ("Now" stream inspired by GATHER) */}
          <div className="utility-widget activity-widget">
            <div className="activity-widget-header">
              <h3 className="activity-widget-title">Live Activity</h3>
              <span className="activity-pulse-live">
                <span className="live-ping-dot" />
                <span>Active</span>
              </span>
            </div>

            <div className="activity-stream-list">
              {recentActivityFeed.map((item) => (
                <div key={item.id} className="activity-item-card">
                  <div className={`activity-icon-box activity-box-${item.color}`}>
                    {item.type === "save" && <Bookmark size={13} />}
                    {item.type === "note" && <FileText size={13} />}
                    {item.type === "stack" && <Layers size={13} />}
                    {item.type === "citation" && <Quote size={13} />}
                  </div>
                  <div className="activity-body">
                    <p className="activity-action-text">{item.action}</p>
                    <p className="activity-title-text">{item.title}</p>
                    <span className="activity-timestamp">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Interactive Paper Detail Modal */}
      {activeModalPaper && (
        <PaperModal
          paper={activeModalPaper}
          onClose={() => setActiveModalPaper(null)}
          isSaved={savedPaperIds.has(activeModalPaper.id)}
          onToggleSave={toggleSavePaper}
        />
      )}
    </div>
  );
}
