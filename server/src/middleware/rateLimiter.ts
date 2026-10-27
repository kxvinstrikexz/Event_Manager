import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up expired keys every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { windowMs, max, message } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Get client IP address
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `${ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();

    let record = memoryStore.get(key);

    if (!record || record.resetAt <= now) {
      record = {
        count: 1,
        resetAt: now + windowMs
      };
      memoryStore.set(key, record);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      next();
      return;
    }

    record.count += 1;
    const remaining = Math.max(0, max - record.count);
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('Retry-After', retryAfterSeconds);

    if (record.count > max) {
      res.status(429).json({
        error: message || 'Too many authentication attempts. Please wait a few minutes before trying again.',
        code: 'TOO_MANY_REQUESTS',
        retryAfterSeconds
      });
      return;
    }

    next();
  };
}

// Preset rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes per IP
  message: 'Too many authentication attempts from this IP address. Please wait 15 minutes before retrying.'
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many password reset requests. Please wait 15 minutes before retrying.'
});
