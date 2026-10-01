"use client";

import { useRef, useState } from "react";
import { parseDate } from "@internationalized/date";
import { Plus, Trash01 } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { DestructiveModal } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Input } from "@/components/base/input/input";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { ComboBox } from "@/components/base/select/combobox";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { TextArea } from "@/components/base/textarea/textarea";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import { FormSectionList, FormSidebar, deriveSectionStatus } from "@/app/pages/_shared/form-section-list";
import {
  MAX_CUSTOM_COLUMNS,
  OPTIONAL_FIELDS,
  SOURCE_TABLES,
  STANDARD_FIELDS,
  cvStatus,
  cvStatusMeta,
  draftOf,
  emptyCvDraft,
  emptyEntry,
  errorSection,
  newId,
  nextNumber,
  withDerivedOrder,
  sourceTable,
  validateCv,
  type Cv,
  type CvDraft,
  type CvEntry,
  type CvErrors,
  type CvSection,
  type IdentifierKind,
  type StandardField,
} from "@/app/pages/_shared/ctrl-vocab/cv-data";
import { useCvs } from "@/app/pages/_shared/ctrl-vocab/cv-store";
import { mergeTemplate, type ParsedTemplate } from "@/app/pages/_shared/ctrl-vocab/cv-template";
import { AvailabilityNote, DescriptiveGrid, EntriesGrid, MappingTable, type RowOps, type Upload } from "@/app/pages/_shared/ctrl-vocab/cv-grids";

// Add or edit a vocabulary (Figma "Create Ctrl Vocab - Reference / Descriptive" and "Edit Ctrl Vocab",
// nodes 1335:3468, 1339:29976, 1366:91960), re-fitted to the form pattern (CONTRACTS 4.1): sections in
// column 2, label-left rows, every action in the footer, "Details missing" when something mandatory is
// left out.
//
// Three sections:
//   Details   name, category, type (and the source table, for Descriptive), dates, description
//   Columns   which standard columns this vocabulary uses, and up to five custom ones. The Figma's
//             "Customise Columns" side panel becomes this section, so it is saved with the rest.
//             For Reference it also sets the identifier: a typed Code, or ID, numbered automatically
//             and read only, one past the highest in use so none is reused; fixed once live.
//             For Descriptive, it also says which of the source table's columns feed each column
//             (one per line, with the first value as a sample).
//   Entries   the grid of values (the Figma's "Fields and Values"), one row per entry, in display
//             order. Reference: typed in. Descriptive: every cell a search and select over the
//             table's values, picking one table row per entry (cv-grids.tsx). Rows move by drag
//             handle or menu, duplicate, and are switched Available or Hidden.
//
// A filled template uploaded from column 2's Actions opens on Entries with its rows merged
// by Code or ID and marked New or Updated, and a summary above the grid; nothing is saved until the
// admin saves.
//
// Departures from the Figma, named:
//   - Order is not typed: it is worked out from the rows' order, which the drag handle sets, so there
//     is one control for it (4.3).
//   - The standard columns can't be reordered (the side panel's handles): the column order is fixed.
//   - The grid is composed from real tokens with real Input and Select in each cell: there is no
//     editable-grid component in DEW (1.2, "composed, not a real component").
//
// Editing a live vocabulary: no Save draft (4.1.5), Type and identifier are locked (the Figma greys
// Type), and Save changes stays disabled until something changes (the Figma note on node
// 1366:93034). A saved entry can't be removed, only hidden (REQ-18.6), so its code is never reused.

type Attempt = null | "draft" | "publish";


const typeItems = [
  { id: "reference", label: "Reference" },
  { id: "descriptive", label: "Descriptive" },
];
/** What each optional column is for, shown under its checkbox. */
const EXTRA_HINTS: Partial<Record<StandardField, string>> = {
  order: "Each entry's place in the list, typed or picked. Rows can be dragged either way.",
  title: "A short label shown with the name, for example Range 1.",
  description: "A sentence explaining the value.",
  value: "A value that goes with it, for example 0m to 10m.",
};

