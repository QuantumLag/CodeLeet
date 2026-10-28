import { app } from "./app";
import { config } from "./config";
import { pool } from "./db";
import { redisConnection, submissionQueue } from "./queue";

const server = app.listen(config.port, () => console.log(`REST API listening on port ${config.port}`));

async function shutdown() {
  server.close();
  await Promise.allSettled([submissionQueue.close(), redisConnection.quit(), pool.end()]);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
