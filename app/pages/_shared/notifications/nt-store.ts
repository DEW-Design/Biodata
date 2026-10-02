"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { ABOUT, NT_CATEGORIES, diffNt, draftOf, nextNtId, nowIso, seedNotifications, todayIso, type Notification, type NtAuditEvent, type NtDraft, type NtState, type RecipientLabel, type Retention } from "@/app/pages/_shared/notifications/nt-data";
import { useSampleVolume } from "@/app/pages/_shared/notifications/nt-directory";

// Every notification, in a zustand store persisted to localStorage (the plumbing every collection
// here uses), so the list, a notification's page and the form - separate routes - read and write the
// same records. There is no backend in this build. Every write appends to the notification's history
// with who, when and what changed. The acting admin is CURRENT_USER_NAME (a placeholder person).

interface NtStoreState {
  items: Notification[];
  /** IDs of deleted drafts: never given out again. */
  deletedIds: string[];
  /** The Figma's eight, then every category an admin has added, in the order they were added. */
  categories: string[];
}

// Version 1 (the first build) sent to the person it's about, to app personas and to placeholder
// names by separate fields, and kept the log with a toggle. Version 2 keys every recipient (nt-data.ts,
// Recipients) against User Management, keeps the log by period or date, and adds attachments.
const PERSONA_ROLE: Record<string, string> = { "biodata-super-admin": "ROLE-101", "biodata-admin": "ROLE-101", "biodata-user": "ROLE-102", "privileged-admin": "ROLE-103", "privileged-user": "ROLE-104", "registered-user": "ROLE-105" };
const PLACEHOLDER_USER: Record<string, string> = { "Olivia Wyatt": "USR-1014" };
type V1 = Omit<Notification, "to" | "cc" | "bcc" | "retention" | "retainUntil" | "attachments"> & { toAbout: boolean; toRoles: string[]; toPeople: string[]; cc: string[]; bcc: string[]; keepLog: boolean; retention: Retention };
const v1Key = (key: string) => {
  const [kind, id] = key.split(":");
  if (kind === "role") return PERSONA_ROLE[id] ? `role:${PERSONA_ROLE[id]}` : undefined;
  return PLACEHOLDER_USER[id] ? `person:${PLACEHOLDER_USER[id]}` : undefined;
};
function fromV1(n: V1): Notification {
  const { toAbout, toRoles, toPeople, keepLog, ...rest } = n;
  const keys = (list: string[]) => list.map(v1Key).filter((k): k is string => !!k);
  return {
    ...rest,
    to: [...(toAbout ? [ABOUT] : []), ...keys(toRoles.map((r) => `role:${r}`)), ...keys(toPeople.map((p) => `person:${p}`))],
    cc: keys(n.cc),
    bcc: keys(n.bcc),
    retention: keepLog ? n.retention : "none",
    retainUntil: "",
    attachments: [],
  };
}

