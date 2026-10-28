"use client";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/lib/api";
import type { SubmissionUpdate } from "@/lib/types";
const styles: Record<string,string> = { PENDING:"bg-amber-50 text-amber-700 ring-amber-200", PROCESSING:"bg-blue-50 text-blue-700 ring-blue-200", AC:"bg-emerald-50 text-emerald-700 ring-emerald-200", WA:"bg-rose-50 text-rose-700 ring-rose-200", TLE:"bg-orange-50 text-orange-700 ring-orange-200", RE:"bg-rose-50 text-rose-700 ring-rose-200", CE:"bg-violet-50 text-violet-700 ring-violet-200" };
export function SubmissionStatus({ submissionId, initialStatus = "PENDING" }: { submissionId: string; initialStatus?: string }) {
  const [update, setUpdate] = useState<SubmissionUpdate>({ submissionId, status: initialStatus });
  useEffect(() => { setUpdate({ submissionId, status: initialStatus }); const socket: Socket = io(SOCKET_URL); const handle=(payload: SubmissionUpdate)=>{if(payload.submissionId===submissionId)setUpdate(payload)}; socket.on("submission_update",handle); return()=>{socket.off("submission_update",handle);socket.disconnect()}; },[submissionId,initialStatus]);
  const verdict=update.verdict || update.status; const key=verdict.toUpperCase(); const pending=key==="PENDING"||key==="PROCESSING";
  return <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"><span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Submission</span><code className="text-xs text-slate-500">{submissionId}</code><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[key]||styles.PENDING}`}>{pending&&<span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current"/>}{pending?key:`Verdict: ${key}`}</span>{update.executionTime!=null&&<span className="text-xs text-slate-500">{update.executionTime} ms</span>}{update.memory!=null&&<span className="text-xs text-slate-500">{update.memory} MB</span>}</div>;
}
