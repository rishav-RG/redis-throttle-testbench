import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL, {
  tls: {}, // required for Upstash
  maxRetriesPerRequest: 3,
});
redis.on("connect", () => {
  console.log("[REDIS] Connected");
});

redis.on("ready", () => {
  console.log("[REDIS] Ready");
});

redis.on("error", (err) => {
  console.error("[REDIS ERROR]", err.message);
});

redis.on("close", () => {
  console.log("[REDIS] Connection closed");
});
