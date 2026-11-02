import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authService } from "../services/authService.js";

export default function ProtectedRoute() {
  const location = useLocation();
  const isAuth = authService.isAuthenticated();

  if (!isAuth) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?mode=login&next=${next}`} replace />;
  }

  return <Outlet />;
}
