"use client";

import { Check } from "@untitledui/icons";
import { cx } from "@/utils/cx";

// Matches the Figma "Set Password" (node 32:153) / "Set new Password" (node 39:630) password
// instruction rows - a filled gray/success check icon per rule, live per keystroke. The two
// screens use different minimum-length copy (12 vs 13 characters in the source design's own two
// symbols - verified from each screen's own get_design_context fetch, not assumed identical) so
// `minLength` is a prop rather than hardcoded.
const SPECIAL_CHARACTERS = /[@#$%^&*]/;

export function passwordMeetsRules(password: string, minLength: number) {
  return { length: password.length >= minLength, special: SPECIAL_CHARACTERS.test(password) };
}

function ChecklistRow({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-full", met ? "bg-success-solid text-white" : "bg-tertiary text-fg-quaternary")}>
        <Check className="size-3" strokeWidth={3} />
      </span>
      <p className="text-base text-secondary">{label}</p>
    </div>
  );
}

export function PasswordChecklist({ password, minLength }: { password: string; minLength: number }) {
  const rules = passwordMeetsRules(password, minLength);
  return (
    <div className="flex w-full flex-col gap-2">
      <ChecklistRow met={rules.length} label={`Must be at least ${minLength} characters`} />
      <ChecklistRow met={rules.special} label="Must contain one special character (@#$%^%)" />
    </div>
  );
}
