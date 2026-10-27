import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-top-row">
          <div className="footer-brand-col">
            <Link className="footer-brand" to="/" aria-label="ResearchNest home">
              <span className="footer-brand-icon" aria-hidden="true">
                <BookOpen size={18} strokeWidth={2.4} />
              </span>
              <span className="footer-brand-name">ResearchNest</span>
            </Link>
            <p className="footer-note">
              Helping the academic and research community discover, organize, and elevate scientific literature.
            </p>
          </div>

          <nav className="footer-nav" aria-label="Legal and contact">
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/security">Security</Link>
            <Link to="/terms">Terms & Conditions</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </div>

        <div className="footer-bottom-row">
          <p className="footer-copyright">
            © {new Date().getFullYear()} ResearchNest. Project preview.
          </p>
          <div className="footer-status-badge">
            <span className="status-indicator-dot" aria-hidden="true" />
            <span>Platform Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

