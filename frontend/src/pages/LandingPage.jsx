import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Bookmark,
  BookOpen,
  FileText,
  Layers,
  Search,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const popularTopics = [
  "Artificial Intelligence",
  "Machine Learning",
  "Climate Science",
  "Neuroscience",
  "Quantum Computing",
];

const featureCards = [
  {
    icon: Search,
    title: "Discover Relevant Papers",
    description:
      "Explore academic papers across disciplines with intelligent search and topic matching designed to pinpoint the literature most relevant to your research goals.",
    badge: "Semantic Search",
  },
  {
    icon: Bookmark,
    title: "Save What Matters",
    description:
      "Keep pivotal studies, key findings, and references close at hand. Save papers with a single click and access them anytime in your workspace.",
    badge: "Personal Library",
  },
  {
    icon: Layers,
    title: "Organize with Collections",
    description:
      "Group papers by project, subject, or course. Build structured bibliographies that keep your research workflow organized and focused.",
    badge: "Custom Stacks",
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "Search or explore",
    description:
      "Start with a research question, concept, or specific field of study to discover relevant papers across disciplines.",
  },
  {
    number: "02",
    title: "Review relevant papers",
    description:
      "Inspect concise abstracts, citation metrics, and open-access previews to evaluate papers in seconds.",
  },
  {
    number: "03",
    title: "Save and organize",
    description:
      "Curate papers into custom collections and seamlessly pick up your reading right where you left off.",
  },
];

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  function handleSearchSubmit(e) {
    e.preventDefault();
    // Real search is protected inside workspace. Guide visitor to login/register flow.
    navigate("/auth?mode=login&next=%2Fworkspace");
  }

  function handleTopicSelect(topic) {
    setSearchQuery(topic);
  }

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero-section" aria-labelledby="hero-heading">
        <div className="landing-hero">
          <div className="hero-copy">
            <p className="section-kicker">
              <Sparkles aria-hidden="true" size={16} />
              Academic Discovery Platform
            </p>
            <h1 id="hero-heading">Discover Research That Inspires You</h1>
            <p className="hero-description">
              Search peer-reviewed literature across disciplines, uncover
              breakthrough connections, and organize the papers that drive your
              academic research forward.
            </p>

            {/* Hero Search Box */}
            <form
              className="hero-search-form"
              onSubmit={handleSearchSubmit}
              role="search"
              aria-label="Literature discovery search"
            >
              <div className="hero-search-bar">
                <Search className="hero-search-icon" size={20} aria-hidden="true" />
                <input
                  type="text"
                  className="hero-search-input"
                  placeholder="Search by topic, paper title, or author (e.g., Quantum Computing)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search research papers"
                />
                <button
                  type="submit"
                  className="button button-primary hero-search-btn"
                  aria-label="Discover papers"
                >
                  <span>Discover</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
              <p className="hero-search-hint">
                <Sparkles size={14} aria-hidden="true" />
                <span>
                  Search connects directly to the discovery workspace upon signing
                  in.
                </span>
              </p>
            </form>

            {/* Popular Topic Chips */}
            <div className="hero-topics-wrapper" aria-label="Popular topics">
              <span className="hero-topics-label">Popular topics:</span>
              <div className="hero-topics-list">
                {popularTopics.map((topic) => {
                  const isSelected = searchQuery === topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      className={`topic-chip ${isSelected ? "topic-chip-active" : ""}`}
                      onClick={() => handleTopicSelect(topic)}
                      aria-pressed={isSelected}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secondary Action */}
            <div className="hero-actions">
              <a className="button button-secondary hero-explore-link" href="#features">
                <span>Explore features</span>
                <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Soft Lavender Research Illustration with Floating Paper Cards */}
          <div className="hero-illustration-pane" aria-hidden="true">
            <div className="orbital-system">
              <span className="orbit-ring orbit-ring-outer" />
              <span className="orbit-ring orbit-ring-middle" />
              <span className="orbit-ring orbit-ring-inner" />

              {/* Central Scientific Hub */}
              <div className="orbit-core-card">
                <div className="orbit-core-icon">
                  <BookOpen size={36} strokeWidth={2} />
                </div>
                <span className="orbit-core-title">ResearchNest</span>
                <span className="orbit-core-sub">Literature Hub</span>
              </div>

              {/* Floating Research Paper Cards */}
              <article className="hero-paper-card hero-paper-card-1">
                <div className="paper-card-pill-row">
                  <span className="paper-card-badge">
                    <Sparkles size={11} aria-hidden="true" />
                    Artificial Intelligence
                  </span>
                  <span className="paper-card-metric">98% match</span>
                </div>
                <h4 className="paper-card-title">
                  Attention Mechanisms in Deep Neural Reasoning
                </h4>
                <p className="paper-card-authors">Vaswani et al. · NeurIPS</p>
              </article>

              <article className="hero-paper-card hero-paper-card-2">
                <div className="paper-card-pill-row">
                  <span className="paper-card-badge">
                    <Bookmark size={11} aria-hidden="true" />
                    Neuroscience
                  </span>
                  <span className="paper-card-saved">Saved</span>
                </div>
                <h4 className="paper-card-title">
                  Cortical Mapping of Semantic Memory
                </h4>
                <p className="paper-card-authors">Chen & Albright · Nature</p>
              </article>

              <article className="hero-paper-card hero-paper-card-3">
                <div className="paper-card-pill-row">
                  <span className="paper-card-badge">
                    <Waypoints size={11} aria-hidden="true" />
                    Quantum Computing
                  </span>
                  <span className="paper-card-oa">Open Access</span>
                </div>
                <h4 className="paper-card-title">
                  Fault-Tolerant Architectures at Scale
                </h4>
                <p className="paper-card-authors">Preskill et al. · Phys. Rev.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section
        className="features-section"
        id="features"
        aria-labelledby="features-heading"
      >
        <div className="section-wrap">
          <div className="section-heading">
            <p className="section-kicker">Built for researchers</p>
            <h2 id="features-heading">
              Tools designed for deep academic work
            </h2>
            <p>
              ResearchNest brings together intelligent discovery tools, seamless
              saving, and custom collections into one distraction-free environment.
            </p>
          </div>

          <div className="feature-grid">
            {featureCards.map(({ icon: Icon, title, description, badge }) => (
              <article className="feature-card" key={title}>
                <div className="feature-card-header">
                  <span className="feature-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={2} />
                  </span>
                  <span className="feature-badge">{badge}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="how-section"
        id="how-it-works"
        aria-labelledby="how-heading"
      >
        <div className="section-wrap">
          <div className="section-heading">
            <p className="section-kicker">How it works</p>
            <h2 id="how-heading">A seamless research workflow</h2>
            <p>
              From finding your first reference to organizing a complete literature
              review in three focused steps.
            </p>
          </div>

          <ol className="steps-grid">
            {workflowSteps.map((step) => (
              <li className="step-card" key={step.number}>
                <div className="step-header">
                  <span className="step-number">{step.number}</span>
                  <span className="step-line" aria-hidden="true" />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Purple Call-to-Action Section */}
      <section className="landing-cta-section" aria-labelledby="cta-heading">
        <div className="section-wrap cta-section-wrap">
          <div className="landing-cta">
            <div className="cta-content">
              <p className="cta-kicker">
                <Sparkles size={16} aria-hidden="true" />
                Make space for a new discovery
              </p>
              <h2 id="cta-heading">Ready to elevate your research workflow?</h2>
              <p className="cta-description">
                Join students, researchers, and academics using ResearchNest to
                discover, evaluate, and organize literature with confidence.
              </p>
            </div>
            <div className="cta-actions">
              <Link className="button button-white" to="/auth?mode=register">
                <span>Get started free</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="button button-ghost-white" to="/auth?mode=login">
                <span>Sign in to workspace</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
