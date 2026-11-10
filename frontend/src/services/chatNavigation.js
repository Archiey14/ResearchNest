/**
 * chatNavigation - lets the NestAI chatbot (typed or spoken) move around the site.
 *
 * parseNavigationIntent("please take me to the sign in page")
 *   -> { path: "/login", label: "Sign In" }
 *
 * It only fires when the whole sentence is a navigation request AND the target is a
 * known page. Questions ("how do I sign in?") and research requests
 * ("show me papers about mamba") are left alone so they still go to the AI.
 */

const LEADING_FILLERS =
  /^(?:hey|hi|hello|ok|okay|please|kindly|can you|could you|would you|will you|i want to|i wanna|i would like to|i d like to|i need to|lets|let s|just)\s+/;

const VERB_PATTERNS = [
  /^(?:take|bring|send|lead|redirect|navigate|move|get)\s+me\s+(?:back\s+)?(?:to|into|onto)?\s*(.+)$/,
  /^(?:go|head|jump|navigate|switch|move|redirect)\s+(?:back\s+)?(?:to|into|onto)\s+(.+)$/,
  /^(?:open|show me|show|visit|launch|load)\s+(.+)$/,
];

const LOGOUT_PATTERN = /^(?:log|sign)\s*(?:me\s+)?out$|^logout$/;

const TARGETS = [
  { re: /^(?:sign ?in|log ?in|login)(?: form)?$/, path: "/login", label: "Sign In" },
  {
    re: /^(?:sign ?up|signup|register|registration|create (?:an )?account|new account)$/,
    path: "/signup",
    label: "Sign Up",
  },
  {
    re: /^(?:saved(?: papers?)?|saved library|bookmarks?|library|reading list|my papers)$/,
    path: "/workspace/saved",
    label: "Saved Papers",
  },
  {
    re: /^(?:discover|explore|recommendations?|recommended(?: papers?)?|feed|for you)$/,
    path: "/workspace/discover",
    label: "Discover",
  },
  {
    re: /^(?:dashboard|workspace|my workspace|my dashboard|home dashboard)$/,
    path: "/workspace",
    label: "Dashboard",
  },
  { re: /^(?:admin|admin console|admin dashboard)$/, path: "/admin", label: "Admin Console" },
  { re: /^about(?: us)?$/, path: "/about", label: "About" },
  { re: /^(?:contact|contact us|support)$/, path: "/contact", label: "Contact" },
  { re: /^(?:privacy|privacy policy)$/, path: "/privacy", label: "Privacy Policy" },
  {
    re: /^(?:terms|terms of service|terms and conditions|terms of use)$/,
    path: "/terms",
    label: "Terms of Service",
  },
  { re: /^(?:security|security policy)$/, path: "/security", label: "Security" },
  {
    re: /^(?:landing|landing page|website|main site|main|homepage|home page|front)$/,
    path: "/",
    label: "Home",
  },
];

function normalize(text) {
  let t = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // strip stacked fillers: "hey please can you ..."
  let prev;
  do {
    prev = t;
    t = t.replace(LEADING_FILLERS, "");
  } while (t !== prev);
  return t.replace(/\s+(?:please|thanks|thank you|now)$/, "").trim();
}

function cleanTarget(target) {
  return target
    .replace(/^(?:the|my|our|a|an|your)\s+/, "")
    .replace(/\s+(?:page|screen|tab|section|area|view|form)$/, "")
    .replace(/\s+(?:please|now)$/, "")
    .trim();
}

const PAPER_PRONOUNS = /^(?:it|this|that|this paper|that paper|the paper|this one|that one)$/;

/**
 * "add the Mamba paper to the recently created stack" -> add-to-stack
 * Also accepts the passive "<paper> added to <stack>".
 * `t` is already normalized (lowercase, no punctuation, fillers stripped).
 */
function parseAddToStack(t) {
  if (t.split(" ").length > 40) return null;

  let m = t.match(/^(?:add|put|save|move|include|file|place|store)\s+(.+)\s+(?:to|into|in|under|onto)\s+(.+)$/);
  if (!m) m = t.match(/^(.+?)\s+(?:be\s+)?added\s+(?:to|into|in|under)\s+(.+)$/);
  if (!m) return null;

  const rawPaper = m[1].replace(/^(?:at|add|and)\s+/, "").trim();
  const usesContext = PAPER_PRONOUNS.test(rawPaper);
  const paperQuery = usesContext
    ? ""
    : rawPaper
        .replace(/^(?:the|this|that|my)\s+/, "")
        .replace(/\s+paper$/, "")
        .trim();
  if (!usesContext && !paperQuery) return null;

  const stackRef = m[2]
    .replace(/^(?:the|my|a|an|our)\s+/, "")
    .replace(/^(?:stack|collection)\s+(?:called|named)\s+/, "")
    .replace(/\s+(?:stack|collection|folder|list)$/, "")
    .trim();

  return { type: "add-to-stack", label: "Add to Stack", paperQuery, usesContext, stackRef };
}

/**
 * Non-navigation chat actions. Currently: opening the "New Stack" modal.
 *
 * parseChatAction("create a new stack called Quantum ML")
 *   -> { type: "open-new-stack", label: "New Stack", name: "Quantum ML" }
 *
 * Questions ("how do I create a stack?") don't match, so they still go to the AI.
 *
 * @param {string} text
 * @returns {{ type: "open-new-stack", label: string, name?: string } | null}
 */
export function parseChatAction(text) {
  const t = normalize(text);
  if (!t) return null;

  const addToStack = parseAddToStack(t);
  if (addToStack) return addToStack;

  if (t.split(" ").length > 16) return null;

  const match = t.match(
    /^(?:(?:create|make|add|start|build|set up|open|new)\s+)(?:(?:a|an|the|my)\s+)?(?:new\s+)?(?:research\s+)?(?:stack|collection)(?:\s+(?:called|named)\s+.+)?$/
  );
  if (!match && !/^new (?:research )?stack$/.test(t)) return null;

  // Take the name from the original text so its capitalisation is preserved.
  const nameMatch = String(text).match(/(?:called|named)\s+["“'‘]?(.+?)["”'’]?\s*[.!?]*\s*$/i);
  const name = nameMatch ? nameMatch[1].trim() : "";

  return { type: "open-new-stack", label: "New Stack", ...(name ? { name } : {}) };
}

/**
 * @param {string} text
 * @param {{ isAuthenticated?: boolean }} [options]
 * @returns {{ path: string, label: string, action?: "logout" } | null}
 */
export function parseNavigationIntent(text, options = {}) {
  const t = normalize(text);
  if (!t || t.split(" ").length > 12) return null;

  if (LOGOUT_PATTERN.test(t)) {
    return { path: "/login", label: "Sign In", action: "logout" };
  }

  // "take me home" / "go home" -> dashboard when signed in, otherwise the landing page
  if (/^(?:take me|bring me|send me|go|head|get me)\s+(?:back\s+)?home$/.test(t)) {
    return options.isAuthenticated
      ? { path: "/workspace", label: "Dashboard" }
      : { path: "/", label: "Home" };
  }

  for (const verb of VERB_PATTERNS) {
    const match = t.match(verb);
    if (!match) continue;
    const target = cleanTarget(match[1]);

    if (target === "home") {
      return options.isAuthenticated
        ? { path: "/workspace", label: "Dashboard" }
        : { path: "/", label: "Home" };
    }

    const hit = TARGETS.find((entry) => entry.re.test(target));
    if (hit) return { path: hit.path, label: hit.label };
  }

  return null;
}
