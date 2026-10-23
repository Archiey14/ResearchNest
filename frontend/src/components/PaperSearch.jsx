import { Search } from "lucide-react";
import { useState } from "react";

export default function PaperSearch() {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (query.trim()) {
      setMessage("Search is a preview and is not connected yet.");
    }
  }

  return (
    <div className="search-area">
      <form className="paper-search" role="search" onSubmit={handleSubmit}>
        <Search className="search-icon" aria-hidden="true" size={32} />
        <label className="visually-hidden" htmlFor="paper-search-input">
          Search papers, topics, keywords, or authors
        </label>
        <input
          id="paper-search-input"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setMessage("");
          }}
          placeholder="Search papers, topics, keywords, or authors..."
        />
        <button className="search-submit" type="submit">
          Search
        </button>
      </form>
      <p className="search-caption" aria-live="polite">
        {message || "AI-powered discovery preview · Search is not connected"}
      </p>
    </div>
  );
}
