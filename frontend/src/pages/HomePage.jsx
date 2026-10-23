import { Sparkles } from "lucide-react";
import PaperSearch from "../components/PaperSearch.jsx";

export default function HomePage() {
  return (
    <div className="dashboard">
      <section className="welcome-panel" aria-labelledby="welcome-heading">
        <p className="eyebrow">
          <Sparkles aria-hidden="true" size={23} strokeWidth={2.2} />
          <span>A little curiosity. A world of possibilities.</span>
        </p>
        <h1 id="welcome-heading">Discover Research That...</h1>
        <p className="welcome-copy">
          Welcome back, Alex. Your next breakthrough starts with a question.
        </p>
        <PaperSearch />
      </section>
    </div>
  );
}
