import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const location = useLocation();
  const next = encodeURIComponent(location.pathname);

  return (
    <Navigate
      to={`/auth?mode=login&next=${next}`}
      replace
      state={{ from: location }}
    />
  );
}
