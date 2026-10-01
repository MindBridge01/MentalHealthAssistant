const HARD_BLOCK_PATTERNS = Object.freeze([
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
]);

const INJECTION_SIGNALS = Object.freeze([
  {
    reason: "instruction_override_attempt",
    score: 3,
    pattern:
      /\b(ignore|disregard|override|forget)\s+(all|any|previous|prior|above|system|developer|safety)\s+(instructions|rules|guidance)\b/i,
  },
  {
    reason: "role_impersonation_attempt",
    score: 2,
    pattern:
      /\b(you are now|act as|pretend to be|from now on you are|developer mode|system mode)\b/i,
  },
  {
    reason: "system_prompt_exfiltration",
    score: 3,
    pattern:
      /\b(show|reveal|print|leak|repeat)\s+(the\s+)?(system prompt|developer prompt|hidden instructions)\b/i,
  },
  {
    reason: "tool_or_secret_exfiltration",
    score: 3,
    pattern:
      /\b(api key|token|secret|credentials|environment variable|dotenv|database password)\b/i,
  },
  {
    reason: "delimiter_abuse",
    score: 1,
    pattern: /(<\s*system\s*>|<\s*assistant\s*>|```(?:system|assistant|developer)?)/i,
  },
  {
    reason: "jailbreak_keyword",
    score: 2,
    pattern: /\b(jailbreak|bypass safety|disable guardrails|unfiltered response)\b/i,
  },
]);

function evaluatePromptGuardrails(message = "", options = {}) {
  if (typeof message !== "string") {
    return {
      blocked: false,
      reason: null,
      score: 0,
      signals: [],
      context: options.context || "message",
    };
  }

  const hardBlock = HARD_BLOCK_PATTERNS.find(({ pattern }) => pattern.test(message));
  if (hardBlock) {
    return {
      blocked: true,
      reason: hardBlock.reason,
      score: 10,
      signals: [hardBlock.reason],
      context: options.context || "message",
    };
  }

  const matchedSignals = INJECTION_SIGNALS.filter(({ pattern }) => pattern.test(message));
  const score = matchedSignals.reduce((total, signal) => total + signal.score, 0);

  if (score >= 3) {
    return {
      blocked: true,
      reason: matchedSignals[0]?.reason || "prompt_injection_attempt",
      score,
      signals: matchedSignals.map((signal) => signal.reason),
      context: options.context || "message",
    };
  }

  return {
    blocked: false,
    reason: null,
    score,
    signals: matchedSignals.map((signal) => signal.reason),
    context: options.context || "message",
  };
}

module.exports = { evaluatePromptGuardrails };
