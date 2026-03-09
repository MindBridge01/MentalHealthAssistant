const USER_STORAGE_KEY = "user";

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "null");
  } catch (_err) {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function hasCompletePatientProfile(user) {
  if (!user || user.role !== "patient") return true;

  const requiredFields = [
    "name",
    "email",
    "birthday",
    "age",
    "gender",
    "phone",
    "address",
    "zipcode",
    "country",
    "city",
    "guardianName",
    "guardianPhone",
    "guardianEmail",
    "illnesses",
  ];

  return requiredFields.every((key) => String(user[key] || "").trim().length > 0);
}
