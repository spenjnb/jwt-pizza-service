const express = require("express");
const { authRouter, setAuthUser } = require("./routes/authRouter.js");
const orderRouter = require("./routes/orderRouter.js");
const franchiseRouter = require("./routes/franchiseRouter.js");
const version = require("./version.json");
const config = require("./config.js");
const metrics = require("./metrics.js");
const { httpLogger } = require("./middleware/httpLogger.js");
const logger = require("./logger.js");

const app = express();

app.use(express.json({ limit: "1mb" }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    logger.warn(`Invalid JSON payload from ${req.method} ${req.originalUrl}`);
    return res.status(400).json({ message: "Invalid JSON payload." });
  }
  next();
});

app.use(metrics.requestTracker);

app.use(setAuthUser);

app.use(httpLogger);

const apiRouter = express.Router();
app.use("/api/v1", apiRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/order", orderRouter);
apiRouter.use("/franchise", franchiseRouter);

apiRouter.use("/docs", async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied." });
    }

    const endpoints = [
      ...(authRouter.endpoints || []),
      ...(orderRouter.endpoints || []),
      ...(franchiseRouter.endpoints || []),
    ];

    res.json({
      version: version.version,
      endpoints: endpoints,
      config: {
        factory: config.factory.url,
        // db: config.db.connection.host, // Removed to prevent exposure
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to JWT Pizza",
    version: config.env === "development" ? version.version : undefined,
  });
});

app.use("*", (req, res) => {
  logger.warn(`Unknown endpoint accessed: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: "Unknown endpoint.",
  });
});

app.use(async (err, req, res) => {
  try {
    await logger.logException({
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      user: req.user ? req.user.id : null,
    });

    const status = err.statusCode || 500;
    const response = { message: err.message };

    if (config.env === "development") {
      response.stack = err.stack;
    }

    res.status(status).json(response);
  } catch (loggingError) {
    console.error("Error logging exception:", loggingError);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = app;
