/**
 * ResearchNest Unified Saved Papers Store
 * Provides a single source of truth for saved research papers across
 * Navbar, Dashboard, Discover, and Saved Papers pages.
 * 
 * Automatically purges legacy phantom IDs ("1", "4", "8") and ensures
 * the navbar counter badge strictly matches the actual number of saved papers.
 */

import { mockPapers } from "../data/mockPapers.js";

const SAVED_IDS_KEY = "researchnest_saved_ids";
const SAVED_POOL_KEY = "researchnest_saved_papers_pool";

/**
 * Read raw saved paper pool from localStorage
 */
export function getSavedPool() {
  try {
    const raw = localStorage.getItem(SAVED_POOL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => p && p.id != null) : [];
  } catch (e) {
    console.warn("Could not read saved papers pool:", e);
    return [];
  }
}

/**
 * Read and sanitize saved paper IDs from localStorage.
 * Automatically purges legacy dummy IDs ("1", "4", "8") that have no matching paper.
 */
export function getSavedIds() {
  try {
    const raw = localStorage.getItem(SAVED_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const pool = getSavedPool();
    const poolIds = new Set(pool.map((p) => String(p.id)));
    const mockIds = new Set(mockPapers.map((p) => String(p.id)));

    // Purge phantom dummy IDs ("1", "4", "8") that were previously initialized as placeholders
    const sanitized = parsed.map(String).filter((id) => {
      if (poolIds.has(id)) return true;
      if (mockIds.has(id)) return true;
      // If numeric 1, 4, 8 and neither in pool nor mock, it's a phantom artifact
      if (["1", "4", "8"].includes(id)) return false;
      return true;
    });

    if (sanitized.length !== parsed.length) {
      localStorage.setItem(SAVED_IDS_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (e) {
    console.warn("Could not read saved IDs:", e);
    return [];
  }
}

/**
 * Retrieve all genuine saved Paper objects by resolving saved IDs against
 * local pool, backend catalog, and mock datasets.
 */
export function getSavedPapers(catalogPapers = []) {
  const ids = getSavedIds();
  if (ids.length === 0) return [];
  const idSet = new Set(ids);

  const pool = getSavedPool();
  const candidateMap = new Map();

  // Combine sources with precedence: pool > catalogPapers > mockPapers
  mockPapers.forEach((p, idx) => {
    if (p && p.id != null) {
      candidateMap.set(String(p.id), {
        ...p,
        stackId: p.stackId || (p.fieldId ? `stack-${p.fieldId}` : "stack-ai"),
        readingStatus:
          p.readingStatus ||
          (idx % 3 === 0
            ? "completed"
            : idx % 3 === 1
            ? "in-progress"
            : "want-to-read"),
      });
    }
  });

  if (Array.isArray(catalogPapers)) {
    catalogPapers.forEach((p, idx) => {
      if (p && p.id != null) {
        candidateMap.set(String(p.id), {
          ...p,
          stackId: p.stackId || (p.fieldId ? `stack-${p.fieldId}` : "stack-ai"),
          readingStatus:
            p.readingStatus ||
            (idx % 3 === 0
              ? "completed"
              : idx % 3 === 1
              ? "in-progress"
              : "want-to-read"),
        });
      }
    });
  }

  pool.forEach((p, idx) => {
    if (p && p.id != null) {
      candidateMap.set(String(p.id), {
        ...p,
        stackId: p.stackId || (p.fieldId ? `stack-${p.fieldId}` : "stack-ai"),
        readingStatus:
          p.readingStatus ||
          (idx % 3 === 0
            ? "completed"
            : idx % 3 === 1
            ? "in-progress"
            : "want-to-read"),
      });
    }
  });

  const resolved = [];
  const validIds = [];

  idSet.forEach((id) => {
    const paper = candidateMap.get(id);
    if (paper) {
      resolved.push(paper);
      validIds.push(id);
    }
  });

  // Ensure stored IDs strictly match verified papers
  if (validIds.length !== ids.length) {
    localStorage.setItem(SAVED_IDS_KEY, JSON.stringify(validIds));
  }

  return resolved;
}

/**
 * Returns the exact count of real saved papers
 */
export function getSavedCount(catalogPapers = []) {
  return getSavedPapers(catalogPapers).length;
}

/**
 * Check if a paper is currently saved
 */
export function isPaperSaved(paperId) {
  if (!paperId) return false;
  const ids = new Set(getSavedIds());
  return ids.has(String(paperId));
}

/**
 * Toggle save status of a paper.
 * Synchronously updates localStorage pool, IDs, and notifies all components.
 */
export function toggleSavedPaper(paperOrId, catalogPapers = []) {
  const isObj = typeof paperOrId === "object" && paperOrId !== null;
  const id = isObj ? paperOrId.id : paperOrId;
  const strId = String(id);

  let pool = getSavedPool();
  let ids = getSavedIds();
  const isCurrentlySaved = ids.includes(strId);

  let targetPaper = isObj ? paperOrId : pool.find((p) => String(p.id) === strId);
  if (!targetPaper && Array.isArray(catalogPapers)) {
    targetPaper = catalogPapers.find((p) => String(p.id) === strId);
  }
  if (!targetPaper) {
    targetPaper = mockPapers.find((p) => String(p.id) === strId);
  }

  let nextIds = [];
  let nextPool = [];
  const nextIsSaving = !isCurrentlySaved;

  if (nextIsSaving) {
    nextIds = Array.from(new Set([...ids, strId]));
    if (targetPaper && !pool.some((p) => String(p.id) === strId)) {
      nextPool = [...pool, targetPaper];
    } else {
      nextPool = pool;
    }
  } else {
    nextIds = ids.filter((item) => item !== strId);
    nextPool = pool.filter((p) => String(p.id) !== strId);
  }

  localStorage.setItem(SAVED_IDS_KEY, JSON.stringify(nextIds));
  localStorage.setItem(SAVED_POOL_KEY, JSON.stringify(nextPool));

  const count = nextIds.length;

  window.dispatchEvent(
    new CustomEvent("researchnest:saved_updated", {
      detail: {
        id: strId,
        isSaving: nextIsSaving,
        count,
        paper: targetPaper,
      },
    })
  );

  return nextIsSaving;
}
