import { BookOpen } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

export default function BrandHeader() {
  return (
    <header className="public-header">
      <div className="public-header-inner">
        <NavLink className="public-brand" to="/" aria-label="ResearchNest home">
          <span className="public-brand-mark" aria-hidden="true">
            <BookOpen size={23} strokeWidth={2} />
          </span>
          <span>ResearchNest</span>
        </NavLink>
        <nav className="public-nav" aria-label="Main navigation">
          <NavLink to="/" end>
            Home
          </NavLink>
          <Link to="/about">About</Link>
          <Link className="nav-sign-in" to="/auth?mode=login">
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}
