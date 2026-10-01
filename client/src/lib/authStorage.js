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
  return user.registrationStatus === 'approved';
}
