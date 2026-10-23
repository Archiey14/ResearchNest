const workspaceSections = {
  discover: {
    heading: "Discover Papers",
    message:
      "Paper discovery is not connected yet. Search and research results require the backend API contract.",
  },
  saved: {
    heading: "Saved Papers",
    message:
      "Saved-paper collections are not connected yet. Their data and behavior require the backend API contract.",
  },
};

export default function WorkspacePlaceholderPage({ section }) {
  const content = workspaceSections[section];

  return (
    <section className="workspace-placeholder" aria-labelledby="workspace-heading">
      <p className="section-kicker">Research workspace</p>
      <h1 id="workspace-heading">{content.heading}</h1>
      <p>{content.message}</p>
    </section>
  );
}
