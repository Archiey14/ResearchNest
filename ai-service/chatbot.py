"""
NestAI Scholarly Chatbot & RAG Assistant for ResearchNest.

Provides conversational intelligence for:
1. Platform Guide: Explains recommendation algorithms, reading duration tracking,
   Rocchio active feedback, research stacks, BibTeX export, and live harvesting.
2. Scholarly Q&A & Semantic Literature Search: Grounded RAG (Retrieval-Augmented
   Generation) using the indexed TF-IDF vector space over real scientific papers.
3. Paper Recommendations: Recommends relevant literature from user conversational queries.
"""

import re
from typing import Dict, List, Any, Optional
from sklearn.metrics.pairwise import cosine_similarity


PLATFORM_KNOWLEDGE = {
    "recommendation_algorithm": (
        "**ResearchNest's Hybrid Recommendation Engine** combines 4 distinct signals to surface relevant literature:\n\n"
        "1. **Semantic Content Matching:** Generates a TF-IDF vector space over paper titles, abstracts, author keywords, and taxonomy tags. Computes cosine similarity against the researcher's profile vector.\n"
        "2. **Logarithmic Citation Impact:** Applies $0.15 \\times \\log(1 + \\text{citations})$ to balance landmark foundation papers with recent breakthroughs without popular-paper bias.\n"
        "3. **Exponential Recency Decay:** Applies $\\exp(-0.065 \\times \\Delta\\text{years})$ so fresh preprints stay competitive with older high-citation classics.\n"
        "4. **Rocchio Active Relevance Feedback:** Steers user preferences dynamically:\n"
        "   - **Liked Papers (👍):** Weighted heavily ($2.5\\times$) as positive preference anchors.\n"
        "   - **Saved Papers (🔖):** Weighted at $1.0\\times$.\n"
        "   - **Deep Reading Sessions:** Papers read for $\\ge 120$s receive an extra $+1.0\\times$ anchor weight.\n"
        "   - **Disliked/Dismissed Papers (👎):** Subtracted as negative vectors ($v_{\\text{user}} = 1.0 \\cdot v_{\\text{pos}} - 0.45 \\cdot v_{\\text{neg}}$) with non-negative projection to steer recommendations away from unwanted topics."
    ),
    "active_learning": (
        "**Active Learning & Dynamic Feedback in ResearchNest:**\n\n"
        "- **Explicit Likes (👍):** Boosts the paper's topical centroid by $2.5\\times$. Even in cold-start (no saved papers), liking 1 paper instantly re-ranks the feed!\n"
        "- **Explicit Dislikes (👎):** Hard-suppresses the paper and subtracts $0.45\\times$ of its vector space coordinates from your profile using the Rocchio formula.\n"
        "- **Reading Duration Tracking:** Active time spent reading in the Reader Studio is recorded. Reads $\\ge 60$s receive a $1.5\\times$ boost; deep reads $\\ge 120$s receive a $2.0\\times$ anchor boost.\n"
        "- **Reset Learning:** You can clear your active feedback loop at any time to start fresh from a neutral baseline."
    ),
    "stacks_and_workspace": (
        "**Organizing Research with Stacks & Workspace:**\n\n"
        "- **Saved Papers:** Click the bookmark icon (🔖) on any paper to save it to your local workspace.\n"
        "- **Custom Stacks:** Group literature into custom collections (e.g., *'Quantum Foundation Models'*, *'NeurIPS 2024 Shortlist'*, *'Climate AI'*).\n"
        "- **Reader Studio:** Click **'Read in Studio'** to open the interactive reading environment featuring a live session stopwatch, direct PDF viewer, and structured key takeaways.\n"
        "- **Exporting Citations:** Open any paper modal to copy pre-formatted BibTeX, APA, IEEE, or MLA citations."
    ),
    "openalex_harvesting": (
        "**Live OpenAlex Literature Harvester:**\n\n"
        "- ResearchNest integrates with the **OpenAlex REST API** (`api.openalex.org/works`) to continuously harvest high-impact scholarly works across disciplines.\n"
        "- Ingests metadata including open-access PDF links, publication venues, author lists, citation counts, and primary inverted abstracts.\n"
        "- You can trigger an on-demand harvest by clicking **'Harvest Literature'** on the Discover page or sending `POST /harvest-openalex` to the AI microservice."
    ),
    "about_platform": (
        "**ResearchNest** is an intelligent scholarly literature discovery and workspace platform designed for academic researchers, graduate students, and ML engineers.\n\n"
        "- **Backend:** Spring Boot (Java 17) REST API with Hibernate/JPA.\n"
        "- **AI Microservice:** Python FastAPI with Scikit-Learn TF-IDF vectorizer, Rocchio active learning, and cosine similarity ranking.\n"
        "- **Frontend:** Modern React + Vite with responsive glassmorphism UI and Reader Studio.\n"
        "- **Live Literature Ingestion:** Automated harvesting from OpenAlex and arXiv open access archives."
    )
}


