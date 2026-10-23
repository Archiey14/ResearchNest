import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Link className="footer-brand" to="/">
          ResearchNest
        </Link>
        <p className="footer-note">
          Helping the research community find its next question.
        </p>
        <nav aria-label="Legal and contact">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/security">Security</Link>
          <Link to="/terms">Terms and Conditions</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <p className="footer-copyright">
          © {new Date().getFullYear()} ResearchNest. Project preview.
        </p>
      </div>
    </footer>
  );
}
