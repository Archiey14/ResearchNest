import { Bookmark, BookOpen, Compass, LayoutDashboard } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSavedCount } from "../services/savedPapersStore.js";

export default function Sidebar() {
  const [savedCount, setSavedCount] = useState(() => getSavedCount());

  useEffect(() => {
    function onUpdate(e) {
      if (e?.detail && typeof e.detail.count === "number") {
        setSavedCount(e.detail.count);
      } else {
        setSavedCount(getSavedCount());
      }
    }
    window.addEventListener("researchnest:saved_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("researchnest:saved_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const navigationItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/workspace" },
    { label: "Discover Papers", icon: Compass, to: "/workspace/discover" },
    { label: "Saved Papers", icon: Bookmark, to: "/workspace/saved", count: savedCount > 0 ? savedCount : undefined },
  ];
  return (
    <aside className="sidebar" aria-label="Researchly workspace">
      <NavLink className="brand" to="/workspace" aria-label="ResearchNest dashboard">
        <span className="brand-mark" aria-hidden="true">
          <BookOpen size={36} strokeWidth={2.2} />
        </span>
        <span className="brand-name">researchly</span>
      </NavLink>

      <div className="workspace-selector" aria-label="Personal workspace, Free plan">
        <span className="avatar" aria-hidden="true">
          AJ
        </span>
        <span className="workspace-details">
          <span className="workspace-name">Personal workspace</span>
          <span className="workspace-plan">Free plan</span>
        </span>
        <span className="selector-arrows" aria-hidden="true">
          <span />
          <span />
        </span>
      </div>

      <nav className="workspace-nav" aria-label="Workspace">
        <p className="nav-heading">Workspace</p>
        <ul className="nav-list">
          {navigationItems.map(({ label, icon: Icon, to, count }) => (
            <li key={label}>
              <NavLink
                className={({ isActive }) =>
                  `nav-item${isActive ? " nav-item-active" : ""}`
                }
                to={to}
                end={to === "/workspace"}
              >
                <Icon aria-hidden="true" size={27} strokeWidth={2} />
                <span>{label}</span>
                {count && <span className="nav-count">{count}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
