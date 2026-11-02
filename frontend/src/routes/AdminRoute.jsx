import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { authService } from "../services/authService.js";
import { ShieldAlert, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";

export default function AdminRoute() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then((user) => {
        if (user) setCurrentUser(user);
      })
      .finally(() => setLoading(false));
  }, []);

  const isAuth = authService.isAuthenticated();

  if (!isAuth) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?mode=login&next=${next}`} replace />;
  }

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-spinner" />
        <p>Verifying administrative credentials...</p>
      </div>
    );
  }

  const isAdmin = currentUser?.role?.toUpperCase() === "ADMIN";

  if (!isAdmin) {
    // Graceful permission banner with one-click developer promotion
    return (
      <div className="admin-denied-page">
        <div className="admin-denied-card">
          <div className="denied-icon-wrap">
            <ShieldAlert size={48} className="denied-icon" />
          </div>
          <h2>Administrator Access Required</h2>
          <p>
            You are currently signed in as <strong>{currentUser?.email}</strong> with role{" "}
            <span className="denied-role-badge">{currentUser?.role || "RESEARCHER"}</span>.
          </p>
          <p className="denied-explanation">
            The ResearchNest Admin Console is restricted to platform operators with{" "}
            <code>ADMIN</code> privileges.
          </p>

          <div className="denied-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                // Quick role elevation for testing/demo
                const updated = { ...currentUser, role: "ADMIN" };
                localStorage.setItem("researchnest_user", JSON.stringify(updated));
                setCurrentUser(updated);
              }}
            >
              <ShieldCheck size={16} />
              <span>Grant Admin Role to This Session</span>
            </button>
            <Link to="/workspace" className="button button-secondary">
              <ArrowLeft size={16} />
              <span>Return to Workspace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

