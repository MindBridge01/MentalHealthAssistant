const { appendMedicalDisclaimer } = require("../services/safeResponseService");

function disclaimerMiddleware(_req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    if (payload && typeof payload === "object" && typeof payload.content === "string") {
      return originalJson({
        ...payload,
        content: appendMedicalDisclaimer(payload.content),
      });
    }

    return originalJson(payload);
  };

  return next();
}

module.exports = { disclaimerMiddleware };
