import "dotenv/config";
import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { Pool } from "pg";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = Number(process.env.REDIS_PORT || 6379);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const judge0Url = (process.env.JUDGE0_URL || "http://judge0:2358").replace(/\/$/, "");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL must be set to connect to PostgreSQL.");

const pool = new Pool({ connectionString: databaseUrl });
pool.on("error", (error) => console.error("Unexpected PostgreSQL pool error", error));

const connectionOptions = { host: redisHost, port: redisPort, password: redisPassword, maxRetriesPerRequest: null as null };
const publisher = new IORedis(connectionOptions);

type TestCase = { input: string; output: string };
type SubmissionJob = {
  submissionId: string;
  problemId: string;
  userId: string;
  languageId: number;
  code: string;
};
type Judge0Result = {
  status?: { id?: number; description?: string };
  time?: string | number | null;
  memory?: number | null;
};
type Verdict = "AC" | "WA" | "TLE" | "RE" | "CE";

function verdictForStatus(statusId: number | undefined): Verdict {
  if (statusId === 4) return "WA";
  if (statusId === 5) return "TLE";
  if (statusId === 6) return "CE";
  if (statusId !== 3) return "RE";
  return "AC";
}

async function executeCase(job: SubmissionJob, testCase: TestCase, timeLimit: number, memoryLimit: number) {
  const response = await fetch(`${judge0Url}/submissions?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      source_code: job.code,
      language_id: job.languageId,
      stdin: testCase.input,
      expected_output: testCase.output,
      cpu_time_limit: timeLimit,
      memory_limit: memoryLimit * 1024,
    }),
  });
  if (!response.ok) throw new Error(`Judge0 returned HTTP ${response.status}`);
  return await response.json() as Judge0Result;
}

async function processSubmission(job: Job<SubmissionJob>) {
  const { submissionId, problemId, userId, languageId, code } = job.data;
  if (!submissionId || !problemId || !userId || !Number.isInteger(languageId) || typeof code !== "string") {
    throw new Error("Malformed submission job payload");
  }

  const { rows } = await pool.query(
    `SELECT "timeLimit", "memoryLimit", "hiddenCases" FROM problems WHERE id = $1`,
    [problemId],
  );
  if (!rows[0]) throw new Error(`Problem ${problemId} does not exist`);

  const timeLimit = Number(rows[0].timeLimit);
  const memoryLimit = Number(rows[0].memoryLimit);
  const hiddenCases = rows[0].hiddenCases as TestCase[];
  if (!Array.isArray(hiddenCases)) throw new Error(`Problem ${problemId} has invalid hidden cases`);

  await pool.query(`UPDATE submissions SET status = 'PROCESSING' WHERE id = $1`, [submissionId]);

  let verdict: Verdict = "AC";
  let executionTimeMs = 0;
  let memoryMb = 0;

  for (const testCase of hiddenCases) {
    const result = await executeCase({ submissionId, problemId, userId, languageId, code }, testCase, timeLimit, memoryLimit);
    const statusId = result.status?.id;
    verdict = verdictForStatus(statusId);
    executionTimeMs = Math.max(executionTimeMs, Number(result.time ?? 0) * 1000);
    memoryMb = Math.max(memoryMb, Number(result.memory ?? 0) / 1024);
    if (verdict !== "AC") break;
  }

  await pool.query(
    `UPDATE submissions
     SET status = 'COMPLETED', verdict = $2, "executionTime" = $3, memory = $4
     WHERE id = $1`,
    [submissionId, verdict, executionTimeMs, memoryMb],
  );

  const event = JSON.stringify({ submissionId, userId, verdict, executionTime: executionTimeMs, memory: memoryMb, status: "COMPLETED" });
  await publisher.publish("submission_events", event);
  return { submissionId, verdict };
}

const worker = new Worker<SubmissionJob>("submission_queue", processSubmission, {
  connection: connectionOptions,
  concurrency: 5,
});

worker.on("completed", (job, result) => console.log(`Submission ${job.id} completed: ${result.verdict}`));
worker.on("failed", (job, error) => console.error(`Submission job ${job?.id ?? "unknown"} failed`, error));
worker.on("error", (error) => console.error("BullMQ worker error", error));

console.log(`Submission worker listening on Redis ${redisHost}:${redisPort}; Judge0 at ${judge0Url}`);

let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await worker.close();
  await Promise.allSettled([publisher.quit(), pool.end()]);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
