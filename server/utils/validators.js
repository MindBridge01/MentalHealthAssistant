function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidObjectIdCandidate(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || ""));
}

module.exports = {
  isNonEmptyString,
  isValidObjectIdCandidate,
};
