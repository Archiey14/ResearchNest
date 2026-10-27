import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
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
    accent: "cyan",
  },
  {
    icon: Bookmark,
    title: "Save What Matters",
    description:
      "Keep pivotal studies, key findings, and references close at hand. Save papers with a single click and access them anytime in your workspace.",
    badge: "Personal Library",
    accent: "orchid",
  },
  {
    icon: Layers,
    title: "Organize with Collections",
    description:
      "Group papers by project, subject, or course. Build structured bibliographies that keep your research workflow organized and focused.",
    badge: "Custom Stacks",
    accent: "peach",
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
              <Sparkles aria-hidden="true" size={15} />
              <span>Next-Gen Academic Discovery</span>
            </p>
            <h1 id="hero-heading" className="hero-title">
              Discover Research That <span className="hero-title-highlight">Feels Alive</span>
            </h1>
            <p className="hero-description">
              Step into an elevated scholarly workspace. Search peer-reviewed literature across disciplines, uncover breakthroughs with conversational AI, and curate your personal research stack.
            </p>

            {/* Conversational Search Box matching Reference */}
            <form
              className="hero-search-form"
              onSubmit={handleSearchSubmit}
              role="search"
              aria-label="Literature discovery search"
            >
              <div className="hero-search-bar">
                <Sparkles className="hero-search-icon" size={19} aria-hidden="true" />
                <input
                  type="text"
                  className="hero-search-input"
                  placeholder="✦ Ask anything you need or explore topics (e.g., Quantum Computing)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search research papers"
                />
                <button
                  type="submit"
                  className="hero-search-btn"
                  aria-label="Discover papers"
                >
                  <span>Send</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </button>
              </div>
              <p className="hero-search-hint">
                <Sparkles size={14} aria-hidden="true" />
                <span>
                  Real-time semantic literature synthesis powered by academic neural embeddings.
                </span>
              </p>
            </form>

            {/* Popular Topic Chips */}
            <div className="hero-topics-wrapper" aria-label="Popular topics">
              <span className="hero-topics-label">Trending topics:</span>
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

          {/* Realistic Dashboard Preview Canvas matching SaaSrooms & GATHER Aesthetic */}
          <div className="hero-illustration-pane" aria-hidden="true">
            <div className="preview-floating-window">
              {/* Window Header */}
              <div className="preview-window-header">
                <div className="window-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="window-nav-pill">
                  <BookOpen size={13} />
                  <span>ResearchNest · Workspace</span>
                </div>
                <span className="window-badge-live">Live Preview</span>
              </div>

              {/* Warm Greeting matching SaaSrooms */}
              <div className="preview-greeting-row">
                <span className="preview-date-label">Thursday, 26 October · Academic Stack</span>
                <h4 className="preview-greeting-text">
                  Good Evening! <span className="greeting-name-gradient">Alex,</span>
                </h4>
              </div>

              {/* 3 KPI metric chips */}
              <div className="preview-kpi-bar">
                <div className="preview-kpi-item">
                  <div className="kpi-micro-num-wrap">
                    <span className="kpi-micro-num">24</span>
                    <span className="kpi-micro-trend kpi-trend-green">▲ +4</span>
                  </div>
                  <span className="kpi-micro-lbl">Saved Papers</span>
                </div>
                <div className="preview-kpi-item">
                  <div className="kpi-micro-num-wrap">
                    <span className="kpi-micro-num">18</span>
                    <span className="kpi-micro-trend kpi-trend-cyan">▲ 85%</span>
                  </div>
                  <span className="kpi-micro-lbl">Papers Read</span>
                </div>
                <div className="preview-kpi-item">
                  <div className="kpi-micro-num-wrap">
                    <span className="kpi-micro-num">98%</span>
                    <span className="kpi-micro-trend kpi-trend-purple">✦ Match</span>
                  </div>
                  <span className="kpi-micro-lbl">Topic Match</span>
                </div>
              </div>

              {/* Mini Visual Split: Sparkline + Topic Bars */}
              <div className="preview-analytics-mini-grid">
                {/* Mini Sparkline Chart */}
                <div className="preview-chart-box">
                  <div className="preview-chart-head">
                    <span className="chart-micro-title">Reading Activity</span>
                    <span className="chart-micro-pill">Last 6 Mos</span>
                  </div>
                  <svg className="preview-sparkline-svg" viewBox="0 0 160 48">
                    <defs>
                      <linearGradient id="landingCurveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 5 36 Q 30 26, 55 22 T 95 28 T 130 12 T 155 6 L 155 46 L 5 46 Z"
                      fill="url(#landingCurveGrad)"
                    />
                    <path
                      d="M 5 36 Q 30 26, 55 22 T 95 28 T 130 12 T 155 6"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                    <circle cx="155" cy="6" r="3" fill="#8b5cf6" />
                  </svg>
                </div>

                {/* Mini Topic Progress Bars matching SaaSrooms Reference */}
                <div className="preview-topic-bars-box">
                  <span className="chart-micro-title">Topic Distribution</span>
                  <div className="mini-stage-item">
                    <div className="mini-stage-label-row">
                      <span>AI Reasoning</span>
                      <span className="mini-stage-num">14</span>
                    </div>
                    <div className="mini-bar-track">
                      <div className="mini-bar-fill bar-cyan" style={{ width: "80%" }} />
                    </div>
                  </div>
                  <div className="mini-stage-item">
                    <div className="mini-stage-label-row">
                      <span>Neuro Memory</span>
                      <span className="mini-stage-num">9</span>
                    </div>
                    <div className="mini-bar-track">
                      <div className="mini-bar-fill bar-orchid" style={{ width: "55%" }} />
                    </div>
                  </div>
                  <div className="mini-stage-item">
                    <div className="mini-stage-label-row">
                      <span>Quantum Scale</span>
                      <span className="mini-stage-num">6</span>
                    </div>
                    <div className="mini-bar-track">
                      <div className="mini-bar-fill bar-peach" style={{ width: "35%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Curated Paper Card */}
              <article className="preview-paper-card">
                <div className="preview-paper-header">
                  <span className="preview-discipline-badge">
                    <Sparkles size={11} /> Artificial Intelligence
                  </span>
                  <span className="preview-match-badge">98% match</span>
                </div>
                <h5 className="preview-paper-title">
                  Attention Mechanisms in Deep Neural Reasoning
                </h5>
                <p className="preview-paper-author">Vaswani et al. · NeurIPS</p>
                <div className="preview-paper-footer">
                  <span className="preview-cit-count">3.2k citations</span>
                  <span className="preview-read-action">Read Paper →</span>
                </div>
              </article>

              {/* Floating streak pill */}
              <div className="preview-floating-streak">
                <span>🔥 5-Day Reading Streak</span>
              </div>
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
