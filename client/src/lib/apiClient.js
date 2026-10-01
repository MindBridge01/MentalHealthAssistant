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
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const preparedBody =
    options.body && !isFormData && typeof options.body === "object"
      ? JSON.stringify(options.body)
      : options.body;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  const response = await fetch(apiUrl(path), {
    credentials: "include",
    ...options,
    headers,
    body: preparedBody,
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
