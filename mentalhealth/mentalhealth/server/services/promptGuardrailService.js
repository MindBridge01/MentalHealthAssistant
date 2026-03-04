const GUARDRAIL_PATTERNS = Object.freeze([
  {
    reason: "diagnosis_request",
    pattern:
      /\b(diagnose|diagnosis|what disorder do i have|do i have depression|am i bipolar|clinical diagnosis)\b/i,
  },
  {
    reason: "medication_request",
    pattern:
      /\b(prescribe|prescription|what medication|which medicine|dosage|dose should i take|drug recommendation)\b/i,
  },
  {
    reason: "safety_bypass_attempt",
    pattern:
      /\b(ignore (all|previous|safety) instructions|bypass safety|jailbreak|developer mode|system prompt)\b/i,
  },
]);

function evaluatePromptGuardrails(message = "") {
  if (typeof message !== "string") {
    return { blocked: false, reason: null };
  }

  const match = GUARDRAIL_PATTERNS.find(({ pattern }) => pattern.test(message));
  if (!match) {
    return { blocked: false, reason: null };
  }

  return {
    blocked: true,
    reason: match.reason,
  };
}

module.exports = { evaluatePromptGuardrails };
