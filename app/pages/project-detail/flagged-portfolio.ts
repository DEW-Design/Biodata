"use client";

// Flagged concepts across every project, for the admin's "Flagged concepts" page (29 Sept 2026).
//
// Adelaide Hills Bushland Survey (BD-5039) is the one project with full survey records in this
// preview: its flagged concepts come live from the field-notes store (review-view.tsx). The other
// projects have no record detail yet, so their flagged concepts are example entries kept here, in
// their own persisted store, so resolving one survives a reload the same way. The projects, species,
// sites and people are the ones this build already uses (the Projects list and the Explore data);
// the record IDs and the flag wording are illustrative, written for this prototype.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  browserStorage,
  useRehydrate,
} from "@/app/pages/_shared/zustand-persist";
import type { RecordKind } from "./survey-data";

export interface ReviewEntry {
  /** Unique across projects. */
  id: string;
  status: "open" | "resolved";
  projectCode: string;
  projectName: string;
  recordCode: string;
  recordName: string;
  recordKind: RecordKind;
  recordType: string;
  sectionTitle: string;
  field: string;
  value: string;
  /** Open: why it was flagged. Resolved: why it was resolved. */
  reason: string;
  by: string;
  date: string;
  daysWaiting: number | null;
  /** Resolved: what it had been flagged as. */
  flagReason?: string;
  comment?: { text: string; author: string; date: string };
  files: string[];
  /** Set for a project with live records (BD-5039): the record and field, for Fix value and Go to record. */
  live?: { recordId: string; sectionId: string; key: string };
}

export const daysSince = (date: string): number | null => {
  const t = new Date(date).getTime();
  return Number.isNaN(t)
    ? null
    : Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
};

/** The project with live survey records. */
export const LIVE_PROJECT = {
  code: "BD-5039",
  name: "Adelaide Hills Bushland Survey",
};

interface Seed {
  id: string;
  projectCode: string;
  projectName: string;
  recordCode: string;
  recordName: string;
  recordKind: RecordKind;
  recordType: string;
  sectionTitle: string;
  field: string;
  value: string;
  flag?: { reason: string; by: string; date: string };
  resolved?: { reason: string; by: string; date: string; flagReason: string };
  comment?: { text: string; author: string; date: string };
}

const KI = {
  projectCode: "BD-4988",
  projectName: "Kangaroo Island Recovery Monitoring",
};
const CO = {
  projectCode: "BD-5102",
  projectName: "Coorong Wetlands Bird Count",
};
const MR = {
  projectCode: "BD-5038",
  projectName: "Mount Remarkable Malleefowl Program",
};
const NA = {
  projectCode: "BD-5035",
  projectName: "Naracoorte Caves Fossil Fauna Survey",
};
const LE = {
  projectCode: "BD-5036",
  projectName: "Lake Eyre Basin Waterbird Survey",
};

