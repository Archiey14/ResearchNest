import { Link, useParams } from "react-router-dom";
import { legalDrafts } from "../data/legalDrafts.js";

export default function LegalPage() {
  const { document } = useParams();
  const page = legalDrafts[document];

  if (!page) {
    return null;
  }

  return (
    <article className="content-page legal-page">
      <p className="draft-label">Draft for project-team review</p>
      <h1>{page.title}</h1>
      <p className="content-lead">{page.summary}</p>
      {page.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <p className="draft-reminder">
        This page is unfinished and must not be treated as an approved policy.
      </p>
      <Link className="text-link" to="/">
        Return home
      </Link>
    </article>
  );
}
