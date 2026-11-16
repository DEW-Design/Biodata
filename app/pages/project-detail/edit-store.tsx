"use client";

// State for project detail Option 3. There is no backend in this build, so what is saved here lasts until the page is
// reloaded, with one exception: the records a person adds (an event, an occurrence, an observation) and their later
// edits and deletes are kept in localStorage per project with a zustand `persist` store (business comment, 10 Nov 2026:
// "once data is entered manually ... let zustand persistence maintain data on localStorage"). The seed's own records,
// the project's registration fields and the attachments are still session only.
//
// - The project is held in the Add Project wizard's own shape (`FormState` from
//   project-registration/option-2/sections.ts: details, collection, restrictions) plus a status.
//   Editing a project section therefore reuses the registration's own section forms and rules
//   unchanged, including adding and removing contacts, managers, permits, species and locations.
// - Project records and their attachments are a list that can be added to, edited and deleted.
// - What the store starts from is the `seed` (project-seed.ts): Adelaide Hills' hand-written records,
//   or another project's records built from Explore's data.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { browserStorage, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import type { Artefact } from "@/app/pages/_shared/artefact-lightbox";
import { logProjectChanges } from "@/app/pages/_shared/project-audit-log-store";
import type { UserRole } from "@/lib/user-role";
import type { FormState } from "@/app/pages/project-registration/option-2/sections";
import type { ProjectMeta, ProjectSeed } from "./project-seed";
import type { SurveyRecord } from "./survey-data";
import { canContain } from "./record-rules";

export type ProjectStatus = "Draft" | "Under review" | "Active" | "Completed";
export const PROJECT_STATUSES: ProjectStatus[] = ["Draft", "Under review", "Active", "Completed"];
export interface ProjectState extends FormState {
  status: ProjectStatus;
}

export type SurveyArtefact = Artefact & { recordId: string };

interface Store {
  canEdit: boolean;
  /** Which project this is: its route id, its own ID (BD-5039), its publisher. */
  meta: ProjectMeta;
  project: ProjectState;
  saveProject: (next: ProjectState) => void;
  records: SurveyRecord[];
  recordById: (id: string | null | undefined) => SurveyRecord | undefined;
  childrenOf: (parentId: string | null) => SurveyRecord[];
  ancestorsOf: (record: SurveyRecord) => SurveyRecord[];
  /** The record and every record inside it, at any depth. */
  subtreeOf: (id: string) => SurveyRecord[];
  saveRecord: (record: SurveyRecord) => void;
  addRecord: (record: SurveyRecord) => void;
  deleteRecord: (id: string) => void;
  artefacts: SurveyArtefact[];
  artefactsFor: (recordId: string) => SurveyArtefact[];
  setArtefactsFor: (recordId: string, next: SurveyArtefact[]) => void;
}

const StoreContext = createContext<Store | null>(null);

