import { useEffect, useState } from "react";
import { BookOpen, Moon, Sun } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

export default function BrandHeader() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("researchnest_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
      }
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

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <header className="public-header">
      <div className="public-header-inner">
        <NavLink className="public-brand" to="/" aria-label="ResearchNest home">
          <span className="public-brand-mark" aria-hidden="true">
            <BookOpen size={22} strokeWidth={2.2} />
          </span>
          <span className="public-brand-name">ResearchNest</span>
        </NavLink>

        <nav className="public-nav" aria-label="Main navigation">
          <div className="public-nav-links">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/about">
              About
            </NavLink>
            <NavLink to="/contact">
              Contact
            </NavLink>
          </div>

          <div className="public-nav-actions">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              title={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
            >
              {theme === "dark" ? (
                <>
                  <Sun size={17} aria-hidden="true" />
                  <span className="theme-toggle-text">Light</span>
                </>
              ) : (
                <>
                  <Moon size={17} aria-hidden="true" />
                  <span className="theme-toggle-text">Dark</span>
                </>
              )}
            </button>

            <Link className="nav-sign-in" to="/auth?mode=login">
              Sign In
            </Link>
            <Link
              className="button button-primary nav-get-started"
              to="/auth?mode=register"
            >
              Get started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
