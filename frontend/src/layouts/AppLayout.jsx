import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  Compass,
  ExternalLink,
  FileText,
  FolderPlus,
  Layers,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Quote,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
  X,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { mockStacks } from "../data/mockPapers.js";
import { authService } from "../services/authService.js";

const notificationsList = [
  {
    id: "notif-1",
    title: "Citation Alert",
    desc: "GraphCast weather forecasting was cited in Nature (2026).",
    time: "10m ago",
    unread: true,
  },
  {
    id: "notif-2",
    title: "Reading Streak Milestone",
    desc: "5 days active streak! 2 days remaining to hit your weekly goal.",
    time: "2h ago",
    unread: true,
  },
  {
    id: "notif-3",
    title: "New Landmark Paper",
    desc: "Mamba-2: State Space Duality was added to Foundation Models.",
    time: "1d ago",
    unread: false,
  },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => authService.getStoredUser());
  const [quickSearch, setQuickSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNewStackModal, setShowNewStackModal] = useState(false);
  const [newStackName, setNewStackName] = useState("");
  const [newStackDesc, setNewStackDesc] = useState("");
  const [savedCount, setSavedCount] = useState(24);

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("researchnest_theme");
      if (saved === "dark" || saved === "light") return saved;
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("researchnest_theme", theme);
  }, [theme]);

  useEffect(() => {
    function updateCount(e) {
      if (e && e.detail && typeof e.detail.count === "number") {
        setSavedCount(e.detail.count);
        return;
      }
      const stored = localStorage.getItem("researchnest_saved_ids");
      if (stored) {
        try {
          const arr = JSON.parse(stored);
          setSavedCount(arr.length);
        } catch (err) {}
      }
    }
    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("researchnest:saved_updated", updateCount);
    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("researchnest:saved_updated", updateCount);
    };
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/workspace/discover?q=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch("");
    }
  }

  function handleCreateStack(e) {
    e.preventDefault();
    if (!newStackName.trim()) return;
    const existing = localStorage.getItem("researchnest_user_stacks");
    const stacks = existing ? JSON.parse(existing) : mockStacks;
    const newStack = {
      id: `stack-${Date.now()}`,
      name: newStackName.trim(),
      description: newStackDesc.trim() || "Custom research stack.",
      color: "#7c3aed",
      count: 0,
      icon: "layers",
    };
    const updated = [...stacks, newStack];
    localStorage.setItem("researchnest_user_stacks", JSON.stringify(updated));
    setNewStackName("");
    setNewStackDesc("");
    setShowNewStackModal(false);
    navigate("/workspace/saved");
  }

  function handleSignOut() {
    authService.logout();
    navigate("/login");
  }

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AC";

  const navTabs = [
    { label: "Dashboard", to: "/workspace", icon: LayoutDashboard },
    { label: "Discover", to: "/workspace/discover", icon: Compass },
    { label: "Saved Papers", to: "/workspace/saved", icon: BookOpen, badge: String(savedCount) },
  ];

  return (
    <div className="workspace-ambient-shell">
      {/* Elevated Floating Canvas inspired by SaaSrooms & GATHER */}
      <div className="workspace-canvas-frame">
        {/* Top Floating Navigation Bar */}
        <header className="workspace-top-bar" aria-label="Workspace top bar">
          <div className="workspace-bar-left">
            <Link to="/workspace" className="workspace-brand-link" aria-label="ResearchNest Workspace">
              <span className="workspace-brand-logo" aria-hidden="true">
                <BookOpen size={20} strokeWidth={2.4} />
              </span>
              <span className="workspace-brand-text">ResearchNest</span>
            </Link>

            {/* Pill Navigation Tabs */}
            <nav className="workspace-pill-nav" aria-label="Workspace navigation">
              {navTabs.map(({ label, to, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/workspace"}
                  className={({ isActive }) =>
                    `workspace-nav-pill ${isActive ? "workspace-nav-pill-active" : ""}`
                  }
                >
                  <span>{label}</span>
                  {badge && <span className="workspace-pill-count">{badge}</span>}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Conversational Search Pill matching Reference */}
          <form
            className="workspace-quick-search-form"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <Sparkles size={15} className="quick-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="quick-search-input"
              placeholder="Ask anything or search papers..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              aria-label="Ask or search research"
            />
            <button type="submit" className="quick-search-send-btn" aria-label="Explore search">
              <span>Send</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </button>
          </form>

          {/* Right Action Tools */}
          <div className="workspace-bar-right">
            <button
              type="button"
              className="workspace-action-btn"
              onClick={() => setShowNewStackModal(true)}
              title="Create a new research stack"
            >
              <Plus size={15} aria-hidden="true" />
              <span>New Stack</span>
            </button>

            {/* Notifications Popover */}
            <div className="popover-wrapper" ref={notifRef}>
              <button
                type="button"
                className={`workspace-icon-button ${showNotifications ? "icon-btn-active" : ""}`}
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                  setShowProfileMenu(false);
                }}
                title="Notifications"
                aria-label="3 notifications"
              >
                <Bell size={17} aria-hidden="true" />
                <span className="workspace-notif-dot">3</span>
              </button>

              {showNotifications && (
                <div className="dropdown-popover notif-popover">
                  <div className="popover-head">
                    <h4>Notifications</h4>
                    <span className="notif-badge-pill">3 new</span>
                  </div>
                  <div className="notif-list">
                    {notificationsList.map((n) => (
                      <div key={n.id} className={`notif-item ${n.unread ? "notif-unread" : ""}`}>
                        <div className="notif-title-row">
                          <span className="notif-title">{n.title}</span>
                          <span className="notif-time">{n.time}</span>
                        </div>
                        <p className="notif-desc">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="popover-footer">
                    <button
                      type="button"
                      className="popover-action-link"
                      onClick={() => setShowNotifications(false)}
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              className="workspace-icon-button theme-toggle-icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? (
                <Sun size={17} aria-hidden="true" />
              ) : (
                <Moon size={17} aria-hidden="true" />
              )}
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="popover-wrapper" ref={profileRef}>
              <div
                className="workspace-profile-pill"
                onClick={() => {
                  setShowProfileMenu((prev) => !prev);
                  setShowNotifications(false);
                }}
                role="button"
                tabIndex={0}
              >
                <span className="profile-avatar" aria-hidden="true">
                  {initials}
                </span>
                <span className="profile-name">{currentUser?.name || "Alex Chen"}</span>
                <ChevronDown size={14} className="profile-chevron" aria-hidden="true" />
              </div>

              {showProfileMenu && (
                <div className="dropdown-popover profile-popover">
                  <div className="profile-popover-header">
                    <span className="profile-avatar large-avatar">{initials}</span>
                    <div className="profile-meta-text">
                      <strong className="profile-full-name">{currentUser?.name || "Alex Chen"}</strong>
                      <span className="profile-email">{currentUser?.email || "alex.chen@stanford.edu"}</span>
                      <span className="profile-role">
                        {currentUser?.department || "AI Lab"} · {currentUser?.institution || "Stanford University"}
                      </span>
                    </div>
                  </div>
                  <div className="profile-stats-strip">
                    <div className="profile-stat-box">
                      <span className="pstat-num">{savedCount}</span>
                      <span className="pstat-lbl">Saved</span>
                    </div>
                    <div className="profile-stat-box">
                      <span className="pstat-num">18</span>
                      <span className="pstat-lbl">Reviewed</span>
                    </div>
                    <div className="profile-stat-box">
                      <span className="pstat-num">5</span>
                      <span className="pstat-lbl">Streak</span>
                    </div>
                  </div>
                  <div className="popover-links-list">
                    <Link
                      to="/workspace/saved"
                      className="popover-menu-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <BookOpen size={15} />
                      <span>My Collections</span>
                    </Link>
                    <Link
                      to="/workspace/discover"
                      className="popover-menu-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Compass size={15} />
                      <span>Literature Explorer</span>
                    </Link>
                  </div>
                  <div className="popover-footer">
                    <button
                      type="button"
                      className="profile-logout-btn"
                      onClick={handleSignOut}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Back to Public Site Link */}
            <Link
              to="/"
              className="workspace-exit-btn"
              title="Exit to ResearchNest home"
              aria-label="Exit workspace to website"
            >
              <LogOut size={16} aria-hidden="true" />
            </Link>
          </div>
        </header>

        {/* Inner Canvas Content */}
        <main className="workspace-canvas-content">
          <Outlet />
        </main>
      </div>

      {/* New Stack Modal */}
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
                <label htmlFor="top-stack-name">Stack Name</label>
                <input
                  id="top-stack-name"
                  type="text"
                  placeholder="e.g., Quantum Machine Learning 2026"
                  required
                  value={newStackName}
                  onChange={(e) => setNewStackName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="top-stack-desc">Description / Focus Area</label>
                <textarea
                  id="top-stack-desc"
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
