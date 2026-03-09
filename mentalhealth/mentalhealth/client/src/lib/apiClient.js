import { apiUrl } from "../config/api";

function parseErrorMessage(status, payload) {
  const backendMessage = payload?.error || payload?.message || payload?.content;

  if (backendMessage) return backendMessage;
  if (status === 401) return "Your session is invalid or expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "Requested resource was not found.";

  return "Request failed. Please try again.";
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_err) {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(parseErrorMessage(response.status, payload));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}
