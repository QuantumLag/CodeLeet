import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { z } from "zod";
import { pool } from "./db";
import { submissionQueue } from "./queue";
import { config } from "./config";

export const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));

const testCaseSchema = z.object({ input: z.string(), output: z.string() });
const createProblemSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().min(1),
  timeLimit: z.number().finite().positive(),
  memoryLimit: z.number().finite().positive(),
  sampleCases: z.array(testCaseSchema),
  hiddenCases: z.array(testCaseSchema),
});
const submissionSchema = z.object({
  problemId: z.string().uuid(),
  userId: z.string().uuid(),
  languageId: z.number().int().positive(),
  code: z.string().min(1),
});

app.get("/api/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) { next(error); }
});

app.post("/api/problems", async (req, res, next) => {
  const parsed = createProblemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid problem payload", errors: parsed.error.flatten() });
  const { title, description, timeLimit, memoryLimit, sampleCases, hiddenCases } = parsed.data;
  try {
    const { rows } = await pool.query(
      `INSERT INTO problems (title, description, "timeLimit", "memoryLimit", "sampleCases", "hiddenCases")
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
       RETURNING id, title, description, "timeLimit", "memoryLimit", "sampleCases", "createdAt"`,
      [title, description, timeLimit, memoryLimit, JSON.stringify(sampleCases), JSON.stringify(hiddenCases)],
    );
    return res.status(201).json(rows[0]);
  } catch (error) { return next(error); }
});

app.get("/api/problems", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, "timeLimit", "memoryLimit", "sampleCases", "createdAt"
       FROM problems ORDER BY "createdAt" DESC`,
    );
    return res.json(rows);
  } catch (error) { return next(error); }
});

app.get("/api/problems/:id", async (req, res, next) => {
  if (!z.string().uuid().safeParse(req.params.id).success) return res.status(400).json({ message: "Invalid problem ID" });
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, "timeLimit", "memoryLimit", "sampleCases", "createdAt"
       FROM problems WHERE id = $1`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ message: "Problem not found" });
    return res.json(rows[0]);
  } catch (error) { return next(error); }
});

app.post("/api/submissions", async (req, res, next) => {
  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid submission payload", errors: parsed.error.flatten() });
  const { problemId, userId, languageId, code } = parsed.data;
  const client = await pool.connect();
  let submissionId: string | undefined;
  let committed = false;
  try {
    await client.query("BEGIN");
    const problem = await client.query("SELECT 1 FROM problems WHERE id = $1", [problemId]);
    if (!problem.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Problem not found" });
    }
    const user = await client.query("SELECT 1 FROM users WHERE id = $1", [userId]);
    if (!user.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }
    const inserted = await client.query(
      `INSERT INTO submissions ("problemId", "userId", "languageId", code, status, verdict)
       VALUES ($1, $2, $3, $4, 'PENDING', 'PENDING') RETURNING id`,
      [problemId, userId, languageId, code],
    );
    submissionId = inserted.rows[0].id as string;
    await client.query("COMMIT");
    committed = true;
    await submissionQueue.add("evaluate", { submissionId, problemId, userId, languageId, code }, { jobId: submissionId });
    return res.status(202).json({ submissionId, status: "PENDING" });
  } catch (error) {
    if (committed && submissionId) {
      await pool.query("DELETE FROM submissions WHERE id = $1", [submissionId]).catch(() => undefined);
    } else {
      await client.query("ROLLBACK").catch(() => undefined);
    }
    return next(error);
  } finally {
    client.release();
  }
});

app.get("/api/submissions/:id", async (req, res, next) => {
  if (!z.string().uuid().safeParse(req.params.id).success) return res.status(400).json({ message: "Invalid submission ID" });
  try {
    const { rows } = await pool.query(
      `SELECT id AS "submissionId", "problemId", "userId", "languageId", status, verdict,
              "executionTime", memory, "createdAt"
       FROM submissions WHERE id = $1`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ message: "Submission not found" });
    return res.json(rows[0]);
  } catch (error) { return next(error); }
});

app.get("/api/leaderboard", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id AS "userId", u.username, u.score,
              COUNT(DISTINCT s."problemId") FILTER (WHERE s.verdict = 'AC')::integer AS "solvedCount"
       FROM users u
       LEFT JOIN submissions s ON s."userId" = u.id
       GROUP BY u.id, u.username, u.score
       ORDER BY "solvedCount" DESC, u.score DESC, u.username ASC`,
    );
    return res.json(rows);
  } catch (error) { return next(error); }
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  if (error instanceof SyntaxError && "body" in error) return void res.status(400).json({ message: "Malformed JSON body" });
  return void res.status(500).json({ message: "Internal server error" });
};
app.use(errorHandler);
