"use client";

import { Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select } from "@/components/base/select/select";
import { useTaxa, commitAppend, commitCombine, commitRename, commitSplit } from "@/app/pages/_shared/taxonomy/tx-store";
import {
  HIGHER_TAXA_LEVELS,
  INFRASPECIFIC_RANKS,
  emptyNameParts,
  nameFromParts,
  nameOptions,
  partsOf,
  type ChangeType,
  type Kingdom,
  type NameParts,
  type Taxon,
  type TaxonChange,
} from "@/app/pages/_shared/taxonomy/tx-data";
import { cx } from "@/utils/cx";

// The fields of the four actions (Figma frames "Rename Taxon", "Combine Taxon", "Split Taxon",
// "Append Species"), shared by the three layout options, plus what each action needs before it can be
// committed and what committing does. Every option asks exactly these fields; they differ in how the
// fields are reached and whether a review comes before the commit.
//
// Read from the Figma, and decided here:
// - The taxon being changed is picked by NSX Code, from a searchable list (the list grows with the
//   taxonomy). Its name fills in beside it and is read only.
// - An old taxon's name parts (Combine's "Old Species") show what the picked taxon already holds, read
//   only: they describe the taxon, they are not being edited.
// - A new taxon's NSX code is typed by the admin, for Combine, Split and Append alike: nothing assigns
//   one on commit (the designer, Sept 30 2026). It must not already be in use.

export interface ChangeDraft {
  kingdom: Kingdom | null;
  /** Rename and Split: the taxon being changed. */
  from: string | null;
  /** Combine: the taxa being combined (a slot may be empty). */
  combineFrom: string[];
  /** The new taxon (Rename, Combine, Append). */
  next: NameParts;
  /** Split: the new taxa. */
  splitInto: NameParts[];
}

export const emptyDraft = (kingdom: Kingdom | null = null, from: string | null = null): ChangeDraft => ({
  kingdom,
  from,
  combineFrom: from ? [from, ""] : ["", ""],
  next: emptyNameParts(),
  splitInto: [emptyNameParts(), emptyNameParts()],
});

/** An NSX code is missing, or already belongs to a taxon. `taken` is every code in use. */
export const nsxProblem = (code: string, taken: string[]) => (!code.trim() ? "Enter the new NSX code" : taken.includes(code.trim().toUpperCase()) ? "This NSX code is already in use" : undefined);

/** What is still missing before the change can be committed, as short names for the "Details missing" alert. */
export function missingFor(type: ChangeType, d: ChangeDraft, taken: string[] = []): string[] {
  const miss: string[] = [];
  const named = (p: NameParts) => p.genus.trim() && p.species.trim();
  const codes = type === "split" ? d.splitInto.map((p) => p.nsx) : type === "rename" ? [] : [d.next.nsx];
  const typed = codes.map((c) => c.trim().toUpperCase());
  if (codes.some((c, i) => nsxProblem(c, taken) || typed.indexOf(typed[i]) !== i)) miss.push(type === "split" ? "A new, unused NSX Code for every new taxon" : "A new, unused NSX Code");
  if (!d.kingdom) miss.push("Species Type");
  if ((type === "rename" || type === "split") && !d.from) miss.push(type === "rename" ? "Taxon to rename" : "Taxon to split");
  if (type === "combine" && d.combineFrom.filter(Boolean).length < 2) miss.push("At least two taxa to combine");
  if ((type === "rename" || type === "combine" || type === "append") && !named(d.next)) miss.push("New Genus and New Species");
  if (type === "split" && d.splitInto.some((p) => !named(p))) miss.push("New Genus and New Species for every new taxon");
  return miss;
}

export function commitDraft(type: ChangeType, d: ChangeDraft): TaxonChange | null {
  if (type === "rename") return commitRename(d.from!, d.next);
  if (type === "combine") return commitCombine(d.combineFrom.filter(Boolean), d.next);
  if (type === "split") return commitSplit(d.from!, d.splitInto);
  return commitAppend(d.kingdom!, d.next);
}

