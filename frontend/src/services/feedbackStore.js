/**
 * Feedback Store for Active Learning (Likes 👍 and Dislikes 👎).
 * Integrates directly with Python Rocchio algorithm (2.5x positive weight, negative coordinate subtraction).
 */

const LIKED_KEY = "researchnest_liked_ids";
const DISLIKED_KEY = "researchnest_disliked_ids";

export function getLikedPaperIds() {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getDislikedPaperIds() {
  try {
    const raw = localStorage.getItem(DISLIKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isPaperLiked(paperId) {
  if (!paperId) return false;
  const list = getLikedPaperIds();
  const target = String(paperId);
  return list.some((id) => String(id) === target);
}

export function isPaperDisliked(paperId) {
  if (!paperId) return false;
  const list = getDislikedPaperIds();
  const target = String(paperId);
  return list.some((id) => String(id) === target);
}

export function toggleLikePaper(paperId) {
  if (!paperId) return false;
  const target = String(paperId);
  let liked = getLikedPaperIds().map(String);
  let disliked = getDislikedPaperIds().map(String);

  // If already liked, remove like
  if (liked.includes(target)) {
    liked = liked.filter((id) => id !== target);
    localStorage.setItem(LIKED_KEY, JSON.stringify(liked));
    notifyFeedbackUpdate();
    return false;
  }

  // Add to liked, and remove from disliked if present
  liked.push(target);
  disliked = disliked.filter((id) => id !== target);

  localStorage.setItem(LIKED_KEY, JSON.stringify(liked));
  localStorage.setItem(DISLIKED_KEY, JSON.stringify(disliked));
  notifyFeedbackUpdate();
  return true;
}

export function toggleDislikePaper(paperId) {
  if (!paperId) return false;
  const target = String(paperId);
  let liked = getLikedPaperIds().map(String);
  let disliked = getDislikedPaperIds().map(String);

  // If already disliked, remove dislike
  if (disliked.includes(target)) {
    disliked = disliked.filter((id) => id !== target);
    localStorage.setItem(DISLIKED_KEY, JSON.stringify(disliked));
    notifyFeedbackUpdate();
    return false;
  }

  // Add to disliked, and remove from liked if present
  disliked.push(target);
  liked = liked.filter((id) => id !== target);

  localStorage.setItem(DISLIKED_KEY, JSON.stringify(disliked));
  localStorage.setItem(LIKED_KEY, JSON.stringify(liked));
  notifyFeedbackUpdate();
  return true;
}

export function resetActiveFeedback() {
  localStorage.removeItem(LIKED_KEY);
  localStorage.removeItem(DISLIKED_KEY);
  notifyFeedbackUpdate();
}

function notifyFeedbackUpdate() {
  window.dispatchEvent(
    new CustomEvent("researchnest:feedback_updated", {
      detail: {
        likedIds: getLikedPaperIds(),
        dislikedIds: getDislikedPaperIds(),
      },
    })
  );
}
