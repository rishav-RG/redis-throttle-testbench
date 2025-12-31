import { redis } from "../Redis/redisClient.js";

// Middleware to check cache for a specific key
export const getCachedData = (key) => async (req, res, next) => {
  try {
    const data = await redis.get(key);
    if (data) {
      console.log(`[CACHE HIT] Key: ${key}`);
      res.setHeader("X-Cache-Status", "HIT");
      return res.json({ [key]: JSON.parse(data) });
    }
    console.log(`[CACHE MISS] Key: ${key}`);
    res.setHeader("X-Cache-Status", "MISS");
    next();
  } catch (error) {
    console.error(`[CACHE ERROR] Key: ${key}, Error:`, error.message);
    next(error);
  }
};

// Middleware to check cache for product by ID
export const getCachedProduct = () => (req, res, next) => {
  const { id } = req.params;
  const key = `product:${id}`;

  redis
    .get(key)
    .then((data) => {
      if (data) {
        console.log(`[CACHE HIT] Product ID: ${id}`);
        res.setHeader("X-Cache-Status", "HIT");
        return res.status(200).json(JSON.parse(data));
      }
      console.log(`[CACHE MISS] Product ID: ${id}`);
      res.setHeader("X-Cache-Status", "MISS");
      return next();
    })
    .catch((error) => {
      console.error(`[CACHE ERROR] Product ID: ${id}, Error:`, error.message);
      return next(error);
    });
};

// Rate limiting middleware
export const rateLimiter =
  ({ limit = 20, timer = 60, keys }) =>
  async (req, res, next) => {
    try {
      const clientIP =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      const key = `${clientIP}:${keys}:request_count`;

      const request_count = await redis.incr(key);
      let timeRemaining;

      if (request_count === 1) {
        await redis.expire(key, timer);
        timeRemaining = timer;
      } else {
        timeRemaining = await redis.ttl(key);
      }

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, limit - request_count)
      );
      res.setHeader("X-RateLimit-Reset", timeRemaining);

      if (request_count > limit) {
        console.log(
          `[RATE LIMIT] Blocked IP: ${clientIP}, Endpoint: ${keys}, Count: ${request_count}/${limit}`
        );
        return res.status(429).json({
          status: 429,
          message: `Too many requests. Please try again after ${timeRemaining} seconds`,
          details: {
            limit,
            current: request_count,
            timeRemaining,
          },
        });
      }

      console.log(
        `[RATE LIMIT] Allowed IP: ${clientIP}, Endpoint: ${keys}, Count: ${request_count}/${limit}`
      );
      next();
    } catch (error) {
      console.error("[RATE LIMIT ERROR]", error.message);
      next(error);
    }
  };
