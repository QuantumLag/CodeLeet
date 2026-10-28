export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";
export const USER_ID = typeof window !== "undefined" ? localStorage.getItem("codeleet-user-id") || "00000000-0000-4000-8000-000000000001" : "00000000-0000-4000-8000-000000000001";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-User-Id": USER_ID, ...init?.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || `Request failed (${response.status})`);
  return body as T;
}

export function getItems<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["data", "problems", "leaderboard", "results"]) if (Array.isArray(record[key])) return record[key] as T[];
  }
  return [];
}