/** The records added in this browser, by project (`ProjectMeta.id`): the one persisted part of this store. */
const useAddedRecords = create<{ byProject: Record<string, SurveyRecord[]> }>()(
  persist(() => ({ byProject: {} as Record<string, SurveyRecord[]> }), {
    name: "biodata-project-added-records",
    version: 1,
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

const NONE: SurveyRecord[] = [];

/** The added records that still hang off the project: one whose parent is gone (a seeded record deleted this session) is not shown, and comes back with it. */
function reachable(base: SurveyRecord[], added: SurveyRecord[]): SurveyRecord[] {
  const ids = new Set(base.map((r) => r.id));
  const out: SurveyRecord[] = [];
  let pending = added.filter((r) => !ids.has(r.id));
  for (let progress = true; progress && pending.length > 0; ) {
    progress = false;
    const rest: SurveyRecord[] = [];
    for (const r of pending) {
      if (r.parentId === null || ids.has(r.parentId)) {
        out.push(r);
        ids.add(r.id);
        progress = true;
      } else rest.push(r);
    }
    pending = rest;
  }
  return out;
}

export function EditStoreProvider({ canEdit, role, seed, children }: { canEdit: boolean; /** Who is editing, for the project audit log's Source column. */ role: UserRole; seed: ProjectSeed; children: ReactNode }) {
  const [project, setProject] = useState<ProjectState>(seed.project);
  // The seed's records, as edited this session; the added ones are the persisted part, read once localStorage has been.
  const [seedRecords, setSeedRecords] = useState<SurveyRecord[]>(seed.records);
  useRehydrate(useAddedRecords);
  const addedHere = useAddedRecords((st) => st.byProject[seed.meta.id]) ?? NONE;
  const setAdded = useCallback(
    (update: (list: SurveyRecord[]) => SurveyRecord[]) =>
      useAddedRecords.setState((st) => ({ byProject: { ...st.byProject, [seed.meta.id]: update(st.byProject[seed.meta.id] ?? []) } })),
    [seed.meta.id],
  );
  const records = useMemo(() => [...seedRecords, ...reachable(seedRecords, addedHere)], [seedRecords, addedHere]);
  const [artefacts, setArtefacts] = useState<SurveyArtefact[]>(seed.artefacts);

  const byId = useMemo(() => new Map(records.map((r) => [r.id, r])), [records]);
  const recordById = useCallback((id: string | null | undefined) => (id ? byId.get(id) : undefined), [byId]);
  const childrenOf = useCallback((parentId: string | null) => records.filter((r) => r.parentId === parentId), [records]);
  const ancestorsOf = useCallback(
    (record: SurveyRecord) => {
      const chain: SurveyRecord[] = [];
      let current = recordById(record.parentId);
      while (current) {
        chain.unshift(current);
        current = recordById(current.parentId);
      }
      return chain;
    },
    [recordById],
  );
  const subtreeOf = useCallback(
    (id: string) => {
      const out: SurveyRecord[] = [];
      const walk = (rid: string) => {
        const r = byId.get(rid);
        if (!r) return;
        out.push(r);
        records.filter((c) => c.parentId === rid).forEach((c) => walk(c.id));
      };
      walk(id);
      return out;
    },
    [byId, records],
  );

  const deleteRecord = useCallback(
    (id: string) => {
      const ids = new Set(subtreeOf(id).map((r) => r.id));
      setSeedRecords((rs) => rs.filter((r) => !ids.has(r.id)));
      setAdded((list) => list.filter((r) => !ids.has(r.id)));
      setArtefacts((as) => as.filter((a) => !ids.has(a.recordId)));
    },
    [subtreeOf, setAdded],
  );

  const store = useMemo<Store>(
    () => ({
      canEdit,
      meta: seed.meta,
      project,
      // A save is also an entry in the project audit log: one UPDATE for each field that is different from what it was.
      saveProject: (next) => {
        logProjectChanges(seed.meta, project, next, role);
        setProject(next);
      },
      records,
      recordById,
      childrenOf,
      ancestorsOf,
      subtreeOf,
      saveRecord: (record) => {
        setSeedRecords((rs) => rs.map((r) => (r.id === record.id ? record : r)));
        setAdded((list) => list.map((r) => (r.id === record.id ? record : r)));
      },
      // The business rules on what an event may hold are checked here too, so no path that adds a record can break them (record-rules.ts `canContain`).
      addRecord: (record) => {
        const parent = byId.get(record.parentId ?? "") ?? null;
        if (record.parentId && !parent) return;
        if (!canContain(parent, record.kind, record.type)) return;
        setAdded((list) => [...list.filter((r) => r.id !== record.id), record]);
      },
      deleteRecord,
      artefacts,
      artefactsFor: (recordId) => artefacts.filter((a) => a.recordId === recordId),
      setArtefactsFor: (recordId, next) => setArtefacts((as) => [...as.filter((a) => a.recordId !== recordId), ...next]),
    }),
    [canEdit, role, seed.meta, project, records, byId, setAdded, recordById, childrenOf, ancestorsOf, subtreeOf, deleteRecord, artefacts],
  );
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useEditStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useEditStore must be used inside EditStoreProvider");
  return store;
}
