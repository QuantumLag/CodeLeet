CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE submission_verdict AS ENUM ('PENDING', 'AC', 'WA', 'TLE', 'RE', 'CE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0)
);

INSERT INTO users (id, username, score)
VALUES ('00000000-0000-4000-8000-000000000001', 'demo-user', 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "timeLimit" DOUBLE PRECISION NOT NULL CHECK ("timeLimit" > 0),
  "memoryLimit" DOUBLE PRECISION NOT NULL CHECK ("memoryLimit" > 0),
  "sampleCases" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "hiddenCases" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "problemId" UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "languageId" INTEGER NOT NULL,
  code TEXT NOT NULL,
  status submission_status NOT NULL DEFAULT 'PENDING',
  verdict submission_verdict NOT NULL DEFAULT 'PENDING',
  "executionTime" DOUBLE PRECISION,
  memory DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS submissions_user_verdict_idx ON submissions ("userId", verdict);
CREATE INDEX IF NOT EXISTS submissions_problem_idx ON submissions ("problemId");
