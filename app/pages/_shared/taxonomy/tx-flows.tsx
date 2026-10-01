"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight, GitBranch01, GitMerge, PencilLine, Plus } from "@untitledui/icons";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { RadioGroupIconCard } from "@/components/base/radio-groups/radio-group-icon-card";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import { FormSectionList, FormSidebar, deriveSectionStatus } from "@/app/pages/_shared/form-section-list";
import { useTaxa, useTaxon } from "@/app/pages/_shared/taxonomy/tx-store";
import { CHANGE_META, CHANGE_TYPES, TX_ROOT, partsOf, type ChangeType, type Taxon } from "@/app/pages/_shared/taxonomy/tx-data";
import {
  CombineInputs,
  NewNsxField,
  ConceptCurrent,
  NamePartsFields,
  SpeciesTypeField,
  SplitOutputs,
  TaxonCodePicker,
  changePreview,
  commitDraft,
  emptyDraft,
  missingFor,
  useTakenCodes,
  type ChangeDraft,
} from "@/app/pages/_shared/taxonomy/tx-actions";
import { speciesHref } from "@/app/pages/_shared/taxonomy/tx-records";
import { useRoleHref } from "@/lib/use-role-href";

const CHANGE_ICON = { rename: PencilLine, combine: GitMerge, split: GitBranch01, append: Plus } as const;

/** A draft started from a species: its kingdom, and the taxon itself as the input, with its name as the starting point for a rename. */
function draftFrom(type: ChangeType, t: Taxon | undefined): ChangeDraft {
  if (!t) return emptyDraft();
  const d = emptyDraft(t.kingdom, type === "append" ? null : t.id);
  if (type === "rename") d.next = partsOf(t);
  if (type === "append") d.next = { ...partsOf(t), species: "", speciesAuthor: "" };
  return d;
}

type Step = "type" | "from" | "to" | "review";

const FROM_TITLE: Record<ChangeType, string> = { rename: "Taxon to rename", combine: "Taxa to combine", split: "Taxon to split", append: "Species type" };
const TO_TITLE: Record<ChangeType, string> = { rename: "New name", combine: "New taxon", split: "New taxa", append: "New species" };

/** A taxon in the review: its name, and what it is (or will be). */
function ReviewTaxon({ name, note, muted }: { name: string; note: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-primary px-3 py-2 ring-1 ring-secondary ring-inset">
      <span className={muted ? "text-sm text-tertiary italic line-through" : "text-sm font-medium text-primary italic"}>{name || "Unnamed"}</span>
      <span className="text-xs text-tertiary">{note}</span>
    </div>
  );
}

