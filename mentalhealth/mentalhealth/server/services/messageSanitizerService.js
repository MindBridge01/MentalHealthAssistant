const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?(?:\d{2,4}[-.\s]?){2,4}\d\b/g;
const NATIONAL_ID_REGEX = /\b(?:\d{9}[vVxX]|\d{12}|\d{3}-\d{2}-\d{4})\b/g;
const ADDRESS_REGEX =
  /\b\d{1,5}\s+[A-Za-z0-9\s,.-]{3,}\b(?:street|st|road|rd|lane|ln|avenue|ave|boulevard|blvd|drive|dr)\b/gi;
const NAME_INTRO_REGEX =
  /\b(i am|i'm|my name is|this is)\s+([a-z]+(?:\s+[a-z]+){0,2})\b/gi;
const LIVE_IN_REGEX = /\b(i live in|i'm from|my location is)\s+([a-z\s,.-]{2,})\b/gi;

const MAX_HISTORY_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 1500;

function maskPII(inputText = "") {
  if (typeof inputText !== "string") return "";

  return inputText
    .replace(EMAIL_REGEX, "[EMAIL]")
    .replace(PHONE_REGEX, "[PHONE]")
    .replace(NATIONAL_ID_REGEX, "[NATIONAL_ID]")
    .replace(ADDRESS_REGEX, "[ADDRESS]")
    .replace(NAME_INTRO_REGEX, "$1 [NAME]")
    .replace(LIVE_IN_REGEX, "$1 [LOCATION]");
}

function normalizeText(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function sanitizeUserMessage(inputText = "") {
  return normalizeText(maskPII(inputText));
}

function sanitizeConversationHistory(rawMessages = [], currentMessage = "") {
  if (!Array.isArray(rawMessages)) return [];

  const safeCurrentMessage = sanitizeUserMessage(currentMessage);
  const recentMessages = rawMessages.slice(-MAX_HISTORY_MESSAGES * 2);
  const sanitizedHistory = [];

  for (const entry of recentMessages) {
    if (!entry || typeof entry.content !== "string") continue;

    const normalizedRole = entry.role === "assistant" ? "assistant" : "user";
    const content =
      normalizedRole === "user"
        ? sanitizeUserMessage(entry.content)
        : normalizeText(entry.content);

    if (!content) continue;

    // Never trust assistant messages sent by the client. We only keep user turns.
    if (normalizedRole !== "user") continue;

    if (safeCurrentMessage && content === safeCurrentMessage) continue;

    sanitizedHistory.push({
      role: "user",
      content,
    });
  }

  return sanitizedHistory.slice(-MAX_HISTORY_MESSAGES);
}

module.exports = {
  MAX_HISTORY_MESSAGES,
  maskPII,
  sanitizeUserMessage,
  sanitizeConversationHistory,
};
