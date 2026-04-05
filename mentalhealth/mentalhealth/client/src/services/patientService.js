import { apiRequest } from "./apiClient";

export function getDashboardData() {
  return apiRequest("/api/patient/dashboard");
}

export function getOnboarding() {
  return apiRequest("/api/patient/onboarding");
}

export function saveOnboarding(payload) {
  return apiRequest("/api/patient/onboarding", {
    method: "PUT",
    body: payload,
  });
}

export function getActivities() {
  return apiRequest("/api/patient/activities");
}

export function triggerSos() {
  return apiRequest("/api/profile/sos", { method: "POST" });
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  return apiRequest("/api/upload", {
    method: "POST",
    body: formData,
  });
}
