"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { runLengthMs, viewAt, type IngestionSubject, type Outcome, type RunView } from "@/app/pages/_shared/dataset-upload/ingestion";

// The lab's own run: a store that starts a simulated ingestion (the same one the project page uses,
// from `_shared/dataset-upload/ingestion.ts`) with a speed control, so the options can be judged
// without waiting. Progress is derived from elapsed time, so it survives a re-render, a navigation
// (the store is module state) and a speed change (the elapsed time so far is banked, then continues
// at the new speed).

export type LabSpeed = 1 | 5 | 20;

/** The lab ingests one file: only one dataset can be uploaded at a time. */
export const LAB_SUBJECT: IngestionSubject = { fileName: "Site Visit Species Load Template.xlsx", rows: 78, projectCode: "BD-4988" };

/** What the ingestion adds to the project's records: one new site, its visits, and the occurrences. */
export const NEW_SITE = { code: "SU00511", visits: [{ code: "VU00511", rows: 26 }, { code: "VU00512", rows: 28 }, { code: "VU00513", rows: 24 }] };

interface LabState {
  /** Null until the first run starts. */
  run: { outcome: Outcome; bankedMs: number; since: number; speed: LabSpeed } | null;
  speed: LabSpeed;
  start: (outcome: Outcome) => void;
  setSpeed: (speed: LabSpeed) => void;
  reset: () => void;
}

const elapsedOf = (run: NonNullable<LabState["run"]>, now: number) => Math.min(runLengthMs(run.outcome), run.bankedMs + (now - run.since) * run.speed);

export const useIngestionLab = create<LabState>((set, get) => ({
  run: null,
  speed: 1,
  start: (outcome) => set({ run: { outcome, bankedMs: 0, since: Date.now(), speed: get().speed } }),
  setSpeed: (speed) => {
    const { run } = get();
    const now = Date.now();
    set({ speed, run: run ? { ...run, bankedMs: elapsedOf(run, now), since: now, speed } : run });
  },
  reset: () => set({ run: null }),
}));

/** The current view of the run, re-rendered while it is in progress. */
export function useRunView(): RunView | null {
  const run = useIngestionLab((s) => s.run);
  const [now, setNow] = useState(() => Date.now());
  const running = !!run && elapsedOf(run, now) < runLengthMs(run.outcome) - 1e-6;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);
  // A run started after the last tick would otherwise read a stale `now`.
  return run ? viewAt(run.outcome, elapsedOf(run, Math.max(now, run.since)), LAB_SUBJECT, run.speed) : null;
}
