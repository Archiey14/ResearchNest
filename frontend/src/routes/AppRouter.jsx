import { BrowserRouter, Route, Routes } from "react-router-dom";
import AboutPage from "../pages/AboutPage.jsx";
import AuthPage from "../pages/AuthPage.jsx";
import ContactPage from "../pages/ContactPage.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import LegalPage from "../pages/LegalPage.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import HomePage from "../pages/HomePage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import WorkspacePlaceholderPage from "../pages/WorkspacePlaceholderPage.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="privacy" element={<LegalPage />} />
          <Route path="security" element={<LegalPage />} />
          <Route path="terms" element={<LegalPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="workspace" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route
              path="discover"
              element={<WorkspacePlaceholderPage section="discover" />}
            />
            <Route
              path="saved"
              element={<WorkspacePlaceholderPage section="saved" />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
