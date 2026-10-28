# Codeleet Online Judge — Product Requirements and Operating Guide

## Product summary

Codeleet is a web application for creating programming problems, submitting solutions, judging them against hidden test cases, and viewing a participant leaderboard. The frontend is built with Next.js App Router and Tailwind CSS. The REST API uses Express, PostgreSQL stores application data, BullMQ/Redis carries submission jobs, Judge0 CE compiles and runs untrusted code, and a Socket.io gateway streams completed verdicts to browsers.

This repository currently provides a local development stack and the first end-to-end implementation of those services. It is not ready for public production use until the authentication, authorization, execution isolation, and automated test gaps described below are addressed.

## User-facing requirements

- Participants can browse problems at `/problems`, view a problem and its public examples at `/problems/:id`, select Python (Judge0 71), C++ (54), or Java (62), and submit source code.
- A submitted solution is recorded as `PENDING`, processed asynchronously, and then reported as `AC`, `WA`, `TLE`, `RE`, or `CE`.
- Admins can create a problem with its statement, time and memory limits, sample cases, and hidden cases at `/admin/problems/create`.
- Participants can view accepted-solution counts on `/leaderboard`.
- Public problem read endpoints must never return hidden test cases.

## System components and connection map

| Component | Address / connection | Responsibility |
| --- | --- | --- |
| Browser frontend | `http://localhost:3000` | Problem pages, creator form, leaderboard, code editor and live badge |
| Express API | Browser: `http://localhost:5000/api`; Compose DNS: `backend-api:5000` | Validates requests, reads/writes application data, enqueues submissions |
| PostgreSQL | Compose DNS `postgres:5432`; application database `codeleet` | Users, problems, submissions; Compose init also creates Judge0's `judge0` database |
| Redis | Compose DNS `redis:6379` | BullMQ queue plus Judge0 queue/cache and platform Pub/Sub (separate key/channel namespaces) |
| Platform execution worker | Compose DNS `worker` | Consumes `submission_queue`, reads hidden cases, calls Judge0, saves verdict and publishes event |
| Judge0 API | Compose DNS `judge0:2358` | Receives one execution request per hidden case |
| Judge0 execution service | Compose DNS `judge0-executor` | Executes Judge0 jobs in its isolate runtime |
| WebSocket gateway | Browser: `http://localhost:5001`; Compose DNS `websocket-server:5001` | Subscribes to `submission_events` and broadcasts `submission_update` via Socket.io |

The end-to-end submission path is:

```text
Browser --POST /api/submissions--> Express API --insert--> PostgreSQL
                                      |
                                      +--enqueue submission_queue--> Redis
                                                                    |
Platform worker <--consume------------------------------------------+
      | read problem limits/hidden cases
      +--POST each case--> Judge0 API --> Judge0 executor
      | update final verdict --> PostgreSQL
      +--PUBLISH submission_events--> Redis --> WebSocket gateway
                                                   +--submission_update--> Browser
```

The browser calls the host-published API and Socket.io URLs. These are build-time configurable through `NEXT_PUBLIC_API_BASE` and `NEXT_PUBLIC_SOCKET_URL`. Container-to-container requests use Compose DNS names; `localhost` inside a container refers to that container itself.

## API contract

| Method and path | Request / response behavior |
| --- | --- |
| `POST /api/problems` | Accepts title, description, numeric `timeLimit` and `memoryLimit`, `sampleCases`, and `hiddenCases`; returns the created problem without hidden cases. |
| `GET /api/problems` | Lists public problem fields and omits `hiddenCases`. |
| `GET /api/problems/:id` | Returns one problem and omits `hiddenCases`. |
| `POST /api/submissions` | Accepts `{ problemId, userId, languageId, code }`; returns HTTP 202 with `{ submissionId, status: "PENDING" }`. |
| `GET /api/submissions/:id` | Returns the submission state, verdict, timing and memory measurements. |
| `GET /api/leaderboard` | Returns users ordered by distinct problems accepted. |
| `GET /api/health` | Checks API process and PostgreSQL connectivity. |

The API currently requires UUIDs for users and problem IDs. The schema seeds a local demo user with ID `00000000-0000-4000-8000-000000000001`. A production identity provider and user provisioning path do not exist yet.

## Data and execution behavior

