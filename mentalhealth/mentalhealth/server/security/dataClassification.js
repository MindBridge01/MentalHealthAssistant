const DATA_CLASSIFICATION = Object.freeze({
  PUBLIC: "PUBLIC",
  INTERNAL: "INTERNAL",
  SENSITIVE: "SENSITIVE",
  PHI: "PHI",
});

const FIELD_CLASSIFICATION = Object.freeze({
  name: DATA_CLASSIFICATION.PHI,
  patient: DATA_CLASSIFICATION.PHI,
  patientname: DATA_CLASSIFICATION.PHI,
  birthday: DATA_CLASSIFICATION.PHI,
  dateofbirth: DATA_CLASSIFICATION.PHI,
  dob: DATA_CLASSIFICATION.PHI,
  age: DATA_CLASSIFICATION.PHI,
  gender: DATA_CLASSIFICATION.PHI,
  address: DATA_CLASSIFICATION.PHI,
  guardianname: DATA_CLASSIFICATION.PHI,
  guardianphone: DATA_CLASSIFICATION.PHI,
  guardianemail: DATA_CLASSIFICATION.PHI,
  guardianinformation: DATA_CLASSIFICATION.PHI,
  illnesses: DATA_CLASSIFICATION.PHI,
  illnesshistory: DATA_CLASSIFICATION.PHI,
  notes: DATA_CLASSIFICATION.PHI,
  appointmentnotes: DATA_CLASSIFICATION.PHI,
  message: DATA_CLASSIFICATION.PHI,
  messages: DATA_CLASSIFICATION.PHI,
  chat: DATA_CLASSIFICATION.PHI,
  transcript: DATA_CLASSIFICATION.PHI,
  transcripts: DATA_CLASSIFICATION.PHI,
  chattranscripts: DATA_CLASSIFICATION.PHI,
  phone: DATA_CLASSIFICATION.SENSITIVE,
  email: DATA_CLASSIFICATION.SENSITIVE,
  patientemail: DATA_CLASSIFICATION.SENSITIVE,
  nationalid: DATA_CLASSIFICATION.SENSITIVE,
  nic: DATA_CLASSIFICATION.SENSITIVE,
});

const ENCRYPT_AT_REST_CATEGORIES = new Set([
  DATA_CLASSIFICATION.PHI,
  DATA_CLASSIFICATION.SENSITIVE,
]);

function normalizeFieldName(fieldName) {
  return String(fieldName || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function classifyField(fieldName) {
  const normalized = normalizeFieldName(fieldName);
  return FIELD_CLASSIFICATION[normalized] || DATA_CLASSIFICATION.INTERNAL;
}

function shouldEncryptField(fieldName) {
  return ENCRYPT_AT_REST_CATEGORIES.has(classifyField(fieldName));
}

module.exports = {
  DATA_CLASSIFICATION,
  FIELD_CLASSIFICATION,
  ENCRYPT_AT_REST_CATEGORIES,
  classifyField,
  shouldEncryptField,
};
