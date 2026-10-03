-- MindBridge aggregate snapshot. Run against the intended environment.
-- Includes demo/test accounts; no identifiable records are returned.
-- This file performs SELECTs only. It does not run migrations or alter data.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

SELECT CURRENT_TIMESTAMP AS captured_at,
       current_database() AS database_name;

SELECT COUNT(*) AS total_accounts,
       COUNT(*) FILTER (WHERE role = 'patient') AS patient_accounts,
       COUNT(*) FILTER (WHERE role = 'doctor') AS approved_doctor_accounts,
       COUNT(*) FILTER (WHERE role = 'pending-doctor') AS pending_doctor_accounts,
       COUNT(*) FILTER (WHERE role = 'admin') AS administrator_accounts,
       COUNT(*) FILTER (WHERE role NOT IN ('patient', 'doctor', 'pending-doctor', 'admin')) AS other_role_accounts
FROM users;

SELECT COUNT(*) AS doctor_profiles,
       COUNT(*) FILTER (WHERE u.role = 'doctor') AS approved_accounts_with_doctor_profile,
       COUNT(*) FILTER (WHERE u.role = 'pending-doctor') AS pending_accounts_with_doctor_profile
FROM doctors d JOIN users u ON u.id = d.user_id;

SELECT COUNT(*) AS approved_patient_registrations
FROM patient_registrations r JOIN users u ON u.id = r.user_id
WHERE u.role = 'patient' AND r.status = 'approved';

SELECT r.status, COUNT(*) AS patient_registrations
FROM patient_registrations r JOIN users u ON u.id = r.user_id
WHERE u.role = 'patient'
GROUP BY r.status ORDER BY r.status;

SELECT COUNT(*) AS appointment_records FROM appointments;
SELECT status, COUNT(*) AS appointment_records
FROM appointments GROUP BY status ORDER BY status;

COMMIT;
