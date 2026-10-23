import { ChevronRight } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

const pageNames = {
  "/workspace": "Dashboard",
  "/workspace/discover": "Discover Papers",
  "/workspace/saved": "Saved Papers",
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const currentPage = pageNames[pathname] ?? "Dashboard";

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="workspace-main">
        <header className="workspace-header">
          <span className="breadcrumb-parent">Workspace</span>
          <ChevronRight aria-hidden="true" size={20} strokeWidth={2.5} />
          <span className="breadcrumb-current" aria-current="page">
            {currentPage}
          </span>
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
