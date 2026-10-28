# Codeleet REST API

Express API on port 5000 with PostgreSQL persistence and a BullMQ producer. The separate `worker/` process consumes and judges submissions.

## Setup

1. Set `DATABASE_URL` to a PostgreSQL connection string.
2. Optionally set `PORT` (default `5000`), `REDIS_HOST` (default `localhost`), `REDIS_PORT` (default `6379`), and `CORS_ORIGIN` (default `http://localhost:3000`).
3. Run `npm run db:init` to create the tables and enums.
4. Ensure PostgreSQL, Redis, and Judge0 CE are available, then run `npm run server:dev` and `npm run worker:dev` in separate terminals.

Create submission requests with UUIDs for both `problemId` and `userId`; users can be inserted into the `users` table by the application/auth layer. The create-problem route returns generated problem IDs. Public problem routes explicitly select only public columns, never `hiddenCases`.

The worker consumes `submission_queue` with concurrency 5, sends each hidden case to `JUDGE0_URL` (default `http://judge0:2358`), updates the submission row, then publishes completion JSON on Redis channel `submission_events`.