const useNtStore = create<NtStoreState>()(
  persist(() => ({ items: seedNotifications, deletedIds: [] as string[], categories: [...NT_CATEGORIES] as string[] }), {
    name: "biodata-notifications",
    version: 2,
    migrate: (persisted, version) => {
      const state = persisted as { items: unknown[]; deletedIds?: string[] };
      const items = version < 2 ? (state.items as V1[]).map(fromV1) : (state.items as Notification[]);
      const categories = [...NT_CATEGORIES, ...new Set(items.map((n) => n.category).filter((c) => c && !(NT_CATEGORIES as readonly string[]).includes(c)))];
      return { items, deletedIds: state.deletedIds ?? [], categories };
    },
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

export function useNotifications(): Notification[] {
  useRehydrate(useNtStore);
  const items = useNtStore((s) => s.items);
  const [volume] = useSampleVolume();
  return useMemo(() => (volume === "scale" ? [...items, ...placeholderNotifications()] : items), [items, volume]);
}

/** Every category: the Figma's eight, the ones admins added, and (at scale) the placeholders. */
export function useCategories(): string[] {
  useRehydrate(useNtStore);
  const categories = useNtStore((s) => s.categories);
  const [volume] = useSampleVolume();
  return useMemo(() => (volume === "scale" ? [...categories, ...PLACEHOLDER_CATEGORIES] : categories), [categories, volume]);
}

const PLACEHOLDER_CATEGORIES = Array.from({ length: 40 }, (_, i) => `Placeholder category ${String(i + 1).padStart(2, "0")}`);
let placeholders: Notification[] | null = null;
function placeholderNotifications(): Notification[] {
  placeholders ??= Array.from({ length: 300 }, (_, i): Notification => {
    const n = i + 1;
    const month = String((n % 9) + 1).padStart(2, "0");
    return {
      ...seedNotifications[0],
      id: `PLACEHOLDER-${String(n).padStart(3, "0")}`,
      name: `Placeholder notification ${String(n).padStart(3, "0")}`,
      description: "Placeholder added by the Sample size tool to show the list at scale.",
      category: PLACEHOLDER_CATEGORIES[i % 40],
      state: n % 17 === 0 ? "draft" : n % 11 === 0 ? "disabled" : "active",
      trigger: seedNotifications[n % seedNotifications.length].trigger,
      updatedAt: `2026-${month}-${String((n % 27) + 1).padStart(2, "0")}`,
      history: [{ at: `2026-${month}-01T09:00`, by: "Placeholder", action: "Created" }],
    };
  });
  return placeholders;
}

export function useNotification(id: string | undefined): Notification | undefined {
  const all = useNotifications();
  return id ? all.find((n) => n.id === id) : undefined;
}

/** False until localStorage has been read: a notification's page waits for this before saying "not found". */
export function useNotificationsHydrated(): boolean {
  useRehydrate(useNtStore);
  return useHydrated(useNtStore);
}

export function allNotifications(): Notification[] {
  return useNtStore.getState().items;
}

function write(id: string, patch: Partial<Notification>, event: Omit<NtAuditEvent, "at" | "by">) {
  const at = nowIso();
  useNtStore.setState({
    items: useNtStore.getState().items.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: todayIso(), history: [...n.history, { at, by: CURRENT_USER_NAME, ...event }] } : n)),
  });
}

/**
 * Save draft keeps (or makes) a draft. Publish turns a draft into an active notification; editing an
 * active or disabled one keeps its state. A new notification gets the next ID, never reused.
 */
export function saveNotification(draft: NtDraft, intent: "draft" | "publish", label: RecipientLabel, existingId?: string, duplicatedFrom?: string): Notification {
  const { items, deletedIds, categories } = useNtStore.getState();
  // A category typed in the form is added to the list the first time it is saved.
  const category = draft.category.trim();
  if (category && !categories.some((c) => c.toLowerCase() === category.toLowerCase())) useNtStore.setState({ categories: [...categories, category] });
  const existing = existingId ? items.find((n) => n.id === existingId) : undefined;
  const at = nowIso();
  const today = todayIso();

  if (!existing) {
    const record: Notification = {
      ...draft,
      id: nextNtId([...items, ...deletedIds.map((id) => ({ id }))]),
      state: intent === "draft" ? "draft" : "active",
      createdAt: today,
      updatedAt: today,
      history: [{ at, by: CURRENT_USER_NAME, action: `${intent === "draft" ? "Saved as draft" : "Created"}${duplicatedFrom ? ` (a copy of ${duplicatedFrom})` : ""}` }],
    };
    useNtStore.setState({ items: [...useNtStore.getState().items, record] });
    return record;
  }

  const changes = diffNt(draftOf(existing), draft, label);
  const publishing = existing.state === "draft" && intent === "publish";
  const record: Notification = {
    ...existing,
    ...draft,
    state: publishing ? "active" : existing.state,
    updatedAt: today,
    history: [...existing.history, { at, by: CURRENT_USER_NAME, action: publishing ? "Turned on" : existing.state === "draft" ? "Draft saved" : "Edited", ...(changes.length ? { changes } : {}) }],
  };
  useNtStore.setState({ items: items.map((n) => (n.id === record.id ? record : n)) });
  return record;
}

export function setNotificationState(id: string, state: Exclude<NtState, "draft">) {
  write(id, { state }, { action: state === "active" ? "Enabled" : "Disabled" });
}

/** Only a draft: it never sent anything. An active or disabled notification is disabled instead, so its history stays. */
export function deleteDraftNotification(id: string) {
  const { items, deletedIds } = useNtStore.getState();
  if (items.find((n) => n.id === id)?.state !== "draft") return;
  useNtStore.setState({ items: items.filter((n) => n.id !== id), deletedIds: [...deletedIds, id] });
}
