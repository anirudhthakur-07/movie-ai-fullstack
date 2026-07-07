// Enterprise AI Observability Platform Logger
// Tracks and aggregates rich AI usage statistics, latencies, tokens, and estimated cost metrics.
class AILogger {
  constructor() {
    this.logs = [];
    this.stats = {
      totalRequests: 0,
      geminiRequests: 0,
      localRequests: 0,
      toolCalls: 0,
      totalCost: 0,
      totalDuration: 0,
      cacheHits: 0,
      failures: 0
    };
  }

  logRequest({ 
    intent, 
    confidence = 1.0,
    promptSize = 0, 
    promptTokens = 0, 
    responseTokens = 0, 
    backendLatency = 0, 
    geminiLatency = 0, 
    cacheHit = false, 
    success = true, 
    toolCalled = null,
    error = null 
  }) {
    const totalDuration = backendLatency + geminiLatency;
    const isGemini = promptTokens > 0 || geminiLatency > 0;
    
    // Estimate cost based on standard Gemini 2.0/2.5 Flash Lite pricing:
    // Input: $0.075 per 1M tokens ($0.000075 per 1K)
    // Output: $0.30 per 1M tokens ($0.0003 per 1K)
    const costUSD = isGemini 
      ? (promptTokens * 0.000075 / 1000) + (responseTokens * 0.0003 / 1000)
      : 0;

    const entry = {
      timestamp: new Date().toISOString(),
      intent,
      confidenceScore: Number(confidence) || 1.0,
      promptSize,
      tokens: {
        prompt: promptTokens,
        response: responseTokens,
        total: promptTokens + responseTokens
      },
      latencies: {
        backend: backendLatency,
        gemini: geminiLatency,
        total: totalDuration
      },
      costUSD,
      cacheHit: !!cacheHit,
      success: !!success,
      toolCalled: toolCalled || null,
      error: error ? error.message || error : null
    };

    // Update aggregate stats
    this.stats.totalRequests++;
    if (isGemini) {
      this.stats.geminiRequests++;
    } else {
      this.stats.localRequests++;
    }
    if (toolCalled) {
      this.stats.toolCalls++;
    }
    if (cacheHit) {
      this.stats.cacheHits++;
    }
    if (!success) {
      this.stats.failures++;
    }
    this.stats.totalCost += costUSD;
    this.stats.totalDuration += totalDuration;

    this.logs.push(entry);
    if (this.logs.length > 500) {
      this.logs.shift(); // Cap logs to latest 500 events
    }

    console.log(
      `[NYX METRIC] Intent: ${intent} | Success: ${success} | Tool: ${toolCalled || "none"} | ` +
      `Duration: ${totalDuration}ms (LLM: ${geminiLatency}ms) | Tokens: ${promptTokens + responseTokens} | Cost: $${costUSD.toFixed(7)}`
    );

    if (error) {
      console.error(`[NYX EXCEPTION]`, error);
    }
  }

  getLogs() {
    // Return aggregated stats summary alongside individual logs
    const avgLatency = this.stats.totalRequests > 0 
      ? Math.round(this.stats.totalDuration / this.stats.totalRequests)
      : 0;

    const cacheHitRatio = this.stats.totalRequests > 0
      ? Number((this.stats.cacheHits / this.stats.totalRequests).toFixed(2))
      : 0;

    return {
      summary: {
        ...this.stats,
        averageLatencyMs: avgLatency,
        cacheHitRatio,
        healthStatus: this.stats.failures > 5 ? "degraded" : "healthy",
        uptimeSeconds: Math.round(process.uptime())
      },
      events: this.logs
    };
  }
}

module.exports = new AILogger();
