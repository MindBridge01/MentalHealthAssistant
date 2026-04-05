import { apiRequest } from "./apiClient";

export function submitAssessment(responses) {
  return apiRequest("/api/patient/assessments", {
    method: "POST",
    body: { responses },
  });
}

export function getAssessmentResult(assessmentId) {
  return apiRequest(`/api/patient/assessments/${assessmentId}`);
}

export function getLatestAssessment() {
  return apiRequest("/api/patient/assessments/latest");
}
