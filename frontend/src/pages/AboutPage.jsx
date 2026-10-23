import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <article className="content-page about-page">
      <p className="section-kicker">About ResearchNest</p>
      <h1>Research discovery should feel more connected.</h1>
      <p className="content-lead">
        ResearchNest is an AI paper recommendation system in development. Its
        goal is to help students, researchers, and academics find relevant
        papers, follow related work, and organize what they want to read.
      </p>
      <p>
        The product is being developed with a dedicated frontend and a separate
        backend. Search, recommendations, summaries, and saved collections
        depend on backend integration and are not presented here as working
        services.
      </p>
      <Link className="text-link" to="/">
        Return home
      </Link>
    </article>
  );
}