function Review({ type, draft }: { type: ChangeType; draft: ChangeDraft }) {
  const taxa = useTaxa();
  const { before, after } = changePreview(type, draft, taxa);
  const effects: string[] =
    type === "rename"
      ? [`Keeps its NSX code, ${before[0]?.nsx ?? ""}, and every record already made against it.`, `${before[0]?.scientific} is added to its synonyms.`]
      : type === "combine"
        ? [
            `${before.length} taxa stop being current and are listed as synonyms of the new taxon.`,
            "Linked Species: each is recorded as a parent (older taxon) of the new one.",
            `The new taxon takes the NSX code ${draft.next.nsx.trim()}.`,
          ]
        : type === "split"
          ? [`${before[0]?.scientific} stops being current.`, `Linked Species: it is recorded as the parent (older taxon) of each of the ${after.length} new taxa.`, `New NSX codes: ${draft.splitInto.map((p) => p.nsx.trim()).join(", ")}.`]
          : [`Added to ${draft.next.genus || "its genus"}${draft.next.family ? `, ${draft.next.family}` : ""}.`, `Its NSX code is ${draft.next.nsx.trim()}.`];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-center gap-4 rounded-xl bg-secondary p-5 ring-1 ring-secondary ring-inset md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Before</p>
          {before.length ? before.map((t) => <ReviewTaxon key={t.id} name={t.scientific} note={`${t.nsx ?? ""} · current`} muted={type !== "rename"} />) : <p className="text-sm text-tertiary">Not in the taxonomy yet</p>}
        </div>
        <ArrowNarrowRight className="size-5 justify-self-center text-fg-quaternary max-md:rotate-90" aria-hidden />
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">After</p>
          {after.map((name, i) => (
            <ReviewTaxon key={i} name={name} note={type === "rename" ? `${before[0]?.nsx ?? ""} · current` : `${(type === "split" ? draft.splitInto[i]?.nsx : draft.next.nsx)?.trim() ?? ""} · new`} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-primary">What will happen</p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-secondary">
          {effects.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * The guided taxon change: pick the kind of change, then what it starts from, then what it makes,
 * then review a before and after and commit. A form with steps (4.1): the steps are in column 2, any
 * step can be opened, and moving on is refused while the current step is missing something. The
 * fields are the Figma's own.
 */
export function TaxonChangeFlow({ initialType, from }: { initialType: ChangeType | null; from: string | null }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const taxa = useTaxa();
  const origin = useTaxon(from);
  const [type, setType] = useState<ChangeType | null>(initialType);
  const [draft, setDraft] = useState<ChangeDraft>(() => (initialType ? draftFrom(initialType, origin) : emptyDraft(origin?.kingdom ?? null, from)));
  const order: Step[] = ["type", "from", "to", "review"];
  const [step, setStep] = useState<Step>(initialType ? "from" : "type");
  const [visited, setVisited] = useState<Set<Step>>(new Set(initialType ? ["type", "from"] : ["type"]));
  const [attempted, setAttempted] = useState<Set<Step>>(new Set());
  const [confirmLeave, setConfirmLeave] = useState(false);
  const taken = useTakenCodes();

  const missingAt = (s: Step): string[] => {
    if (s === "type") return type ? [] : ["The kind of change"];
    if (!type) return [];
    const all = missingFor(type, draft, taken);
    const toItems = ["New Genus and New Species", "New Genus and New Species for every new taxon", "A new, unused NSX Code", "A new, unused NSX Code for every new taxon"];
    if (s === "from") return all.filter((m) => !toItems.includes(m));
    if (s === "to") return all.filter((m) => toItems.includes(m));
    return all;
  };
  const go = (next: Step) => {
    setVisited((v) => new Set([...v, next]));
    setStep(next);
  };
  const tryLeave = (next: Step) => {
    const idx = order.indexOf(next);
    if (idx <= order.indexOf(step)) return go(next);
    for (const s of order.slice(0, idx)) {
      if (missingAt(s).length) {
        setAttempted((a) => new Set([...a, s]));
        setStep(s);
        return;
      }
    }
    go(next);
  };

  const meta = type ? CHANGE_META[type] : null;
  const sections = (["type", "from", "to"] as Step[]).map((s) => ({
    id: s,
    title: s === "type" ? "Kind of change" : type ? (s === "from" ? FROM_TITLE[type] : TO_TITLE[type]) : s === "from" ? "Taxa in" : "Taxa out",
    status: deriveSectionStatus({ isCurrent: step === s, isValid: !missingAt(s).length, visited: visited.has(s), attempted: attempted.has(s) }),
  }));
  const done = sections.filter((s) => s.status === "complete").length;
  const leave = () => router.push(roleHref(origin ? speciesHref(origin.id) : TX_ROOT));
  const problems = attempted.has(step) && missingAt(step).length ? { items: missingAt(step) } : undefined;

  return (
    <>
      <FormSidebar>
        <FormSectionList
          heading={meta ? meta.title : "New taxon change"}
          groups={[{ sections }]}
          closing={{ id: "review", title: "Review and commit", status: deriveSectionStatus({ isCurrent: step === "review", isValid: true, visited: visited.has("review"), attempted: false }) }}
          onSelect={(id) => tryLeave(id as Step)}
          progress={{ done, total: sections.length }}
        />
      </FormSidebar>
      <FormPage
        eyebrow={meta ? `${meta.verb} · ${meta.shape}` : undefined}
        title={step === "review" ? "Review and commit" : sections.find((s) => s.id === step)?.title ?? ""}
        subtitle={step === "type" ? "What should happen to the taxonomy?" : meta?.summary}
        onCancel={() => (visited.size > 1 || type ? setConfirmLeave(true) : leave())}
        onBack={step === "type" ? undefined : () => go(order[order.indexOf(step) - 1])}
        problems={problems}
        primaryLabel={step === "review" ? (meta?.commitLabel ?? "Commit") : "Continue"}
        primaryIsContinue={step !== "review"}
        onPrimary={() => {
          if (step !== "review") {
            if (missingAt(step).length) {
              setAttempted((a) => new Set([...a, step]));
              return;
            }
            return go(order[order.indexOf(step) + 1]);
          }
          if (missingAt("review").length) {
            setAttempted((a) => new Set([...a, "review"]));
            return;
          }
          const change = type ? commitDraft(type, draft) : null;
          if (!change || !meta) {
            toast.error("That change could not be made", { description: "The preview has run out of room for new taxa." });
            return;
          }
          toast.success(`${meta.verb} committed`, { description: change.outputs.map((o) => o.name).join(", ") });
          router.push(roleHref(speciesHref(change.outputs[0]?.id ?? change.inputs[0]?.id ?? "")));
        }}
      >
        {step === "type" && (
          <RadioGroupIconCard
            aria-label="Kind of change"
            value={type ?? ""}
            onChange={(v) => {
              const t = v as ChangeType;
              setType(t);
              setDraft(draftFrom(t, origin));
            }}
            items={CHANGE_TYPES.map((t) => ({ value: t, title: CHANGE_META[t].verb, secondaryTitle: CHANGE_META[t].shape, description: CHANGE_META[t].summary, icon: CHANGE_ICON[t], disabled: !!origin && t === "append" }))}
            className="max-w-2xl"
          />
        )}

        {step === "from" && type && (
          <>
            <FormRow title="Species Type" required>
              <SpeciesTypeField value={draft.kingdom} onChange={(k) => setDraft({ ...emptyDraft(k), next: draft.next, splitInto: draft.splitInto })} isDisabled={!!origin} showError={attempted.has("from")} />
            </FormRow>
            {type === "rename" && (
              <FormRow title="Select Taxon Name" required>
                <TaxonCodePicker kingdom={draft.kingdom} value={draft.from} isDisabled={!!origin} showError={attempted.has("from")} onChange={(id) => setDraft({ ...draft, from: id, next: partsOf(taxa.find((t) => t.id === id)!) })} />
                <ConceptCurrent taxonId={draft.from} />
              </FormRow>
            )}
            {type === "combine" && (
              <FormRow title="Old Species" required description="The taxa being combined. Each is picked by its NSX code.">
                <CombineInputs draft={draft} onChange={setDraft} showError={attempted.has("from")} />
              </FormRow>
            )}
            {type === "split" && (
              <FormRow title="Select Taxon to Split" required>
                <TaxonCodePicker kingdom={draft.kingdom} value={draft.from} isDisabled={!!origin} showError={attempted.has("from")} onChange={(id) => setDraft({ ...draft, from: id })} />
              </FormRow>
            )}
          </>
        )}

        {step === "to" && type && (
          <>
            {type === "rename" && (
              <FormRow title="Select New Taxon Name" required description={`Currently ${taxa.find((t) => t.id === draft.from)?.scientific ?? ""}.`}>
                <NamePartsFields parts={draft.next} kingdom={draft.kingdom} showError={attempted.has("to")} onChange={(next) => setDraft({ ...draft, next })} />
              </FormRow>
            )}
            {type === "combine" && (
              <FormRow title="New Taxon" required>
                <NewNsxField value={draft.next.nsx} showError={attempted.has("to")} onChange={(nsx) => setDraft({ ...draft, next: { ...draft.next, nsx } })} />
                <NamePartsFields parts={draft.next} kingdom={draft.kingdom} showError={attempted.has("to")} onChange={(next) => setDraft({ ...draft, next })} />
              </FormRow>
            )}
            {type === "split" && (
              <FormRow title="New Taxon" required description="The taxa it is split into.">
                <SplitOutputs draft={draft} onChange={setDraft} showError={attempted.has("to")} />
              </FormRow>
            )}
            {type === "append" && (
              <FormRow title="Append New Species" required>
                <NewNsxField value={draft.next.nsx} showError={attempted.has("to")} onChange={(nsx) => setDraft({ ...draft, next: { ...draft.next, nsx } })} />
                <NamePartsFields parts={draft.next} kingdom={draft.kingdom} showError={attempted.has("to")} onChange={(next) => setDraft({ ...draft, next })} append />
              </FormRow>
            )}
          </>
        )}

        {step === "review" && type && (
          <>
            {missingAt("review").length ? (
              <p className="text-sm text-tertiary">Complete the earlier steps to see the change.</p>
            ) : (
              <Review type={type} draft={draft} />
            )}
          </>
        )}
      </FormPage>
      <ConfirmationModal
        isOpen={confirmLeave}
        onOpenChange={setConfirmLeave}
        title="Leave this taxon change?"
        description="What you have filled in will be lost. Nothing has been changed yet."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        onConfirm={leave}
      />
    </>
  );
}

