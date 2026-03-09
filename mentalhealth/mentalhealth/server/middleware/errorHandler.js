function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const message = statusCode >= 500 ? "Internal server error" : err.message;

  if (!isProduction) {
    console.error("[error]", {
      path: req.path,
      method: req.method,
      statusCode,
      message: err.message,
    });
  } else {
    console.error("[error]", {
      path: req.path,
      method: req.method,
      statusCode,
    });
  }

  return res.status(statusCode).json({ error: message });
}

module.exports = { errorHandler };
