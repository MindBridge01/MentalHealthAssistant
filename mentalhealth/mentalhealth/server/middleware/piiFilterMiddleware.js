const { maskPII } = require("../services/messageSanitizerService");

function piiFilterMessage(req, _res, next) {
  const rawMessage = typeof req.body?.message === "string" ? req.body.message : "";
  req.piiSafeMessage = maskPII(rawMessage);
  return next();
}

module.exports = {
  maskPII,
  piiFilterMessage,
};
