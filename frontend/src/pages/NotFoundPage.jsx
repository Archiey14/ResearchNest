import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="welcome-panel" aria-labelledby="not-found-heading">
      <p className="eyebrow">Page not found</p>
      <h1 id="not-found-heading">That page isn’t here.</h1>
      <p className="welcome-copy">
        Return to the ResearchNest home page to continue.
      </p>
      <Link className="text-link" to="/">
        Go home
      </Link>
    </section>
  );
}