/** Before and after, for a review and for the confirmation message. */
export function changePreview(type: ChangeType, d: ChangeDraft, taxa: Taxon[]) {
  const find = (id: string | null) => taxa.find((t) => t.id === id);
  const before = type === "combine" ? d.combineFrom.map(find).filter((t): t is Taxon => !!t) : type === "append" ? [] : [find(d.from)].filter((t): t is Taxon => !!t);
  const after = type === "split" ? d.splitInto.map(nameFromParts) : [nameFromParts(d.next)];
  return { before, after };
}

// ── Fields ──

export function SpeciesTypeField({ value, onChange, isDisabled, showError }: { value: Kingdom | null; onChange: (k: Kingdom) => void; isDisabled?: boolean; showError?: boolean }) {
  return (
    <>
      <RadioGroup aria-label="Species Type" orientation="horizontal" value={value ?? ""} onChange={(v) => onChange(v as Kingdom)} isDisabled={isDisabled} isInvalid={showError && !value} className="gap-8">
        <RadioButton value="Flora" label="Flora" />
        <RadioButton value="Fauna" label="Fauna" />
      </RadioGroup>
      {showError && !value && <p className="text-sm text-error-primary">Choose Flora or Fauna</p>}
    </>
  );
}

/** The NSX Code picker and the taxon name it fills in (Rename's and Split's "Select Taxon"). */
export function TaxonCodePicker({
  kingdom,
  value,
  onChange,
  exclude = [],
  isDisabled,
  label = "NSX Code",
  showError,
}: {
  kingdom: Kingdom | null;
  value: string | null;
  onChange: (id: string) => void;
  exclude?: string[];
  isDisabled?: boolean;
  label?: string;
  /** The person tried to move on: an empty picker shows its error. */
  showError?: boolean;
}) {
  const taxa = useTaxa();
  const pool = taxa.filter((t) => t.current && t.nsx && (!kingdom || t.kingdom === kingdom) && !exclude.includes(t.id));
  const picked = taxa.find((t) => t.id === value);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-secondary">{label}</p>
        <MultiSelect
          aria-label={label}
          selectionMode="single"
          size="sm"
          placeholder={kingdom ? "Search by code or name" : "Choose Flora or Fauna first"}
          isDisabled={isDisabled || !kingdom}
          items={pool.map((t) => ({ id: t.id, label: t.nsx!, supportingText: t.scientific }))}
          selectedKeys={new Set(value ? [value] : [])}
          onSelectionChange={(keys) => {
            const next = keys === "all" ? undefined : Array.from(keys as Set<string>)[0];
            if (next) onChange(String(next));
          }}
          emptyStateTitle="No taxon matches"
          isInvalid={showError && !value}
          hint={showError && !value ? "Choose a taxon" : undefined}
        >
          {(item) => <MultiSelect.Item {...item} />}
        </MultiSelect>
      </div>
      <Input size="sm" label="Taxon" isDisabled value={picked?.scientific ?? ""} />
    </div>
  );
}

