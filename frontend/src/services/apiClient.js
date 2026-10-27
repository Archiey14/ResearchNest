const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";

/**
 * Universal API client for ResearchNest Spring Boot backend.
 * Handles automatic JSON formatting, Bearer token injection, and error extraction.
 */
export async function apiRequest(endpoint, options = {}) {
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const cleanEndpoint = endpoint.replace(/^\//, "");
  const url = `${cleanBase}/${cleanEndpoint}`;

  const token = localStorage.getItem("researchnest_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      (typeof data === "object" && (data?.error || data?.message)) ||
      `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  return data;
}