- PostgreSQL tables and enums are in `server/schema.sql`; `docker/postgres-init.sql` creates the separate Judge0 database on first initialization of the Postgres data volume.
- A BullMQ job includes `submissionId`, `problemId`, `userId`, `languageId`, and `code`.
- The platform worker concurrency is 5. For each hidden test case it sends source, language, stdin, expected output, CPU limit in seconds, and memory limit in KB to Judge0.
- The platform worker stops at the first non-accepted test. It stores the maximum reported time and memory across executed test cases (milliseconds and megabytes for the UI), then publishes completion JSON to `submission_events`.
- The WebSocket gateway forwards the parsed event to every connected client. The frontend filters updates by its current `submissionId`.
- Empty hidden-case arrays currently result in `AC`; problem creation should require at least one hidden case before the platform is used for real contests.

## Repository map

- `src/app/` — Next.js routes and global styles.
- `src/components/` — shared shell and live submission badge.
- `src/lib/api.ts` — browser API and Socket.io URLs plus user ID placeholder.
- `server/src/` — Express routes, PostgreSQL pool, BullMQ producer, and DB initializer.
- `server/schema.sql` — application tables, enums, indexes, and demo user.
- `worker/src/index.ts` — BullMQ consumer and Judge0 integration.
- `websocket/src/index.ts` — Redis Pub/Sub to Socket.io bridge.
- `Dockerfile` — build targets for frontend, API, worker, gateway, and database initializer.
- `docker-compose.yml` — local multi-service environment.
- `.env.example` — starter local configuration; copy to `.env` before running Compose.

## Next steps: run locally

Use Docker Desktop with a Linux container engine. Judge0 relies on Linux isolation features; Windows containers are not a supported substitute.

1. From the repository root, create the Compose environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Open `.env` and replace both placeholder passwords. Keep `DATABASE_URL` using the Compose hostname `postgres`, keep browser URLs at localhost for local testing, and ensure `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and the credentials embedded in `DATABASE_URL` stay consistent. If you change Redis password, all services receive it from `REDIS_PASSWORD`.

3. Validate Compose expansion and start the core app without the large Judge0 image:

   ```powershell
   docker compose config --quiet
   docker compose up --build -d
   docker compose ps
   ```

   This builds the app and starts PostgreSQL, Redis, the API, WebSocket gateway, and frontend. The one-shot `db-init` service initializes the application schema. This default profile does not run execution jobs, so submissions will remain pending. Postgres' Judge0 database init script only runs when the Postgres data volume is created for the first time.

   When you want the full local judge and accept its multi-gigabyte image download, start the execution services with:

   ```powershell
   docker compose --profile judge up --build -d
   ```

4. Check service logs and readiness:

   ```powershell
   docker compose logs --tail=100 postgres redis db-init backend-api worker judge0 judge0-executor websocket-server frontend
   Invoke-RestMethod http://localhost:5000/api/health
   Invoke-RestMethod http://localhost:5001/health
   ```

   Open `http://localhost:3000`. Judge0 may take longer than the API to become ready. If the executor reports isolate permission or cgroup errors, stop here and resolve the host/Judge0 runtime compatibility before submitting untrusted code; do not blindly enable full privileged mode.

## Manual end-to-end test

Run these in PowerShell after the full `judge` profile is ready. This creates a small echo problem with a hidden case, submits a Python solution, polls the REST API, and checks the leaderboard. In the lightweight profile, test problem creation/list/detail and leaderboard only; submissions will queue but cannot be evaluated.

```powershell
$problemBody = @{
  title = "Echo test"
  description = "Read stdin and write the same text to stdout."
  timeLimit = 2
  memoryLimit = 128
  sampleCases = @(@{ input = "hello"; output = "hello" })
  hiddenCases = @(@{ input = "hello"; output = "hello" })
} | ConvertTo-Json -Depth 10

$problem = Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/problems `
  -ContentType "application/json" -Body $problemBody
$problem

# Confirm the public detail endpoint has no hiddenCases property.
$detail = Invoke-RestMethod -Uri "http://localhost:5000/api/problems/$($problem.id)"
$detail | ConvertTo-Json -Depth 10

$submissionBody = @{
  problemId = $problem.id
  userId = "00000000-0000-4000-8000-000000000001"
  languageId = 71
  code = "import sys`nsys.stdout.write(sys.stdin.read())"
} | ConvertTo-Json -Depth 10

