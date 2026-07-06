// Simple in-memory cache to manage rate limits and save tokens on free tier keys
class CacheService {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = 300) {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
  }

  clear() {
    this.cache.clear();
  }

  clearUserCache(userId) {
    if (!userId) return;
    const prefix = `${userId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new CacheService();
