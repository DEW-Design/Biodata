"use client";

// VERSION 3: "Fields shown", the right-hand column while a card is in edit mode. A checklist of every
// category (section) of the record and its fields: tick a field to add it (empty fields start
// unticked), untick one to take it off the record, in edit mode and when viewed; untick a category to
// hide all of it. A category shows its own tick as checked, partly
// checked (some fields hidden) or clear, with a count. The category being edited opens first; the
// others fold, and searching opens whatever matches.
//
// Patterns: Airtable's "Hide fields" (one list, a search, Show all / Hide all) and Notion's property
// visibility, built from our Checkbox, Input and Button. Identifiers stay shown (locked): they are how
// a record is found and cited. Changes belong to the edit session and are saved with Save changes.

import { useMemo, useState } from "react";
import { ChevronDown, Eye, Lock01, SearchMd } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import type { SurveyRecord } from "./survey-data";
import { recordFieldEntries } from "./field-visibility-store";

export function VisibilityPanel({
  record,
  hidden,
  onChange,
  activeSection,
}: {
  record: SurveyRecord;
  hidden: Set<string>;
  onChange: (next: Set<string>) => void;
  /** The category being edited: opened and marked. Omitted when every card is being edited. */
  activeSection?: string;
}) {
  const groups = useMemo(
    () => recordFieldEntries(record).filter((g) => g.fields.length > 0),
    [record],
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(activeSection ? [activeSection] : []),
  );
  const q = query.trim().toLowerCase();

  const all = groups.flatMap((g) => g.fields);
  const hideable = all.filter((f) => !f.locked);
  const shownCount = all.filter((f) => !hidden.has(f.key)).length;

  const set = (keys: string[], show: boolean) => {
    const next = new Set(hidden);
    for (const k of keys) {
      if (show) next.delete(k);
      else next.add(k);
    }
    onChange(next);
  };

  return (
    <section
      aria-label="Fields shown"
      className="flex flex-col overflow-hidden rounded-xl border border-secondary bg-primary"
    >
      <div className="flex flex-col gap-3 border-b border-secondary p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Eye className="size-4 text-fg-quaternary" />
              Fields shown
            </h3>
            <p className="text-xs text-balance text-tertiary">
              Tick a field to add it to the record, untick it to take it away. Empty fields start unticked.
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary tabular-nums">
            {shownCount} of {all.length}
          </span>
        </div>
        <Input
          aria-label="Find a field"
          size="sm"
          icon={SearchMd}
          placeholder="Find a field"
          value={query}
          onChange={setQuery}
        />
        <div className="flex items-center gap-4">
          <Button
            color="link-color"
            size="sm"
            isDisabled={hideable.every((f) => !hidden.has(f.key))}
            onClick={() =>
              set(
                hideable.map((f) => f.key),
                true,
              )
            }
          >
            Show all
          </Button>
          <Button
            color="link-gray"
            size="sm"
            isDisabled={hideable.every((f) => hidden.has(f.key))}
            onClick={() =>
              set(
                hideable.map((f) => f.key),
                false,
              )
            }
          >
            Hide all
          </Button>
        </div>
      </div>

      <ul className="flex max-h-[calc(100dvh-22rem)] flex-col overflow-y-auto p-2">
        {groups.map(({ section, fields }) => {
          const matches = q
            ? fields.filter(
                (f) =>
                  f.label.toLowerCase().includes(q) ||
                  section.title.toLowerCase().includes(q),
              )
            : fields;
          if (matches.length === 0) return null;
          const free = fields.filter((f) => !f.locked);
          const shown = fields.filter((f) => !hidden.has(f.key)).length;
          const allOn = shown === fields.length;
          const someOn = shown > 0 && !allOn;
          const isOpen = q ? true : open.has(section.id);
          const isActive = section.id === activeSection;
          return (
            <li
              key={section.id}
              className={cx(
                "flex flex-col rounded-lg",
                isActive &&
                  "bg-brand-25 ring-1 ring-[var(--color-brand-100)] ring-inset",
              )}
            >
              <div className="flex items-center gap-1 py-1 pr-2 pl-1">
                <button
                  type="button"
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${section.title}`}
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpen((o) => {
                      const next = new Set(o);
                      if (next.has(section.id)) next.delete(section.id);
                      else next.add(section.id);
                      return next;
                    })
                  }
                  className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-fg-quaternary outline-focus-ring hover:bg-secondary focus-visible:outline-2"
                >
                  <ChevronDown
                    className={cx(
                      "size-4 transition-transform duration-150",
                      !isOpen && "-rotate-90",
                    )}
                  />
                </button>
                <Checkbox
                  aria-label={`Show ${section.title}`}
                  isSelected={allOn}
                  isIndeterminate={someOn}
                  isDisabled={free.length === 0}
                  onChange={() =>
                    set(
                      free.map((f) => f.key),
                      !allOn,
                    )
                  }
                  label={
                    <span className="text-sm font-semibold text-primary">
                      {section.title}
                    </span>
                  }
                  className="min-w-0 flex-1 py-1"
                />
                <span
                  className={cx(
                    "shrink-0 text-xs tabular-nums",
                    shown === 0 ? "text-quaternary" : "text-tertiary",
                  )}
                >
                  {shown}/{fields.length}
                </span>
              </div>
              {isOpen && (
                <ul className="mb-1 ml-[1.625rem] flex flex-col border-l border-secondary pl-3">
                  {matches.map((f) => (
                    <li
                      key={f.key}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-primary_hover"
                    >
                      <Checkbox
                        isSelected={!hidden.has(f.key)}
                        isDisabled={f.locked}
                        onChange={(on) => set([f.key], on)}
                        label={
                          <span
                            className={cx(
                              "text-sm font-normal",
                              hidden.has(f.key)
                                ? "text-quaternary"
                                : "text-secondary",
                            )}
                          >
                            {f.label}
                          </span>
                        }
                        className="min-w-0 flex-1"
                      />
                      {f.locked && (
                        <span
                          className="flex shrink-0 items-center gap-1 text-xs text-tertiary"
                          title="Identifiers are always shown"
                        >
                          <Lock01 className="size-3" />
                          Always
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
        {q &&
          groups.every(
            ({ section, fields }) =>
              !fields.some(
                (f) =>
                  f.label.toLowerCase().includes(q) ||
                  section.title.toLowerCase().includes(q),
              ),
          ) && (
            <li className="px-3 py-6 text-center text-sm text-tertiary">
              No field matches &quot;{query.trim()}&quot;.
            </li>
          )}
      </ul>
    </section>
  );
}