export function CvForm({
  initial,
  initialUpload,
  onClose,
  onSaveDraft,
  onPublish,
}: {
  /** The vocabulary being edited; omit for a new one. */
  initial?: Cv;
  /** A filled template uploaded from column 2's Actions: merged in on arrival. */
  initialUpload?: ParsedTemplate & { fileName: string };
  onClose: () => void;
  /** `returned` names the template hand-out whose filled copy this save brings back. */
  onSaveDraft: (draft: CvDraft, returned?: { handoutId?: string }) => void;
  onPublish: (draft: CvDraft, returned?: { handoutId?: string }) => void;
}) {
  const live = useCvs();
  // Once saved, the store already holds this vocabulary, so checking again would find its own name
  // "already used" and flash an error before the page moves on. Validation keeps the list as it was.
  const savedPool = useRef<Cv[] | null>(null);
  const all = savedPool.current ?? live;

  // A template uploaded before arriving here is merged into the rows once, on the first render.
  const [start] = useState(() => {
    const base = initial ? draftOf(initial) : emptyCvDraft();
    if (!initialUpload) return { draft: base, upload: null as Upload | null };
    const merged = mergeTemplate(base, initialUpload);
    return {
      draft: { ...base, entries: merged.entries, fields: OPTIONAL_FIELDS.filter((f) => base.fields.includes(f) || merged.fields.includes(f)) },
      upload: { fileName: initialUpload.fileName, handoutId: initialUpload.handoutId, added: new Set(merged.added), updated: new Set(merged.updated), unchanged: merged.unchanged, ignored: merged.ignored },
    };
  });
  const [draft, setDraft] = useState<CvDraft>(start.draft);
  const [upload] = useState<Upload | null>(start.upload);
  const SECTIONS: CvSection[] = ["details", "columns", "values"];
  const sectionOf = errorSection;

  const [section, setSection] = useState<CvSection>(initialUpload ? "values" : "details");
  const [visited, setVisited] = useState<Set<CvSection>>(() => new Set<CvSection>(initialUpload ? ["details", "columns"] : []));
  const [blocked, setBlocked] = useState<Set<CvSection>>(new Set());
  const [submitPressed, setSubmitPressed] = useState(false);
  const [attempt, setAttempt] = useState<Attempt>(null);
  const [dirty, setDirty] = useState(!!initialUpload);
  const [confirmClose, setConfirmClose] = useState(false);
  const [savedIds] = useState(() => new Set(initial && initial.state !== "draft" ? initial.entries.map((e) => e.id) : []));

  const isLive = !!initial && initial.state !== "draft";
  // A new row left completely empty (the starter row, an extra "Add row") is not an entry: it is
  // dropped rather than saved blank or reported as missing. A ID alone doesn't make a row filled.
  const isBlank = (e: CvEntry) =>
    !savedIds.has(e.id) &&
    (draft.type === "descriptive"
      ? !e.sourceKey
      : (draft.idKind === "number" || !e.code.trim()) && !e.name.trim() && !e.title.trim() && !e.description.trim() && !e.value.trim() && !Object.values(e.custom).some((v) => v.trim()));
  // Order is written from the rows' order as they stand (REQ-18.2).
  const cleaned = (): CvDraft => ({ ...draft, entries: withDerivedOrder(draft.entries.filter((e) => !isBlank(e))) });
  const categories = [...new Set(all.map((cv) => cv.category.trim()).filter(Boolean))].sort().map((c) => ({ id: c, label: c }));
  const valuesTitle = "Entries";
  const sectionMeta: Record<CvSection, { title: string; description: string }> = {
    details: { title: "Details", description: "What the vocabulary is called, where it belongs, and when it is live." },
    columns: { title: "Columns", description: "The columns this vocabulary uses, and up to five of your own." },
    values:
      draft.type === "descriptive"
        ? { title: valuesTitle, description: "The table's values this vocabulary offers, one row each: search a cell and pick. Values are read from the table, never copied." }
        : { title: valuesTitle, description: "The values, one row each, in the order users see them: drag a row, or use its menu, to move it." },
  };

  const index = SECTIONS.indexOf(section);
  const isLast = index === SECTIONS.length - 1;

  const rawErrors: CvErrors = attempt ? validateCv(cleaned(), attempt === "draft" ? "draft" : "publish", all, initial?.id) : {};
  const errors: CvErrors = attempt === "draft" || submitPressed ? rawErrors : Object.fromEntries(Object.entries(rawErrors).filter(([path]) => blocked.has(sectionOf(path))));

  const update = (patch: Partial<CvDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };
  const updateEntry = (id: string, patch: Partial<CvEntry>) => update({ entries: draft.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  const toggleField = (id: StandardField, on: boolean) => update({ fields: on ? STANDARD_FIELDS.map((f) => f.id).filter((f) => f === id || draft.fields.includes(f)) : draft.fields.filter((f) => f !== id) });
  const addEntry = () => update({ entries: [...draft.entries, { ...emptyEntry(), code: draft.type === "reference" && draft.idKind === "number" ? nextNumber(draft.entries) : "" }] });
  const ops: RowOps = {
    reorder: (ids) => {
      const byId = new Map(draft.entries.map((e) => [e.id, e]));
      update({ entries: ids.map((id) => byId.get(id)).filter((e): e is CvEntry => !!e) });
    },
    move: (id, to) => {
      const from = draft.entries.findIndex((e) => e.id === id);
      if (from < 0 || to < 0 || to >= draft.entries.length) return;
      const entries = [...draft.entries];
      const [row] = entries.splice(from, 1);
      entries.splice(to, 0, row);
      update({ entries });
    },
    // A copy lands under its row. A Code must be unique, so the copy's is left for the admin; a ID is the next one.
    duplicate:
      draft.type === "reference"
        ? (id) => {
            const at = draft.entries.findIndex((e) => e.id === id);
            if (at < 0) return;
            const copy = { ...structuredClone(draft.entries[at]), id: newId("entry"), code: draft.idKind === "number" ? nextNumber(draft.entries) : "" };
            update({ entries: [...draft.entries.slice(0, at + 1), copy, ...draft.entries.slice(at + 1)] });
          }
        : undefined,
    remove: (id) => update({ entries: draft.entries.filter((e) => e.id !== id) }),
  };
  const addCustom = () => update({ customColumns: [...draft.customColumns, { id: newId("custom"), label: "" }] });
  const renameCustom = (id: string, label: string) => update({ customColumns: draft.customColumns.map((x) => (x.id === id ? { ...x, label } : x)) });
  const removeCustom = (id: string) => {
    const { [id]: _removed, ...mapping } = draft.mapping;
    void _removed;
    update({ customColumns: draft.customColumns.filter((x) => x.id !== id), mapping });
  };
  /** Switching a draft to ID numbers every entry 1, 2, 3 ... in its current order; switching back keeps the numbers as codes. */
  const setIdentifier = (kind: IdentifierKind) => {
    if (kind === draft.idKind) return;
    const renumber = kind === "number" && draft.entries.some((e) => !/^[1-9]\d*$/.test(e.code.trim()));
    update({ idKind: kind, entries: renumber ? draft.entries.map((e, i) => ({ ...e, code: String(i + 1) })) : draft.entries });
  };

  const goTo = (next: CvSection) => {
    setVisited((v) => new Set(v).add(section));
    setSection(next);
  };

  const allProblems = Object.entries(validateCv(cleaned(), "publish", all, initial?.id));
  const currentProblems = [...new Set(allProblems.filter(([path]) => sectionOf(path) === section).map(([, m]) => m))];
  const otherProblemCount = allProblems.length - allProblems.filter(([path]) => sectionOf(path) === section).length;
  const proceed = (next: CvSection) => {
    if (SECTIONS.indexOf(next) > index && currentProblems.length > 0) {
      setAttempt("publish");
      setBlocked((b) => new Set(b).add(section));
      return;
    }
    goTo(next);
  };

  const sectionProblems: Record<CvSection, number> = { details: 0, columns: 0, values: 0 };
  for (const [path] of allProblems) sectionProblems[sectionOf(path)] += 1;
  const sectionItems = SECTIONS.map((id) => ({
    id,
    title: sectionMeta[id].title,
    status: deriveSectionStatus({ isCurrent: id === section, isValid: sectionProblems[id] === 0, visited: visited.has(id), attempted: submitPressed || blocked.has(id) }),
    detail: (submitPressed || blocked.has(id)) && sectionProblems[id] > 0 && id !== section ? `${sectionProblems[id]} to fix` : undefined,
  }));

  const returned = upload ? { handoutId: upload.handoutId } : undefined;
  const publish = () => {
    setAttempt("publish");
    setSubmitPressed(true);
    const first = Object.keys(validateCv(cleaned(), "publish", all, initial?.id))[0];
    if (first) return setSection(sectionOf(first));
    savedPool.current = all;
    onPublish(cleaned(), returned);
  };
  const draftIsValid = () => {
    setAttempt("draft");
    if (Object.keys(validateCv(cleaned(), "draft", all, initial?.id)).length) {
      setSection("details");
      return false;
    }
    return true;
  };
  const saveDraft = () => {
    if (!draftIsValid()) return;
    savedPool.current = all;
    onSaveDraft(cleaned(), returned);
  };

  const status = initial ? cvStatus(initial) : null;
  const title = !initial ? "New vocabulary" : isLive ? `Edit ${initial.name}` : `Edit draft ${initial.name || initial.id}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FormSidebar>
        <FormSectionList
          heading={initial ? initial.id : "Controlled vocabulary"}
          groups={[{ sections: sectionItems }]}
          progress={{ done: sectionItems.filter((i) => i.status === "complete").length, total: SECTIONS.length }}
          onSelect={(id) => proceed(id as CvSection)}
        />
      </FormSidebar>

      <FormPage
        eyebrow={`${title} - Step ${index + 1} of ${SECTIONS.length}`}
        title={sectionMeta[section].title}
        badge={
          status && (
            <Badge size="md" color={cvStatusMeta[status].badgeColor}>
              {cvStatusMeta[status].label}
            </Badge>
          )
        }
        subtitle={`${sectionMeta[section].description} Fields marked * are required; a draft only needs a name.`}
        onCancel={() => (dirty ? setConfirmClose(true) : onClose())}
        onSaveDraft={isLive ? undefined : saveDraft}
        onBack={index > 0 ? () => goTo(SECTIONS[index - 1]) : undefined}
        problems={attempt === "publish" && (submitPressed || blocked.has(section)) && currentProblems.length > 0 ? { items: currentProblems, extra: submitPressed && otherProblemCount > 0 ? `${otherProblemCount} more to fix in other sections.` : undefined } : undefined}
        primaryLabel={isLast ? (isLive ? "Save changes" : "Add vocabulary") : "Continue"}
        primaryIsContinue={!isLast}
        primaryIsDisabled={isLast && isLive && !dirty}
        onPrimary={isLast ? publish : () => proceed(SECTIONS[index + 1])}
      >
        {section === "details" && (
          <>
            <FormRow title="Vocabulary" required>
              <Input
                label="Vocabulary name"
                isRequired
                placeholder="Enter vocabulary name"
                value={draft.name}
                onChange={(v) => update({ name: v })}
                isInvalid={!!errors.name}
                hint={errors.name && errors.name !== "Vocabulary name" ? errors.name : undefined}
              />
              <ComboBox
                label="Category name"
                isRequired
                placeholder="Choose or type a category"
                allowsCustomValue
                items={categories}
                inputValue={draft.category}
                onInputChange={(v) => update({ category: v })}
                onSelectionChange={(k) => k != null && update({ category: String(k) })}
                isInvalid={!!errors.category}
                hint="Choose an existing category, or type a new one."
              >
                {(item) => <SelectItem id={item.id} label={item.label} />}
              </ComboBox>
            </FormRow>
            <FormRow title="Type" required description="Reference values are typed in and kept here. Descriptive values are read from an existing table.">
              <Select
                label="Type"
                isRequired
                isDisabled={isLive}
                items={typeItems}
                selectedKey={draft.type}
                onSelectionChange={(k) => k && update({ type: k as CvDraft["type"] })}
                hint={isLive ? "Fixed once the vocabulary is live." : undefined}
              >
                {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
              </Select>
              {draft.type === "descriptive" && (
                <>
                  <Select
                    label="Source table"
                    isRequired
                    placeholder="Select a table"
                    items={SOURCE_TABLES.map((t) => ({ id: t.id, label: t.label }))}
                    selectedKey={draft.sourceTable || null}
                    onSelectionChange={(k) => k && k !== draft.sourceTable && update({ sourceTable: String(k), mapping: {} })}
                    isInvalid={!!errors.sourceTable}
                    hint="Changing the table clears the column mapping."
                  >
                    {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                  </Select>
                </>
              )}
            </FormRow>
            <FormRow title="Live from" required description="A start date in the future schedules the vocabulary. After the end date it is archived automatically.">
              <div className="grid gap-4 sm:grid-cols-2">
                <InputDatePicker
                  label="Start date"
                  isRequired
                  value={draft.startDate ? parseDate(draft.startDate) : null}
                  onChange={(v) => update({ startDate: v ? v.toString() : "" })}
                  isInvalid={!!errors.startDate}
                  hint="Today, unless you choose another date."
                />
                <InputDatePicker
                  label="End date"
                  value={draft.endDate ? parseDate(draft.endDate) : null}
                  onChange={(v) => update({ endDate: v ? v.toString() : "" })}
                  isInvalid={!!errors.endDate}
                  hint={errors.endDate ?? "Optional. Leave empty to keep it live."}
                />
              </div>
            </FormRow>
            <FormRow title="Short description">
              <TextArea label="Short description" placeholder="Enter a short description" rows={3} value={draft.description} onChange={(v) => update({ description: v })} />
            </FormRow>
          </>
        )}

        {section === "columns" && (
          <>
            {draft.type === "reference" && (
              <FormRow title="Each entry is identified by" required description="Records keep it, so it can't change once the vocabulary is live.">
                <RadioGroup aria-label="Each entry is identified by" isDisabled={isLive} value={draft.idKind ?? "code"} onChange={(v) => setIdentifier(v as IdentifierKind)}>
                  <RadioButton value="code" label="A code you type" hint="Short and unique, for example EN or GDA2020." />
                  <RadioButton value="number" label="An ID, numbered automatically" hint="1, 2, 3 as entries are added, and you can change it. It stays with its entry when rows are moved. For lists with no official code." />
                </RadioGroup>
              </FormRow>
            )}
            <FormRow title="Extra columns" description={`Every entry has ${draft.type === "reference" && draft.idKind === "number" ? "an ID" : "a code"} and a name. Add what else this vocabulary needs.`}>
              <div className="flex flex-col gap-3">
                {OPTIONAL_FIELDS.map((id) => (
                  <Checkbox key={id} label={STANDARD_FIELDS.find((f) => f.id === id)!.label} hint={EXTRA_HINTS[id]} isSelected={draft.fields.includes(id)} onChange={(on) => toggleField(id, on)} />
                ))}
              </div>
            </FormRow>
            <FormRow
              title="Your own columns"
              description={
                draft.type === "descriptive"
                  ? `Up to ${MAX_CUSTOM_COLUMNS} more, for anything else. Each is read from a column of the table.`
                  : `Up to ${MAX_CUSTOM_COLUMNS} more, for anything else. Each holds text.`
              }
            >
              {draft.customColumns.map((c, i) => (
                <div key={c.id} className="flex items-start gap-2">
                  <Input
                    className="flex-1"
                    label={`Custom column ${i + 1}`}
                    placeholder="Column name"
                    value={c.label}
                    onChange={(v) => renameCustom(c.id, v)}
                    isInvalid={!!errors[`custom.${c.id}`]}
                    hint={errors[`custom.${c.id}`] && errors[`custom.${c.id}`] !== "Custom column name" ? errors[`custom.${c.id}`] : undefined}
                  />
                  <div className="pt-6">
                    <Button color="tertiary" size="md" iconLeading={Trash01} aria-label={`Remove custom column ${i + 1}`} onPress={() => removeCustom(c.id)} />
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-3">
                <Button color="link-color" size="md" iconLeading={Plus} isDisabled={draft.customColumns.length >= MAX_CUSTOM_COLUMNS} onPress={addCustom}>
                  Add custom column
                </Button>
                <span className="text-sm text-tertiary tabular-nums">
                  {draft.customColumns.length} of {MAX_CUSTOM_COLUMNS}
                </span>
              </div>
            </FormRow>
            {draft.type === "descriptive" && (
              <FormRow
                title="Read from the table"
                required
                description={`Which columns of the ${sourceTable(draft.sourceTable)?.label ?? "source"} table give each column its values. Order is set by the rows' order in Entries.`}
              >
                <MappingTable draft={draft} errors={errors} onMap={(fieldId, columns) => update({ mapping: { ...draft.mapping, [fieldId]: columns } })} />
              </FormRow>
            )}
          </>
        )}

        {section === "values" && draft.type === "reference" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-primary">Fields and values</p>
              <AvailabilityNote />
              {upload && (
                <AlertFullWidth
                  contained
                  wrap
                  color="brand"
                  title={`Rows from ${upload.fileName}${upload.handoutId ? ` (template ${upload.handoutId})` : ""}`}
                  description={`${upload.added.size} added, ${upload.updated.size} updated, ${upload.unchanged} unchanged. Entries not in the file are kept. Check the rows marked New and Updated, then ${isLive ? "save your changes" : "add the vocabulary or save a draft"}.${upload.ignored.length ? ` Columns not recognised, left out: ${upload.ignored.join(", ")}.` : ""}`}
                  confirmLabel="OK"
                />
              )}
              {errors.entries && <p className="text-sm text-error-primary">Add at least one entry.</p>}
              <EntriesGrid
                widthKey={initial?.id ?? "new"}
                draft={draft}
                savedIds={savedIds}
                errors={errors}
                upload={upload}
                ops={ops}
                onChange={updateEntry}
                onAdd={addEntry}
              />
            </div>
          </div>
        )}

        {section === "values" && draft.type === "descriptive" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-primary">{sourceTable(draft.sourceTable) ? `Fields and values from the ${sourceTable(draft.sourceTable)!.label} table` : "Fields and values"}</p>
            <AvailabilityNote />
            {errors.entries && <p className="text-sm text-error-primary">Add at least one entry.</p>}
            <DescriptiveGrid widthKey={initial?.id ?? "new"} draft={draft} savedIds={savedIds} errors={errors} ops={ops} onChange={updateEntry} onAdd={addEntry} />
          </div>
        )}
      </FormPage>

      <DestructiveModal
        isOpen={confirmClose}
        onOpenChange={setConfirmClose}
        title="Discard your changes?"
        description={isLive ? "You have unsaved changes to this vocabulary. Leaving now will lose them." : "You have unsaved changes to this vocabulary. Save a draft to keep them, or discard them."}
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        secondaryLabel={isLive ? undefined : "Save draft"}
        onSecondary={() => {
          setConfirmClose(false);
          saveDraft();
        }}
        onConfirm={() => {
          setConfirmClose(false);
          onClose();
        }}
      />
    </div>
  );
}
