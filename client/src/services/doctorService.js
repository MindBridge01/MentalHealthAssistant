import { apiRequest } from "./apiClient";

export function getDoctors() {
  return apiRequest("/api/doctor/all");
}

export function getDoctorProfile(doctorId) {
  return apiRequest(`/api/doctor/profile/${doctorId}`);
}
