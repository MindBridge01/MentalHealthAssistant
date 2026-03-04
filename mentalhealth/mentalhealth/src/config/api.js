export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
export const WS_BASE_URL = (import.meta.env.VITE_WS_BASE_URL || "").replace(/\/+$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

export function wsUrl() {
  if (WS_BASE_URL) return WS_BASE_URL;
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}
