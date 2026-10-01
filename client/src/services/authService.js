import { apiRequest } from "./apiClient";

export function login(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function signup(payload) {
  return apiRequest("/api/auth/signup", {
    method: "POST",
    body: payload,
  });
}

export function logout() {
  return apiRequest("/api/auth/logout", { method: "POST" });
}
