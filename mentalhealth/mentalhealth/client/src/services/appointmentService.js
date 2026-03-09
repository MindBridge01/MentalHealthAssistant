import { apiRequest } from "./apiClient";

export function bookAppointment(doctorId, payload) {
  return apiRequest(`/api/doctor/appointments/${doctorId}`, {
    method: "POST",
    body: payload,
  });
}

export function getPatientAppointments(patientId) {
  return apiRequest(`/api/doctor/patient-appointments/${patientId}`);
}
