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

    def recommend_for_user(
        self,
        saved_paper_ids: List[Any],
        liked_paper_ids: Optional[List[Any]] = None,
        disliked_paper_ids: Optional[List[Any]] = None,
        dismissed_paper_ids: Optional[List[Any]] = None,
        read_durations: Optional[Dict[str, float]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Personalized Active Hybrid Recommendation with Explicit Like/Dislike Feedback:
        1. Positive Centroid Formulation:
           - Liked papers: High-conviction anchor (w = 2.5x).
           - Saved papers: Standard anchor (w = 1.0x).
           - Deep reading bonus: Papers read for >= 120s gain +1.0x weight.
        2. Rocchio Relevance Feedback (Negative Signals):
           - Explicitly Disliked papers & Dismissed papers are weighted and subtracted:
             v_user = 1.0 * v_pos - 0.45 * v_neg
           - Non-negative projection (clamped to >= 0) and L2-normalized.
        3. Hard Suppression:
           - Disliked and dismissed papers are never presented in recommendations.
        4. Multi-Factor Hybrid Ranking:
           - Hybrid score = Cosine Sim + log(Citations) + Exponential Recency Decay.
        """
        liked_paper_ids = liked_paper_ids or []
        disliked_paper_ids = disliked_paper_ids or []
        dismissed_paper_ids = dismissed_paper_ids or []
        read_durations = read_durations or {}

        # Resolve all negative signals (disliked + dismissed)
        resolved_negatives = set()
        for nid in disliked_paper_ids + dismissed_paper_ids:
            rd = self._resolve_paper_id(nid)
            if rd and rd in self.paper_id_to_index:
                resolved_negatives.add(self.paper_id_to_index[rd])

        # Resolve positive signals (saved + liked)
        str_pos_map = {}  # resolved_id -> weight
        liked_set = set()
        for lid in liked_paper_ids:
            rd = self._resolve_paper_id(lid)
            if rd and rd in self.paper_id_to_index:
                str_pos_map[rd] = max(str_pos_map.get(rd, 0.0), 2.5)
                liked_set.add(rd)

        for sid in saved_paper_ids:
            rd = self._resolve_paper_id(sid)
            if rd and rd in self.paper_id_to_index:
                # Add base weight if not already higher from like
                str_pos_map[rd] = max(str_pos_map.get(rd, 0.0), 1.0)

        # Apply reading depth bonus to positive papers
        for pid in list(str_pos_map.keys()):
            idx = self.paper_id_to_index[pid]
            dur = float(read_durations.get(pid, 0.0) or read_durations.get(str(idx + 1), 0.0) or 0.0)
            if dur >= 120.0:
                str_pos_map[pid] += 1.0  # +1.0 boost for deep read >= 2 min
            elif dur >= 60.0:
                str_pos_map[pid] += 0.5  # +0.5 boost for read >= 1 min

        # Cold-start fallback if no positive signals exist
        if not str_pos_map or self.tfidf_matrix is None or not self.papers:
            sorted_papers = [
                p for p in sorted(self.papers, key=lambda p: (p.get("citations", 0) or 0), reverse=True)
                if self.paper_id_to_index.get(str(p.get("id"))) not in resolved_negatives
            ][:top_k]

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

        # 1. Build Weighted Positive Vector
        pos_indices = []
        weights = []
        for pid, w in str_pos_map.items():
            idx = self.paper_id_to_index[pid]
            pos_indices.append(idx)
            weights.append(w)

        pos_vectors = self.tfidf_matrix[pos_indices].toarray()
        weights_arr = np.array(weights).reshape(-1, 1)
        weighted_pos_vec = np.sum(pos_vectors * weights_arr, axis=0) / np.sum(weights_arr)

        # 2. Rocchio Relevance Feedback (Negative Signals)
        neg_indices = list(resolved_negatives)
        has_negative_feedback = len(neg_indices) > 0
        if has_negative_feedback:
            neg_vecs = self.tfidf_matrix[neg_indices].toarray()
            mean_neg_vec = np.mean(neg_vecs, axis=0)
            # Rocchio formula: v_user = 1.0 * v_pos - 0.45 * v_neg
            user_profile_vector = weighted_pos_vec - (0.45 * mean_neg_vec)
            user_profile_vector = np.maximum(0.0, user_profile_vector)  # Non-negative constraint
            norm = np.linalg.norm(user_profile_vector)
            if norm > 0:
                user_profile_vector = user_profile_vector / norm
            user_profile_vector = user_profile_vector.reshape(1, -1)
        else:
            user_profile_vector = weighted_pos_vec.reshape(1, -1)

        # 3. Cosine similarity against catalog
        cosine_scores = cosine_similarity(user_profile_vector, self.tfidf_matrix).flatten()

        saved_set = set(self.paper_id_to_index[self._resolve_paper_id(sid)] for sid in saved_paper_ids if self._resolve_paper_id(sid) in self.paper_id_to_index)
        liked_idx_set = set(self.paper_id_to_index[self._resolve_paper_id(lid)] for lid in liked_paper_ids if self._resolve_paper_id(lid) in self.paper_id_to_index)
        negative_set = resolved_negatives

        scored_candidates = []
        for idx in range(len(self.papers)):
            # Never recommend disliked or dismissed papers
            if idx in negative_set:
                continue
            cand_paper = self.papers[idx]
            raw_sim = float(cosine_scores[idx])
            hybrid_score = self._calc_hybrid_score(raw_sim, cand_paper)
            scored_candidates.append((idx, raw_sim, hybrid_score))

        # Sort by hybrid score descending
        scored_candidates = sorted(scored_candidates, key=lambda x: x[2], reverse=True)
        top_candidates = scored_candidates[:top_k] if top_k > 0 else scored_candidates

        max_hybrid_raw = top_candidates[0][2] if top_candidates and top_candidates[0][2] > 0 else 1.0

        recommendations = []
        for rank, (cand_idx, raw_sim, hybrid_score) in enumerate(top_candidates):
            cand_paper = self.papers[cand_idx]
            is_saved = cand_idx in saved_set
            is_liked = cand_idx in liked_idx_set

            cand_vec = self.tfidf_matrix[cand_idx].toarray()
            pairwise_with_pos = cosine_similarity(cand_vec, pos_vectors).flatten()
            best_pos_rel_idx = int(np.argmax(pairwise_with_pos))
            best_anchor_idx = pos_indices[best_pos_rel_idx]
            best_anchor_paper = self.papers[best_anchor_idx]
            best_anchor_w = weights[best_pos_rel_idx]
            is_liked_anchor = best_anchor_idx in liked_idx_set

            # Extract overlapping concepts with user profile
            matched_keywords = self._extract_top_keywords(user_profile_vector, cand_vec, top_n=3)

            rel_score = hybrid_score / max_hybrid_raw if max_hybrid_raw > 0 else 0.8
            if is_saved:
                match_pct = 98
                explanation = f"Saved in your stack · Core anchor in {cand_paper.get('field', 'your research')}"
            elif is_liked:
                match_pct = 97
                explanation = f"Liked by you · Strong preference in {cand_paper.get('field', 'your research')}"
            else:
                match_pct = int(round(86 + (rel_score * 12) - (rank * 1.5)))
                match_pct = max(75, min(98, match_pct))
                
                if is_liked_anchor:
                    anchor_prefix = "Recommended via liked paper"
                elif best_anchor_w >= 2.0:
                    anchor_prefix = "Deep reading anchor"
                else:
                    anchor_prefix = "Recommended based on"

                if matched_keywords:
                    kw_str = ", ".join([f'"{k}"' for k in matched_keywords[:2]])
                    explanation = (
                        f"{anchor_prefix}: {kw_str} alignment with \"{best_anchor_paper.get('title')}\""
                    )
                else:
                    explanation = (
                        f"{anchor_prefix}: affinity with \"{best_anchor_paper.get('title')}\" "
                        f"({best_anchor_paper.get('field')})"
                    )

            if has_negative_feedback and not is_saved and not is_liked:
                explanation += " (refined with Rocchio active feedback)"

            recommendations.append({
                "paper": cand_paper,
                "score": hybrid_score,
                "rawCosineSimilarity": float(round(raw_sim, 4)),
                "matchPercentage": f"{match_pct}% Match",
                "isSaved": is_saved,
                "isLiked": is_liked,
                "deepReadingBoost": best_anchor_w >= 2.0,
                "matchedKeywords": matched_keywords,
                "matchedWith": {
                    "id": best_anchor_paper.get("id"),
                    "title": best_anchor_paper.get("title"),
                    "field": best_anchor_paper.get("field"),
                    "isLiked": is_liked_anchor
                },
                "reason": explanation
            })

        return recommendations
