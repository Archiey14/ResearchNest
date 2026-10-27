import { apiRequest } from "./apiClient.js";

const DEFAULT_USER = {
  id: 1,
  name: "Alex Chen",
  email: "alex.chen@stanford.edu",
  institution: "Stanford University",
  department: "Computer Science & AI Lab",
  role: "RESEARCHER",
};

export const authService = {
  /**
   * Log in researcher with email & password via Spring Boot /api/auth/login
   */
  async login(email, password) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data?.token) {
      localStorage.setItem("researchnest_token", data.token);
    }
    if (data?.user) {
      localStorage.setItem("researchnest_user", JSON.stringify(data.user));
    }
    localStorage.setItem("researchnest_authenticated", "true");

    return data;
  },

  /**
   * Register a new researcher via Spring Boot /api/auth/register
   */
  async register({ name, email, password, institution, department }) {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, institution, department }),
    });

    if (data?.token) {
      localStorage.setItem("researchnest_token", data.token);
    }
    if (data?.user) {
      localStorage.setItem("researchnest_user", JSON.stringify(data.user));
    }
    localStorage.setItem("researchnest_authenticated", "true");

    return data;
  },

  /**
   * Fetch current authenticated user profile via /api/auth/me
   */
  async getCurrentUser() {
    try {
      const data = await apiRequest("/auth/me");
      if (data?.user) {
        localStorage.setItem("researchnest_user", JSON.stringify(data.user));
        return data.user;
      }
    } catch (err) {
      console.warn("Could not fetch remote user profile, using stored session:", err);
    }
    return this.getStoredUser();
  },

  /**
   * Get cached user profile from localStorage with fallback
   */
  getStoredUser() {
    try {
      const stored = localStorage.getItem("researchnest_user");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore JSON parse error
    }
    return DEFAULT_USER;
  },

  /**
   * Check if user is currently marked as authenticated
   */
  isAuthenticated() {
    return localStorage.getItem("researchnest_authenticated") === "true";
  },

  /**
   * Log out researcher and clear stored session tokens
   */
  logout() {
    localStorage.removeItem("researchnest_token");
    localStorage.removeItem("researchnest_user");
    localStorage.removeItem("researchnest_authenticated");
  },
};
