/**
 * chatStackActions - lets the NestAI chatbot file a paper under a research stack.
 *
 *   "add the Mamba paper to the recently created stack"
 *   "put BERT into my Quantum ML stack"
 *   "add it to the latest stack"      (it = the paper the chatbot just showed)
 *
 * Works on the same localStorage data as the Saved Papers page, so the paper
 * shows up under that stack there immediately.
 */

import { papersService } from "./papersService.js";
import { mockPapers } from "../data/mockPapers.js";
import { addPaperToStack, getUserStacks, hasUserCreatedStacks } from "./savedPapersStore.js";

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "and", "for", "with", "in", "on", "to", "by", "paper", "papers",
]);

const RECENT_STACK_REF =
  /^(?:recently created|recently made|recently added|newly created|just created|most recent|last created|recent|latest|newest|last|new)(?: created| made| added)?$/;

const SAVED_LIBRARY_REF =
  /^(?:saved(?: papers?)?|saved library|bookmarks?|library|reading list|my papers|workspace)$/;

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Light stemming so "modelling"/"modeling" and "spaces"/"space" line up.
function stem(w) {
  return w.length > 4 ? w.replace(/(?:ing|ed|es|s)$/, "") : w;
}

function tokens(s) {
  return norm(s)
    .split(" ")
    .filter((w) => w && !STOP_WORDS.has(w))
    .map(stem);
}

function sameToken(a, b) {
  if (a === b) return true;
  const min = Math.min(a.length, b.length);
  if (min >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return a.length >= 5 && b.length >= 5 && a.slice(0, 5) === b.slice(0, 5);
}

function findPaper(query, candidates) {
  const q = tokens(query);
  if (q.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const paper of candidates) {
    const titleTokens = tokens(paper.title);
    if (titleTokens.length === 0) continue;
    const matched = q.filter((w) => titleTokens.some((t) => sameToken(w, t))).length;
    const recall = matched / q.length;
    const precision = matched / titleTokens.length;
    const score = recall * 0.8 + precision * 0.2;
    if (recall >= 0.7 && matched >= Math.min(2, q.length) && score > bestScore) {
      best = paper;
      bestScore = score;
    }
  }
  return best;
}

function findStack(ref, stacks) {
  const r = norm(ref);
  if (!r) return null;
  return (
    stacks.find((s) => norm(s.name) === r) ||
    stacks.find((s) => {
      const n = norm(s.name);
      return n && (n.includes(r) || r.includes(n));
    }) ||
    null
  );
}

function dedupeById(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    if (!p || p.id == null) continue;
    const key = String(p.id);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/**
 * @param {{ paperQuery?: string, usesContext?: boolean, stackRef?: string, contextPapers?: object[] }} args
 * @returns {Promise<{ reply: string, suggestedQueries: string[] }>}
 */
export async function addPaperToStackFromChat({
  paperQuery = "",
  usesContext = false,
  stackRef = "",
  contextPapers = [],
}) {
  // Full catalog (backend, falling back to the local dataset). These objects have every field
  // the Saved Papers page expects, so we prefer them over the slimmer chatbot payload.
  let catalog = [];
  try {
    catalog = await papersService.getPapers();
  } catch {
    catalog = [];
  }
  const candidates = dedupeById([...catalog, ...contextPapers, ...mockPapers]);

  // 1. Which paper?
  let paper = null;
  if (usesContext) {
    paper = contextPapers[0] || null;
    if (!paper) {
      return {
        reply:
          "Which paper should I add? Tell me its title, e.g. **add the Mamba paper to my latest stack**.",
        suggestedQueries: ["Recommend papers on State Space Models"],
      };
    }
  } else {
    if (tokens(paperQuery).length === 0) {
      return {
        reply:
          "Which paper should I add? Tell me its title, e.g. **add the Mamba paper to my latest stack**.",
        suggestedQueries: ["Recommend papers on State Space Models"],
      };
    }
    paper = findPaper(paperQuery, candidates);
    if (!paper) {
      return {
        reply: `I couldn't find a paper matching **"${paperQuery}"** in the catalog. Try the exact title, or ask me to recommend papers on the topic first.`,
        suggestedQueries: [
          "Recommend papers on State Space Models",
          "Recommend papers on Machine Learning",
        ],
      };
    }
  }
  paper = candidates.find((p) => String(p.id) === String(paper.id)) || paper;

  // 2. Which stack?
  const ref = norm(stackRef);
  let stack = null;
  let saveOnly = false;

  if (SAVED_LIBRARY_REF.test(ref)) {
    saveOnly = true;
  } else if (!ref || RECENT_STACK_REF.test(ref)) {
    if (!hasUserCreatedStacks()) {
      return {
        reply:
          "You haven't created a stack yet. Say **create a new stack** to make one, then ask me again.",
        suggestedQueries: ["Create a new stack"],
      };
    }
    const stacks = getUserStacks();
    stack = stacks[stacks.length - 1];
  } else {
    const stacks = getUserStacks();
    stack = findStack(ref, stacks);
    if (!stack) {
      const names = stacks.map((s) => `**${s.name}**`).join(", ");
      return {
        reply: `I couldn't find a stack called **"${stackRef}"**. Your stacks: ${names}.`,
        suggestedQueries: ["Add it to the latest stack", "Create a new stack"],
      };
    }
  }

  // 3. Do it.
  const result = addPaperToStack(paper, saveOnly ? null : stack.id, catalog);
  if (!result.ok) {
    return {
      reply: `Sorry, I couldn't save **${paper.title}** just now. Please try again from the Discover page.`,
      suggestedQueries: [],
    };
  }

  if (saveOnly) {
    return {
      reply: result.wasSaved
        ? `**${paper.title}** is already in your saved papers.`
        : `Saved **${paper.title}** to your saved papers.`,
      suggestedQueries: ["Take me to saved papers"],
    };
  }

  const alreadyThere = result.wasSaved && result.previousStackId === stack.id;
  return {
    reply: alreadyThere
      ? `**${paper.title}** is already in your **${stack.name}** stack.`
      : `Added **${paper.title}** to your **${stack.name}** stack. It's also saved to your library.`,
    suggestedQueries: ["Take me to saved papers", "Create a new stack"],
  };
}
