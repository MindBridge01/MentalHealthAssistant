const MEDICAL_DISCLAIMER =
  "MindBridge is an AI support assistant and does not replace professional medical advice.";

const RESPONSES = Object.freeze({
  CRISIS:
    "I’m really sorry that you're feeling this way. You are not alone and help is available.\n\nPlease consider reaching out to a trusted person or a professional mental health support service.\n\nIf you are in immediate danger, please contact your local emergency services or a crisis hotline now.",
  BLOCKED_DIAGNOSIS:
    "I am not able to provide medical diagnoses or prescribe medication. Please consult a qualified healthcare professional.",
  MODERATED_FALLBACK:
    "I want to keep this conversation safe and supportive. I can help with grounding, breathing, and coping strategies, but for medical diagnosis or treatment decisions please speak with a licensed professional.",
});

function appendMedicalDisclaimer(text = "") {
  if (typeof text !== "string" || text.trim().length === 0) {
    return MEDICAL_DISCLAIMER;
  }

  if (text.includes(MEDICAL_DISCLAIMER)) {
    return text;
  }

  return `${text}\n\n${MEDICAL_DISCLAIMER}`;
}

function getCrisisResponse() {
  return RESPONSES.CRISIS;
}

function getBlockedDiagnosisResponse() {
  return RESPONSES.BLOCKED_DIAGNOSIS;
}

function getModeratedFallbackResponse() {
  return RESPONSES.MODERATED_FALLBACK;
}

module.exports = {
  MEDICAL_DISCLAIMER,
  appendMedicalDisclaimer,
  getCrisisResponse,
  getBlockedDiagnosisResponse,
  getModeratedFallbackResponse,
};