const SEED: Seed[] = [
  {
    id: "ki-1",
    ...KI,
    recordCode: "OC04901",
    recordName: "Southern Hairy-nosed Wombat",
    recordKind: "occurrence",
    recordType: "Individual",
    sectionTitle: "Occurrence details",
    field: "Occurrence status",
    value: "Present",
    flag: {
      reason: "Only fresh burrow activity was seen; no animal was sighted.",
      by: "Lana Steiner",
      date: "21 May 2026",
    },
  },
  {
    id: "ki-2",
    ...KI,
    recordCode: "OC04902",
    recordName: "Emu",
    recordKind: "occurrence",
    recordType: "Individual",
    sectionTitle: "Location information",
    field: "Reliability",
    value: "3 · Within 1 km",
    flag: {
      reason: "Seen from the road; the distance was estimated, not measured.",
      by: "Phoenix Baker",
      date: "22 May 2026",
    },
  },
  {
    id: "ki-3",
    ...KI,
    recordCode: "SU00505",
    recordName: "Flinders Chase Recovery Site",
    recordKind: "event",
    recordType: "Site",
    sectionTitle: "Location information",
    field: "Datum",
    value: "GDA94 · Geocentric Datum of Australia 1994",
    flag: {
      reason: "Records after 2020 should use GDA2020.",
      by: "Maya Dewitt",
      date: "2 Feb 2026",
    },
    comment: {
      text: "The field tablet was still set to GDA94.",
      author: "Olivia Wyatt",
      date: "3 Feb 2026",
    },
  },
  {
    id: "co-1",
    ...CO,
    recordCode: "OC05201",
    recordName: "Fairy Tern",
    recordKind: "occurrence",
    recordType: "Population",
    sectionTitle: "Species",
    field: "Number observed",
    value: "42",
    flag: {
      reason: "The count overlaps with the previous day's roost count.",
      by: "Olivia Wyatt",
      date: "16 Aug 2026",
    },
  },
  {
    id: "co-2",
    ...CO,
    recordCode: "OC05202",
    recordName: "Orange-bellied Parrot",
    recordKind: "occurrence",
    recordType: "Individual",
    sectionTitle: "Occurrence details",
    field: "Occurrence status",
    value: "Absent",
    flag: {
      reason: "Absent after a 10 minute search; the protocol needs 20.",
      by: "Phoenix Baker",
      date: "11 Aug 2026",
    },
  },
  {
    id: "co-3",
    ...CO,
    recordCode: "OC05203",
    recordName: "Osprey",
    recordKind: "occurrence",
    recordType: "Individual",
    sectionTitle: "Occurrence details",
    field: "Occurrence status",
    value: "Absent",
    resolved: {
      reason: "The nest platform was checked twice; the pair had left.",
      by: "Jane Harlow",
      date: "12 Aug 2026",
      flagReason: "The pair may only have been off the nest.",
    },
  },
  {
    id: "mr-1",
    ...MR,
    recordCode: "CU00501",
    recordName: "Malleefowl mound check",
    recordKind: "event",
    recordType: "Custom event",
    sectionTitle: "Temporal details",
    field: "Start date",
    value: "9 Aug 2026",
    flag: {
      reason: "The mound camera timestamp says 8 Aug.",
      by: "Maya Dewitt",
      date: "15 Aug 2026",
    },
  },
  {
    id: "mr-2",
    ...MR,
    recordCode: "OC03801",
    recordName: "Heath Mouse",
    recordKind: "occurrence",
    recordType: "Population",
    sectionTitle: "Species",
    field: "Number observed",
    value: "18",
    flag: {
      reason: "Includes recaptures from the first night.",
      by: "Lana Steiner",
      date: "18 Aug 2026",
    },
  },
  {
    id: "mr-3",
    ...MR,
    recordCode: "SU00509",
    recordName: "Mambray Creek Site",
    recordKind: "event",
    recordType: "Site",
    sectionTitle: "Site details",
    field: "Altitude",
    value: "1250",
    resolved: {
      reason: "Corrected to 125 m from the topographic map.",
      by: "Jane Harlow",
      date: "19 Aug 2026",
      flagReason: "1250 m is above the range's highest peak.",
    },
  },
  {
    id: "na-1",
    ...NA,
    recordCode: "OC03501",
    recordName: "Southern Bell Frog",
    recordKind: "occurrence",
    recordType: "Individual",
    sectionTitle: "Voucher",
    field: "Determiners",
    value: "Lana Steiner",
    flag: {
      reason: "Identified from a call only; needs a second determiner.",
      by: "Maya Dewitt",
      date: "26 Aug 2026",
    },
  },
  {
    id: "le-1",
    ...LE,
    recordCode: "OC03601",
    recordName: "Regent Parrot",
    recordKind: "occurrence",
    recordType: "Individual",
    sectionTitle: "Location information",
    field: "Location method",
    value: "GPS · Hand-held GPS",
    flag: {
      reason: "The coordinates were copied from the ramble's start point.",
      by: "Phoenix Baker",
      date: "12 Jul 2026",
    },
  },
];

interface State {
  entries: Seed[];
}

const useStore = create<State>()(
  persist(() => ({ entries: SEED }), {
    name: "biodata-flagged-portfolio",
    version: 1,
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

export const portfolioActions = {
  resolve(id: string, reason: string, by: string, date: string) {
    useStore.setState((s) => ({
      entries: s.entries.map((e) =>
        e.id === id && e.flag
          ? {
              ...e,
              flag: undefined,
              resolved: { reason, by, date, flagReason: e.flag.reason },
            }
          : e,
      ),
    }));
  },
  /** Undo: puts back what the entry was before. */
  restore(seed: Seed) {
    useStore.setState((s) => ({
      entries: s.entries.map((e) => (e.id === seed.id ? seed : e)),
    }));
  },
  get(id: string): Seed | undefined {
    return useStore.getState().entries.find((e) => e.id === id);
  },
};

/** Flagged concepts on the projects without live records, as review entries. */
export function usePortfolioEntries(): ReviewEntry[] {
  useRehydrate(useStore);
  const entries = useStore((s) => s.entries);
  return entries.flatMap((e): ReviewEntry[] => {
    const base = {
      id: `pf|${e.id}`,
      projectCode: e.projectCode,
      projectName: e.projectName,
      recordCode: e.recordCode,
      recordName: e.recordName,
      recordKind: e.recordKind,
      recordType: e.recordType,
      sectionTitle: e.sectionTitle,
      field: e.field,
      value: e.value,
      comment: e.comment,
      files: [],
    };
    if (e.flag)
      return [
        {
          ...base,
          status: "open",
          reason: e.flag.reason,
          by: e.flag.by,
          date: e.flag.date,
          daysWaiting: daysSince(e.flag.date),
        },
      ];
    if (e.resolved)
      return [
        {
          ...base,
          status: "resolved",
          reason: e.resolved.reason,
          by: e.resolved.by,
          date: e.resolved.date,
          daysWaiting: daysSince(e.resolved.date),
          flagReason: e.resolved.flagReason,
        },
      ];
    return [];
  });
}

export const portfolioSeedId = (entryId: string) =>
  entryId.replace(/^pf\|/, "");
