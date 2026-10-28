import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: process.env.DATABASE_URL,
  redisHost: process.env.REDIS_HOST ?? "localhost",
  redisPort: Number(process.env.REDIS_PORT ?? 6379),
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
};

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL must be set to connect to PostgreSQL.");
}