function PickList({ label, placeholder, options, value, onChange, isDisabled, error }: { label: string; placeholder?: string; options: string[]; value: string; onChange: (v: string) => void; isDisabled?: boolean; error?: string }) {
  const items = [...new Set([...(value ? [value] : []), ...options])].map((o) => ({ id: o, label: o }));
  return (
    <Select size="sm" label={label} placeholder={placeholder ?? "Select"} isDisabled={isDisabled} isInvalid={!!error} hint={error} items={items} selectedKey={value || null} onSelectionChange={(k) => onChange(String(k ?? ""))}>
      {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
    </Select>
  );
}

/**
 * A taxon's name parts. `prefix` is "New " for the taxon being made, "" for an old one. `readOnly`
 * shows an old taxon's parts as they are. `append` adds Append's New Higher Taxa Name, Order, Major
 * Group and Family; `withAuthor` adds Combine's Species Author.
 */
export function NamePartsFields({
  parts,
  onChange,
  kingdom,
  prefix = "New ",
  readOnly = false,
  append = false,
  withAuthor = false,
  showError = false,
}: {
  parts: NameParts;
  onChange: (p: NameParts) => void;
  kingdom: Kingdom | null;
  prefix?: string;
  readOnly?: boolean;
  append?: boolean;
  withAuthor?: boolean;
  /** The person tried to move on: an empty New Genus or New Species shows its error. */
  showError?: boolean;
}) {
  const taxa = useTaxa();
  const opts = nameOptions(taxa, kingdom);
  const set = (patch: Partial<NameParts>) => onChange({ ...parts, ...patch });
  const infra = (i: number, patch: Partial<NameParts["infra"][number]>) => set({ infra: parts.infra.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const dis = readOnly;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <PickList label={`${prefix}Higher Taxa Level`} placeholder="Eg; Order" options={HIGHER_TAXA_LEVELS} value={parts.higherTaxaLevel} onChange={(v) => set({ higherTaxaLevel: v, higherTaxaName: "" })} isDisabled={dis} />
        <PickList
          label={append ? "New Higher Taxa Name" : `${prefix}Higher Taxa Name`}
          placeholder="Eg; Order Name"
          options={opts.higherNames(parts.higherTaxaLevel || "Order")}
          value={parts.higherTaxaName}
          onChange={(v) => set({ higherTaxaName: v })}
          isDisabled={dis}
        />
      </div>
      {append && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <PickList label="New Order" options={opts.orders} value={parts.order} onChange={(v) => set({ order: v })} />
            <Input size="sm" label="New Major Group" value={parts.majorGroup} onChange={(v) => set({ majorGroup: v })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PickList label="New Family" options={opts.families} value={parts.family} onChange={(v) => set({ family: v })} />
          </div>
        </>
      )}
      <div className={cx("grid gap-4", withAuthor ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        <PickList label={`${prefix}Genus`} options={opts.genera} value={parts.genus} onChange={(v) => set({ genus: v })} isDisabled={dis} error={showError && !parts.genus.trim() ? "Choose a genus" : undefined} />
        <SpeciesEpithet label={`${prefix}Species`} value={parts.species} onChange={(v) => set({ species: v })} isDisabled={dis} options={opts.species} error={showError && !parts.species.trim() ? "Choose or type a species" : undefined} />
        {withAuthor && <PickList label="Species Author" options={opts.authors} value={parts.speciesAuthor} onChange={(v) => set({ speciesAuthor: v })} isDisabled={dis} />}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid gap-4 sm:grid-cols-2">
          <PickList label={`Infraspecific ${i + 1} Rank`} options={INFRASPECIFIC_RANKS} value={parts.infra[i]?.rank ?? ""} onChange={(v) => infra(i, { rank: v })} isDisabled={dis} />
          <Input size="sm" label={`Infraspecific ${i + 1}`} isDisabled={dis} value={parts.infra[i]?.name ?? ""} onChange={(v) => infra(i, { name: v })} />
        </div>
      ))}
    </div>
  );
}

/**
 * Figma draws New Species as a dropdown, but a new name is usually one not in use yet: the list
 * offers the epithets in use, and "Type a new one" switches it to a text field.
 */
function SpeciesEpithet({ label, value, onChange, isDisabled, options, error }: { label: string; value: string; onChange: (v: string) => void; isDisabled?: boolean; options: string[]; error?: string }) {
  const typed = !!value && !options.includes(value);
  const items = [...options.map((o) => ({ id: o, label: o })), { id: "__new", label: "Type a new one" }];
  if (typed || value === " ")
    return <Input size="sm" label={label} isDisabled={isDisabled} value={value.trim()} onChange={onChange} isInvalid={!!error} hint={error ?? (isDisabled ? undefined : "A species epithet not in the list yet")} />;
  return (
    <Select size="sm" label={label} placeholder="Select" isDisabled={isDisabled} isInvalid={!!error} hint={error} items={items} selectedKey={value || null} onSelectionChange={(k) => onChange(k === "__new" ? " " : String(k ?? ""))}>
      {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
    </Select>
  );
}

/** A grey card around one group of fields, as the Figma boxes them ("Taxon 1", "Select New Taxon Name"). */
export function FieldCard({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("flex flex-col gap-4 rounded-xl bg-secondary p-5 ring-1 ring-secondary ring-inset", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3">
          {title && <p className="text-sm font-semibold text-primary">{title}</p>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Combine's "Old Species": one card per taxon, and Add Taxon. */
export function CombineInputs({ draft, onChange, showError }: { draft: ChangeDraft; onChange: (d: ChangeDraft) => void; showError?: boolean }) {
  const taxa = useTaxa();
  return (
    <div className="flex flex-col gap-4">
      {draft.combineFrom.map((id, i) => {
        const t = taxa.find((x) => x.id === id);
        return (
          <FieldCard
            key={i}
            title={`Taxon ${i + 1}`}
            action={
              draft.combineFrom.length > 2 ? (
                <Button color="tertiary" size="sm" iconLeading={Trash01} aria-label={`Remove taxon ${i + 1}`} onClick={() => onChange({ ...draft, combineFrom: draft.combineFrom.filter((_, j) => j !== i) })} />
              ) : undefined
            }
          >
            <TaxonCodePicker
              kingdom={draft.kingdom}
              value={id || null}
              exclude={draft.combineFrom.filter((x, j) => x && j !== i)}
              showError={showError}
              onChange={(next) => onChange({ ...draft, combineFrom: draft.combineFrom.map((x, j) => (j === i ? next : x)) })}
            />
            <NamePartsFields parts={t ? partsOf(t) : emptyNameParts()} onChange={() => {}} kingdom={draft.kingdom} prefix="" readOnly withAuthor />
          </FieldCard>
        );
      })}
      <div>
        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => onChange({ ...draft, combineFrom: [...draft.combineFrom, ""] })}>
          Add Taxon
        </Button>
      </div>
    </div>
  );
}

/** Every NSX code in use, upper-cased, to refuse a new taxon a code that is taken. */
export function useTakenCodes(): string[] {
  return useTaxa()
    .map((t) => t.nsx?.toUpperCase())
    .filter((c): c is string => !!c);
}

/** New NSX Code, for Combine, Split and Append: typed, required, and not one already in use. */
export function NewNsxField({ value, onChange, showError, duplicate }: { value: string; onChange: (v: string) => void; showError?: boolean; duplicate?: boolean }) {
  const taken = useTakenCodes();
  const problem = nsxProblem(value, taken) ?? (duplicate ? "Each new taxon needs its own NSX code" : undefined);
  // "In use" is shown as soon as it is typed; "enter one" waits until the person tries to move on (4.1).
  const shown = problem && (showError || (value.trim() && problem !== "Enter the new NSX code")) ? problem : undefined;
  return (
    <div className="sm:max-w-[calc(50%-0.5rem)]">
      <Input size="sm" label="New NSX Code" isRequired value={value} onChange={onChange} isInvalid={!!shown} hint={shown} />
    </div>
  );
}

/** Split's "New Taxon": one card per new taxon, and Add Taxon. */
export function SplitOutputs({ draft, onChange, showError }: { draft: ChangeDraft; onChange: (d: ChangeDraft) => void; showError?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {draft.splitInto.map((p, i) => (
        <FieldCard
          key={i}
          title={`Taxon ${i + 1}`}
          className="bg-primary"
          action={
            draft.splitInto.length > 2 ? (
              <Button color="tertiary" size="sm" iconLeading={Trash01} aria-label={`Remove taxon ${i + 1}`} onClick={() => onChange({ ...draft, splitInto: draft.splitInto.filter((_, j) => j !== i) })} />
            ) : undefined
          }
        >
          <NewNsxField
            value={p.nsx}
            showError={showError}
            duplicate={!!p.nsx.trim() && draft.splitInto.some((o, j) => j !== i && o.nsx.trim().toUpperCase() === p.nsx.trim().toUpperCase())}
            onChange={(nsx) => onChange({ ...draft, splitInto: draft.splitInto.map((x, j) => (j === i ? { ...x, nsx } : x)) })}
          />
          <NamePartsFields parts={p} kingdom={draft.kingdom} showError={showError} onChange={(next) => onChange({ ...draft, splitInto: draft.splitInto.map((x, j) => (j === i ? next : x)) })} />
        </FieldCard>
      ))}
      <div>
        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => onChange({ ...draft, splitInto: [...draft.splitInto, emptyNameParts()] })}>
          Add Taxon
        </Button>
      </div>
    </div>
  );
}

/** Whether the concept picked for Rename is current (Figma: "Is concept current? Yes"). */
export function ConceptCurrent({ taxonId }: { taxonId: string | null }) {
  const t = useTaxa().find((x) => x.id === taxonId);
  if (!t) return null;
  return (
    <p className="text-sm text-secondary">
      Is concept current? <span className="font-medium text-primary">{t.current ? "Yes" : "No"}</span>
    </p>
  );
}
