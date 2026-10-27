import { useEffect, useMemo, useState } from "react";
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
  ExternalLink,
  FileText,
  Flame,
  Globe,
  Layers,
  Loader2,
  Quote,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import PaperModal from "../components/PaperModal.jsx";
import { trendingTopics } from "../data/mockPapers.js";
import { papersService } from "../services/papersService.js";
import { authService } from "../services/authService.js";
import { activityService } from "../services/activityService.js";
import { scholarlyService } from "../services/scholarlyService.js";
import { apiRequest } from "../services/apiClient.js";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("for-you");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => authService.getStoredUser());
  const [feedMode, setFeedMode] = useState("catalog"); // "catalog" | "scholarly"

  // Catalog papers from Spring Boot MySQL
  const [catalogPapers, setCatalogPapers] = useState([]);
  // Live papers from OpenAlex / arXiv API
  const [scholarlyPapers, setScholarlyPapers] = useState([]);
  const [isFetchingScholarly, setIsFetchingScholarly] = useState(false);

  // Dynamic database metrics from Spring Boot /api/papers/stats
  const [backendStats, setBackendStats] = useState({
    totalPapers: 12,
    totalCitations: 399570,
    fieldsDistribution: {},
    openAccessCount: 12,
  });

  // User saved paper IDs
  const [savedPaperIds, setSavedPaperIds] = useState(() => {
    const stored = localStorage.getItem("researchnest_saved_ids");
    return stored ? new Set(JSON.parse(stored).map(String)) : new Set(["1", "4", "8"]);
  });

  // Dynamic user activities & reading history
  const [activities, setActivities] = useState(() => activityService.getActivities());
  const [readingHistory, setReadingHistory] = useState(() => activityService.getReadingHistory());

  // AI recommendations state
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [calendarMonth, setCalendarMonth] = useState("October 2026");
  const [activeModalPaper, setActiveModalPaper] = useState(null);

  // Load Spring Boot MySQL catalog papers & stats
  useEffect(() => {
    papersService
      .getPapers()
      .then((data) => {
        if (data && data.length > 0) setCatalogPapers(data);
      })
      .catch((err) => console.warn("Failed to fetch catalog papers:", err));

    apiRequest("/papers/stats")
      .then((stats) => {
        if (stats) setBackendStats(stats);
      })
      .catch((err) => console.warn("Failed to fetch backend stats:", err));

    authService
      .getCurrentUser()
      .then((u) => {
        if (u) setCurrentUser(u);
      })
      .catch((err) => console.warn("Failed to fetch current user:", err));
  }, []);

  // Listen for real-time activity, reading history, and saved paper updates
  useEffect(() => {
    function onActivityUpdate() {
      setActivities(activityService.getActivities());
    }
    function onHistoryUpdate() {
      setReadingHistory(activityService.getReadingHistory());
    }
    function onSavedUpdated() {
      const stored = localStorage.getItem("researchnest_saved_ids");
      if (stored) {
        setSavedPaperIds(new Set(JSON.parse(stored).map(String)));
      }
    }

    window.addEventListener("researchnest:activity", onActivityUpdate);
    window.addEventListener("researchnest:history", onHistoryUpdate);
    window.addEventListener("researchnest:saved_updated", onSavedUpdated);
    window.addEventListener("storage", onSavedUpdated);
    return () => {
      window.removeEventListener("researchnest:activity", onActivityUpdate);
      window.removeEventListener("researchnest:history", onHistoryUpdate);
      window.removeEventListener("researchnest:saved_updated", onSavedUpdated);
      window.removeEventListener("storage", onSavedUpdated);
    };
  }, []);

  // Fetch live scholarly papers from OpenAlex when scholarly mode is active or topic/search changes
  useEffect(() => {
    if (feedMode !== "scholarly") return;

    let active = true;
    setIsFetchingScholarly(true);

    scholarlyService
      .searchLivePapers(searchQuery, {
        fieldId: selectedTopic,
        perPage: 12,
      })
      .then((items) => {
        if (active && items) setScholarlyPapers(items);
      })
      .catch((err) => console.warn("Failed to fetch live scholarly papers:", err))
      .finally(() => {
        if (active) setIsFetchingScholarly(false);
      });

    return () => {
      active = false;
    };
  }, [feedMode, selectedTopic, searchQuery]);

  // Request AI recommendation ranking for user whenever saved papers update
  useEffect(() => {
    let active = true;
    setLoadingRecommendations(true);
    const ids = Array.from(savedPaperIds).map((id) => (isNaN(id) ? id : Number(id)));

    papersService
      .getRecommendationsForUser(ids, 8)
      .then((items) => {
        if (active && items) setAiRecommendations(items);
      })
      .catch((err) => console.warn("Failed to load AI recommendations:", err))
      .finally(() => {
        if (active) setLoadingRecommendations(false);
      });

    return () => {
      active = false;
    };
  }, [savedPaperIds]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setStatusMessage(`Displaying results for "${searchQuery.trim()}".`);
      setSearchParams({ q: searchQuery.trim() });
      activityService.logActivity(
        "Searched literature",
        `Query: "${searchQuery.trim()}"`,
        "stack",
        "blue"
      );
    } else {
      setStatusMessage("");
      setSearchParams({});
    }
  }

  function toggleSavePaper(id) {
    const strId = String(id);
    const activeList = feedMode === "scholarly" ? scholarlyPapers : catalogPapers;
    const targetPaper =
      activeList.find((p) => String(p.id) === strId) ||
      catalogPapers.find((p) => String(p.id) === strId) ||
      scholarlyPapers.find((p) => String(p.id) === strId);

    setSavedPaperIds((prev) => {
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

    if (targetPaper) {
      const isSaving = !savedPaperIds.has(strId);
      if (isSaving) {
        activityService.logActivity(
          "Saved paper to Stack",
          targetPaper.title?.length > 40 ? `${targetPaper.title.slice(0, 40)}...` : targetPaper.title,
          "save",
          "purple"
        );
        if (feedMode === "scholarly") {
          papersService
            .createPaper({
              title: targetPaper.title,
              authors: targetPaper.authors,
              year: targetPaper.year,
              abstractText: targetPaper.abstract || targetPaper.abstractText,
              doi: targetPaper.doi,
              field: targetPaper.field,
              fieldId: targetPaper.fieldId,
              venue: targetPaper.venue,
              topicTag: targetPaper.topicTag,
              citations: targetPaper.citations,
              citationLabel: targetPaper.citationLabel,
              openAccess: targetPaper.openAccess,
              pdfUrl: targetPaper.pdfUrl,
              readingTime: targetPaper.readingTime,
            })
            .catch((err) => console.warn("Could not persist scholarly paper:", err));
        }
      } else {
        activityService.logActivity(
          "Removed paper from Stack",
          targetPaper.title?.length > 40 ? `${targetPaper.title.slice(0, 40)}...` : targetPaper.title,
          "save",
          "peach"
        );
      }
    }
  }

  function handleTopicClick(topicId) {
    setSelectedTopic((prev) => (prev === topicId ? null : topicId));
  }

  // Active paper list based on feed mode
  const activePapersSource = feedMode === "scholarly" ? scholarlyPapers : catalogPapers;

  // Real dynamic KPI metrics computed from database & user state
  const dynamicKpiMetrics = useMemo(() => {
    const totalExplored = Math.max(readingHistory.length, 1);
    const totalSaved = savedPaperIds.size;
    const streakDays = activityService.getReadingStreak();

    const allKnown = [...catalogPapers, ...scholarlyPapers];
    const savedPapersList = allKnown.filter(
      (p) => savedPaperIds.has(String(p.id)) || savedPaperIds.has(Number(p.id))
    );
    const savedCitations = savedPapersList.reduce((acc, p) => acc + (p.citations || 0), 0);
    const totalDbCitations = backendStats.totalCitations || 399570;

    const citationDisplay =
      savedCitations > 0
        ? savedCitations >= 1000
          ? `${(savedCitations / 1000).toFixed(1)}k`
          : String(savedCitations)
        : totalDbCitations >= 1000
        ? `${(totalDbCitations / 1000).toFixed(1)}k`
        : String(totalDbCitations);

    // Dynamic average AI match percentage
    let avgMatch = "96%";
    if (aiRecommendations.length > 0) {
      const pcts = aiRecommendations
        .map((r) => {
          const m = r.matchPercentage?.match(/(\d+)%/);
          return m ? parseInt(m[1], 10) : null;
        })
        .filter((n) => n !== null);
      if (pcts.length > 0) {
        avgMatch = `${Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)}%`;
      }
    }

    return [
      {
        id: "saved",
        label: "Saved Papers",
        value: String(totalSaved),
        trend: "Personal library",
        trendType: "up",
      },
      {
        id: "read",
        label: "Papers Explored",
        value: String(totalExplored),
        trend: "Reading sessions",
        trendType: "up",
      },
      {
        id: "match",
        label: "Avg AI Match",
        value: avgMatch,
        trend: "Vector similarity",
        trendType: "up",
      },
      {
        id: "streak",
        label: "Reading Streak",
        value: `${streakDays} Days`,
        trend: "🔥 Daily active",
        trendType: "up",
      },
      {
        id: "citations",
        label: "Citations Tracked",
        value: citationDisplay,
        trend: "↗ Verified",
        trendType: "up",
      },
      {
        id: "stacks",
        label: "Catalog Papers",
        value: String(backendStats.totalPapers || catalogPapers.length || 12),
        trend: "MySQL DB Active",
        trendType: "neutral",
      },
    ];
  }, [savedPaperIds, readingHistory, catalogPapers, scholarlyPapers, backendStats, aiRecommendations]);

  // Real dynamic Topic Focus distribution computed from database catalog
  const dynamicTopicStages = useMemo(() => {
    const counts = {};
    const papersToAnalyze = catalogPapers.length > 0 ? catalogPapers : activePapersSource;
    const total = papersToAnalyze.length || 1;

    papersToAnalyze.forEach((p) => {
      const f = p.field || "Artificial Intelligence";
      counts[f] = (counts[f] || 0) + 1;
    });

    const colors = {
      "Artificial Intelligence": "#06b6d4",
      "Machine Learning": "#3b82f6",
      "Neuroscience": "#a855f7",
      "Quantum Computing": "#8b5cf6",
      "Climate Science": "#f97316",
      "Biotechnology & Medicine": "#10b981",
      "Natural Language Processing": "#ec4899",
    };

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({
        label,
        papers: `${count} papers`,
        pct: Math.min(100, Math.round((count / total) * 100 * 2.2)),
        color: colors[label] || "#7c3aed",
      }));
  }, [catalogPapers, activePapersSource]);

  // Real dynamic Reading Queue from saved papers
  const dynamicReadingQueue = useMemo(() => {
    const pool = catalogPapers.length > 0 ? catalogPapers : activePapersSource;
    const saved = pool.filter((p) => savedPaperIds.has(String(p.id)) || savedPaperIds.has(Number(p.id)));
    const queuePapers = saved.length > 0 ? saved.slice(0, 3) : pool.slice(0, 3);

    return queuePapers.map((p, idx) => ({
      id: `rq-${p.id}`,
      paperId: p.id,
      title: p.title,
      venue: `${p.venue} · ${p.authors ? p.authors.split(",")[0] + " et al." : "Landmark Publication"}`,
      daysTag: idx === 0 ? "Priority Review" : idx === 1 ? "In Stack" : "Annotated",
      tagType: idx === 0 ? "green" : idx === 1 ? "purple" : "blue",
      paper: p,
    }));
  }, [catalogPapers, activePapersSource, savedPaperIds]);

  // Real dynamic monthly reading trend points
  const monthlyReadTrends = useMemo(() => {
    return activityService.getMonthlyReadStats();
  }, [readingHistory, activities]);

  // Compute displayed papers according to filters, search, and AI recommendation rank
  const displayedPapers = useMemo(() => {
    let list = [...activePapersSource];

    if (selectedTopic) {
      list = list.filter((paper) => paper.fieldId === selectedTopic);
    }

    if (searchQuery.trim() && feedMode === "catalog") {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (paper) =>
          paper.title?.toLowerCase().includes(q) ||
          paper.field?.toLowerCase().includes(q) ||
          paper.authors?.toLowerCase().includes(q) ||
          paper.topicTag?.toLowerCase().includes(q)
      );
    }

    if (activeTab === "for-you" && aiRecommendations.length > 0) {
      const aiRankMap = new Map();
      aiRecommendations.forEach((rec, idx) => {
        aiRankMap.set(String(rec.paper?.id), idx);
      });

      list.sort((a, b) => {
        const isSavedA = savedPaperIds.has(String(a.id)) || savedPaperIds.has(Number(a.id));
        const isSavedB = savedPaperIds.has(String(b.id)) || savedPaperIds.has(Number(b.id));

        const rankA = aiRankMap.has(String(a.id))
          ? aiRankMap.get(String(a.id))
          : isSavedA ? 0 : 999;
        const rankB = aiRankMap.has(String(b.id))
          ? aiRankMap.get(String(b.id))
          : isSavedB ? 0 : 999;
        return rankA - rankB;
      });
    } else if (activeTab === "latest") {
      list.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (activeTab === "most-cited") {
      list.sort((a, b) => (b.citations || 0) - (a.citations || 0));
    }

    return list;
  }, [activePapersSource, activeTab, selectedTopic, searchQuery, feedMode, aiRecommendations]);

  const firstName = currentUser?.name?.split(" ")[0] || "Researcher";

  return (
    <div className="natural-dashboard">
      {/* 1. Human Greeting & Micro Date Banner */}
      <section className="dashboard-greeting-banner" aria-label="Greeting">
        <div className="greeting-meta-row">
          <span className="greeting-date">Live Research Workspace</span>
          <span className="greeting-meta-separator">·</span>
          <span className="greeting-tag">Spring Boot API Connected</span>
          <span className="greeting-meta-separator">·</span>
          <span className="greeting-tag">OpenAlex Scholarly Engine</span>
        </div>
        <div className="greeting-main-row">
          <div className="greeting-text-wrap">
            <h1 className="greeting-headline">
              Good Day! <span className="greeting-name">{firstName},</span>
            </h1>
            <p className="greeting-subtext">
              Welcome back. Real-time scholarly literature, live research statistics, and dynamic AI paper recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Real Dynamic KPI Metrics Ribbon */}
      <section className="kpi-metrics-ribbon" aria-label="Key research metrics">
        {dynamicKpiMetrics.map((item) => (
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

      {/* 3. Real Dynamic Analytics & Progress Row */}
      <section className="analytics-trio-row" aria-label="Research progress charts">
        {/* Card 1: Dynamic SVG Sparkline Curve Chart */}
        <article className="chart-card chart-card-trend">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Reading Activity</h2>
              <div className="chart-total-stat">
                <span className="chart-stat-number">{readingHistory.length || 1}</span>
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

              {/* Dynamic Filled Area Under Curve */}
              <path
                d={
                  monthlyReadTrends.length > 0
                    ? `M ${monthlyReadTrends[0].x} ${monthlyReadTrends[0].y} ` +
                      monthlyReadTrends.slice(1).map((pt) => `L ${pt.x} ${pt.y}`).join(" ") +
                      ` L 300 95 L 20 95 Z`
                    : "M 20 72 L 300 16 L 300 95 L 20 95 Z"
                }
                fill="url(#curveGradient)"
              />

              {/* Dynamic Smooth Line Curve */}
              <path
                d={
                  monthlyReadTrends.length > 0
                    ? `M ${monthlyReadTrends[0].x} ${monthlyReadTrends[0].y} ` +
                      monthlyReadTrends.slice(1).map((pt) => `L ${pt.x} ${pt.y}`).join(" ")
                    : "M 20 72 L 300 16"
                }
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Real Data Marker Dots */}
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

        {/* Card 2: Real Topic Distribution Stages */}
        <article className="chart-card chart-card-stages">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Topic Focus</h2>
              <p className="chart-card-sub">Active disciplines in database</p>
            </div>
            <div className="chart-pill-dropdown">
              <span>All Disciplines</span>
              <span className="dropdown-caret">⌵</span>
            </div>
          </div>

          <div className="topic-stages-list">
            {dynamicTopicStages.map((stage) => (
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

        {/* Card 3: Real Dynamic Reading Queue */}
        <article className="chart-card chart-card-queue">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Reading Queue</h2>
              <p className="chart-card-sub">Saved papers in your review stack</p>
            </div>
            <div className="queue-filter-pill">
              <span className="queue-pill-opt queue-pill-active">All</span>
              <span className="queue-pill-opt">Priority</span>
            </div>
          </div>

          <div className="reading-queue-list">
            {dynamicReadingQueue.map((item) => (
              <div
                key={item.id}
                className="queue-item-row"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (item.paper) setActiveModalPaper(item.paper);
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

          {/* Feed Controls: Segmented Tabs + Live API Switcher */}
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

            {/* Live API Feed Switcher Toggle */}
            <div className="feed-source-toggle" role="group" aria-label="Literature source">
              <button
                type="button"
                className={`feed-source-pill ${feedMode === "catalog" ? "feed-source-pill-active" : ""}`}
                onClick={() => setFeedMode("catalog")}
                title="Verified peer-reviewed papers from Spring Boot MySQL database"
              >
                <Layers size={13} />
                <span>MySQL Catalog ({catalogPapers.length})</span>
              </button>
              <button
                type="button"
                className={`feed-source-pill ${feedMode === "scholarly" ? "feed-source-pill-active" : ""}`}
                onClick={() => setFeedMode("scholarly")}
                title="Query live papers from OpenAlex 250M+ scientific research API"
              >
                <Globe size={13} />
                <span>Live OpenAlex API</span>
              </button>
            </div>
          </div>

          {/* Scholarly Live Stream Banner */}
          {feedMode === "scholarly" && (
            <div className="scholarly-feed-banner">
              <div className="scholarly-feed-left">
                <span className="scholarly-globe-icon">
                  <Globe size={16} />
                </span>
                <div>
                  <h4 className="scholarly-feed-title">Live Scientific Literature API Active</h4>
                  <p className="scholarly-feed-sub">
                    Streaming genuine peer-reviewed publications from OpenAlex & arXiv. Saving papers persists them directly to your MySQL database.
                  </p>
                </div>
              </div>
              {isFetchingScholarly && (
                <span className="scholarly-fetching-pill">
                  <Loader2 size={13} className="spin-icon" /> Fetching live papers...
                </span>
              )}
            </div>
          )}

          {statusMessage && (
            <div className="feed-status-notice" aria-live="polite">
              <span>{statusMessage}</span>
            </div>
          )}

          {/* AI Recommendation Engine Feed Banner */}
          {activeTab === "for-you" && (
            <div className="ai-feed-banner">
              <div className="ai-feed-banner-left">
                <span className="ai-feed-banner-icon">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h3 className="ai-feed-banner-title">
                    Smart AI Literature Recommendations
                  </h3>
                  <p className="ai-feed-banner-sub">
                    Personalized to your saved stacks using TF-IDF & Cosine Similarity vector space matching.
                  </p>
                </div>
              </div>
              <span className="ai-feed-badge">
                <Sparkles size={12} /> AI Engine Active
              </span>
            </div>
          )}

          {/* Curated Paper Cards Grid */}
          <div className="curated-papers-grid">
            {displayedPapers.map((paper) => {
              const isSaved = savedPaperIds.has(String(paper.id)) || savedPaperIds.has(Number(paper.id));
              const recInfo = aiRecommendations.find(
                (r) => String(r.paper?.id) === String(paper.id)
              );
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
                      <span className={`card-match-pill ${recInfo ? "card-ai-match-pill" : ""}`}>
                        {recInfo ? recInfo.matchPercentage : (paper.matchScore || "96% Match")}
                      </span>
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

                  {recInfo && (
                    <div className="card-ai-reason">
                      <Sparkles size={12} className="ai-reason-icon" />
                      <span>{recInfo.reason}</span>
                    </div>
                  )}

                  <p className="card-paper-abstract">{paper.abstract || paper.abstractText}</p>

                  <div className="card-tag-wrapper">
                    <span className="card-topic-tag">
                      <Tag size={11} aria-hidden="true" />
                      <span>{paper.topicTag}</span>
                    </span>
                  </div>

                  <div className="card-footer-metrics">
                    <div className="card-metrics-left">
                      <span className="metric-item">
                        <Quote size={12} aria-hidden="true" />
                        <span>{paper.citationLabel || `${paper.citations || 0} citations`}</span>
                      </span>
                      {paper.openAccess && (
                        <span className="metric-oa-badge">Open Access</span>
                      )}
                    </div>
                    <span className="card-read-link">
                      <span>Read paper</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {displayedPapers.length === 0 && !isFetchingScholarly && (
            <div className="empty-state-notice">
              <p>No research papers found matching your current filter.</p>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setSelectedTopic(null);
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Right Utility Widgets Column (30%) */}
        <aside className="feed-utility-column" aria-label="Workspace widgets">
          {/* Widget 1: Interactive Research Calendar */}
          <div className="utility-widget calendar-widget">
            <div className="calendar-widget-header">
              <div className="calendar-title-wrap">
                <CalendarIcon size={16} className="widget-icon" />
                <h3 className="calendar-title">Research Schedule</h3>
              </div>
              <div className="calendar-month-nav">
                <span className="calendar-current-label">{calendarMonth}</span>
                <button
                  type="button"
                  className="cal-nav-btn"
                  aria-label="Previous month"
                  onClick={() => setCalendarMonth("September 2026")}
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  className="cal-nav-btn"
                  aria-label="Next month"
                  onClick={() => setCalendarMonth("November 2026")}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            <div className="calendar-mini-grid" role="grid" aria-label="October 2026 calendar">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="cal-header-cell">
                  {d}
                </div>
              ))}
              {[
                { day: 28, muted: true },
                { day: 29, muted: true },
                { day: 30, muted: true },
                { day: 1 },
                { day: 2 },
                { day: 3 },
                { day: 4 },
                { day: 5 },
                { day: 6 },
                { day: 7 },
                { day: 8, hasNote: true },
                { day: 9 },
                { day: 10 },
                { day: 11 },
                { day: 12 },
                { day: 13 },
                { day: 14 },
                { day: 15, hasNote: true },
                { day: 16 },
                { day: 17 },
                { day: 18 },
                { day: 19 },
                { day: 20 },
                { day: 21 },
                { day: 22 },
                { day: 23, hasNote: true },
                { day: 24 },
                { day: 25 },
                { day: 26, isToday: true },
                { day: 27 },
                { day: 28 },
                { day: 29 },
                { day: 30 },
                { day: 31 },
                { day: 1, muted: true },
              ].map((cell, idx) => (
                <div
                  key={idx}
                  className={`cal-day-cell ${cell.muted ? "cal-cell-muted" : ""} ${
                    cell.isToday ? "cal-cell-today" : ""
                  }`}
                >
                  <span>{cell.day}</span>
                  {cell.hasNote && <span className="cal-note-dot" />}
                </div>
              ))}
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

          {/* Widget 2: Real Dynamic Live Activity Stream */}
          <div className="utility-widget activity-widget">
            <div className="activity-widget-header">
              <h3 className="activity-widget-title">Live Activity</h3>
              <span className="activity-pulse-live">
                <span className="live-ping-dot" />
                <span>Real-Time</span>
              </span>
            </div>

            <div className="activity-stream-list">
              {activities.slice(0, 5).map((item) => (
                <div key={item.id} className="activity-item-card">
                  <div className={`activity-icon-box activity-box-${item.color || "purple"}`}>
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
          onSelectPaper={(p) => setActiveModalPaper(p)}
        />
      )}
    </div>
  );
}
