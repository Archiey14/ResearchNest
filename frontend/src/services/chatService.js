import { apiRequest } from "./apiClient.js";

const AI_DIRECT_URL = "http://127.0.0.1:8000/chat";
const STORAGE_KEY = "researchnest_chat_history";

export const chatService = {
  /**
   * Send a query to the NestAI Copilot.
   * Attempts Spring Boot backend proxy first, falling back to direct Python AI microservice.
   */
  async sendMessage(message, history = [], currentPaperId = null) {
    const payload = {
      message: message.trim(),
      history: history.slice(-6).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      currentPaperId: currentPaperId || null,
    };

    // 1. Try Spring Boot backend
    try {
      const data = await apiRequest("/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (data && data.reply) {
        return data;
      }
    } catch (sbErr) {
      console.warn("Spring Boot /api/chat unavailable, attempting direct AI microservice:", sbErr);
    }

    // 2. Direct fallback to Python FastAPI AI service
    try {
      const resp = await fetch(AI_DIRECT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (aiErr) {
      console.warn("Direct AI microservice unavailable:", aiErr);
    }

    // 3. Resilient offline response if both microservices are momentarily down
    return {
      reply:
        "I am **NestAI Copilot**, your research literature and platform assistant.\n\n" +
        "You can explore:\n" +
        "- **Hybrid Recommendations:** TF-IDF content similarity + log citation impact + recency decay + Rocchio active feedback.\n" +
        "- **Reading Studio:** Deep reading tracking for over 2 minutes boosts paper topical affinity.\n" +
        "- **Research Stacks:** Save papers to local workspace collections and export formatted citations.",
      intent: "general",
      suggestedQueries: [
        "How does the hybrid recommendation model work?",
        "Recommend papers on State Space Models",
        "How do research stacks work?",
      ],
      relatedPapers: [],
    };
  },

  getStoredHistory() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveHistory(messages) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch (e) {
      console.warn("Failed to save chat history to sessionStorage:", e);
    }
  },

  clearHistory() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear chat history:", e);
    }
  },
};
