function normalizeUserRole(role) {
  if (role === "user") return "patient";
  return role;
}

module.exports = { normalizeUserRole };
