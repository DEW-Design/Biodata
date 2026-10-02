"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { fullName } from "@/app/pages/_shared/user-management/um-data";
import { useRoles, useUsers } from "@/app/pages/_shared/user-management/um-store";
import { ABOUT, aboutOf, type NtTrigger, type RecipientLabel } from "@/app/pages/_shared/notifications/nt-data";

// Who a notification can be sent to: User Management's roles and users, read live, so the picker
// offers whoever an admin has set up there. A role is offered while it is active; a user while they
// are not inactive.
//
// The Sample size tool (on the Prototype tools bar, Notification Management only) adds 2,000
// placeholder people and 300 placeholder notifications in 40 placeholder categories, to see the
// screens at the size they are expected to grow to. Every name says it is a placeholder (CONTRACTS
// 0.3); they are made in memory, never saved, and gone on reload.

export interface RecipientOption {
  /** The recipient key: role:<id> or person:<id>. */
  id: string;
  label: string;
  /** The organisation, or the role's department, so two "Contributor" roles can be told apart. */
  detail?: string;
}

export type Volume = "seed" | "scale";
const useVolumeStore = create<{ volume: Volume }>()(() => ({ volume: "seed" }));

export function useSampleVolume(): [Volume, (v: Volume) => void] {
  return [useVolumeStore((s) => s.volume), (volume) => useVolumeStore.setState({ volume })];
}

let placeholderPeople: RecipientOption[] | null = null;
function placeholdersPeople(): RecipientOption[] {
  placeholderPeople ??= Array.from({ length: 2000 }, (_, i) => ({ id: `person:PLACEHOLDER-${i + 1}`, label: `Placeholder person ${String(i + 1).padStart(4, "0")}`, detail: "Placeholder" }));
  return placeholderPeople;
}

function useDirectory() {
  const users = useUsers();
  const roles = useRoles();
  const [volume] = useSampleVolume();
  return useMemo(() => {
    const roleOptions: RecipientOption[] = roles.filter((r) => r.status === "active").map((r) => ({ id: `role:${r.id}`, label: r.name, detail: r.department || "System role" }));
    const people: RecipientOption[] = [
      ...users.filter((u) => u.status !== "inactive").map((u) => ({ id: `person:${u.id}`, label: fullName(u), detail: u.organisation || "No organisation" })),
      ...(volume === "scale" ? placeholdersPeople() : []),
    ];
    // Every role and user by key, inactive ones included: one chosen before it was made inactive still reads by name.
    const names = new Map<string, string>([...roles.map((r) => [`role:${r.id}`, r.name] as const), ...users.map((u) => [`person:${u.id}`, fullName(u)] as const), ...people.map((o) => [o.id, o.label] as const)]);
    /** A notification's recipient keys in words; `about` is its own event's phrase. */
    const labelFor =
      (trigger: NtTrigger): RecipientLabel =>
      (key) =>
        key === ABOUT ? (aboutOf(trigger) ?? "the person it's about") : (names.get(key) ?? key);
    return { roles: roleOptions, people, labelFor };
  }, [users, roles, volume]);
}

/** Labels for any notification's recipients: `labelFor(n.trigger)(key)`. */
export function useRecipientLabels(): (trigger: NtTrigger) => RecipientLabel {
  return useDirectory().labelFor;
}

/** What the recipient picker offers, and how this trigger's recipients read. */
export function useRecipientDirectory(trigger: NtTrigger) {
  const { roles, people, labelFor } = useDirectory();
  return useMemo(() => ({ roles, people, about: aboutOf(trigger), label: labelFor(trigger) }), [roles, people, labelFor, trigger]);
}
