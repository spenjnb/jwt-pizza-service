// src/middleware/httpLogger.js

const logger = require("../logger.js");

const httpLogger = (req, res, next) => {
  const { method, originalUrl, headers, body } = req;
  const hasAuth = Boolean(headers.authorization);

  // Capture request body safely
  const requestBody = body && typeof body === "object" ? { ...body } : {};

  // Initialize variable to capture response details
  let responseBody = null;

  // Preserve the original res.send and res.json methods
  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);

  // Override res.send to capture response body
  res.send = (body) => {
    responseBody = body;
    return originalSend(body);
  };

  // Override res.json to capture response body
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  // Handle the finish event to log the request and response
  res.on("finish", () => {
    const { statusCode } = res;

    // Log the HTTP request and response
    logger
      .logHttpRequest({
        method,
        path: originalUrl,
        statusCode,
        hasAuth,
        requestBody,
        responseBody,
      })
      .catch((error) => {
        console.error("Failed to log HTTP request:", error);
      });
  });

  next();
};

module.exports = { httpLogger };
