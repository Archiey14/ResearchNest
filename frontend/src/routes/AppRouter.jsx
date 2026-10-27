import { BrowserRouter, Route, Routes } from "react-router-dom";
import AboutPage from "../pages/AboutPage.jsx";
import AuthPage from "../pages/AuthPage.jsx";
import ContactPage from "../pages/ContactPage.jsx";
import DiscoverPage from "../pages/DiscoverPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import LegalPage from "../pages/LegalPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import SavedPapersPage from "../pages/SavedPapersPage.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="auth" element={<AuthPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="signup" element={<AuthPage />} />
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="privacy" element={<LegalPage />} />
          <Route path="security" element={<LegalPage />} />
          <Route path="terms" element={<LegalPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="workspace" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="saved" element={<SavedPapersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
