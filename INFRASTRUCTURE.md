# Local Docker stack

See [PRD.md](./PRD.md) for the architecture map, manual API/worker/WebSocket test, local startup sequence, deployment checklist, and current production gaps.

Copy `.env.example` to `.env` and replace the development passwords, then start the lightweight app stack:

```sh
docker compose up --build
```

This default stack starts PostgreSQL, Redis, the API, WebSocket gateway, and frontend without downloading Judge0. To include the self-hosted execution engine and the platform worker, use `docker compose --profile judge up --build` instead. That option downloads the large Judge0 compiler image.

The frontend is available at `http://localhost:3000`; the REST API and Socket.io gateway use ports 5000 and 5001. PostgreSQL and Redis are published on 5432 and 6379 for local development. These ports bind to loopback only. Judge0 is only exposed to other containers on `judge_net` at `http://judge0:2358`.

The Compose network is internal, Judge0 submissions have `ENABLE_NETWORK=false`, and Judge0's execution worker is not given full privileged mode or host mounts. Its isolate runtime receives only the capabilities needed for sandbox setup. This stack is for local development; the Judge0 isolate runtime depends on Linux kernel features and may need additional host configuration on Docker Desktop.

The official Judge0 deployment uses separate API and execution-worker containers. This stack keeps that split as `judge0` and `judge0-executor`, in addition to the platform's own BullMQ `worker`.

Without the `judge` profile, submissions can still be stored and enqueued, but they remain `PENDING` because no platform worker consumes the queue. Use the profile when you are ready to run end-to-end judging.
