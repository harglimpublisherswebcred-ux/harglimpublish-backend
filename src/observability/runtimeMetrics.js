const MAX_SAMPLES = 2000;

class RuntimeMetrics {
  constructor() {
    this.reset();
  }

  reset() {
    this.startedAt = new Date();
    this.totalRequests = 0;
    this.inFlight = 0;
    this.statusClasses = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
    this.durations = [];
  }

  requestStarted() {
    this.inFlight += 1;
  }

  requestCompleted({ durationMs, statusCode }) {
    this.inFlight = Math.max(this.inFlight - 1, 0);
    this.totalRequests += 1;
    const statusClass = `${Math.floor(Number(statusCode) / 100)}xx`;
    if (this.statusClasses[statusClass] !== undefined) this.statusClasses[statusClass] += 1;
    this.durations.push(Math.max(Number(durationMs) || 0, 0));
    if (this.durations.length > MAX_SAMPLES) this.durations.shift();
  }

  percentile(percentile) {
    if (this.durations.length === 0) return 0;
    const sorted = [...this.durations].sort((left, right) => left - right);
    const index = Math.min(Math.ceil((percentile / 100) * sorted.length) - 1, sorted.length - 1);
    return Math.round(sorted[Math.max(index, 0)]);
  }

  snapshot() {
    const memory = process.memoryUsage();
    const average = this.durations.length
      ? this.durations.reduce((sum, value) => sum + value, 0) / this.durations.length
      : 0;
    return {
      startedAt: this.startedAt,
      uptimeSeconds: Math.round(process.uptime()),
      requests: {
        total: this.totalRequests,
        inFlight: this.inFlight,
        statusClasses: { ...this.statusClasses },
        sampleSize: this.durations.length,
        durationMs: {
          average: Math.round(average),
          p50: this.percentile(50),
          p95: this.percentile(95),
          p99: this.percentile(99)
        }
      },
      memoryBytes: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external
      }
    };
  }
}

module.exports = new RuntimeMetrics();
module.exports.RuntimeMetrics = RuntimeMetrics;
