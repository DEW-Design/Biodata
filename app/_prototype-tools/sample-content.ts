"use client";

import { useEffect, useRef, useState } from "react";
import { MagicWand02 } from "@untitledui/icons";
import { useRegisterTool } from "./tools";

// Pre-fill sample content (the designer, 16 Oct 2026): a switch on the Prototype tools bar that fills a form with
// ready-made sample answers, so a form can be shown to stakeholders without typing it in. Any form gets it by calling
// this hook with its value, its setter and a function that builds its sample. Every form has it (the designer, 10 Nov 2026: "if there's a form, let's
// have a fill sample content toggle"), and the sample covers what a form can ask, not only its first screen:
// - **A question that branches is answered down its fullest branch.** The answer that opens a conditional field is the one the sample gives, and the
//   field it opens is filled too (a "Yes" with its "where"), so every question a form can show is on screen.
// - **A file upload is filled.** A form that takes files passes `files`: the sample's files go in as if they had been added (`sampleFile`,
//   `sampleWorkbook`, sample-files.ts), and switching off takes out the ones the sample added and leaves the person's own. Switching it on keeps what was in the form
// and puts the sample in; switching it off puts back what was there before. Edits made while it is on are the person's
// own and are dropped when it is switched off. Scaffold (CONTRACTS 1.5, 3.8): it previews the form, it is not product.
//
// The switch is kept across a refresh (the designer, 30 Oct 2026: "If prefill sample content is turned on, it should be on even if I
// refresh"): the choice is in localStorage, like the bar's position and whether it is collapsed, and a form that comes up while it is on
// is filled with the sample as it mounts. It is one choice for the browser, not one per form, so it is still on when the person goes to
// the next screen that has a form to fill (option 1 to option 2 of Add Project).

const STORAGE_KEY = "biodata-prototype-sample-content";

const wasOn = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
};

const remember = (on: boolean) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Storage is blocked: the switch still works for this visit, it just is not kept.
  }
};

const OPTIONS = [
  { id: "on", label: "On" },
  { id: "off", label: "Off" },
];

/** Puts the Pre-fill sample content switch on the bar while `enabled`. Returns a number that changes each time the content
 *  is swapped, for a form to use as a `key` so fields that keep their own state (a picker's tab, a reveal) start fresh. */
/** How a form takes sample files: what they are, how they are added and how the ones the sample added are taken out (by name). */
export interface SampleFiles {
  sample: () => File[] | Promise<File[]>;
  add: (files: File[]) => void;
  remove: (names: string[]) => void;
}

export function useSampleContent<T>({
  value,
  onChange,
  sample,
  enabled = true,
  files,
}: {
  value: T;
  onChange: (next: T) => void;
  sample: () => T;
  enabled?: boolean;
  files?: SampleFiles;
}): number {
  const [saved, setSaved] = useState<{ value: T } | null>(null);
  const addedFiles = useRef<string[]>([]);
  const putFiles = (f?: SampleFiles) => {
    if (!f) return;
    void Promise.resolve(f.sample()).then((list) => {
      addedFiles.current = list.map((x) => x.name);
      f.add(list);
    });
  };
  const takeFiles = (f?: SampleFiles) => {
    if (!f || addedFiles.current.length === 0) return;
    f.remove(addedFiles.current);
    addedFiles.current = [];
  };
  const [swaps, setSwaps] = useState(0);
  const on = saved !== null;

  // A form that mounts while the switch was left on is filled once, as it comes up. What it held then is what switching off puts back.
  // The fill is one tick after the form mounts, with what the form held then (`latest`), so it is not a state change made while the form is
  // still mounting and it does not run again each time the form renders.
  const latest = useRef({ value, onChange, sample, files });
  useEffect(() => {
    latest.current = { value, onChange, sample, files };
  });
  const started = useRef(false);
  useEffect(() => {
    if (!enabled || started.current) return;
    const id = window.setTimeout(() => {
      started.current = true;
      if (!wasOn()) return;
      const { value: initial, onChange: fill, sample: make, files: sampleFiles } = latest.current;
      setSaved({ value: initial });
      fill(make());
      putFiles(sampleFiles);
      setSwaps((n) => n + 1);
    }, 0);
    return () => window.clearTimeout(id);
  }, [enabled]);

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
              putFiles(files);
              remember(true);
            } else if (id === "off" && saved) {
              onChange(saved.value);
              takeFiles(files);
              setSaved(null);
              remember(false);
            } else return;
            setSwaps((n) => n + 1);
          },
        }
      : null,
  );

  return swaps;
}
