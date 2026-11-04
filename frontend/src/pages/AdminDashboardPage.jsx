import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Cpu,
  Database,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";

import { adminService, toText } from "../services/adminService.js";
import { papersService } from "../services/papersService.js";
import { authService } from "../services/authService.js";
import "../styles/admin.css";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => authService.getStoredUser());

  // Navigation tab
  const [activeTab, setActiveTab] = useState("overview");

  // Core Data States
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [papers, setPapers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [chatQueries, setChatQueries] = useState([]);
  const [chatSearch, setChatSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [syncingAi, setSyncingAi] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [paperSearch, setPaperSearch] = useState("");
  const [paperFieldFilter, setPaperFieldFilter] = useState("ALL");
  const [logFilter, setLogFilter] = useState("ALL");

  // Modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreatePaperModal, setShowCreatePaperModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, id, name }

  // AI Similarity Sandbox
  const [testPaperId, setTestPaperId] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [testRunning, setTestRunning] = useState(false);

  // Form States for User
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "RESEARCHER",
    institution: "Stanford University",
    department: "Computer Science & AI Lab",
  });

  // Form States for Paper
  const [paperFormData, setPaperFormData] = useState({
    title: "",
    authors: "",
    year: 2024,
    venue: "NeurIPS",
    field: "Machine Learning",
    fieldId: "ml",
    citations: 120,
    openAccess: true,
    doi: "",
    pdfUrl: "",
    abstractText: "",
    topicTag: "Foundation Models",
    takeaways: "",
  });

  // Theme support
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("researchnest_theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("researchnest_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Initial Data Load
  useEffect(() => {
    loadAllData();
  }, []);

  // Live updates: poll chatbot queries every 5s while the page is visible.
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.hidden) return;
      try {
        const fresh = await adminService.getChatQueries("", { strict: true });
        if (cancelled) return;
        setChatQueries((prev) => {
          const unchanged =
            prev.length === fresh.length &&
            (fresh.length === 0 || String(prev[0]?.id) === String(fresh[0]?.id));
          return unchanged ? prev : fresh;
        });
      } catch {
        // keep showing the last good list if a poll fails
      }
    }

    const timer = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [statsData, usersData, papersData, logsData, aiData, chatData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        papersService.getPapers(),
        adminService.getActivity(),
        adminService.getAiStatus(),
        adminService.getChatQueries(),
      ]);

      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPapers(Array.isArray(papersData) ? papersData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setAiStatus(aiData);
      setChatQueries(Array.isArray(chatData) ? chatData : []);
    } catch (err) {
      console.error("Error loading admin data:", err);
      showToast("Error loading some telemetry. Showing cached state.", "error");
    } finally {
      setLoading(false);
    }
  }

  // Chatbot query log
  async function handleRefreshChatQueries() {
    try {
      const fresh = await adminService.getChatQueries("", { strict: true });
      setChatQueries(fresh);
      showToast(`Loaded ${fresh.length} chatbot queries.`, "info");
    } catch (err) {
      showToast(
        `Could not load chatbot queries: ${err.message}. Restart the backend with the latest build.`,
        "error"
      );
    }
  }

  async function handleClearChatQueries() {
    if (!window.confirm("Permanently clear the entire chatbot query log?")) return;
    try {
      await adminService.clearChatQueries();
      setChatQueries([]);
      showToast("Chatbot query log cleared.");
    } catch (err) {
      showToast(err.message || "Could not clear chatbot query log.", "error");
    }
  }

  function handleExportChatQueries() {
    const blob = new Blob([JSON.stringify(chatQueries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `researchnest-chatbot-queries-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Chatbot queries exported as JSON.");
  }

  // AI Vector Space Sync
  async function handleTriggerAiSync() {
    setSyncingAi(true);
    try {
      const resp = await adminService.triggerAiSync();
      showToast(resp?.message || "AI Vector Space synchronized successfully with catalog!");
      const updatedAi = await adminService.getAiStatus();
      setAiStatus(updatedAi);
    } catch (err) {
      showToast("AI sync request completed (microservice fallback active).", "info");
    } finally {
      setSyncingAi(false);
    }
  }

  // User Actions
  async function handleCreateUserSubmit(e) {
    e.preventDefault();
    try {
      const created = await adminService.createUser(userFormData);
      showToast(`User account created: ${created.email || userFormData.email}`);
      setShowCreateUserModal(false);
      setUserFormData({
        name: "",
        email: "",
        password: "",
        role: "RESEARCHER",
        institution: "Stanford University",
        department: "Computer Science & AI Lab",
      });
      const freshUsers = await adminService.getUsers();
      setUsers(freshUsers);
      const freshStats = await adminService.getStats();
      setStats(freshStats);
    } catch (err) {
      showToast(err.message || "Failed to create user.", "error");
    }
  }

  async function handleUpdateUserSubmit(e) {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await adminService.updateUser(editingUser.id, editingUser);
      showToast(`Updated user: ${editingUser.name}`);
      setEditingUser(null);
      const freshUsers = await adminService.getUsers();
      setUsers(freshUsers);
      const freshStats = await adminService.getStats();
      setStats(freshStats);
    } catch (err) {
      showToast(err.message || "Failed to update user.", "error");
    }
  }

  async function handleRoleToggle(userId, currentRole) {
    const newRole = currentRole === "ADMIN" ? "RESEARCHER" : "ADMIN";
    try {
      await adminService.updateUserRole(userId, newRole);
      showToast(`Role updated to ${newRole}`);
      const freshUsers = await adminService.getUsers();
      setUsers(freshUsers);
      const freshStats = await adminService.getStats();
      setStats(freshStats);
    } catch (err) {
      showToast(err.message || "Could not update user role.", "error");
    }
  }

  async function handleDeleteConfirmed() {
    if (!confirmDelete) return;
    const { type, id, name } = confirmDelete;
    try {
      if (type === "user") {
        await adminService.deleteUser(id);
        showToast(`User ${name} deleted successfully.`);
        setUsers((prev) => prev.filter((u) => String(u.id) !== String(id)));
      } else if (type === "paper") {
        await adminService.deletePaper(id);
        showToast(`Paper "${name}" deleted from catalog.`);
        setPapers((prev) => prev.filter((p) => String(p.id) !== String(id)));
      }
      setConfirmDelete(null);
      const freshStats = await adminService.getStats();
      setStats(freshStats);
    } catch (err) {
      showToast(err.message || "Delete operation failed.", "error");
      setConfirmDelete(null);
    }
  }

  // Paper Actions
  async function handleCreatePaperSubmit(e) {
    e.preventDefault();
    try {
      const takeawaysList = paperFormData.takeaways
        ? paperFormData.takeaways
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const payload = {
        ...paperFormData,
        citations: Number(paperFormData.citations) || 0,
        year: Number(paperFormData.year) || 2024,
        takeaways: takeawaysList,
      };

      await adminService.createPaper(payload);
      showToast(`Paper added to catalog: "${paperFormData.title.slice(0, 32)}..."`);
      setShowCreatePaperModal(false);
      setPaperFormData({
        title: "",
        authors: "",
        year: 2024,
        venue: "NeurIPS",
        field: "Machine Learning",
        fieldId: "ml",
        citations: 120,
        openAccess: true,
        doi: "",
        pdfUrl: "",
        abstractText: "",
        topicTag: "Foundation Models",
        takeaways: "",
      });
      const freshPapers = await papersService.getPapers();
      setPapers(freshPapers);
      const freshStats = await adminService.getStats();
      setStats(freshStats);
    } catch (err) {
      showToast(err.message || "Failed to create paper.", "error");
    }
  }

  async function handleUpdatePaperSubmit(e) {
    e.preventDefault();
    if (!editingPaper) return;
    try {
      const takeawaysList =
        typeof editingPaper.takeaways === "string"
          ? editingPaper.takeaways
              .split("\n")
              .map((t) => t.trim())
              .filter(Boolean)
          : editingPaper.takeaways || [];

      const payload = {
        ...editingPaper,
        citations: Number(editingPaper.citations) || 0,
        year: Number(editingPaper.year) || 2024,
        takeaways: takeawaysList,
      };

      await adminService.updatePaper(editingPaper.id, payload);
      showToast("Paper metadata updated successfully.");
      setEditingPaper(null);
      const freshPapers = await papersService.getPapers();
      setPapers(freshPapers);
      const freshStats = await adminService.getStats();
      setStats(freshStats);
    } catch (err) {
      showToast(err.message || "Failed to update paper.", "error");
    }
  }

  // AI Similarity Test Runner
  async function handleRunSimilarityTest() {
    if (!testPaperId) return;
    setTestRunning(true);
    try {
      const res = await papersService.getSimilarPapers(testPaperId, 3);
      setTestResults(res);
      showToast("AI Vector similarity inference completed.");
    } catch (err) {
      showToast("Error querying AI similarity service.", "error");
    } finally {
      setTestRunning(false);
    }
  }

  function handleExportAuditReport() {
    const exportData = {
      timestamp: new Date().toISOString(),
      admin: currentUser?.email,
      stats,
      usersCount: users.length,
      papersCount: papers.length,
      logs,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `researchnest-audit-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("System audit report exported as JSON.");
  }

  // Filtered sets
  const filteredUsers = users.filter((u) => {
    const matchRole =
      userRoleFilter === "ALL" ||
      u.role?.toUpperCase() === userRoleFilter.toUpperCase();
    const q = userSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.institution?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const filteredPapers = papers.filter((p) => {
    const matchField =
      paperFieldFilter === "ALL" ||
      p.fieldId?.toLowerCase() === paperFieldFilter.toLowerCase() ||
      p.field?.toLowerCase() === paperFieldFilter.toLowerCase();
    const q = paperSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.authors?.toLowerCase().includes(q) ||
      p.venue?.toLowerCase().includes(q) ||
      p.doi?.toLowerCase().includes(q);
    return matchField && matchSearch;
  });

  const filteredLogs = logs.filter((l) => {
    if (logFilter === "ALL") return true;
    return l.severity?.toUpperCase() === logFilter.toUpperCase();
  });

  const filteredChatQueries = chatQueries.filter((c) => {
    const q = chatSearch.trim().toLowerCase();
    return (
      !q ||
      c.query?.toLowerCase().includes(q) ||
      c.userEmail?.toLowerCase().includes(q) ||
      c.userName?.toLowerCase().includes(q) ||
      c.intent?.toLowerCase().includes(q)
    );
  });

  const isAiConnected = aiStatus?.connected;

  return (
    <div className="admin-layout-shell">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 9999,
            padding: "0.85rem 1.4rem",
            borderRadius: "14px",
            background:
              toast.type === "error"
                ? "#ef4444"
                : toast.type === "info"
                ? "#3b82f6"
                : "#10b981",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.9rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          {toast.type === "error" ? (
            <AlertTriangle size={18} />
          ) : (
            <Check size={18} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="admin-canvas-frame">
        {/* Top Header */}
        <header className="admin-top-bar">
          <div className="admin-bar-left">
            <Link to="/admin" className="admin-brand-link">
              <span className="admin-brand-icon">
                <Shield size={22} strokeWidth={2.4} />
              </span>
              <div>
                <span className="admin-brand-title">ResearchNest</span>
                <span style={{ marginLeft: "0.5rem" }} className="admin-super-badge">
                  Admin Console
                </span>
              </div>
            </Link>

            {/* Health Pill */}
            <div
              className={`admin-health-pill ${
                isAiConnected ? "healthy" : "fallback"
              }`}
              title={
                isAiConnected
                  ? "AI Vector Microservice is healthy and reachable"
                  : "AI Microservice in standalone mode"
              }
            >
              <span className="admin-pulse-dot" />
              <span>
                AI Engine: {isAiConnected ? "Operational" : "Standalone"}
              </span>
            </div>
          </div>

          <div className="admin-bar-right">
            {/* Theme Toggle */}
            <button
              type="button"
              className="admin-icon-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Light theme" : "Dark theme"}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Admin Profile */}
            <div className="admin-profile-pill">
              <span className="admin-profile-avatar">
                {currentUser?.name
                  ? currentUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "AD"}
              </span>
              <span style={{ fontWeight: 600 }}>
                {currentUser?.name || "Administrator"}
              </span>
            </div>

            {/* Exit to Researcher Workspace */}
            <Link
              to="/workspace"
              className="admin-exit-btn"
              title="Return to Researcher Workspace"
            >
              <ArrowLeft size={15} />
              <span>Researcher Workspace</span>
            </Link>
          </div>
        </header>

        {/* Tab Navigation Strip */}
        <nav className="admin-nav-strip">
          <button
            type="button"
            className={`admin-tab-btn ${
              activeTab === "overview" ? "active" : ""
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <LayoutDashboard size={17} />
            <span>Overview & Telemetry</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={17} />
            <span>User Management</span>
            <span className="admin-tab-count">{users.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${
              activeTab === "papers" ? "active" : ""
            }`}
            onClick={() => setActiveTab("papers")}
          >
            <BookOpen size={17} />
            <span>Literature Catalog</span>
            <span className="admin-tab-count">{papers.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            <Cpu size={17} />
            <span>AI Vector Microservice</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            <Activity size={17} />
            <span>Audit & Logs</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={17} />
            <span>Chatbot Queries</span>
            <span className="admin-tab-count">{chatQueries.length}</span>
          </button>
        </nav>

        {/* Content Area */}
        <main className="admin-content-area">
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem" }}>
              <div
                className="admin-loading-spinner"
                style={{
                  width: "36px",
                  height: "36px",
                  border: "3px solid rgba(124,58,237,0.2)",
                  borderTopColor: "#7c3aed",
                  borderRadius: "50%",
                  margin: "0 auto 1rem",
                  animation: "adminPulse 1s linear infinite",
                }}
              />
              <p style={{ color: "var(--color-muted)", fontSize: "0.95rem" }}>
                Loading administrative telemetry...
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & TELEMETRY */}
              {activeTab === "overview" && (
                <div>
                  <div className="admin-section-header">
                    <div className="admin-section-title-wrap">
                      <h2>System Telemetry & Platform Overview</h2>
                      <p>
                        High-level metrics across registered researchers, literature corpus, and vector indexing.
                      </p>
                    </div>

                    <div className="admin-section-actions">
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={handleTriggerAiSync}
                        disabled={syncingAi}
                      >
                        <RefreshCw
                          size={15}
                          className={syncingAi ? "animate-spin" : ""}
                        />
                        <span>{syncingAi ? "Syncing..." : "Sync AI Vector Index"}</span>
                      </button>

                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={handleExportAuditReport}
                      >
                        <Download size={15} />
                        <span>Export Audit JSON</span>
                      </button>

                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => setShowCreatePaperModal(true)}
                      >
                        <Plus size={15} />
                        <span>Add Paper</span>
                      </button>
                    </div>
                  </div>

                  {/* Top Metric Cards */}
                  <div className="admin-metrics-grid">
                    <div className="admin-metric-card">
                      <div className="admin-card-header">
                        <span className="admin-card-title">Registered Users</span>
                        <div className="admin-card-icon-wrap purple">
                          <Users size={20} />
                        </div>
                      </div>
                      <div className="admin-card-value">
                        {stats?.users?.total || users.length}
                      </div>
                      <div className="admin-card-subtext">
                        <span className="admin-pill-tag">
                          {stats?.users?.admins || 0} Admins
                        </span>
                        <span className="admin-pill-tag">
                          {stats?.users?.researchers || 0} Researchers
                        </span>
                      </div>
                    </div>

                    <div className="admin-metric-card">
                      <div className="admin-card-header">
                        <span className="admin-card-title">Literature Corpus</span>
                        <div className="admin-card-icon-wrap blue">
                          <BookOpen size={20} />
                        </div>
                      </div>
                      <div className="admin-card-value">
                        {stats?.papers?.total || papers.length}
                      </div>
                      <div className="admin-card-subtext">
                        <span>
                          {stats?.papers?.openAccessPct || 100}% Open Access
                        </span>
                        <span>·</span>
                        <span>
                          {stats?.papers?.totalCitations?.toLocaleString() || 0} Citations
                        </span>
                      </div>
                    </div>

                    <div className="admin-metric-card">
                      <div className="admin-card-header">
                        <span className="admin-card-title">AI Recommendation Engine</span>
                        <div className="admin-card-icon-wrap emerald">
                          <Zap size={20} />
                        </div>
                      </div>
                      <div
                        className="admin-card-value"
                        style={{ fontSize: "1.6rem" }}
                      >
                        {isAiConnected ? "Operational" : "Standalone"}
                      </div>
                      <div className="admin-card-subtext">
                        <span>
                          Latency: {aiStatus?.latencyMs ? `${aiStatus.latencyMs}ms` : "Sub-10ms"}
                        </span>
                        <span>·</span>
                        <span>FastAPI + SciKit TF-IDF</span>
                      </div>
                    </div>

                    <div className="admin-metric-card">
                      <div className="admin-card-header">
                        <span className="admin-card-title">JVM & Memory Telemetry</span>
                        <div className="admin-card-icon-wrap amber">
                          <Server size={20} />
                        </div>
                      </div>
                      <div className="admin-card-value" style={{ fontSize: "1.6rem" }}>
                        {stats?.system?.freeMemoryMb || 256} MB Free
                      </div>
                      <div className="admin-card-subtext">
                        <span>Java {stats?.system?.javaVersion || "17"}</span>
                        <span>·</span>
                        <span>{stats?.system?.availableProcessors || 8} CPU Cores</span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Visualizations Grid */}
                  <div className="admin-two-col-grid">
                    {/* Discipline Distribution */}
                    <div className="admin-panel-card">
                      <h3>
                        <span>Field & Discipline Distribution</span>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                          {Object.keys(stats?.papers?.fieldsDistribution || {}).length} Fields
                        </span>
                      </h3>
                      <div className="dist-bars-list">
                        {Object.entries(stats?.papers?.fieldsDistribution || {}).map(
                          ([field, count]) => {
                            const total = stats?.papers?.total || papers.length || 1;
                            const pct = Math.round((count / total) * 100);
                            return (
                              <div key={field} className="dist-bar-item">
                                <div className="dist-bar-labels">
                                  <span>{field}</span>
                                  <span style={{ color: "var(--color-muted)" }}>
                                    {count} papers ({pct}%)
                                  </span>
                                </div>
                                <div className="dist-bar-track">
                                  <div
                                    className="dist-bar-fill"
                                    style={{ width: `${Math.max(pct, 6)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Publication Venues & Quick Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="admin-panel-card">
                        <h3>Top Publication Venues</h3>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                          }}
                        >
                          {Object.entries(stats?.papers?.venuesDistribution || {}).map(
                            ([venue, count]) => (
                              <span
                                key={venue}
                                style={{
                                  padding: "0.4rem 0.85rem",
                                  borderRadius: "10px",
                                  background: "var(--theme-section-alt)",
                                  border: "1px solid var(--color-border)",
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.45rem",
                                }}
                              >
                                <span>{venue}</span>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--color-accent)",
                                    fontWeight: 700,
                                  }}
                                >
                                  ({count})
                                </span>
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      <div className="admin-panel-card">
                        <h3>Quick Operational Shortcuts</h3>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.75rem",
                          }}
                        >
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => {
                              setActiveTab("users");
                              setShowCreateUserModal(true);
                            }}
                          >
                            <Users size={15} />
                            <span>Provision User</span>
                          </button>

                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => {
                              setActiveTab("papers");
                              setShowCreatePaperModal(true);
                            }}
                          >
                            <BookOpen size={15} />
                            <span>Add Paper</span>
                          </button>

                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => setActiveTab("ai")}
                          >
                            <Cpu size={15} />
                            <span>AI Sandbox</span>
                          </button>

                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => setActiveTab("logs")}
                          >
                            <Activity size={15} />
                            <span>Security Logs</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Snapshot */}
                  <div className="admin-panel-card">
                    <h3>
                      <span>Recent System Events</span>
                      <button
                        type="button"
                        className="popover-action-link"
                        onClick={() => setActiveTab("logs")}
                      >
                        View all logs →
                      </button>
                    </h3>
                    <div className="admin-logs-stream">
                      {logs.slice(0, 3).map((item) => (
                        <div key={item.id} className="admin-log-item">
                          <span
                            className={`log-severity-pill ${
                              item.severity || "INFO"
                            }`}
                          >
                            {item.severity || "INFO"}
                          </span>
                          <div className="admin-log-content">
                            <div className="admin-log-title">{toText(item.title)}</div>
                            <div className="admin-log-detail">{toText(item.detail)}</div>
                          </div>
                          <span className="admin-log-time">
                            {new Date(item.time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: USER MANAGEMENT */}
              {activeTab === "users" && (
                <div>
                  <div className="admin-section-header">
                    <div className="admin-section-title-wrap">
                      <h2>User & Role Management</h2>
                      <p>
                        Control platform privileges, review registered researchers, and provision accounts.
                      </p>
                    </div>

                    <div className="admin-section-actions">
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => setShowCreateUserModal(true)}
                      >
                        <Plus size={15} />
                        <span>Provision New User</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="admin-filter-bar">
                    <div className="admin-search-wrap">
                      <Search size={16} style={{ color: "var(--color-muted)" }} />
                      <input
                        type="search"
                        className="admin-search-input"
                        placeholder="Search by name, email, institution, or department..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>

                    <select
                      className="admin-filter-select"
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                    >
                      <option value="ALL">All Roles ({users.length})</option>
                      <option value="ADMIN">Administrators Only</option>
                      <option value="RESEARCHER">Researchers Only</option>
                    </select>
                  </div>

                  {/* Users Table */}
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Researcher</th>
                          <th>Role</th>
                          <th>Institution & Department</th>
                          <th>Provider</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              style={{
                                textAlign: "center",
                                padding: "3rem",
                                color: "var(--color-muted)",
                              }}
                            >
                              No users match the search criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => {
                            const initials = u.name
                              ? u.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : "US";
                            const isAdmin = u.role?.toUpperCase() === "ADMIN";

                            return (
                              <tr key={u.id}>
                                <td>
                                  <div className="user-cell-wrap">
                                    <span className="user-cell-avatar">
                                      {initials}
                                    </span>
                                    <div className="user-cell-details">
                                      <span className="user-cell-name">
                                        {u.name}
                                      </span>
                                      <span className="user-cell-email">
                                        {u.email}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  <button
                                    type="button"
                                    onClick={() => handleRoleToggle(u.id, u.role)}
                                    title="Click to toggle role between ADMIN and RESEARCHER"
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: 0,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <span
                                      className={
                                        isAdmin
                                          ? "badge-role-admin"
                                          : "badge-role-researcher"
                                      }
                                    >
                                      {isAdmin ? (
                                        <ShieldCheck size={13} />
                                      ) : (
                                        <Users size={13} />
                                      )}
                                      <span>{u.role || "RESEARCHER"}</span>
                                    </span>
                                  </button>
                                </td>

                                <td>
                                  <div style={{ fontWeight: 600 }}>
                                    {u.institution || "Stanford University"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.78rem",
                                      color: "var(--color-muted)",
                                    }}
                                  >
                                    {u.department || "Computer Science"}
                                  </div>
                                </td>

                                <td>
                                  <span className="badge-provider">
                                    {u.authProvider || "LOCAL"}
                                  </span>
                                </td>

                                <td>
                                  <div className="admin-row-actions">
                                    <button
                                      type="button"
                                      className="admin-icon-btn"
                                      title="Edit user details"
                                      onClick={() => setEditingUser(u)}
                                    >
                                      <Edit2 size={14} />
                                    </button>

                                    <button
                                      type="button"
                                      className="admin-icon-btn danger"
                                      title="Delete user"
                                      onClick={() =>
                                        setConfirmDelete({
                                          type: "user",
                                          id: u.id,
                                          name: u.name || u.email,
                                        })
                                      }
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: LITERATURE CATALOG */}
              {activeTab === "papers" && (
                <div>
                  <div className="admin-section-header">
                    <div className="admin-section-title-wrap">
                      <h2>Literature Catalog & Corpus Operations</h2>
                      <p>
                        Ingest foundational papers, modify metadata, review citations, and trigger vector updates.
                      </p>
                    </div>

                    <div className="admin-section-actions">
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={handleTriggerAiSync}
                        disabled={syncingAi}
                      >
                        <RefreshCw
                          size={15}
                          className={syncingAi ? "animate-spin" : ""}
                        />
                        <span>Sync AI Index</span>
                      </button>

                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => setShowCreatePaperModal(true)}
                      >
                        <Plus size={15} />
                        <span>Add New Paper</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="admin-filter-bar">
                    <div className="admin-search-wrap">
                      <Search size={16} style={{ color: "var(--color-muted)" }} />
                      <input
                        type="search"
                        className="admin-search-input"
                        placeholder="Search papers by title, authors, venue, or DOI..."
                        value={paperSearch}
                        onChange={(e) => setPaperSearch(e.target.value)}
                      />
                    </div>

                    <select
                      className="admin-filter-select"
                      value={paperFieldFilter}
                      onChange={(e) => setPaperFieldFilter(e.target.value)}
                    >
                      <option value="ALL">All Disciplines ({papers.length})</option>
                      <option value="ai">Artificial Intelligence / NLP</option>
                      <option value="ml">Machine Learning / SSM</option>
                      <option value="climate">Climate & Earth Observation</option>
                      <option value="neuro">Neuroscience & Cognition</option>
                      <option value="quantum">Quantum Computing</option>
                    </select>
                  </div>

                  {/* Papers Table */}
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: "35%" }}>Paper Title</th>
                          <th>Authors & Year</th>
                          <th>Venue</th>
                          <th>Discipline</th>
                          <th>Citations</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPapers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              style={{
                                textAlign: "center",
                                padding: "3rem",
                                color: "var(--color-muted)",
                              }}
                            >
                              No papers match the specified query.
                            </td>
                          </tr>
                        ) : (
                          filteredPapers.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: "var(--color-ink-heading)" }}>
                                  {p.title}
                                </div>
                                {p.doi && (
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "var(--color-muted)",
                                      marginTop: "0.2rem",
                                    }}
                                  >
                                    DOI: {p.doi}
                                  </div>
                                )}
                              </td>

                              <td>
                                <div
                                  style={{
                                    fontSize: "0.82rem",
                                    color: "var(--color-ink)",
                                    maxWidth: "200px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                  title={p.authors}
                                >
                                  {p.authors || "Unknown"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--color-muted)",
                                  }}
                                >
                                  Year: {p.year || 2024}
                                </div>
                              </td>

                              <td>
                                <span className="admin-pill-tag">
                                  {p.venue || "arXiv"}
                                </span>
                              </td>

                              <td>
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    color: "var(--color-accent)",
                                  }}
                                >
                                  {p.field || p.fieldId || "General"}
                                </span>
                              </td>

                              <td>
                                <div style={{ fontWeight: 700 }}>
                                  {p.citations?.toLocaleString() || 0}
                                </div>
                                {p.openAccess && (
                                  <span className="badge-oa">
                                    <Check size={11} /> Open Access
                                  </span>
                                )}
                              </td>

                              <td>
                                <div className="admin-row-actions">
                                  {p.pdfUrl && (
                                    <a
                                      href={p.pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="admin-icon-btn"
                                      title="Open PDF Document"
                                    >
                                      <ExternalLink size={14} />
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    className="admin-icon-btn"
                                    title="Edit paper metadata"
                                    onClick={() => setEditingPaper(p)}
                                  >
                                    <Edit2 size={14} />
                                  </button>

                                  <button
                                    type="button"
                                    className="admin-icon-btn danger"
                                    title="Delete paper"
                                    onClick={() =>
                                      setConfirmDelete({
                                        type: "paper",
                                        id: p.id,
                                        name: p.title,
                                      })
                                    }
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: AI VECTOR MICROSERVICE */}
              {activeTab === "ai" && (
                <div>
                  <div className="admin-section-header">
                    <div className="admin-section-title-wrap">
                      <h2>AI Recommendation & Vector Space Diagnostics</h2>
                      <p>
                        Real-time status of the Python FastAPI microservice, TF-IDF embedding matrix, and Cosine similarity pipeline.
                      </p>
                    </div>

                    <div className="admin-section-actions">
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={handleTriggerAiSync}
                        disabled={syncingAi}
                      >
                        <RefreshCw
                          size={15}
                          className={syncingAi ? "animate-spin" : ""}
                        />
                        <span>{syncingAi ? "Re-indexing..." : "Force Index Sync"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Engine Specs */}
                  <div className="ai-diagnostics-card">
                    <div className="ai-engine-status-row">
                      <div>
                        <h3 style={{ margin: 0 }}>
                          Service Health:{" "}
                          <span
                            style={{
                              color: isAiConnected ? "#10b981" : "#f59e0b",
                            }}
                          >
                            {isAiConnected
                              ? "ONLINE & READY"
                              : "STANDALONE FALLBACK"}
                          </span>
                        </h3>
                        <p
                          style={{
                            margin: "0.25rem 0 0",
                            fontSize: "0.85rem",
                            color: "var(--color-muted)",
                          }}
                        >
                          Target Endpoint: <code>http://127.0.0.1:8000/recommend</code>
                        </p>
                      </div>

                      <div
                        className={`admin-health-pill ${
                          isAiConnected ? "healthy" : "fallback"
                        }`}
                      >
                        <span className="admin-pulse-dot" />
                        <span>
                          {isAiConnected ? "Connected" : "Fallback Active"}
                        </span>
                      </div>
                    </div>

                    <div className="ai-spec-grid">
                      <div className="ai-spec-box">
                        <span className="ai-spec-label">Indexed Papers</span>
                        <span className="ai-spec-value">
                          {toText(aiStatus?.indexedPapersCount, String(papers.length))}
                        </span>
                      </div>

                      <div className="ai-spec-box">
                        <span className="ai-spec-label">Vector Space Matrix</span>
                        <span className="ai-spec-value">
                          {Array.isArray(aiStatus?.vectorSpaceDim)
                            ? `${aiStatus.vectorSpaceDim[0]} × ${aiStatus.vectorSpaceDim[1]}`
                            : `${papers.length} × 1024`}
                        </span>
                      </div>

                      <div className="ai-spec-box">
                        <span className="ai-spec-label">Algorithm</span>
                        <span className="ai-spec-value">TF-IDF + Cosine</span>
                      </div>

                      <div className="ai-spec-box">
                        <span className="ai-spec-label">Inference Latency</span>
                        <span className="ai-spec-value">
                          {aiStatus?.latencyMs ? `${aiStatus.latencyMs} ms` : "< 15 ms"}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: "0.88rem", color: "var(--color-muted)", margin: 0 }}>
                      The AI recommendation microservice executes content-based semantic filtering over paper titles, abstracts, methodology keywords, and venue descriptors. When a researcher explores literature, embeddings are projected into an n-dimensional vector space to return accurate academic recommendations.
                    </p>
                  </div>

                  {/* Live Similarity Tester */}
                  <div className="admin-panel-card">
                    <h3>Interactive Vector Similarity Tester</h3>
                    <p
                      style={{
                        fontSize: "0.88rem",
                        color: "var(--color-muted)",
                        marginTop: 0,
                      }}
                    >
                      Select any paper from the corpus to test semantic similarity output:
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginBottom: "1.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <select
                        className="admin-filter-select"
                        style={{ flex: 1, minWidth: "min(300px, 100%)" }}
                        value={testPaperId}
                        onChange={(e) => setTestPaperId(e.target.value)}
                      >
                        <option value="">Select target paper...</option>
                        {papers.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.id}] {p.title} ({p.venue || p.year})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className="button button-primary"
                        onClick={handleRunSimilarityTest}
                        disabled={!testPaperId || testRunning}
                      >
                        <Sparkles size={15} />
                        <span>
                          {testRunning ? "Computing Vectors..." : "Test Similarity"}
                        </span>
                      </button>
                    </div>

                    {/* Results Display */}
                    {testResults && (
                      <div
                        style={{
                          background: "var(--theme-section-alt)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "14px",
                          padding: "1.25rem",
                        }}
                      >
                        <h4 style={{ margin: "0 0 1rem 0" }}>
                          AI Match Results ({testResults.length} similar papers)
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                          }}
                        >
                          {testResults.map((rec, i) => (
                            <div
                              key={rec.paper?.id || i}
                              style={{
                                background: "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "10px",
                                padding: "0.95rem 1.15rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "1rem",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {rec.paper?.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "var(--color-muted)",
                                    marginTop: "0.2rem",
                                  }}
                                >
                                  {rec.reason || "High vector cosine overlap"}
                                </div>
                              </div>

                              <span
                                style={{
                                  padding: "0.3rem 0.75rem",
                                  borderRadius: "9999px",
                                  background: "rgba(124, 58, 237, 0.12)",
                                  color: "var(--color-accent)",
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {rec.matchPercentage ||
                                  `${Math.round(rec.score * 100)}% Match`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: AUDIT & LOGS */}
              {activeTab === "logs" && (
                <div>
                  <div className="admin-section-header">
                    <div className="admin-section-title-wrap">
                      <h2>System Audit Trail & Security Logs</h2>
                      <p>
                        Immutable timeline of user authentication, catalog updates, cryptographic validations, and vector synchronization events.
                      </p>
                    </div>

                    <div className="admin-section-actions">
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={handleExportAuditReport}
                      >
                        <Download size={15} />
                        <span>Export Logs JSON</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Bar */}
                  <div className="admin-filter-bar">
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {["ALL", "INFO", "SUCCESS", "WARN", "SECURITY"].map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          className={`admin-tab-btn ${
                            logFilter === sev ? "active" : ""
                          }`}
                          onClick={() => setLogFilter(sev)}
                        >
                          <span>{sev}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Log stream */}
                  <div className="admin-logs-stream">
                    {filteredLogs.map((item) => (
                      <div key={item.id} className="admin-log-item">
                        <span
                          className={`log-severity-pill ${
                            item.severity || "INFO"
                          }`}
                        >
                          {item.severity || "INFO"}
                        </span>
                        <div className="admin-log-content">
                          <div className="admin-log-title">{toText(item.title)}</div>
                          <div className="admin-log-detail">{toText(item.detail)}</div>
                        </div>
                        <span className="admin-log-time">
                          {new Date(item.time).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* TAB 6: CHATBOT QUERIES */}
              {activeTab === "chat" && (
                <div>
                  <div className="admin-section-header">
                    <div className="admin-section-title-wrap">
                      <h2>NestAI Chatbot Queries</h2>
                      <p>
                        Every question researchers ask the NestAI Copilot, with who asked, when, and how it was answered.
                      </p>
                    </div>

                    <div className="admin-section-actions">
                      <span
                        className="admin-health-pill healthy"
                        title="This list refreshes automatically every 5 seconds"
                      >
                        <span className="admin-pulse-dot" />
                        <span>Live · every 5s</span>
                      </span>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={handleRefreshChatQueries}
                      >
                        <RefreshCw size={15} />
                        <span>Refresh</span>
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={handleExportChatQueries}
                        disabled={chatQueries.length === 0}
                      >
                        <Download size={15} />
                        <span>Export JSON</span>
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={handleClearChatQueries}
                        disabled={chatQueries.length === 0}
                      >
                        <Trash2 size={15} />
                        <span>Clear Log</span>
                      </button>
                    </div>
                  </div>

                  <div className="admin-filter-bar">
                    <div className="admin-search-wrap">
                      <Search size={16} style={{ color: "var(--color-muted)" }} />
                      <input
                        type="search"
                        className="admin-search-input"
                        placeholder="Search by question text, user name, email, or intent..."
                        value={chatSearch}
                        onChange={(e) => setChatSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Asked By</th>
                          <th style={{ width: "45%" }}>Question</th>
                          <th>Intent</th>
                          <th>Answered By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredChatQueries.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              style={{
                                textAlign: "center",
                                padding: "3rem",
                                color: "var(--color-muted)",
                              }}
                            >
                              {chatQueries.length === 0
                                ? "No chatbot queries recorded yet. Questions asked in NestAI will appear here."
                                : "No queries match the search."}
                            </td>
                          </tr>
                        ) : (
                          filteredChatQueries.map((c) => (
                            <tr key={c.id}>
                              <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                                {c.time ? new Date(c.time).toLocaleString() : "—"}
                              </td>
                              <td>
                                <div className="user-cell-details">
                                  <span className="user-cell-name">{c.userName}</span>
                                  <span className="user-cell-email">{c.userEmail}</span>
                                </div>
                              </td>
                              <td style={{ fontWeight: 600, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {c.query}
                              </td>
                              <td>
                                <span className="admin-pill-tag">{c.intent || "general"}</span>
                              </td>
                              <td>
                                <span className="badge-provider">
                                  {c.source === "AI_SERVICE"
                                    ? "AI Engine"
                                    : c.source === "FALLBACK"
                                    ? "Built-in"
                                    : c.source || "—"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* MODAL: PROVISION NEW USER */}
      {showCreateUserModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowCreateUserModal(false)}
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>
                <Users size={18} />
                <span>Provision New User Account</span>
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowCreateUserModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dr. Jane Doe"
                  value={userFormData.name}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, name: e.target.value })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Academic / Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="jane.doe@university.edu"
                  value={userFormData.email}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, email: e.target.value })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Initial Password * (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={userFormData.password}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      password: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>System Role *</label>
                <select
                  value={userFormData.role}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, role: e.target.value })
                  }
                >
                  <option value="RESEARCHER">Researcher</option>
                  <option value="ADMIN">Platform Administrator</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Institution / Affiliation</label>
                <input
                  type="text"
                  placeholder="e.g., MIT, Stanford, Harvard"
                  value={userFormData.institution}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      institution: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Department / Laboratory</label>
                <input
                  type="text"
                  placeholder="e.g., Department of Physics"
                  value={userFormData.department}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      department: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowCreateUserModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div
          className="admin-modal-overlay"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>
                <Edit2 size={18} />
                <span>Edit User Account</span>
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setEditingUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingUser.name || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  required
                  value={editingUser.email || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Role</label>
                <select
                  value={editingUser.role || "RESEARCHER"}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value })
                  }
                >
                  <option value="RESEARCHER">Researcher</option>
                  <option value="ADMIN">Platform Administrator</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Institution</label>
                <input
                  type="text"
                  value={editingUser.institution || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      institution: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={editingUser.department || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      department: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PAPER */}
      {showCreatePaperModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowCreatePaperModal(false)}
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>
                <BookOpen size={18} />
                <span>Add Research Paper to Catalog</span>
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowCreatePaperModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreatePaperSubmit}
              className="admin-modal-form"
            >
              <div className="admin-form-group">
                <label>Paper Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Attention Is All You Need"
                  value={paperFormData.title}
                  onChange={(e) =>
                    setPaperFormData({
                      ...paperFormData,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Authors * (Comma separated)</label>
                <input
                  type="text"
                  required
                  placeholder="Ashish Vaswani, Noam Shazeer, Niki Parmar, et al."
                  value={paperFormData.authors}
                  onChange={(e) =>
                    setPaperFormData({
                      ...paperFormData,
                      authors: e.target.value,
                    })
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="admin-form-group">
                  <label>Year</label>
                  <input
                    type="number"
                    value={paperFormData.year}
                    onChange={(e) =>
                      setPaperFormData({
                        ...paperFormData,
                        year: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label>Venue / Conference</label>
                  <input
                    type="text"
                    placeholder="NeurIPS, ICML, Nature..."
                    value={paperFormData.venue}
                    onChange={(e) =>
                      setPaperFormData({
                        ...paperFormData,
                        venue: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="admin-form-group">
                  <label>Academic Field</label>
                  <input
                    type="text"
                    placeholder="e.g., Natural Language Processing"
                    value={paperFormData.field}
                    onChange={(e) =>
                      setPaperFormData({
                        ...paperFormData,
                        field: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label>Field Identifier (Slug)</label>
                  <input
                    type="text"
                    placeholder="ai, ml, neuro, quantum..."
                    value={paperFormData.fieldId}
                    onChange={(e) =>
                      setPaperFormData({
                        ...paperFormData,
                        fieldId: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>DOI / ArXiv ID</label>
                <input
                  type="text"
                  placeholder="10.48550/arXiv.1706.03762"
                  value={paperFormData.doi}
                  onChange={(e) =>
                    setPaperFormData({ ...paperFormData, doi: e.target.value })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Direct PDF URL</label>
                <input
                  type="url"
                  placeholder="https://arxiv.org/pdf/1706.03762.pdf"
                  value={paperFormData.pdfUrl}
                  onChange={(e) =>
                    setPaperFormData({
                      ...paperFormData,
                      pdfUrl: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Abstract</label>
                <textarea
                  rows={4}
                  placeholder="Executive scientific abstract of the paper..."
                  value={paperFormData.abstractText}
                  onChange={(e) =>
                    setPaperFormData({
                      ...paperFormData,
                      abstractText: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Key Takeaways (One takeaway per line)</label>
                <textarea
                  rows={3}
                  placeholder="• Introduces transformer architecture\n• Eliminates recurrent and convolutional networks\n• Scales sequence modeling"
                  value={paperFormData.takeaways}
                  onChange={(e) =>
                    setPaperFormData({
                      ...paperFormData,
                      takeaways: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowCreatePaperModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Add Paper to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PAPER */}
      {editingPaper && (
        <div
          className="admin-modal-overlay"
          onClick={() => setEditingPaper(null)}
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>
                <Edit2 size={18} />
                <span>Edit Paper Metadata</span>
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setEditingPaper(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleUpdatePaperSubmit}
              className="admin-modal-form"
            >
              <div className="admin-form-group">
                <label>Title *</label>
                <input
                  type="text"
                  required
                  value={editingPaper.title || ""}
                  onChange={(e) =>
                    setEditingPaper({ ...editingPaper, title: e.target.value })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Authors *</label>
                <input
                  type="text"
                  required
                  value={editingPaper.authors || ""}
                  onChange={(e) =>
                    setEditingPaper({
                      ...editingPaper,
                      authors: e.target.value,
                    })
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="admin-form-group">
                  <label>Year</label>
                  <input
                    type="number"
                    value={editingPaper.year || 2024}
                    onChange={(e) =>
                      setEditingPaper({ ...editingPaper, year: e.target.value })
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label>Venue</label>
                  <input
                    type="text"
                    value={editingPaper.venue || ""}
                    onChange={(e) =>
                      setEditingPaper({
                        ...editingPaper,
                        venue: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="admin-form-group">
                  <label>Field Name</label>
                  <input
                    type="text"
                    value={editingPaper.field || ""}
                    onChange={(e) =>
                      setEditingPaper({
                        ...editingPaper,
                        field: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label>Field ID Slug</label>
                  <input
                    type="text"
                    value={editingPaper.fieldId || ""}
                    onChange={(e) =>
                      setEditingPaper({
                        ...editingPaper,
                        fieldId: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Citations Count</label>
                <input
                  type="number"
                  value={editingPaper.citations || 0}
                  onChange={(e) =>
                    setEditingPaper({
                      ...editingPaper,
                      citations: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-form-group">
                <label>Abstract</label>
                <textarea
                  rows={4}
                  value={editingPaper.abstract || editingPaper.abstractText || ""}
                  onChange={(e) =>
                    setEditingPaper({
                      ...editingPaper,
                      abstract: e.target.value,
                      abstractText: e.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setEditingPaper(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div
          className="admin-modal-overlay"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="admin-modal-card"
            style={{ maxWidth: "440px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3 style={{ color: "#dc2626" }}>
                <AlertTriangle size={18} />
                <span>Confirm Deletion</span>
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setConfirmDelete(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <p style={{ margin: "0 0 1.25rem 0", color: "var(--color-ink)" }}>
                Are you sure you want to permanently delete this {confirmDelete.type}?
              </p>
              <div
                style={{
                  padding: "0.85rem 1rem",
                  background: "var(--theme-section-alt)",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  marginBottom: "1.5rem",
                }}
              >
                "{confirmDelete.name}"
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={{
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "10px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={handleDeleteConfirmed}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

