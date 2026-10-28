import { Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "./config";

export const redisConnection = new IORedis({
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword,
  maxRetriesPerRequest: null,
});

export const submissionQueue = new Queue("submission_queue", {
  connection: redisConnection,
});
