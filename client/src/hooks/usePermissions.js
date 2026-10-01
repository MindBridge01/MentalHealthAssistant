import { useMemo } from "react";
import { useAuth } from "./useAuth";

const PERMISSIONS = {
  patient: ["view_own_profile", "edit_own_profile", "chat_ai", "create_appointment", "view_own_appointments", "request_doctor_access"],
  "pending-doctor": ["view_own_profile", "edit_own_profile", "chat_ai"],
  doctor: ["view_patient_records", "manage_appointments", "update_slots"],
  admin: ["manage_users", "approve_doctor", "reject_doctor", "view_all_records"],
};

export function usePermissions() {
  const { user } = useAuth();

  return useMemo(() => {
    const role = user?.role;
    const permissions = PERMISSIONS[role] || [];
    return {
      role,
      permissions,
      hasPermission: (permission) => permissions.includes(permission),
    };
  }, [user]);
}
