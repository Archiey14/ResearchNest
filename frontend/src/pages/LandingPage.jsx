import {
  ArrowRight,
  Bookmark,
  BookOpen,
  FileText,
  Search,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Search,
    title: "Discover relevant research",
    description:
      "Explore academic papers by the questions, topics, and authors that matter to your work.",
  },
  {
    icon: Sparkles,
    title: "Personalized recommendations",
    description:
      "Find papers selected to align with your interests as the recommendation experience develops.",
  },
  {
    icon: Waypoints,
    title: "Find similar papers",
    description:
      "Follow connections from one useful paper to related work and new perspectives.",
  },
  {
    icon: FileText,
    title: "Get the key ideas",
    description:
      "Review concise paper summaries designed to help you decide what to read in depth.",
  },
  {
    icon: Bookmark,
    title: "Build saved collections",
    description:
      "Keep important papers organized so they are easier to revisit during your research.",
  },
];

const steps = [
  {
    number: "01",
    title: "Start with a question",
    description: "Describe a subject, topic, keyword, or author you want to explore.",
  },
  {
    number: "02",
    title: "Explore the literature",
    description: "Review relevant papers and discover connections across research.",
  },
  {
    number: "03",
    title: "Save what matters",
    description: "Collect papers you want to return to as your work evolves.",
  },
];

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <article className="feature-card">
      <span className="feature-icon" aria-hidden="true">
        <Icon size={23} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="section-kicker">
            <Sparkles aria-hidden="true" size={18} />
            A clearer path through research
          </p>
          <h1 id="hero-heading">
            Find the papers that move your research forward.
          </h1>
          <p className="hero-description">
            ResearchNest is being built to help students, researchers, and
            academics discover relevant literature, explore related work, and
            keep useful papers close at hand.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/auth?mode=login">
              Discover Papers <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <a className="button button-secondary" href="#how-it-works">
              Learn More
            </a>
          </div>
          <p className="preview-note">
            Research discovery features are under development.
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-orbit hero-orbit-one" />
          <span className="hero-orbit hero-orbit-two" />
          <span className="hero-book">
            <BookOpen size={61} strokeWidth={1.5} />
          </span>
          <span className="hero-sparkle hero-sparkle-one">
            <Sparkles size={25} />
          </span>
          <span className="hero-sparkle hero-sparkle-two">
            <Sparkles size={18} />
          </span>
        </div>
      </section>

      <section className="features-section section-wrap" id="about">
        <div className="section-heading">
          <p className="section-kicker">Made for curious minds</p>
          <h2>Research support, from first search to saved paper.</h2>
          <p>
            ResearchNest brings together the discovery tools a research workflow
            needs, in one focused workspace.
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section
        className="how-section section-wrap"
        id="how-it-works"
        aria-labelledby="how-heading"
      >
        <div className="section-heading">
          <p className="section-kicker">How it works</p>
          <h2>From a research question to a reading list.</h2>
          <p>
            A simple intended workflow: search with purpose, explore relevant
            work, and save papers for later.
          </p>
        </div>
        <ol className="steps-grid">
          {steps.map((step) => (
            <li className="step-card" key={step.number}>
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-cta" aria-labelledby="cta-heading">
        <div>
          <p className="section-kicker">Your next question starts somewhere</p>
          <h2 id="cta-heading">Make space for a new discovery.</h2>
        </div>
        <Link className="button button-primary" to="/auth?mode=login">
          Explore Research <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </section>
    </div>
  );
}
