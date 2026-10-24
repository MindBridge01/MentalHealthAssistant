const USER_STORAGE_KEY = "user";

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "null");
  } catch (_err) {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user ? { _id:user._id,name:user.name,email:user.email,role:user.role,registrationStatus:user.registrationStatus,onboardingCompleted:user.onboardingCompleted,mfaEnabled:user.mfaEnabled } : null));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function hasCompletePatientProfile(user) {
  if (!user || user.role !== "patient") return true;
  return user.registrationStatus === 'approved';
}
