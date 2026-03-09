const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?(?:\d{2,4}[-.\s]?){2,4}\d\b/g;
const NATIONAL_ID_REGEX = /\b(?:\d{9}[vVxX]|\d{12}|\d{3}-\d{2}-\d{4})\b/g;
const ADDRESS_REGEX =
  /\b\d{1,5}\s+[A-Za-z0-9\s,.-]{3,}\b(?:street|st|road|rd|lane|ln|avenue|ave|boulevard|blvd|drive|dr)\b/gi;
const NAME_INTRO_REGEX =
  /\b(i am|i'm|my name is|this is)\s+([a-z]+(?:\s+[a-z]+){0,2})\b/gi;
const LIVE_IN_REGEX = /\b(i live in|i'm from|my location is)\s+([a-z\s,.-]{2,})\b/gi;

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

function piiFilterMessage(req, _res, next) {
  const rawMessage = typeof req.body?.message === "string" ? req.body.message : "";
  req.piiSafeMessage = maskPII(rawMessage);
  return next();
}

module.exports = {
  maskPII,
  piiFilterMessage,
};
