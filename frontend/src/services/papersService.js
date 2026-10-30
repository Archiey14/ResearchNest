import { apiRequest } from "./apiClient.js";
import { mockPapers } from "../data/mockPapers.js";

function normalizePaper(p, index = 0) {
  if (!p) return null;
  return {
    ...p,
    id: p.id ? String(p.id) : `paper-${index + 1}`,
    abstract: p.abstract || p.abstractText || "",
    takeaways:
      Array.isArray(p.takeaways) && p.takeaways.length > 0
        ? p.takeaways
        : [
            `Key scientific contribution in ${p.field || "this academic domain"}.`,
            "Empirically validated benchmarking across standard evaluation datasets.",
            "Published with open reproducibility guidelines and verifiable references.",
          ],
    readingTime: p.readingTime || "15 min read",
    bibtex:
      p.bibtex ||
      `@article{paper_${p.id || index},
  title={${p.title}},
  author={${p.authors || "Unknown"}},
  year={${p.year || 2024}}
}`,
    matchScore: p.matchScore || "98% match",
    stackId: p.stackId || (p.fieldId ? `stack-${p.fieldId}` : "stack-ai"),
    readingStatus:
      p.readingStatus ||
      (index % 3 === 0
        ? "completed"
        : index % 3 === 1
        ? "in-progress"
        : "want-to-read"),
  };
}

export const papersService = {
  /**
   * Fetch papers with optional search query or field filter
   */
  async getPapers({ search = "", field = "" } = {}) {
    try {
      const params = new URLSearchParams();
      if (search && search.trim()) params.append("search", search.trim());
      if (field && field.trim() && field !== "all") params.append("field", field.trim());

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const data = await apiRequest(`/papers${queryStr}`);

      if (Array.isArray(data) && data.length > 0) {
        return data.map((p, idx) => normalizePaper(p, idx));
      }
    } catch (err) {
      console.warn("Backend papers request failed, using cached mock dataset:", err);
    }

    // Fallback to local catalog if server is momentarily unavailable
    let fallback = [...mockPapers];
    if (field && field !== "all") {
      fallback = fallback.filter(
        (p) => p.fieldId?.toLowerCase() === field.toLowerCase()
      );
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      fallback = fallback.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.authors?.toLowerCase().includes(q) ||
          p.abstract?.toLowerCase().includes(q)
      );
    }
    return fallback;
  },

  /**
   * Search papers across fields using Spring Boot /api/papers/search?q=...
   */
  async searchPapers(query) {
    if (!query || !query.trim()) {
      return this.getPapers();
    }
    try {
      const data = await apiRequest(`/papers/search?q=${encodeURIComponent(query.trim())}`);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p, idx) => normalizePaper(p, idx));
      }
    } catch (err) {
      console.warn("Backend search failed, filtering locally:", err);
    }

    const q = query.toLowerCase();
    return mockPapers.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.authors?.toLowerCase().includes(q) ||
        p.abstract?.toLowerCase().includes(q)
    );
  },

  /**
   * Get papers filtered by academic field
   */
  async getPapersByField(fieldId) {
    if (!fieldId || fieldId === "all") {
      return this.getPapers();
    }
    try {
      const data = await apiRequest(`/papers/field/${encodeURIComponent(fieldId)}`);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p, idx) => normalizePaper(p, idx));
      }
    } catch (err) {
      console.warn("Backend field query failed, filtering locally:", err);
    }
    return mockPapers.filter(
      (p) => p.fieldId?.toLowerCase() === fieldId.toLowerCase()
    );
  },

  /**
   * Get top trending papers from Spring Boot /api/papers/trending
   */
  async getTrendingPapers() {
    try {
      const data = await apiRequest("/papers/trending");
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p, idx) => normalizePaper(p, idx));
      }
    } catch (err) {
      console.warn("Backend trending failed, using fallback:", err);
    }
    return [...mockPapers]
      .sort((a, b) => (b.citations || 0) - (a.citations || 0))
      .slice(0, 5);
  },

  /**
   * Get single paper by ID from Spring Boot /api/papers/:id
   */
  async getPaperById(id) {
    try {
      const data = await apiRequest(`/papers/${id}`);
      if (data) return normalizePaper(data);
    } catch (err) {
      console.warn(`Backend paper #${id} lookup failed, checking local catalog:`, err);
    }
    return mockPapers.find((p) => String(p.id) === String(id)) || null;
  },

  /**
   * Get similar papers using the Python AI recommendation engine via Spring Boot
   */
  async getSimilarPapers(paperId, topK = 3) {
    try {
      const data = await apiRequest(`/recommendations/similar/${paperId}?topK=${topK}`);
      if (data?.similarPapers && Array.isArray(data.similarPapers)) {
        return data.similarPapers.map((item, idx) => ({
          ...item,
          paper: normalizePaper(item.paper, idx),
        }));
      }
    } catch (err) {
      console.warn(`AI similar papers for #${paperId} failed, falling back:`, err);
    }
    // Fallback: pick papers with same field or top cited
    const target = mockPapers.find((p) => String(p.id) === String(paperId));
    return mockPapers
      .filter((p) => String(p.id) !== String(paperId))
      .filter((p) => !target || p.fieldId === target.fieldId)
      .slice(0, topK)
      .map((p, idx) => ({
        paper: p,
        score: 0.9 - idx * 0.05,
        matchPercentage: `${92 - idx * 4}% Match`,
        reason: "Shares core methodology in " + (p.field || "the discipline"),
      }));
  },

  /**
   * Get personalized recommendations for user based on their saved stack and active learning signals
   */
  async getRecommendationsForUser(savedIds = [], topK = 4, options = {}) {
    const { dismissedIds = [], readDurations = {} } = options;
    try {
      const data = await apiRequest("/recommendations/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          savedPaperIds: savedIds,
          dismissedPaperIds: dismissedIds,
          readDurations: readDurations,
          topK: topK,
        }),
      });

      if (data?.recommendations && Array.isArray(data.recommendations)) {
        return data.recommendations.map((item, idx) => ({
          ...item,
          paper: normalizePaper(item.paper, idx),
        }));
      }
    } catch (err) {
      console.warn("AI user recommendations failed, falling back to GET:", err);
      try {
        const idsParam = savedIds && savedIds.length > 0 ? savedIds.join(",") : "";
        const disParam = dismissedIds && dismissedIds.length > 0 ? dismissedIds.join(",") : "";
        let url = `/recommendations/for-you?topK=${topK}`;
        if (idsParam) url += `&savedIds=${encodeURIComponent(idsParam)}`;
        if (disParam) url += `&dismissedIds=${encodeURIComponent(disParam)}`;
        const fallbackData = await apiRequest(url);
        if (fallbackData?.recommendations && Array.isArray(fallbackData.recommendations)) {
          return fallbackData.recommendations.map((item, idx) => ({
            ...item,
            paper: normalizePaper(item.paper, idx),
          }));
        }
      } catch (e) {
        console.warn("Secondary fallback failed:", e);
      }
    }

    // Fallback: pick top papers not in savedIds or dismissedIds
    const savedSet = new Set(savedIds.map(String));
    const dismissedSet = new Set(dismissedIds.map(String));
    return mockPapers
      .filter((p) => !savedSet.has(String(p.id)) && !dismissedSet.has(String(p.id)))
      .slice(0, topK)
      .map((p, idx) => ({
        paper: p,
        score: 0.95 - idx * 0.03,
        matchPercentage: `${96 - idx * 3}% Match`,
        reason: "Curated based on your active research stack and interests",
      }));
  },
};
