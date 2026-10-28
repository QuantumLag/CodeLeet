export type TestCase = { input: string; output: string };
export type Problem = { _id?: string; id?: string | number; title: string; description: string; timeLimit: number; memoryLimit: number; sampleCases?: TestCase[] };
export type SubmissionUpdate = { submissionId: string; status: string; verdict?: string; executionTime?: number; memory?: number };
