import numpy as np
import math
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Optional

class PaperRecommendationEngine:
    def __init__(self):
        self.papers: List[Dict[str, Any]] = []
        self.paper_map: Dict[str, Dict[str, Any]] = {}
        self.paper_id_to_index: Dict[str, int] = {}
        self.index_to_paper_id: Dict[int, str] = {}
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self.similarity_matrix = None
        self.feature_names: np.ndarray = np.array([])
        self.max_citations: int = 1

    def fit(self, papers: List[Dict[str, Any]]):
        """
        Fits the TF-IDF vector space model on the scholarly paper catalog.
        Combines title, field, topic tags, venue, and abstract with domain weights.
        Supports unigrams and bigrams with sublinear term-frequency scaling.
        """
        if not papers:
            return

        self.papers = papers
        self.paper_map = {str(p.get("id")): p for p in papers}
        self.paper_id_to_index = {str(p.get("id")): idx for idx, p in enumerate(papers)}
        self.index_to_paper_id = {idx: str(p.get("id")) for idx, p in enumerate(papers)}

        self.max_citations = max([int(p.get("citations", 1) or 1) for p in papers] + [100])

        # Build weighted textual corpus:
        # Title (weight x3), Field (weight x2), TopicTag (weight x2), Venue (weight x1), Abstract (weight x1)
        corpus = []
        for p in papers:
            title = str(p.get("title", ""))
            field = str(p.get("field", ""))
            topic = str(p.get("topicTag", ""))
            venue = str(p.get("venue", ""))
            abstract = str(p.get("abstract", "") or p.get("abstractText", ""))

            weighted_text = f"{title} {title} {title} {field} {field} {topic} {topic} {venue} {abstract}"
            corpus.append(weighted_text)

        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
            max_features=8000
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        self.feature_names = np.array(self.vectorizer.get_feature_names_out())
        self.similarity_matrix = cosine_similarity(self.tfidf_matrix)

    def _extract_top_keywords(self, vec1: np.ndarray, vec2: np.ndarray, top_n: int = 3) -> List[str]:
        """
        Extracts the highest-weighted overlapping terms/n-grams between two vectors.
        """
        if len(self.feature_names) == 0:
            return []
        overlap = np.multiply(vec1.flatten(), vec2.flatten())
        top_indices = np.argsort(overlap)[::-1]
        keywords = []
        for idx in top_indices:
            if overlap[idx] <= 0:
                break
            term = self.feature_names[idx]
            if len(term) > 2 and term not in keywords:
                keywords.append(term)
            if len(keywords) >= top_n:
                break
        return keywords

    def _calc_hybrid_score(self, sim: float, paper: Dict[str, Any]) -> float:
        """
        Hybrid multi-factor scoring:
        - 75% Content semantic cosine similarity
        - 15% Normalized logarithmic citation impact
        - 10% Publication recency boost (bounded within last 18 years)
        """
        cites = int(paper.get("citations", 0) or 0)
        norm_cite = math.log1p(cites) / math.log1p(self.max_citations) if self.max_citations > 0 else 0.5
        norm_cite = max(0.0, min(1.0, norm_cite))

        year = int(paper.get("year", 2024) or 2024)
        recency = max(0.0, min(1.0, 1.0 - (2026 - year) / 18.0))

        hybrid = (0.75 * sim) + (0.15 * norm_cite) + (0.10 * recency)
        return float(round(hybrid, 4))

    def _resolve_paper_id(self, paper_id: Any) -> Optional[str]:
        pid = str(paper_id).strip()
        if pid in self.paper_id_to_index:
            return pid
        digits = "".join(filter(str.isdigit, pid))
        if digits and digits in self.paper_id_to_index:
            return digits
        # Also check if index based (e.g. paper-1 maps to index 0)
        if digits:
            try:
                idx = int(digits) - 1
                if 0 <= idx < len(self.papers):
                    return self.index_to_paper_id[idx]
            except Exception:
                pass
        return None

    def recommend_similar(self, paper_id: Any, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Finds the top_k most similar papers for a given paper using hybrid similarity
        and extracts overlapping scientific concepts.
        """
        resolved_pid = self._resolve_paper_id(paper_id)
        if not resolved_pid or resolved_pid not in self.paper_id_to_index or self.similarity_matrix is None:
            return []

        idx = self.paper_id_to_index[resolved_pid]
        current_paper = self.papers[idx]
        current_vec = self.tfidf_matrix[idx].toarray()

        sim_scores = list(enumerate(self.similarity_matrix[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        filtered = [s for s in sim_scores if s[0] != idx][:top_k]

        results = []
        max_raw = sim_scores[1][1] if len(sim_scores) > 1 and sim_scores[1][1] > 0 else 1.0

        for rank, (other_idx, raw_score) in enumerate(filtered):
            other_paper = self.papers[other_idx]
            other_vec = self.tfidf_matrix[other_idx].toarray()

            hybrid_score = self._calc_hybrid_score(raw_score, other_paper)
            matched_keywords = self._extract_top_keywords(current_vec, other_vec, top_n=3)

            rel_score = raw_score / max_raw if max_raw > 0 else 0.8
            match_pct = int(round(84 + (rel_score * 13) - (rank * 2)))
            match_pct = max(72, min(98, match_pct))
            
            same_field = other_paper.get("field") == current_paper.get("field")
            if matched_keywords:
                kw_str = ", ".join([f'"{k}"' for k in matched_keywords[:2]])
                reason = f"High affinity in {kw_str} and {other_paper.get('field', 'methodology')}"
            elif same_field:
                reason = f"Shares core methodology in {other_paper.get('field', 'the discipline')}"
            else:
                reason = f"Interdisciplinary cross-domain relevance in {other_paper.get('field')}"

            results.append({
                "paper": other_paper,
                "score": hybrid_score,
                "rawCosineSimilarity": float(round(raw_score, 4)),
                "matchPercentage": f"{match_pct}% Match",
                "matchedKeywords": matched_keywords,
                "reason": reason
            })

        return results

    def recommend_for_user(self, saved_paper_ids: List[Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Personalized Hybrid Recommendation:
        1. Computes the User Research Profile Centroid from saved papers.
        2. Computes cosine similarity across all papers in the catalog.
        3. Applies hybrid weighting (semantic match + citation impact + recency).
        4. Identifies top matched concepts and specific trigger paper for transparency.
        """
        if not saved_paper_ids or self.tfidf_matrix is None or not self.papers:
            # Fallback to high-impact trending papers
            sorted_papers = sorted(
                self.papers,
                key=lambda p: (p.get("citations", 0) or 0),
                reverse=True
            )[:top_k]
            return [
                {
                    "paper": p,
                    "score": round(0.95 - (i * 0.02), 4),
                    "matchPercentage": f"{96 - (i * 2)}% Trending",
                    "matchedKeywords": [p.get("field", "AI").lower()],
                    "reason": "Top cited landmark publication in the global scientific community"
                }
                for i, p in enumerate(sorted_papers)
            ]

        str_saved = []
        for sid in saved_paper_ids:
            resolved = self._resolve_paper_id(sid)
            if resolved and resolved in self.paper_id_to_index and resolved not in str_saved:
                str_saved.append(resolved)

        if not str_saved:
            return self.recommend_for_user([], top_k)

        saved_indices = [self.paper_id_to_index[sid] for sid in str_saved]
        
        # Calculate User Profile Centroid Vector (mean of TF-IDF vectors of saved papers)
        saved_vectors = self.tfidf_matrix[saved_indices]
        user_profile_vector = np.asarray(saved_vectors.mean(axis=0))

        # Compute cosine similarity between user profile and all papers in catalog
        cosine_scores = cosine_similarity(user_profile_vector, self.tfidf_matrix).flatten()

        saved_set = set(saved_indices)
        scored_candidates = []
        for idx in range(len(self.papers)):
            cand_paper = self.papers[idx]
            raw_sim = float(cosine_scores[idx])
            hybrid_score = self._calc_hybrid_score(raw_sim, cand_paper)
            scored_candidates.append((idx, raw_sim, hybrid_score))

        # Sort by hybrid score descending
        scored_candidates = sorted(scored_candidates, key=lambda x: x[2], reverse=True)
        top_candidates = scored_candidates[:max(top_k, len(self.papers))]

        max_hybrid_raw = top_candidates[0][2] if top_candidates and top_candidates[0][2] > 0 else 1.0

        recommendations = []
        for rank, (cand_idx, raw_sim, hybrid_score) in enumerate(top_candidates):
            cand_paper = self.papers[cand_idx]
            is_saved = cand_idx in saved_set

            cand_vec = self.tfidf_matrix[cand_idx].toarray()
            pairwise_with_saved = cosine_similarity(cand_vec, saved_vectors).flatten()
            best_saved_rel_idx = int(np.argmax(pairwise_with_saved))
            best_saved_paper = self.papers[saved_indices[best_saved_rel_idx]]

            # Extract overlapping concepts with user profile
            matched_keywords = self._extract_top_keywords(user_profile_vector, cand_vec, top_n=3)

            rel_score = hybrid_score / max_hybrid_raw if max_hybrid_raw > 0 else 0.8
            if is_saved:
                match_pct = 98
                explanation = f"Saved in your stack · Core anchor in {cand_paper.get('field', 'your research')}"
            else:
                match_pct = int(round(86 + (rel_score * 12) - (rank * 1.5)))
                match_pct = max(75, min(98, match_pct))
                if matched_keywords:
                    kw_str = ", ".join([f'"{k}"' for k in matched_keywords[:2]])
                    explanation = (
                        f"Recommended based on {kw_str} alignment with \"{best_saved_paper.get('title')}\""
                    )
                else:
                    explanation = (
                        f"Recommended based on your saved paper \"{best_saved_paper.get('title')}\" "
                        f"({best_saved_paper.get('field')})"
                    )

            recommendations.append({
                "paper": cand_paper,
                "score": hybrid_score,
                "rawCosineSimilarity": float(round(raw_sim, 4)),
                "matchPercentage": f"{match_pct}% Match",
                "isSaved": is_saved,
                "matchedKeywords": matched_keywords,
                "matchedWith": {
                    "id": best_saved_paper.get("id"),
                    "title": best_saved_paper.get("title"),
                    "field": best_saved_paper.get("field")
                },
                "reason": explanation
            })

        return recommendations
