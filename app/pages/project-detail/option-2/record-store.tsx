"use client";

// A small in-memory, session-only store for every edit made on this page - no real backend exists
// anywhere in this build (see field-editor.tsx's own header comment), so "Save" commits into this
// store instead of a server. Kept as a single React Context at the page root rather than local
// `useState` inside each panel, so the same record edited from the Tree view, the Table view, and
// the Species view (three separate mount points for the same underlying record) always shows the
// same edited values - editing an Occurrence's Location Method from the Species tab and reopening
// it from the Records tree must show the edit, not a stale copy.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { FieldValues } from "./field-editor";
import type { CustomPropertyRow } from "./field-editor";

interface RecordStoreValue {
  getSection: (key: string) => FieldValues;
  setSection: (key: string, values: FieldValues) => void;
  getCustomRows: (key: string, seed: CustomPropertyRow[]) => CustomPropertyRow[];
  setCustomRows: (key: string, rows: CustomPropertyRow[]) => void;
}

const RecordStoreContext = createContext<RecordStoreValue | null>(null);

export function RecordStoreProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Record<string, FieldValues>>({});
  const [customRows, setCustomRowsState] = useState<Record<string, CustomPropertyRow[]>>({});

  const getSection = useCallback((key: string) => sections[key] ?? {}, [sections]);
  const setSection = useCallback((key: string, values: FieldValues) => setSections((s) => ({ ...s, [key]: values })), []);
  const getCustomRows = useCallback((key: string, seed: CustomPropertyRow[]) => customRows[key] ?? seed, [customRows]);
  const setCustomRows = useCallback((key: string, rows: CustomPropertyRow[]) => setCustomRowsState((s) => ({ ...s, [key]: rows })), []);

  const value = useMemo(() => ({ getSection, setSection, getCustomRows, setCustomRows }), [getSection, setSection, getCustomRows, setCustomRows]);

  return <RecordStoreContext.Provider value={value}>{children}</RecordStoreContext.Provider>;
}

export function useRecordStore(): RecordStoreValue {
  const ctx = useContext(RecordStoreContext);
  if (!ctx) throw new Error("useRecordStore must be used within a RecordStoreProvider");
  return ctx;
}
