"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { RETIRED_SEED_IDS, diffCv, draftOf, formatShortDate, nextCvId, nowIso, openHandouts, seedCvs, sourceTable, todayIso, type Cv, type CvAuditEvent, type CvDraft } from "@/app/pages/_shared/ctrl-vocab/cv-data";
import type { ParsedTemplate } from "@/app/pages/_shared/ctrl-vocab/cv-template";

// Every controlled vocabulary, in a zustand store persisted to localStorage (the same plumbing as
// dsa-store.ts), so the list, a vocabulary's page and the form - separate routes - read and write
// the same records. There is no backend in this build.
//
// Nothing here deletes a vocabulary (REQ-18.6): it is archived, and can be brought back. Every write
// appends to the vocabulary's own history with who, when and the before and after values (REQ-18.11).
// The acting admin is CURRENT_USER_NAME (a placeholder person).

interface CvStoreState {
  cvs: Cv[];
  /** IDs of deleted drafts: never given out again (REQ-18.1). */
  deletedIds: string[];
}

const useCvStore = create<CvStoreState>()(
  persist(() => ({ cvs: seedCvs, deletedIds: [] as string[] }), {
    name: "biodata-ctrl-vocab",
    // 1: identifier kind and template hand-outs. Older records read as Code, no hand-outs.
    // 2: the seeds' template demo reaches browsers that already had data: the seed vocabularies with
    //    a template out get it (and its history line), and Measurement becomes numbered when its codes
    //    are all whole numbers. Vocabularies the admin created are left exactly as they are.
    // 3: realistic seeds replace the Figma-name seeds (the designer, Sept 30 2026: "All the sample
    //    added here are just codes which is looking very confusing"). BIODATA-001 to 011 were always
    //    seeds and are retired, edits to them included; everything created in this browser is kept. A
    //    Descriptive vocabulary saved before entries picked rows gets one entry per row of its table, so
    //    it offers what it offered before.
    // 4: Order became a column a vocabulary chooses (the designer, 30 Sept 2026: "add order option
    //    here"). Every vocabulary saved before then showed it, so each keeps it.
    version: 4,
    migrate: (persisted, version) => {
      const state = persisted as { cvs: Cv[] };
      let cvs: Cv[] = state.cvs.map((cv) => ({ ...cv, idKind: cv.idKind ?? "code", templates: cv.templates ?? [] }));
      if (version < 2)
        cvs = cvs.map((cv) => {
          const seed = seedCvs.find((s) => s.id === cv.id && s.name === cv.name);
          if (!seed) return cv;
          const next = { ...cv };
          if (seed.templates?.length && !cv.templates?.length) {
            next.templates = seed.templates;
            next.history = [...cv.history, ...seed.history.filter((e) => e.action.startsWith("Template"))];
          }
          if (seed.idKind === "number" && cv.entries.every((e) => /^[1-9]\d*$/.test(e.code.trim()))) next.idKind = "number";
          return next;
        });
      if (version < 3) {
        cvs = cvs.filter((cv) => !RETIRED_SEED_IDS.includes(cv.id));
        cvs = cvs.map((cv) => {
          const table = sourceTable(cv.sourceTable);
          if (cv.type !== "descriptive" || cv.entries.length > 0 || !table) return cv;
          return { ...cv, entries: table.rows.map((row) => ({ id: `row-${row[table.key]}`, code: "", name: "", title: "", description: "", value: "", order: "", status: "active" as const, custom: {}, sourceKey: row[table.key] })) };
        });
        cvs = [...seedCvs.filter((seed) => !cvs.some((cv) => cv.id === seed.id)), ...cvs];
      }
      if (version < 4) cvs = cvs.map((cv) => (cv.fields.includes("order") ? cv : { ...cv, fields: ["order", ...cv.fields] }));
      return { cvs, deletedIds: (persisted as { deletedIds?: string[] }).deletedIds ?? [] };
    },
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

export function useCvs(): Cv[] {
  useRehydrate(useCvStore);
  const cvs = useCvStore((s) => s.cvs);
  const volume = useSampleStore((s) => s.volume);
  return useMemo(() => (volume === "300" ? [...cvs, ...placeholderCvs()] : cvs), [cvs, volume]);
}

// ── Sample size (a Prototype tool) ──
// Controlled vocabularies are expected to grow into the hundreds. To see the list at that size before
// real data exists, the Prototype tools bar can add 300 placeholder vocabularies across 24
// categories. They are Scaffold, not sample data: every name says it is a placeholder (CONTRACTS
// 0.3), they are made in memory, never saved, and gone on reload.

type Volume = "seed" | "300";
const useSampleStore = create<{ volume: Volume }>()(() => ({ volume: "seed" }));

export function useSampleVolume(): [Volume, (v: Volume) => void] {
  return [useSampleStore((s) => s.volume), (volume) => useSampleStore.setState({ volume })];
}

let placeholders: Cv[] | null = null;

function placeholderCvs(): Cv[] {
  if (placeholders) return placeholders;
  const pad = (n: number, w = 3) => String(n).padStart(w, "0");
  placeholders = Array.from({ length: 300 }, (_, i): Cv => {
    const n = i + 1;
    const descriptive = n % 7 === 0;
    const month = String((n % 9) + 1).padStart(2, "0");
    return {
      id: `PLACEHOLDER-${pad(n)}`,
      name: `Placeholder vocabulary ${pad(n)}`,
      category: `Placeholder category ${pad((i % 24) + 1, 2)}`,
      type: descriptive ? "descriptive" : "reference",
      idKind: "number",
      state: n % 23 === 0 ? "draft" : n % 31 === 0 ? "archived" : "published",
      startDate: `2026-${month}-01`,
      endDate: "",
      description: "Placeholder added by the Sample size tool to show the list at scale.",
      fields: ["order"],
      customColumns: [],
      entries: descriptive
        ? ["M03050", "M01170", "A00215"].map((key) => ({ id: `placeholder-${n}-${key}`, code: "", name: "", title: "", description: "", value: "", order: "", status: "active" as const, custom: {}, sourceKey: key }))
        : Array.from({ length: (n % 6) + 2 }, (_, j) => ({
            id: `placeholder-${n}-${j}`,
            code: String(j + 1),
            name: `Placeholder value ${j + 1}`,
            title: "",
            description: "",
            value: "",
            order: String(j + 1),
            status: j === 4 ? "inactive" : "active",
            custom: {},
          })),
      sourceTable: descriptive ? "taxonomy" : "",
      mapping: descriptive ? { code: ["nsx"], name: ["common"] } : {},
      createdAt: `2026-${month}-01`,
      updatedAt: `2026-${month}-${pad((n % 27) + 1, 2)}`,
      history: [{ at: `2026-${month}-01T09:00`, by: "Placeholder", action: "Created" }],
      templates: [],
    };
  });
  return placeholders;
}

export function useCv(id: string | undefined): Cv | undefined {
  const all = useCvs();
  return id ? all.find((cv) => cv.id === id) : undefined;
}

/** False until localStorage has been read: a vocabulary's page waits for this before saying "not found". */
export function useCvsHydrated(): boolean {
  useRehydrate(useCvStore);
  return useHydrated(useCvStore);
}

export function allCvs(): Cv[] {
  return useCvStore.getState().cvs;
}

function write(id: string, patch: Partial<Cv>, event: Omit<CvAuditEvent, "at" | "by">) {
  const at = nowIso();
  useCvStore.setState({
    cvs: useCvStore.getState().cvs.map((cv) => (cv.id === id ? { ...cv, ...patch, updatedAt: todayIso(), history: [...cv.history, { at, by: CURRENT_USER_NAME, ...event }] } : cv)),
  });
}

/**
 * Save draft keeps (or makes) a draft. Publish turns a draft into a live vocabulary; editing a live
 * one keeps it live. A new vocabulary gets the next ID, which is never reused.
 */
export function saveCv(draft: CvDraft, intent: "draft" | "publish", existingId?: string, action?: string, returned?: { handoutId?: string }): Cv {
  const cvs = useCvStore.getState().cvs;
  const existing = existingId ? cvs.find((cv) => cv.id === existingId) : undefined;
  const at = nowIso();
  const today = todayIso();

  if (!existing) {
    const record: Cv = {
      ...draft,
      id: nextCvId([...cvs, ...useCvStore.getState().deletedIds.map((id) => ({ id }) as Cv)]),
      state: intent === "draft" ? "draft" : "published",
      createdAt: today,
      updatedAt: today,
      history: [{ at, by: CURRENT_USER_NAME, action: action ?? (intent === "draft" ? "Saved as draft" : "Created") }],
    };
    useCvStore.setState({ cvs: [...cvs, record] });
    return record;
  }

  const changes = diffCv(draftOf(existing), draft);
  const publishing = existing.state === "draft" && intent === "publish";
  const state = publishing ? "published" : existing.state;
  // A filled template came back with this save: close its hand-out (the one named in the file, or
  // the oldest still out when the file named none).
  const closing = returned ? (openHandouts(existing).find((t) => t.id === returned.handoutId) ?? openHandouts(existing)[0]) : undefined;
  const templates = (existing.templates ?? []).map((t) => (t === closing ? { ...t, returnedAt: at } : t));
  const record: Cv = {
    ...existing,
    ...draft,
    state,
    templates,
    updatedAt: today,
    history: [
      ...existing.history,
      {
        at,
        by: CURRENT_USER_NAME,
        action: action ?? (closing ? `Filled template ${closing.id} uploaded` : publishing ? "Published" : existing.state === "draft" ? "Draft saved" : "Edited"),
        ...(changes.length ? { changes } : {}),
      },
    ],
  };
  useCvStore.setState({ cvs: cvs.map((cv) => (cv.id === record.id ? record : cv)) });
  return record;
}

/** Archive by hand. Archived vocabularies drop out of every form's list but stay on existing records (REQ-18.6). */
/**
 * Delete a draft (the designer, 30 Sept 2026: "A draft vocab can be deleted"). Only a draft: it was
 * never live, so no record holds its values. A published vocabulary is archived instead (REQ-18.6).
 * Its ID is kept aside and never given to another vocabulary.
 */
export function deleteDraftCv(id: string) {
  const { cvs, deletedIds } = useCvStore.getState();
  if (cvs.find((c) => c.id === id)?.state !== "draft") return;
  useCvStore.setState({ cvs: cvs.filter((c) => c.id !== id), deletedIds: [...deletedIds, id] });
}

export function archiveCv(id: string) {
  write(id, { state: "archived" }, { action: "Archived" });
}

/**
 * Bring an archived vocabulary back. Archived by hand or by its end date passing, it comes back
 * with the end date given here (empty for no end), and the creation checks have already run
 * (REQ-18.5).
 */
export function reactivateCv(id: string, endDate: string) {
  const cv = useCvStore.getState().cvs.find((c) => c.id === id);
  if (!cv) return;
  const date = (v: string) => (v ? formatShortDate(v) : "Not provided");
  const changes = cv.endDate !== endDate ? [{ field: "End date", from: date(cv.endDate), to: date(endDate) }] : undefined;
  write(id, { state: "published", endDate }, { action: "Reactivated", ...(changes ? { changes } : {}) });
}

// ── Template hand-outs ──

/** Records a template download and returns its hand-out id ("T1", "T2" ...), which goes into the file. */
export function recordTemplateDownload(id: string): { handoutId: string; at: string } {
  const cv = useCvStore.getState().cvs.find((c) => c.id === id);
  const handoutId = `T${(cv?.templates?.length ?? 0) + 1}`;
  const at = nowIso();
  useCvStore.setState({
    cvs: useCvStore.getState().cvs.map((c) =>
      c.id === id ? { ...c, templates: [...(c.templates ?? []), { id: handoutId, downloadedAt: at, by: CURRENT_USER_NAME }], history: [...c.history, { at, by: CURRENT_USER_NAME, action: `Template ${handoutId} downloaded` }] } : c,
    ),
  });
  return { handoutId, at };
}

// A filled template uploaded from the list or a vocabulary's page, carried to that vocabulary's form,
// which merges it into its rows for the admin to check before saving. Held in memory only: it lives
// for the one client-side navigation.
const pendingUploads = new Map<string, ParsedTemplate & { fileName: string }>();

export function setPendingUpload(vocabId: string, upload: ParsedTemplate & { fileName: string }) {
  pendingUploads.set(vocabId, upload);
}

/** Read, not removed: React may run a state initialiser twice in development. The form clears it once it leaves. */
export function peekPendingUpload(vocabId: string): (ParsedTemplate & { fileName: string }) | undefined {
  return pendingUploads.get(vocabId);
}

export function clearPendingUpload(vocabId: string) {
  pendingUploads.delete(vocabId);
}
