function logInfo(message, metadata = {}) {
  console.log("[info]", { message, ...metadata });
}

function logError(message, metadata = {}) {
  console.error("[error]", { message, ...metadata });
}

function logWarn(message, metadata = {}) {
  console.warn("[warn]", { message, ...metadata });
}

module.exports = {
  logInfo,
  logWarn,
  logError,
};
