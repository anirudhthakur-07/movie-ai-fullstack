// Backend AI observability logger to track request statistics and rate limit warnings
class AILogger {
  constructor() {
    this.logs = [];
  }

  logRequest({ intent, promptSize, tokens, duration, cacheHit, success, error = null }) {
    const entry = {
      timestamp: new Date().toISOString(),
      intent,
      promptSize,
      tokens: tokens || 0,
      duration: `${duration}ms`,
      cacheHit: !!cacheHit,
      success: !!success,
      error: error ? error.message || error : null
    };

    this.logs.push(entry);
    if (this.logs.length > 500) {
      this.logs.shift(); // Keep logs capped to latest 500 events
    }

    console.log(`[NYX LOG] Intent: ${intent} | Success: ${success} | Duration: ${duration}ms | CacheHit: ${cacheHit} | Tokens: ${tokens || 0}`);
    if (error) {
      console.error(`[NYX ERROR]`, error);
    }
  }

  getLogs() {
    return this.logs;
  }
}

module.exports = new AILogger();
