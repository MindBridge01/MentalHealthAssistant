const { getModeratedFallbackResponse } = require("./safeResponseService");

const UNSAFE_RESPONSE_PATTERNS = Object.freeze([
  {
    reason: "self_harm_encouragement",
    pattern:
      /\b(kill yourself|end your life|you should die|harm yourself|overdose|self-harm is the answer)\b/i,
  },
  {
    reason: "unsafe_medical_claim",
    pattern:
      /\b(you have [a-z\s]+ disorder|i diagnose you|take (this|that) medication|start taking [a-z0-9\s-]+mg)\b/i,
  },
]);

function moderateModelResponse(responseText = "") {
  if (typeof responseText !== "string") {
    return {
      moderated: true,
      reason: "invalid_response_type",
      content: getModeratedFallbackResponse(),
    };
  }

  const matched = UNSAFE_RESPONSE_PATTERNS.find(({ pattern }) => pattern.test(responseText));
  if (!matched) {
    return {
      moderated: false,
      reason: null,
      content: responseText,
    };
  }

  return {
    moderated: true,
    reason: matched.reason,
    content: getModeratedFallbackResponse(),
  };
}

module.exports = { moderateModelResponse };
