import Redis from "ioredis";
import dotenv from "dotenv";

// Load environment variables if not already loaded
if (!process.env.REDIS_HOST) {
  dotenv.config({ path: ".env.local" });
}

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
   password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,

};

// Add password only if provided
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

const redis = new Redis(redisConfig);

export default redis;