class NestAIChatbot:
    def __init__(self, engine=None):
        self.engine = engine

    def set_engine(self, engine):
        self.engine = engine

    def _classify_intent(self, query: str) -> str:
        q = query.lower()

        # Check for platform / website feature questions
        if any(w in q for w in ["how does", "how to", "how do i", "how can i", "algorithm", "recommendation", "rocchio", "hybrid", "model work", "reading time", "active learning", "stack", "save paper", "save a paper", "workspace", "bookmark", "openalex", "harvest", "what is researchnest", "citation", "bibtex"]):
            return "platform_help"

        # Check for recommendations / search intent
        if any(w in q for w in ["recommend", "suggest", "find me", "show me", "papers about", "papers on", "related papers", "literature on", "search for"]):
            return "recommendation_search"

        # Check for specific paper / scientific questions
        if any(w in q for w in ["what is", "tell me about", "summarize", "explain", "difference between", "mamba", "transformer", "attention", "graphcast", "alphafold", "lora", "rag", "quantum"]):
            return "paper_qa"

        return "general"

    def _retrieve_relevant_papers(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Vector space RAG retrieval over indexed papers."""
        vectorizer = getattr(self.engine, "vectorizer", None) or getattr(self.engine, "tfidf_vectorizer", None)
        if not self.engine or self.engine.tfidf_matrix is None or not self.engine.papers or not vectorizer:
            return []

        # Strip conversational prefix words to isolate scientific concepts
        clean_q = re.sub(
            r"^(can you\s+)?(please\s+)?(recommend|suggest|find|search|show|tell me about|what is|papers on|papers about|literature on)\s+",
            "",
            query,
            flags=re.IGNORECASE
        ).strip()
        search_text = f"{clean_q} {query}" if clean_q else query

        # Expand common shorthand so "suggest ML papers" matches "machine learning" in the index
        synonyms = {
            "ml": "machine learning",
            "nlp": "natural language processing",
            "cv": "computer vision",
            "llm": "large language model",
            "llms": "large language models",
            "dl": "deep learning",
            "rl": "reinforcement learning",
            "ai": "artificial intelligence",
        }
        extra = [synonyms[w] for w in re.findall(r"[a-z]+", query.lower()) if w in synonyms]
        if extra:
            search_text = f"{search_text} {' '.join(extra)}"

        try:
            query_vec = vectorizer.transform([search_text])
            sims = cosine_similarity(query_vec, self.engine.tfidf_matrix).flatten()
            top_indices = sims.argsort()[::-1]

            results = []
            for idx in top_indices:
                if sims[idx] < 0.02 and len(results) >= 1:
                    break
                paper = self.engine.papers[idx]
                results.append({
                    "id": paper.get("id"),
                    "title": paper.get("title"),
                    "authors": paper.get("authors"),
                    "year": paper.get("year"),
                    "field": paper.get("field"),
                    "citations": paper.get("citations", 0),
                    "abstract": paper.get("abstract"),
                    "takeaways": paper.get("takeaways", []),
                    "pdfUrl": paper.get("pdfUrl"),
                    "similarity": float(round(sims[idx], 3))
                })
                if len(results) >= top_k:
                    break
            return results
        except Exception as e:
            print(f"Error in vector space retrieval: {e}")
            return []

    def answer_query(self, query: str, conversation_history: Optional[List[Dict[str, str]]] = None, current_paper_id: Optional[Any] = None) -> Dict[str, Any]:
        """
        Synthesizes a response for the user's query with grounding papers and follow-up suggestions.
        """
        q = query.strip()
        q_lower = q.lower()
        intent = self._classify_intent(q)

        # 1. Platform & Website Help
        if intent == "platform_help":
            if any(w in q_lower for w in ["algorithm", "recommend", "how does", "hybrid", "rocchio", "formula", "weight"]):
                reply = (
                    PLATFORM_KNOWLEDGE["recommendation_algorithm"] +
                    "\n\n💡 *Tip: Try liking (👍) or deep reading a paper for over 2 minutes in the Reader Studio to see your feed instantly adapt!*"
                )
                suggestions = [
                    "How does the reading duration boost work?",
                    "Recommend papers on State Space Models",
                    "How do I organize research stacks?"
                ]
            elif any(w in q_lower for w in ["active learning", "like", "dislike", "feedback", "thumbs"]):
                reply = PLATFORM_KNOWLEDGE["active_learning"]
                suggestions = [
                    "How does the hybrid recommendation model work?",
                    "How to harvest new papers from OpenAlex?",
                    "Show me papers on Large Language Models"
                ]
            elif any(w in q_lower for w in ["stack", "workspace", "save", "collection", "studio", "read"]):
                reply = PLATFORM_KNOWLEDGE["stacks_and_workspace"]
                suggestions = [
                    "How does the active learning feedback loop work?",
                    "Recommend papers on Quantum Computing",
                    "How do I export BibTeX citations?"
                ]
            elif any(w in q_lower for w in ["harvest", "openalex", "api", "ingest"]):
                reply = PLATFORM_KNOWLEDGE["openalex_harvesting"]
                suggestions = [
                    "How does the recommendation algorithm work?",
                    "What papers are in the catalog?",
                    "Explain Mamba linear-time sequence modeling"
                ]
            else:
                reply = PLATFORM_KNOWLEDGE["about_platform"]
                suggestions = [
                    "How does the recommendation algorithm work?",
                    "Recommend papers on Attention & Transformers",
                    "How do I save papers to my stack?"
                ]

            # Also check if query mentions a specific domain/paper (skip for pure how-to answers)
            matched_papers = [] if any(w in q_lower for w in ["stack", "save", "workspace", "bookmark", "collection"]) else self._retrieve_relevant_papers(query, top_k=2)
            return {
                "reply": reply,
                "intent": "platform_help",
                "suggestedQueries": suggestions,
                "relatedPapers": matched_papers
            }

        # 2. Literature Recommendations Request
        if intent == "recommendation_search":
            matched_papers = self._retrieve_relevant_papers(query, top_k=3)
            if matched_papers:
                paper_bullets = []
                for p in matched_papers:
                    takeaway_snip = f" — *{p['takeaways'][0]}*" if p.get("takeaways") else ""
                    paper_bullets.append(
                        f"• **[{p['title']}]** ({p.get('field', 'Science')}, {p.get('year', 2024)}) by *{p.get('authors', 'Unknown')}* ({p.get('citations', 0):,} citations){takeaway_snip}"
                    )
                
                reply = (
                    f"Here are the top scholarly papers matching **\"{q}\"** from our indexed catalog:\n\n" +
                    "\n\n".join(paper_bullets) +
                    "\n\nClick on any card below to open the **Reader Studio**, view takeaways, or save to your workspace."
                )
                suggestions = [
                    f"Explain the methodology of {matched_papers[0]['title'][:30]}...",
                    "How does the hybrid recommendation model work?",
                    "Find related papers with high citation impact"
                ]
            else:
                reply = (
                    f"I searched our vector space for **\"{q}\"**, but didn't find high-confidence matches in the current local cache. "
                    "You can expand the catalog by using the **Harvest Literature** feature on the Discover page to pull fresh works from OpenAlex!"
                )
                suggestions = [
                    "Recommend papers on Machine Learning",
                    "Recommend papers on Climate Modeling",
                    "How does the hybrid recommendation engine work?"
                ]

            return {
                "reply": reply,
                "intent": "recommendation_search",
                "suggestedQueries": suggestions,
                "relatedPapers": matched_papers
            }

        # 3. Paper Q&A / Conceptual Inquiry
        matched_papers = self._retrieve_relevant_papers(query, top_k=3)
        if matched_papers and matched_papers[0]["similarity"] > 0.12:
            top_p = matched_papers[0]
            takeaways_formatted = "\n".join([f"  - {t}" for t in top_p.get("takeaways", [])]) if top_p.get("takeaways") else "  - Core scientific contributions detailed in abstract."
            
            reply = (
                f"### Analysis: **{top_p['title']}**\n\n"
                f"**Field:** {top_p.get('field')} · **Published:** {top_p.get('year')} · **Citations:** {top_p.get('citations', 0):,}\n"
                f"**Authors:** {top_p.get('authors')}\n\n"
                f"**Core Abstract:**\n>{top_p.get('abstract', 'No abstract available.')}\n\n"
                f"**Key Innovations & Takeaways:**\n{takeaways_formatted}\n\n"
                f"You can launch the **Reader Studio** to study the full manuscript or check the citation details below."
            )
            suggestions = [
                f"Compare {top_p['title'][:25]} with related papers",
                "How does the recommendation algorithm rank this paper?",
                "Recommend more papers in this research area"
            ]
            return {
                "reply": reply,
                "intent": "paper_qa",
                "suggestedQueries": suggestions,
                "relatedPapers": matched_papers
            }

        # 4. General fallback / greeting
        reply = (
            "Hello! I am **NestAI**, your research copilot for ResearchNest. Here is how I can assist you:\n\n"
            "- 🔍 **Literature Discovery:** Ask me to find or recommend papers on any topic (e.g., *'Find papers on linear state space models'* or *'Show me climate forecasting AI'*).\n"
            "- 📖 **Paper Explanations:** Ask about key takeaways, methods, or abstracts of indexed papers.\n"
            "- ⚙️ **Platform Guidance:** Ask how our hybrid recommendation algorithms, reading duration tracking, Rocchio active feedback, or research stacks work.\n\n"
            "What would you like to explore today?"
        )
        suggestions = [
            "How does the hybrid recommendation engine work?",
            "Recommend papers on Transformers & Attention",
            "What are the top takeaways of Mamba?",
            "How does the reading timer steer my recommendations?"
        ]
        return {
            "reply": reply,
            "intent": "general",
            "suggestedQueries": suggestions,
            "relatedPapers": matched_papers[:2] if matched_papers else []
        }
