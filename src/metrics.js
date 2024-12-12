const os = require("os");
const fetch = require("node-fetch");
const config = require("./config.js");

class MetricBuilder {
  constructor() {
    this.lines = [];
  }

  addMeasurement(measurement, tags = {}, fields = {}) {
    const tagStr = Object.entries(tags)
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    const fieldStr = Object.entries(fields)
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    const line = tagStr
      ? `${measurement},${tagStr} ${fieldStr}`
      : `${measurement} ${fieldStr}`;
    this.lines.push(line);
  }

  toString(separator = "\n") {
    return this.lines.join(separator);
  }
}

class Metrics {
  constructor() {
    this.source = config.metrics.source;
    this.userId = config.metrics.userId;
    this.url = config.metrics.url;
    this.apiKey = config.metrics.apiKey;

    // Initialize metric counters
    this.requestCounts = { GET: 0, POST: 0, PUT: 0, DELETE: 0 };
    this.activeUsers = new Set();
    this.authSuccessCount = 0;
    this.authFailureCount = 0;
    this.ordersCount = 0;
    this.creationFailures = 0;
    this.revenueTotal = 0;
    this.pizzaCreationLatencies = [];

    // Set reporting interval (e.g., every 60 seconds)
    this.reportingInterval = 60000;
    this.intervalId = setInterval(
      () => this.reportMetrics(),
      this.reportingInterval
    );
    this.intervalId.unref();
  }

  // Middleware to track HTTP requests
  requestTracker = (req, res, next) => {
    const method = req.method;
    if (this.requestCounts[method] !== undefined) {
      this.requestCounts[method]++;
      console.log(
        `HTTP Request - Method: ${method}, Count: ${this.requestCounts[method]}`
      );
    }

    if (req.user && req.user.id) {
      this.activeUsers.add(req.user.id);
      console.log(`Active Users: ${this.activeUsers.size}`);
    }

    next();
  };

  // Record authentication attempts
  recordAuthAttempt(success) {
    if (success) {
      this.authSuccessCount++;
      console.log(`Auth Success Count: ${this.authSuccessCount}`);
    } else {
      this.authFailureCount++;
      console.log(`Auth Failure Count: ${this.authFailureCount}`);
    }
  }

  // Record pizza orders
  recordOrder(items, success, latencyMs) {
    if (success && Array.isArray(items)) {
      this.ordersCount += items.length;
      let sum = 0;
      for (const item of items) {
        sum += item.price;
      }
      this.revenueTotal += sum;
      console.log(
        `Orders Count: ${this.ordersCount}, Revenue Total: ${this.revenueTotal}`
      );

      if (latencyMs !== undefined) {
        this.pizzaCreationLatencies.push(latencyMs);
        console.log(`Pizza Creation Latency Recorded: ${latencyMs} ms`);
      }
    } else {
      this.creationFailures++;
      console.log(`Creation Failures: ${this.creationFailures}`);
    }
  }

  // Report metrics to Grafana
  async reportMetrics() {
    try {
      const buf = new MetricBuilder();

      // HTTP request metrics
      for (const [method, count] of Object.entries(this.requestCounts)) {
        buf.addMeasurement(
          "http_requests",
          { source: this.source, method },
          { total: count }
        );
      }

      // Active users
      buf.addMeasurement(
        "active_users",
        { source: this.source },
        { count: this.activeUsers.size }
      );

      // Authentication attempts
      buf.addMeasurement(
        "auth_attempts",
        { source: this.source },
        { success: this.authSuccessCount, failure: this.authFailureCount }
      );

      // System metrics
      const cpuUsage = this.getCpuUsagePercentage();
      const memUsage = this.getMemoryUsagePercentage();
      buf.addMeasurement(
        "system_metrics",
        { source: this.source },
        { cpu_usage: cpuUsage, memory_usage: memUsage }
      );

      // Pizza metrics
      buf.addMeasurement(
        "pizza_metrics",
        { source: this.source },
        {
          sold: this.ordersCount,
          failures: this.creationFailures,
          revenue: this.revenueTotal,
        }
      );

      // Latency metrics
      let avgLatency = 0;
      if (this.pizzaCreationLatencies.length > 0) {
        const sum = this.pizzaCreationLatencies.reduce((a, b) => a + b, 0);
        avgLatency = sum / this.pizzaCreationLatencies.length;
      }
      buf.addMeasurement(
        "pizza_latency",
        { source: this.source },
        { average_ms: avgLatency }
      );

      const metrics = buf.toString("\n");
      console.log("Metrics being sent to Grafana:\n", metrics);

      // Send to Grafana
      await this.sendToGrafana(metrics);

      // Reset counters
      this.resetCounters();
    } catch (error) {
      console.log("Error sending metrics", error);
    }
  }

  // Helper to send metrics to Grafana
  async sendToGrafana(metrics, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(this.url, {
          method: "POST",
          body: metrics,
          headers: {
            Authorization: `Bearer ${this.userId}:${this.apiKey}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Attempt ${attempt}: ${response.statusText}`);
        }
        console.log("Metrics pushed successfully");
        return;
      } catch (error) {
        console.error(`Failed to push metrics (Attempt ${attempt}):`, error);
        if (attempt === retries) {
          console.error("All retry attempts failed.");
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise((res) => setTimeout(res, 1000 * attempt));
        }
      }
    }
  }

  // Reset metric counters after reporting
  resetCounters() {
    for (const method in this.requestCounts) {
      this.requestCounts[method] = 0;
    }

    this.activeUsers.clear();
    this.authSuccessCount = 0;
    this.authFailureCount = 0;
    this.ordersCount = 0;
    this.creationFailures = 0;
    this.revenueTotal = 0;
    this.pizzaCreationLatencies = [];
  }

  // System metrics helpers
  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return (cpuUsage * 100).toFixed(2);
  }

  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }
}

const metrics = new Metrics();
module.exports = metrics;
