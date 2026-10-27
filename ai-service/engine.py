import numpy as np
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

    def fit(self, papers: List[Dict[str, Any]]):
        """
        Fits the TF-IDF vector space model on the scholarly paper catalog.
        Combines title, field, topic tags, and abstract with domain weights.
        """
        if not papers:
            return

        self.papers = papers
        self.paper_map = {str(p.get("id")): p for p in papers}
        self.paper_id_to_index = {str(p.get("id")): idx for idx, p in enumerate(papers)}
        self.index_to_paper_id = {idx: str(p.get("id")) for idx, p in enumerate(papers)}

        # Build weighted textual corpus:
        # Title (weight x3), Field (weight x2), TopicTag (weight x2), Abstract (weight x1)
        corpus = []
        for p in papers:
            title = str(p.get("title", ""))
            field = str(p.get("field", ""))
            topic = str(p.get("topicTag", ""))
            abstract = str(p.get("abstract", "") or p.get("abstractText", ""))

            weighted_text = f"{title} {title} {title} {field} {field} {topic} {topic} {abstract}"
            corpus.append(weighted_text)

        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
            max_features=5000
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        self.similarity_matrix = cosine_similarity(self.tfidf_matrix)

    def recommend_similar(self, paper_id: Any, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Finds the top_k most similar papers for a given paper using cosine similarity.
        """
        pid = str(paper_id)
        if pid not in self.paper_id_to_index or self.similarity_matrix is None:
            return []

        idx = self.paper_id_to_index[pid]
        sim_scores = list(enumerate(self.similarity_matrix[idx]))

        # Sort by similarity score descending (excluding the paper itself)
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        filtered = [s for s in sim_scores if s[0] != idx][:top_k]

        results = []
        current_paper = self.papers[idx]

        max_raw = sim_scores[1][1] if len(sim_scores) > 1 and sim_scores[1][1] > 0 else 1.0

        for rank, (other_idx, score) in enumerate(filtered):
            other_paper = self.papers[other_idx]
            # Proportional score scaling between 75% and 97% for UI presentation
            rel_score = score / max_raw if max_raw > 0 else 0.8
            match_pct = int(round(82 + (rel_score * 15) - (rank * 3)))
            match_pct = max(70, min(98, match_pct))
            
            same_field = other_paper.get("field") == current_paper.get("field")
            reason = (
                f"Shares core methodology in {other_paper.get('field', 'the discipline')}"
                if same_field
                else f"High semantic relevance in {other_paper.get('field', 'interdisciplinary research')}"
            )

            results.append({
                "paper": other_paper,
                "score": float(round(score, 4)),
                "matchPercentage": f"{match_pct}% Match",
                "reason": reason
            })

        return results

    def recommend_for_user(self, saved_paper_ids: List[Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Personalized Content-Based Recommendation:
        1. Computes the User Profile Centroid Vector from the researcher's saved papers.
        2. Computes cosine similarity of this profile centroid against all unsaved catalog papers.
        3. Identifies the specific saved paper driving the recommendation for explainability.
        """
        if not saved_paper_ids or self.tfidf_matrix is None or not self.papers:
            sorted_papers = sorted(
                self.papers,
                key=lambda p: p.get("citations", 0),
                reverse=True
            )[:top_k]
            return [
                {
                    "paper": p,
                    "score": 0.95 - (i * 0.02),
                    "matchPercentage": f"{96 - (i * 2)}% Trending",
                    "reason": "Top cited landmark publication in the global scientific community"
                }
                for i, p in enumerate(sorted_papers)
            ]

        str_saved = [str(sid) for sid in saved_paper_ids if str(sid) in self.paper_id_to_index]
        if not str_saved:
            return self.recommend_for_user([], top_k)

        saved_indices = [self.paper_id_to_index[sid] for sid in str_saved]
        
        # Calculate User Profile Centroid Vector (mean of TF-IDF vectors of saved papers)
        saved_vectors = self.tfidf_matrix[saved_indices]
        user_profile_vector = np.asarray(saved_vectors.mean(axis=0))

        # Compute cosine similarity between user profile and all papers in catalog
        candidate_scores = cosine_similarity(user_profile_vector, self.tfidf_matrix).flatten()

        saved_set = set(saved_indices)
        scored_candidates = [
            (idx, float(candidate_scores[idx]))
            for idx in range(len(self.papers))
        ]

        scored_candidates = sorted(scored_candidates, key=lambda x: x[1], reverse=True)[:max(top_k, len(self.papers))]

        max_cand_raw = scored_candidates[0][1] if scored_candidates and scored_candidates[0][1] > 0 else 1.0

        recommendations = []
        for rank, (cand_idx, overall_score) in enumerate(scored_candidates):
            cand_paper = self.papers[cand_idx]
            is_saved = cand_idx in saved_set

            cand_vec = self.tfidf_matrix[cand_idx]
            pairwise_with_saved = cosine_similarity(cand_vec, saved_vectors).flatten()
            best_saved_rel_idx = int(np.argmax(pairwise_with_saved))
            best_saved_paper = self.papers[saved_indices[best_saved_rel_idx]]

            rel_score = overall_score / max_cand_raw if max_cand_raw > 0 else 0.8
            if is_saved:
                match_pct = 98
                explanation = f"Saved in your stack · Core anchor in {cand_paper.get('field', 'your research')}"
            else:
                match_pct = int(round(86 + (rel_score * 12) - (rank * 2)))
                match_pct = max(75, min(97, match_pct))
                explanation = (
                    f"Recommended based on your saved paper \"{best_saved_paper.get('title')}\" "
                    f"({best_saved_paper.get('field')})"
                )

            recommendations.append({
                "paper": cand_paper,
                "score": round(overall_score, 4),
                "matchPercentage": f"{match_pct}% Match",
                "isSaved": is_saved,
                "matchedWith": {
                    "id": best_saved_paper.get("id"),
                    "title": best_saved_paper.get("title"),
                    "field": best_saved_paper.get("field")
                },
                "reason": explanation
            })

        return recommendations