$submission = Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/submissions `
  -ContentType "application/json" -Body $submissionBody
$submission

for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 2
  $result = Invoke-RestMethod -Uri "http://localhost:5000/api/submissions/$($submission.submissionId)"
  $result
  if ($result.status -eq "COMPLETED") { break }
}

Invoke-RestMethod -Uri http://localhost:5000/api/leaderboard
```

Expected: problem creation returns an ID; detail output contains no `hiddenCases`; submission returns `PENDING` immediately and eventually `COMPLETED` with verdict `AC`; leaderboard shows the demo participant with one solved problem. To check the real-time path, open the problem page in the browser and submit there while watching `docker compose logs -f websocket-server worker`; the status badge should receive `submission_update`.

Then test a wrong answer by submitting code that writes `wrong` and confirm `WA`. Check failure and retry behavior by intentionally stopping Judge0, observing worker logs, then restarting it. Avoid using an infinite loop as an initial safety test until you have verified Judge0 isolation and resource limits on the host.

## Useful operations

```powershell
docker compose logs -f worker websocket-server judge0 judge0-executor
docker compose restart worker
docker compose down                 # stop stack; keep database and Redis volumes
docker compose down -v              # destructive: remove persisted DB/Redis data
```

Use `docker compose down -v` only when you intentionally want to erase all local records. To rerun the database initializer after removing the application schema, run `docker compose run --rm db-init`.

## Deployment plan

1. **Finish production access control first.** Add authentication, derive `userId` from a verified session/token rather than browser local state, authorize admin problem creation, enforce submission ownership on reads, rate-limit submissions, and protect API errors/logs from exposing secrets. The current API has no authentication and must stay local/private.
2. **Prove Judge0 isolation on the actual Linux host.** The Compose executor intentionally avoids `privileged: true`; test whether its isolate runtime works with the host kernel and configured capabilities. Keep the network internal, Judge0 un-published, user code networking disabled, and no host mounts. Treat user-code execution as a high-risk service and obtain a focused security review before public use.
3. **Pin images and dependencies.** Replace `judge0/judge0:latest` with a tested release, pin base images, generate and commit a lockfile, and build/review immutable artifacts. Judge0 releases and platform requirements can change.
4. **Provision production secrets and persistence.** Use managed secret storage, managed PostgreSQL/Redis or secured persistent volumes, TLS, automated backups, restore drills, log rotation, resource limits, and monitoring/alerts. Do not publish database, Redis, or Judge0 ports publicly.
5. **Set public browser endpoints before building.** Set `NEXT_PUBLIC_API_BASE` and `NEXT_PUBLIC_SOCKET_URL` to HTTPS/WSS endpoints, set `CORS_ORIGIN` and `FRONTEND_ORIGIN` to the real frontend origin, and rebuild the frontend because Next public variables are embedded at build time. Put a TLS reverse proxy/load balancer in front of the frontend, API, and WebSocket gateway; configure WebSocket upgrade forwarding.
6. **Deploy in staging first.** Start the same pinned Compose stack on a Linux staging host, run the manual workflow above, verify AC and WA, inspect that hidden cases never appear in public responses, test Redis/Judge0 restarts, and verify backups and restore. Keep ports bound to loopback when a host-level reverse proxy connects locally.
7. **Add automated checks before production.** Add API integration tests for validation, hidden-case omission, queue enqueueing, status reads, and leaderboard counts; worker tests for every Judge0 status and first-failure behavior; plus a browser smoke test for create/list/detail/submit/live verdict. Add CI to run type checking, lint, tests, and image builds.

## Known gaps and acceptance criteria for production

- No automated test suite or CI workflow currently exists.
- The “Run” button is a UI placeholder; only “Submit code” is wired to the backend.
- There is no login, user creation API, or admin role; the frontend defaults to the seeded demo UUID.
- Admin problem creation has no authorization.
- `judge0/judge0:latest` is mutable; current isolate/cgroup compatibility has not been tested in this environment.
- The stack has basic health endpoints but no readiness coordination for Judge0, metrics, alerts, backups, or resource quotas for all containers.
- The leaderboard currently ranks by distinct accepted problems; the `score` column is a tie-break field and is not updated by the submission worker.

Before public release, require verified user/admin access control, tested sandbox isolation, no hidden-case leakage, successful AC and WA end-to-end flows, production endpoint/TLS configuration, pinned images, recoverable backups, and automated CI checks.
