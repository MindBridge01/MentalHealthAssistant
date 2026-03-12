const permissions = {
  patient: [
    "view_own_profile",
    "edit_own_profile",
    "chat_ai",
    "create_appointment",
    "view_own_appointments",
    "request_doctor_access",
  ],
  "pending-doctor": [
    "view_own_profile",
    "edit_own_profile",
    "chat_ai",
  ],
  doctor: [
    "view_patient_records",
    "manage_appointments",
    "update_slots",
  ],
  admin: [
    "manage_users",
    "approve_doctor",
    "reject_doctor",
    "view_all_records",
    "view_audit_logs",
  ],
};

module.exports = { permissions };
