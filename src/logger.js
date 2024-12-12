// src/logger.js

const fetch = require("node-fetch");
const config = require("./config.js");

class Logger {
  constructor() {
    this.component = config.logging.component || "jwt-pizza-service-dev"; // Ensure 'component' is defined
    this.userId = config.logging.userId;
    this.url = config.logging.url;
    this.apiKey = config.logging.apiKey;
  }

  /**
   * Sends a log entry to Loki.
   * @param {string} level - The log level (e.g., info, error, warn).
   * @param {string} type - The type of log (e.g., http_request, db_query, exception).
   * @param {object} logBody - Additional structured log data.
   */
  async sendLogToLoki(level, type, logBody = {}) {
    const timestamp = `${Date.now() * 1000000}`; // Convert ms to ns

    const labels = {
      component: this.component,
      level: level,
      type: type,
    };

    const message = JSON.stringify(logBody);

    const streams = [
      {
        stream: labels,
        values: [[timestamp, message]],
      },
    ];

    // Debug: Log the payload being sent
    console.log("Sending log to Loki:", JSON.stringify({ streams }, null, 2));

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.userId}:${this.apiKey}`,
        },
        body: JSON.stringify({ streams }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Failed to send log to Loki:",
          response.status,
          errorText
        );
      } else {
        console.log("Log sent successfully");
      }
    } catch (error) {
      console.error("Error sending log to Loki:", error);
    }
  }

  /**
   * Logs an informational message.
   * @param {string} type - The type of log (e.g., http_request).
   * @param {object} logBody - Additional structured log data.
   */
  async info(type, logBody = {}) {
    await this.sendLogToLoki("info", type, logBody);
  }

  /**
   * Logs an error message.
   * @param {string} type - The type of log (e.g., exception).
   * @param {object} logBody - Additional structured log data.
   */
  async error(type, logBody = {}) {
    await this.sendLogToLoki("error", type, logBody);
  }

  /**
   * Logs a warning message.
   * @param {string} type - The type of log (e.g., warning).
   * @param {object} logBody - Additional structured log data.
   */
  async warn(type, logBody = {}) {
    await this.sendLogToLoki("warn", type, logBody);
  }

  /**
   * Logs HTTP requests.
   * @param {object} params - HTTP request details.
   */
  async logHttpRequest({
    method,
    path,
    statusCode,
    hasAuth,
    requestBody,
    responseBody,
  }) {
    const logData = {
      method,
      path,
      statusCode,
      hasAuth,
      requestBody: this._truncate(JSON.stringify(requestBody)),
      responseBody: this._truncate(JSON.stringify(responseBody)),
    };

    await this.info("http_request", logData);
  }

  /**
   * Logs database queries.
   * @param {object} params - Database query details.
   */
  async logDbQuery({ query, params, durationMs }) {
    const logData = {
      query: this._truncate(query),
      params: this._truncate(JSON.stringify(params)),
      durationMs,
    };

    await this.info("db_query", logData);
  }

  /**
   * Logs exceptions.
   * @param {object} params - Exception details.
   */
  async logException({ message, stack }) {
    const logData = {
      message: this._truncate(message),
      stack: this._truncate(stack),
    };

    await this.error("exception", logData);
  }

  /**
   * Truncates data to a specified maximum length.
   * @param {string|object} data - The data to truncate.
   * @param {number} maxLength - The maximum length of the truncated string.
   * @returns {string} - The truncated string.
   */
  _truncate(data, maxLength = 200) {
    if (!data) return "N/A";
    const stringData = typeof data === "string" ? data : JSON.stringify(data);
    return stringData.length > maxLength
      ? `${stringData.substring(0, maxLength)}...`
      : stringData;
  }
}

const logger = new Logger();
module.exports = logger;
