"use client";
import { useEffect, useState } from "react";

export type Trajectory = {
  summary: { projectsCreated: number; projectsCompleted: number; tasksAssigned: number; tasksCompleted: number; participations: number; comments: number; requestsSent: number; requestsAccepted: number; collaboration: number; fulfillment: number | null; quality: number | null };
  entries: { id: string; date: string; text: string; href: string }[];
};
export function useOwnTrajectory() {
  const [data, setData] = useState<Trajectory | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  useEffect(() => {
    let active = true;
    fetch("/api/profile/trajectory", { credentials: "same-origin", cache: "no-store" }).then(async response => {
      if (!active) return;
      if (response.status === 401) { setStatus("signed-out"); return; }
      if (!response.ok) { setStatus("error"); return; }
      const body: Trajectory = await response.json();
      if (active) { setData(body); setStatus("ready"); }
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);
  return { data, status };
}
