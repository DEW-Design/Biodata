"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Download01 } from "@untitledui/icons";
import { utils as sheetUtils, writeFile as writeWorkbookFile } from "xlsx";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Table, TableHeader, Column, TableBody, Row, Cell } from "@/components/base/table/table";
import { Accordion } from "@/components/base/accordion/accordion";
import { VALID_TYPES_BY_KIND, FIELD_SCHEMA, KNOWN_GAPS, BDBSA_KEY_CROSSWALK, type RecordKind } from "@/config/data-model-schema";

// "This begs to be more visual... let's have another route /config/data-model - so everything is
// visible and transparent. If any changes need to be made, they can sit here." Per the user
// directly, after a round of hand-checking `FIELD_SCHEMA` against 4 real BDBSA legacy exports
// surfaced real, confirmed gaps (see `KNOWN_GAPS` in `config/data-model-schema.ts`) that were
// otherwise only visible buried in a proto file's comments and a chat transcript. This page reads
// the exact same `FIELD_SCHEMA`/`KNOWN_GAPS`/`BDBSA_KEY_CROSSWALK` the `/proto/data-model-stress-
// test` sandbox validates real uploads against - one source of truth, two views of it (this one for
// review, that one for hands-on testing) - never a second, independent copy that could drift.
//
// Not a component doc page (no Playground/Variants/API/Figma sections) - this documents a data
// model, not a UI component, so it follows `/config`'s own simpler template instead: PageHeader +
// direct content. Gaps are rendered as plain, always-visible cards rather than behind an Accordion
// - the whole point is that they're impossible to miss, not tucked away. The field schema itself
// *is* behind Accordion items (progressive disclosure, per this codebase's own cognitive-load
// principles) - ~130 fields shown flat at once would be the exact flat-scroll overload problem
// this codebase's design principles exist to prevent.
//
// Per the user directly: "under each - i need a table with three columns: first column is the
// concept name used in the UI, concept name from BDBSA and the third column with Verified checkbox
// - that persists." That's `FieldSchemaTable` below - the same `BDBSA_KEY_CROSSWALK` the sandbox
// annotates its own JSON with, now the source for a real, human-reviewable table instead of a
// code comment. "Verified" is a real per-field checkbox, persisted to `localStorage` (same
// client-only persistence convention as `/config`'s own overrides - a real edit, not just a demo
// toggle, so `"use client"` and a small dedicated hook rather than the design-system config
// context, which is a different, unrelated shape of data).
const KIND_ORDER: RecordKind[] = ["Event", "Occurrence", "Observation"];

const VERIFIED_STORAGE_KEY = "dew-data-model-verified-fields";

function useVerifiedFields() {
  const [verified, setVerified] = useState<Set<string>>(new Set());

  // Client-only read, same hydration-safe pattern as `ConfigProvider`: server and first client
  // render both start from the same empty default, so this can only ever add a checkmark, never
  // mismatch. `react-hooks/set-state-in-effect` flags this - same pre-existing, accepted shape as
  // `ConfigProvider`'s own localStorage hydration (`lib/config-context.tsx`) - a one-time read of an
  // external store on mount has no equivalent lint-clean idiom in this codebase yet.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VERIFIED_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration
      if (raw) setVerified(new Set(JSON.parse(raw) as string[]));
    } catch {
      // Corrupt/unavailable storage - fall back to the empty default silently.
    }
  }, []);

  const toggle = (key: string) => {
    setVerified((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(VERIFIED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Storage unavailable - the toggle still works for this session, just won't persist.
      }
      return next;
    });
  };

  return { verified, toggle };
}

// Same "Not yet checked" / "No equivalent found" / real key logic `FieldSchemaTable` below renders
// on screen - shared here so the Excel export and the on-page table can never say something
// different about the same field.
function bdbsaDisplayText(crosswalk: Record<string, string | null> | undefined, field: string) {
  if (!crosswalk || !(field in crosswalk)) return "Not yet checked";
  const bdbsaKey = crosswalk[field];
  return bdbsaKey ? bdbsaKey : "No equivalent found";
}

// "Can I get an excel download - split into different tabs e.g., (site, visit, observations) on
// the data model view?" - per the user directly. One sheet per Event type that has a real schema
// (Site, Visit), plus one sheet per Observation type (Individual/Population/Community/Non-biotic) -
// per the user's follow-up ("Observations - all the four types please"), each type's own fields,
// not one deduplicated union sheet. Per the user's second follow-up ("we also need the BDBSA
// Concept name as well - this needs to feed in as the team needs to cross-check the mapping"),
// each sheet is now two columns - "Concept name (UI)" and "Concept name (BDBSA)" - not just a bare
// field-name header row, so the crosswalk itself travels with the template instead of staying
// locked to this page's own on-screen table. Built with `xlsx` (SheetJS, already a dependency for
// the sandbox's own XLS/XLSX parsing) - `writeFile` triggers a real browser download, still
// entirely client-side, no server round-trip.
function downloadDataModelWorkbook() {
  const workbook = sheetUtils.book_new();

  const addSheet = (name: string, key: string, fields: string[]) => {
    const crosswalk = BDBSA_KEY_CROSSWALK[key];
    const rows = [
      ["Concept name (UI)", "Concept name (BDBSA)"],
      ...fields.map((field) => [field, bdbsaDisplayText(crosswalk, field)]),
    ];
    sheetUtils.book_append_sheet(workbook, sheetUtils.aoa_to_sheet(rows), name);
  };

  addSheet("Site", "Event:Site", FIELD_SCHEMA["Event:Site"] ?? []);
  addSheet("Visit", "Event:Visit", FIELD_SCHEMA["Event:Visit"] ?? []);
  for (const type of VALID_TYPES_BY_KIND.Observation) {
    const key = `Observation:${type}`;
    addSheet(`Observation - ${type}`, key, FIELD_SCHEMA[key] ?? []);
  }

  writeWorkbookFile(workbook, "biodata-sa-ingestion-template.xlsx");
}

function GapCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-25 p-4">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-fg-warning-primary" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="text-sm text-tertiary text-balance">{description}</p>
      </div>
    </div>
  );
}

function FieldSchemaTable({
  kind,
  type,
  fields,
  verified,
  onToggle,
}: {
  kind: string;
  type: string;
  fields: string[];
  verified: Set<string>;
  onToggle: (key: string) => void;
}) {
  const crosswalk = BDBSA_KEY_CROSSWALK[`${kind}:${type}`];

  return (
    <Table aria-label={`${kind}:${type} field schema`}>
      <TableHeader>
        <Column id="field" isRowHeader>
          Concept name (UI)
        </Column>
        <Column id="bdbsa">Concept name (BDBSA)</Column>
        <Column id="verified">Verified</Column>
      </TableHeader>
      <TableBody items={fields.map((field) => ({ field }))}>
        {(item) => {
          const bdbsaKey = crosswalk?.[item.field];
          const bdbsaText = bdbsaDisplayText(crosswalk, item.field);
          const verifyKey = `${kind}:${type}:${item.field}`;
          return (
            <Row id={item.field}>
              <Cell>{item.field}</Cell>
              <Cell>
                <span className={bdbsaKey ? "text-tertiary" : "text-quaternary"}>{bdbsaText}</span>
              </Cell>
              <Cell>
                <Checkbox aria-label={`Mark "${item.field}" verified`} isSelected={verified.has(verifyKey)} onChange={() => onToggle(verifyKey)} />
              </Cell>
            </Row>
          );
        }}
      </TableBody>
    </Table>
  );
}

export default function DataModelConfigPage() {
  const { verified, toggle } = useVerifiedFields();

  const schemaAccordionItems = KIND_ORDER.flatMap((kind) =>
    VALID_TYPES_BY_KIND[kind].map((type) => {
      const key = `${kind}:${type}`;
      const fields = FIELD_SCHEMA[key];
      return {
        id: key,
        title: (
          <span className="flex items-center gap-2">
            <Badge size="sm" color="gray">
              {kind}
            </Badge>
            <span className="text-sm font-semibold text-primary">{type}</span>
            <span className="text-xs text-quaternary">{fields ? `${fields.length} fields` : "no schema yet"}</span>
          </span>
        ),
        content: fields ? (
          <FieldSchemaTable kind={kind} type={type} fields={fields} verified={verified} onToggle={toggle} />
        ) : (
          <p className="text-sm text-quaternary">
            No real field template has been provided for {kind}:{type} yet - it falls back to generic passthrough (every column becomes a field, nothing
            validated against a known list).
          </p>
        ),
      };
    }),
  );

  return (
    <div className="prose-doc">
      <PageHeader
        section="Reference"
        title="Data Model"
        description="The real ingestion field schema for every record type, and every gap found hand-checking it against actual BDBSA legacy exports. This is the single source of truth the stress-test sandbox validates uploads against - changes belong here, not in a second copy."
      />

      <div className="mb-10 flex items-center justify-between gap-4">
        <p className="text-sm text-tertiary">Want to test a real file against this schema?</p>
        <div className="flex items-center gap-3">
          <Button size="sm" color="secondary" iconLeading={Download01} onClick={downloadDataModelWorkbook}>
            Download Excel template
          </Button>
          <Button size="sm" color="secondary" href="/proto/data-model-stress-test">
            Open the ingestion sandbox
          </Button>
        </div>
      </div>

      <h2 className="mb-1 text-lg font-semibold text-primary">Known gaps</h2>
      <p className="mb-4 text-sm text-tertiary text-balance">
        Confirmed by hand-checking this schema against 4 real BDBSA legacy exports (Site/Visit/Species Fauna/Species Flora, survey SU1211) - not hypothetical.
        Each one is a real decision still waiting to be made.
      </p>
      <div className="mb-10 flex flex-col gap-3">
        {KNOWN_GAPS.map((gap) => (
          <GapCard key={gap.title} title={gap.title} description={gap.description} />
        ))}
      </div>

      <h2 className="mb-1 text-lg font-semibold text-primary">Field schema, by record type</h2>
      <p className="mb-4 text-sm text-tertiary text-balance">
        Every field name here is real, pulled directly from that type&apos;s own Figma ingestion-template frame - never invented, never a wireframe&apos;s own
        example value. All 6 record types below have now been hand-checked field-by-field against a real BDBSA export, so every row here reads either a real
        BDBSA column or an honest &ldquo;No equivalent found&rdquo; - &ldquo;Not yet checked&rdquo; should no longer appear at all. Tick a row off once
        you&apos;ve personally confirmed it - that stays saved in this browser.
      </p>
      <Accordion items={schemaAccordionItems} className="mb-10" />
    </div>
  );
}
