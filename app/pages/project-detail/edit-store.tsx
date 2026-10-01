"use client";

// Session-only state for project detail Option 3. There is no backend in this build, so everything
// saved here lasts until the page is reloaded.
//
// - The project is held in the Add Project wizard's own shape (`FormState` from
//   project-registration/option-2/sections.ts: details, collection, restrictions) plus a status.
//   Editing a project section therefore reuses the registration's own section forms and rules
//   unchanged, including adding and removing contacts, managers, permits, species and locations.
// - Project records and their attachments are a list that can be added to, edited and deleted.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Artefact } from "@/app/pages/_shared/artefact-lightbox";
import type { FormState } from "@/app/pages/project-registration/option-2/sections";
import { registrationDataCollection, registrationProjectDetails, registrationRestrictions } from "./project-registration-data";
import { SURVEY_ARTEFACTS, SURVEY_RECORDS, type SurveyRecord } from "./survey-data";

export type ProjectStatus = "Draft" | "Under review" | "Active" | "Completed";
export const PROJECT_STATUSES: ProjectStatus[] = ["Draft", "Under review", "Active", "Completed"];
export interface ProjectState extends FormState {
  status: ProjectStatus;
}

export type SurveyArtefact = Artefact & { recordId: string };

interface Store {
  canEdit: boolean;
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

export function EditStoreProvider({ canEdit, children }: { canEdit: boolean; children: ReactNode }) {
  const [project, setProject] = useState<ProjectState>(() => ({
    details: registrationProjectDetails,
    collection: registrationDataCollection,
    restrictions: registrationRestrictions,
    status: "Active",
  }));
  const [records, setRecords] = useState<SurveyRecord[]>(SURVEY_RECORDS);
  const [artefacts, setArtefacts] = useState<SurveyArtefact[]>(SURVEY_ARTEFACTS);

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
      setRecords((rs) => rs.filter((r) => !ids.has(r.id)));
      setArtefacts((as) => as.filter((a) => !ids.has(a.recordId)));
    },
    [subtreeOf],
  );

  const store = useMemo<Store>(
    () => ({
      canEdit,
      project,
      saveProject: setProject,
      records,
      recordById,
      childrenOf,
      ancestorsOf,
      subtreeOf,
      saveRecord: (record) => setRecords((rs) => rs.map((r) => (r.id === record.id ? record : r))),
      addRecord: (record) => setRecords((rs) => [...rs, record]),
      deleteRecord,
      artefacts,
      artefactsFor: (recordId) => artefacts.filter((a) => a.recordId === recordId),
      setArtefactsFor: (recordId, next) => setArtefacts((as) => [...as.filter((a) => a.recordId !== recordId), ...next]),
    }),
    [canEdit, project, records, recordById, childrenOf, ancestorsOf, subtreeOf, deleteRecord, artefacts],
  );
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useEditStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useEditStore must be used inside EditStoreProvider");
  return store;
}
