"use client";

import { useState } from "react";
import { MagicWand02 } from "@untitledui/icons";
import { useRegisterTool } from "./tools";

// Pre-fill sample content (the designer, 16 Oct 2026): a switch on the Prototype tools bar that fills a form with
// ready-made sample answers, so a form can be shown to stakeholders without typing it in. Any form gets it by calling
// this hook with its value, its setter and a function that builds its sample. Switching it on keeps what was in the form
// and puts the sample in; switching it off puts back what was there before. Edits made while it is on are the person's
// own and are dropped when it is switched off. Scaffold (CONTRACTS 1.5, 3.8): it previews the form, it is not product.

const OPTIONS = [
  { id: "on", label: "On" },
  { id: "off", label: "Off" },
];

/** Puts the Pre-fill sample content switch on the bar while `enabled`. Returns a number that changes each time the content
 *  is swapped, for a form to use as a `key` so fields that keep their own state (a picker's tab, a reveal) start fresh. */
export function useSampleContent<T>({ value, onChange, sample, enabled = true }: { value: T; onChange: (next: T) => void; sample: () => T; enabled?: boolean }): number {
  const [saved, setSaved] = useState<{ value: T } | null>(null);
  const [swaps, setSwaps] = useState(0);
  const on = saved !== null;

  useRegisterTool(
    enabled
      ? {
          id: "sample",
          kind: "toggle",
          label: "Pre-fill sample content",
          barLabel: "Pre-fill sample content",
          icon: MagicWand02,
          options: OPTIONS,
          value: on ? "on" : "off",
          onChange: (id) => {
            if (id === "on" && !on) {
              setSaved({ value });
              onChange(sample());
            } else if (id === "off" && saved) {
              onChange(saved.value);
              setSaved(null);
            } else return;
            setSwaps((n) => n + 1);
          },
        }
      : null,
  );

  return swaps;
}
