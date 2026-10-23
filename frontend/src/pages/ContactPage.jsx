import { Link } from "react-router-dom";

export default function ContactPage() {
  return (
    <article className="content-page">
      <p className="section-kicker">Contact</p>
      <h1>Get in touch with the ResearchNest team.</h1>
      <p className="content-lead">
        The project team has not provided a public contact address yet. Contact
        details will be added here once they are confirmed.
      </p>
      <Link className="text-link" to="/">
        Return home
      </Link>
    </article>
  );
}
