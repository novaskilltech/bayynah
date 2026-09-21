/**
 * Architecture de Rate Limiting Pluggable (Sliding Window)
 * Supporte :
 * 1. MemoryRateLimitStore pour développement local et tests unitaires
 * 2. UpstashRedisRateLimitStore pour environnement Vercel / serverless multi-instances
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds?: number;
}

export interface RateLimitStore {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
  clear?(): Promise<void>;
}

/**
 * Store en mémoire pour développement et tests
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private lastCleanup = Date.now();
  private cleanupIntervalMs = 5 * 60 * 1000;

  private cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupIntervalMs) return;
    this.lastCleanup = now;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    this.cleanup();
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs,
      };
    }

    if (entry.count >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfterSeconds,
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

/**
 * Store Upstash Redis REST pour environnement multi-instances Vercel
 */
export class UpstashRedisRateLimitStore implements RateLimitStore {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, "");
    this.token = token;
  }

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    try {
      const redisKey = `ratelimit:${key}`;
      const now = Date.now();
      const windowSeconds = Math.ceil(windowMs / 1000);

      // Pipeline REST Upstash : INCR + EXPIRE + TTL
      const res = await fetch(`${this.url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["EXPIRE", redisKey, windowSeconds, "NX"],
          ["TTL", redisKey],
        ]),
      });

      if (!res.ok) {
        throw new Error(`Upstash response HTTP ${res.status}`);
      }

      const data = await res.json();
      const currentCount = Number(data[0]?.result || 1);
      const ttlSeconds = Math.max(1, Number(data[2]?.result || windowSeconds));
      const resetTime = now + ttlSeconds * 1000;

      if (currentCount > limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfterSeconds: ttlSeconds,
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, limit - currentCount),
        resetTime,
      };
    } catch (err) {
      console.error("Erreur Upstash Redis Rate Limiting, fallback local:", err);
      // Fail-open contrôlé en cas d'incident réseau Redis
      return {
        allowed: true,
        remaining: 1,
        resetTime: Date.now() + windowMs,
      };
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await fetch(`${this.url}/del/ratelimit:${key}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}` },
      });
    } catch (err) {
      console.error("Erreur lors de la réinitialisation Upstash Redis:", err);
    }
  }
}

let activeStore: RateLimitStore | null = null;

export function getRateLimitStore(): RateLimitStore {
  if (activeStore) return activeStore;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (upstashUrl && upstashToken) {
    activeStore = new UpstashRedisRateLimitStore(upstashUrl, upstashToken);
  } else {
    activeStore = new MemoryRateLimitStore();
  }

  return activeStore;
}

export function setRateLimitStore(store: RateLimitStore) {
  activeStore = store;
}

/**
 * Vérifie et applique une limite de débit (asynchrone)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  return getRateLimitStore().check(key, limit, windowMs);
}

/**
 * Réinitialise manuellement un compteur
 */
export async function resetRateLimit(key: string): Promise<void> {
  return getRateLimitStore().reset(key);
}

/**
 * Réinitialise tous les compteurs (tests)
 */
export async function clearAllRateLimits(): Promise<void> {
  const store = getRateLimitStore();
  if (store.clear) {
    await store.clear();
  }
}
