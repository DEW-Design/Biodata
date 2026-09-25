"use client";

// The About tab's content - see this file's own git history for earlier rounds. This pass is a
// real architecture change, all per direct feedback with screenshots and a live page review:
//  - Editing no longer opens an overlay - every card's hover-only Edit icon now sends its edit
//    request up to a real **docked column** (`EditColumn`, rendered once in `page.tsx`, a genuine
//    flex sibling of the main content that shrinks the page to make room for it, not a
//    `ModalOverlay` covering it - "In Jira it is appearing as a new column. I want a new column to
//    the right," confirmed against a real Jira reference screenshot).
//  - Every edit form inside that column is the real `TypeformCard` shell the registration wizard
//    itself is built from (kicker/big heading/description, Back-as-cancel/Save as the primary
//    action) - not a dense field-row stack with its own Cancel/Save bar - per direct instruction:
//    "the edit screen must be same as the project registration flow." Several kicker/title/
//    description strings are the wizard's own real copy for the matching question (Data Owner ->
//    "Who owns this data?", Geographic Extent -> "Where does this data come from?", Focus Areas ->
//    "What kind of data does this project focus on?", Method -> "How was this data collected?").
//  - Two real bugs a live page review caught and this pass fixes: `DataOwnerCard`/
//    `ProjectManagersCard` (registration-summary.tsx) already return their own `BentoCard` - this
//    file was wrapping them in a second one, a real double-bordered-card bug ("there are extra
//    outer containers which is ugly"), fixed by dropping the redundant outer wrap. And every
//    FieldRow-driven display card except Data Owner/Project Manager had no heading of its own at
//    all, reading as structurally different from those two - fixed by giving every card the exact
//    same real `<h2>` heading style `DataOwnerCard` already established, everywhere.
//  - The inner Ownership/Data Collection/Restrictions switcher changed from `button-brand` to
//    `underline` - the exact type the outer About/Records/Species tabs on this same page already
//    use - per direct feedback that it didn't read as the same DEW tab pattern as its neighbour.
//  - The "At a glance" rail's record counts now wrap Events/Occurrences/Observations onto one row
//    and Artefacts onto its own, per direct feedback, and the rail's own Geographic Extent summary
//    row was removed - it's the one row whose full detail (map + table) already sits one click
//    away in the same tab, and the only row whose text wrapped to two lines, unlike every other
//    row here.

import { useState, type FC, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { parseDate, type DateValue } from "@internationalized/date";
import { Activity, Database01, Edit02, Eye, File02, File06, Globe01, Plus, Shield01, Target05, Trash01 } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { toast } from "@/components/application/toast/toast";
import { DestructiveModal } from "@/components/application/modals/modal";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { LocationDetailsTable } from "@/app/pages/_shared/location-details-table";
import { MetricTile } from "@/app/pages/_shared/map-search/metric-tile";
import { TypeformCard, ChoiceTile } from "@/app/pages/project-registration/typeform-card";
import { FieldRow, type FieldSpec, type FieldValues } from "../option-2/field-editor";
import { useRecordStore } from "../option-2/record-store";
import type { EntityTab } from "../option-2/records-view";
import { registrationDataCollection, registrationProjectDetails, registrationRestrictions } from "../option-2/project-registration-data";
import { DataOwnerCard, ProjectManagersCard, roleOfWorkLabel } from "../option-2/registration-summary";
import { GeoExtentPicker, geoExtentSummary } from "@/app/pages/project-registration/geo-extent-picker";
import type { GeoExtentValue, RestrictionsState, RestrictionTypeKey } from "@/app/pages/project-registration/types";
import {
  RESTRICTION_TYPE_META,
  RestrictionTypeFields,
  TYPE_CARD_TITLES,
  isTypeValid,
  restrictionsSummaryRows,
} from "@/app/pages/project-registration/step-3-privacy-restrictions";
import { FOCUS_AREA_OPTIONS, COLLECTION_METHOD_OPTIONS, PERMIT_TYPE_OPTIONS, REGISTRATION_SPECIES, ROLE_OF_WORK_OPTIONS } from "@/app/pages/project-registration/data";
import type { SearchEvent } from "@/app/pages/_shared/map-search/search-data";
import type { EditRequest } from "./edit-column";

// ── Project status/date helpers - shared by the page header (ProjectHero, in page.tsx) and the
//    Overview stage's own edit form below, both reading and writing the exact same session-store
//    section (`event-<id>:header`) so the two edit entry points can never drift apart and show a
//    different status/date for the same project. Owned here (not page.tsx) since page.tsx already
//    imports from this file, not the other way round - keeping the direction one-way avoids a
//    circular import. ──

export const PROJECT_STATUS_OPTIONS = [
  { id: "Active", label: "Active" },
  { id: "Under review", label: "Under review" },
  { id: "Completed", label: "Completed" },
];

export function statusColorFor(status: string): "success" | "warning" | "gray" {
  if (status === "Active") return "success";
  if (status === "Under review") return "warning";
  return "gray";
}

export function parseProjectDate(value: string): DateValue | null {
  if (!value || value === "—") return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

const LocationMap = dynamic(() => import("@/app/pages/_shared/map-search/sa-map"), {
  ssr: false,
  loading: () => <div className="h-48 w-full animate-pulse rounded-lg bg-secondary" />,
});

const FOCUS_AREA_FIELD_OPTIONS = FOCUS_AREA_OPTIONS.map((o) => ({ id: o.id, label: o.label }));
const SPECIES_FIELD_OPTIONS = REGISTRATION_SPECIES.map((s) => ({ id: s.id, label: `${s.commonName} (${s.species})` }));
const COLLECTION_METHOD_FIELD_OPTIONS = COLLECTION_METHOD_OPTIONS.map((o) => ({ id: o.id, label: o.label }));
const PERMIT_TYPE_FIELD_OPTIONS = PERMIT_TYPE_OPTIONS.map((o) => ({ id: o.id, label: o.label }));
const ROLE_FIELD_OPTIONS = ROLE_OF_WORK_OPTIONS.map((o) => ({ id: o.id, label: o.label }));

export function savedToast() {
  toast.brand("Changes saved", { description: "This is a demo build with no real backend - your edit is kept for this session only." });
}

/** Every edit form's shared shell - the real `TypeformCard` the registration wizard itself is
 *  built from, "Back" doubling as Cancel (no separate cancel affordance exists in that
 *  vocabulary, and closing without saving is exactly what stepping back means here too). */
function EditShell({
  kicker,
  title,
  description,
  onDone,
  onSave,
  nextDisabled = false,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  onDone: () => void;
  onSave: () => void;
  nextDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <TypeformCard
      cardKey={title}
      step={1}
      totalSteps={1}
      kicker={kicker}
      title={title}
      description={description}
      showQuestionCount={false}
      showBack
      onBack={onDone}
      nextLabel="Save"
      nextDisabled={nextDisabled}
      onNext={onSave}
    >
      {children}
    </TypeformCard>
  );
}

// ── EditableCard - the shape every card in this tab follows: read-only content, a hover-only icon
//    Edit button top-right, and a real heading matching every other card (DataOwnerCard's own
//    established `<h2 className="text-sm font-medium text-primary">` style). Clicking Edit doesn't
//    open anything locally - it sends the request up to the page's own docked `EditColumn` via
//    `onEditRequest`, so there's ever only one edit surface open at a time, like Jira's own panel. ──

function EditableCard({
  title,
  heading,
  bare = false,
  children,
  renderPanel,
  onEditRequest,
}: {
  title: string;
  /** The card's own visible heading - defaults to `title` when omitted. */
  heading?: string;
  /** When the children already render their own complete `BentoCard` + heading (e.g.
   *  `DataOwnerCard`/`ProjectManagersCard`, both already established display components), skip
   *  this component's own wrap - stacking a second `BentoCard` (and a second heading) around an
   *  already-complete one was a real bug a live page review caught ("there are extra outer
   *  containers which is ugly"). Every other card here still needs the wrap, since its own
   *  children are just raw `FieldRow`s with no card shell of their own. */
  bare?: boolean;
  children: ReactNode;
  renderPanel: (onDone: () => void) => ReactNode;
  onEditRequest: (req: EditRequest) => void;
}) {
  const content = bare ? (
    children
  ) : (
    <BentoCard className="transition-colors group-hover:bg-primary_hover">
      <h2 className="text-sm font-medium text-primary">{heading ?? title}</h2>
      {children}
    </BentoCard>
  );

  return (
    <div className="group relative">
      {content}
      <button
        type="button"
        aria-label={`Edit ${title}`}
        onClick={() => onEditRequest({ title, render: renderPanel })}
        className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-md text-quaternary opacity-0 transition hover:bg-secondary hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Edit02 className="size-4" />
      </button>
    </div>
  );
}

// ── Project Manager/s - one form editing every manager's own fields, with real draft state (not
//    writing to the record store on every keystroke) so Back-as-cancel genuinely discards unsaved
//    changes instead of a no-op. ──

const MANAGER_FIELDS: FieldSpec[] = [
  { id: "firstName", label: "First Name", type: "text" },
  { id: "lastName", label: "Last Name", type: "text" },
  { id: "organisation", label: "Organisation", type: "text" },
  { id: "role", label: "Role", type: "select", options: ROLE_FIELD_OPTIONS },
  { id: "email", label: "Email", type: "text" },
  { id: "phone", label: "Phone", type: "text" },
  { id: "isPrimary", label: "Primary Contact", type: "boolean" },
];

function managerSeed(m: { firstName: string; lastName: string; organisation: string; role: string | null; email: string; phone: string; isPrimary: boolean }): FieldValues {
  return { firstName: m.firstName, lastName: m.lastName, organisation: m.organisation, role: m.role, email: m.email, phone: m.phone, isPrimary: m.isPrimary ? "yes" : "no" };
}

function ProjectManagersEditor({
  managers,
  values,
  onSave,
  onDone,
}: {
  managers: { id: number }[];
  values: FieldValues[];
  onSave: (index: number, next: FieldValues) => void;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<FieldValues[]>(values);

  return (
    <EditShell
      kicker="Project team"
      title="Who's managing this project day to day?"
      description="Add at least one project manager - their organisation, role and phone are optional extras you can add if you'd like."
      onDone={onDone}
      onSave={() => {
        draft.forEach((v, i) => onSave(i, v));
        savedToast();
        onDone();
      }}
    >
      <div className="flex flex-col gap-6">
        {managers.map((m, i) => (
          <div key={m.id} className={i > 0 ? "border-t border-secondary pt-5" : undefined}>
            <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Manager {i + 1}</p>
            <div className="flex flex-col gap-4">
              {MANAGER_FIELDS.map((spec) => (
                <FieldRow
                  key={spec.id}
                  spec={spec}
                  value={draft[i][spec.id]}
                  editing
                  onChange={(v) => setDraft((d) => d.map((row, idx) => (idx === i ? { ...row, [spec.id]: v } : row)))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </EditShell>
  );
}

// ── Geographic Extent - real map + the shared Location Details table, editable via the real
//    `GeoExtentPicker` the registration wizard already built (shapefile/draw a boundary/pick a
//    national park/enter coordinates) - not a second, disconnected picker. The preview map/table
//    use the edited boundary's own centre when it's a circle (drawn or entered); other methods (a
//    park, a shapefile) have no single point to re-centre on, so the preview honestly keeps
//    showing the project's own real coordinate instead of guessing one. ──

function GeographicExtentCard({
  project,
  extent,
  onSave,
  onEditRequest,
}: {
  project: SearchEvent;
  extent: GeoExtentValue;
  onSave: (next: GeoExtentValue) => void;
  onEditRequest: (req: EditRequest) => void;
}) {
  const boundary = extent.boundary;
  const hasCircle = boundary?.kind === "circle";
  const center: [number, number] = hasCircle ? boundary.center : [project.lat, project.lon];
  const radiusKm = hasCircle ? boundary.radiusKm : 1;

  return (
    <EditableCard title="Geographic Extent" onEditRequest={onEditRequest} renderPanel={(onDone) => <GeoExtentEditor extent={extent} onSave={onSave} onDone={onDone} />}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-secondary">{geoExtentSummary(extent)}</p>
        <div className="h-48 w-full overflow-hidden rounded-lg border border-secondary">
          <LocationMap boundaries={[{ id: "project-extent", kind: "circle", center, radiusKm }]} onBoundaryAdd={() => {}} activeDrawTool={null} onDrawToolChange={() => {}} className="size-full" />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Location Details</p>
          <LocationDetailsTable lat={center[0]} lon={center[1]} />
        </div>
      </div>
    </EditableCard>
  );
}

function GeoExtentEditor({ extent, onSave, onDone }: { extent: GeoExtentValue; onSave: (next: GeoExtentValue) => void; onDone: () => void }) {
  const [draft, setDraft] = useState<GeoExtentValue>(extent);
  return (
    <EditShell
      kicker="Data collection"
      title="Where does this data come from?"
      description="Define the geographic extent this project's data collection covers."
      onDone={onDone}
      onSave={() => {
        onSave(draft);
        savedToast();
        onDone();
      }}
    >
      <GeoExtentPicker value={draft} onChange={setDraft} />
    </EditShell>
  );
}

// ── Privacy and Restrictions - each enabled restriction type is now its own separately editable,
//    separately removable container, per direct request: "separate editable container for each
//    restriction types and an option to add more restrictions if required. a way to remove a
//    restriction already configured." Still built entirely from the real Add Project wizard's own
//    Step 3 pieces (`RestrictionTypeFields`/`RESTRICTION_TYPE_META`/`TYPE_CARD_TITLES`/
//    `isTypeValid`, all exported from `step-3-privacy-restrictions.tsx` for exactly this reuse) -
//    not a second, bespoke form per type. Editing one type's row opens just that type's own
//    question card (`RestrictionTypeEditor`). "Add restriction" (`AddRestrictionEditor`) follows
//    the exact same two-stage journey the real wizard itself uses for this - per direct
//    correction: "first you choose the restriction types and then you hit continue and then you
//    define each restriction type" - a "Which kinds...?" multi-select tile card, then one focused
//    card per newly picked type in sequence, each with its own Back/Continue (the wizard's own
//    "Question N of M" progress, not a flattened single "pick and save" step). Removing a row asks
//    for confirmation first via the real `DestructiveModal` - per direct feedback, a same-session
//    demo-data removal is still a real loss of whatever the user entered, so it isn't silent.
//    `restrictionsSummaryRows` stays the one shared source for each row's own summary text, so
//    this display and the wizard's own review card can never disagree. ──

function RestrictionTypeRow({
  row,
  incomplete,
  onEdit,
  onRemove,
}: {
  row: { key: RestrictionTypeKey; title: string; icon: typeof Globe01; summary: string };
  incomplete: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group relative flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-25 p-4">
      <FeaturedIcon icon={row.icon} color="warning" theme="light" size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 pr-16">
        <p className="text-sm font-medium text-primary">{row.title}</p>
        <p className="text-sm text-secondary">{row.summary || (incomplete ? "Needs setup - click Edit to finish" : "-")}</p>
      </div>
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          aria-label={`Edit ${row.title}`}
          onClick={onEdit}
          className="flex size-8 items-center justify-center rounded-md text-quaternary hover:bg-primary hover:text-primary"
        >
          <Edit02 className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Remove ${row.title}`}
          onClick={onRemove}
          className="flex size-8 items-center justify-center rounded-md text-quaternary hover:bg-primary hover:text-error-600"
        >
          <Trash01 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function RestrictionsSection({
  restrictions,
  onSave,
  onEditRequest,
}: {
  restrictions: RestrictionsState;
  onSave: (next: RestrictionsState) => void;
  onEditRequest: (req: EditRequest) => void;
}) {
  const rows = restrictionsSummaryRows(restrictions);
  const remainingTypes = RESTRICTION_TYPE_META.filter((m) => !restrictions.enabledTypes.has(m.key));
  const [pendingRemove, setPendingRemove] = useState<RestrictionTypeKey | null>(null);
  const pendingRow = pendingRemove ? RESTRICTION_TYPE_META.find((m) => m.key === pendingRemove) : undefined;

  const confirmRemove = () => {
    if (!pendingRemove) return;
    const enabledTypes = new Set(restrictions.enabledTypes);
    enabledTypes.delete(pendingRemove);
    onSave({ ...restrictions, enabledTypes });
    setPendingRemove(null);
  };

  const editType = (key: RestrictionTypeKey) => {
    onEditRequest({
      title: TYPE_CARD_TITLES[key].title,
      render: (onDone) => <RestrictionTypeEditor typeKey={key} restrictions={restrictions} onSave={onSave} onDone={onDone} />,
    });
  };

  const addRestriction = () => {
    onEditRequest({
      title: "Add restriction",
      render: (onDone) => <AddRestrictionEditor restrictions={restrictions} onSave={onSave} onDone={onDone} />,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {(!restrictions.hasRestrictions || rows.length === 0) && (
        <div className="flex items-center gap-3 rounded-lg border border-secondary bg-secondary/40 p-4">
          <FeaturedIcon icon={Globe01} color="gray" theme="light" size="sm" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-primary">No restrictions</p>
            <p className="text-sm text-secondary">This project&apos;s data is openly available to every BioData SA user.</p>
          </div>
        </div>
      )}

      {rows.map((row) => (
        <RestrictionTypeRow
          key={row.key}
          row={row}
          incomplete={!isTypeValid(row.key, restrictions)}
          onEdit={() => editType(row.key)}
          onRemove={() => setPendingRemove(row.key)}
        />
      ))}

      {remainingTypes.length > 0 && (
        <button
          type="button"
          onClick={addRestriction}
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-secondary p-4 text-sm font-medium text-tertiary transition hover:border-brand-300 hover:bg-primary_hover hover:text-brand-secondary"
        >
          <Plus className="size-4" />
          Add restriction
        </button>
      )}

      <DestructiveModal
        isOpen={!!pendingRemove}
        onOpenChange={(open) => !open && setPendingRemove(null)}
        title={pendingRow ? `Remove "${pendingRow.title}"?` : "Remove this restriction?"}
        description={
          pendingRow
            ? `This project's data will no longer be restricted by "${pendingRow.title}", and everything you've entered for it will be lost.`
            : undefined
        }
        confirmLabel="Remove restriction"
        cancelLabel="Keep restriction"
        onConfirm={confirmRemove}
      />
    </div>
  );
}

function RestrictionTypeEditor({
  typeKey,
  restrictions,
  onSave,
  onDone,
}: {
  typeKey: RestrictionTypeKey;
  restrictions: RestrictionsState;
  onSave: (next: RestrictionsState) => void;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<RestrictionsState>(restrictions);
  const meta = TYPE_CARD_TITLES[typeKey];
  return (
    <EditShell
      kicker="Privacy and restrictions"
      title={meta.title}
      description={meta.description}
      onDone={onDone}
      nextDisabled={!isTypeValid(typeKey, draft)}
      onSave={() => {
        onSave({ ...draft, hasRestrictions: true, enabledTypes: new Set(draft.enabledTypes).add(typeKey) });
        savedToast();
        onDone();
      }}
    >
      <RestrictionTypeFields typeKey={typeKey} value={draft} onChange={setDraft} />
    </EditShell>
  );
}

// "Add restriction" is its own small multi-step sequence, not a single pick-and-save step - per
// direct correction to match the real wizard's own journey exactly: "first you choose the
// restriction types and then you hit continue and then you define each restriction type." Step 1
// is the same "Which kinds...?" multi-select tile card (scoped to only the types not already
// enabled); Continue moves into one focused `RestrictionTypeFields` card per newly picked type, in
// `RESTRICTION_TYPE_META`'s own fixed order, each with its own Back/Continue - identical in shape
// to the wizard's own "any" -> "types" -> per-type sequence, just skipping the closing Review card
// since the outer restrictions list this panel sits on top of already serves as the review. Only
// the last type's card commits (adds every newly picked type to `enabledTypes` plus whatever was
// filled in for them) - stepping back from the first type's card returns to re-pick types, and
// Back from the type-picker itself closes the panel with nothing changed, same as every other
// editor in this file.
function AddRestrictionEditor({
  restrictions,
  onSave,
  onDone,
}: {
  restrictions: RestrictionsState;
  onSave: (next: RestrictionsState) => void;
  onDone: () => void;
}) {
  const remaining = RESTRICTION_TYPE_META.filter((m) => !restrictions.enabledTypes.has(m.key));
  const [pickedTypes, setPickedTypes] = useState<Set<RestrictionTypeKey>>(new Set());
  const [draft, setDraft] = useState<RestrictionsState>(restrictions);
  const [step, setStep] = useState<"types" | number>("types");

  const orderedPicked = RESTRICTION_TYPE_META.map((m) => m.key).filter((k) => pickedTypes.has(k));
  const totalSteps = 1 + orderedPicked.length;

  const toggleType = (key: RestrictionTypeKey) => {
    setPickedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const commit = () => {
    const enabledTypes = new Set(restrictions.enabledTypes);
    pickedTypes.forEach((key) => enabledTypes.add(key));
    onSave({ ...draft, hasRestrictions: true, enabledTypes });
    savedToast();
    onDone();
  };

  if (step === "types") {
    return (
      <TypeformCard
        cardKey="types"
        step={1}
        totalSteps={totalSteps}
        kicker="Privacy and restrictions"
        title="Which kinds of restriction do you want to add?"
        description="Select one or more - you'll set each one up next."
        nextDisabled={pickedTypes.size === 0}
        showBack
        onBack={onDone}
        onNext={() => setStep(0)}
      >
        <div className="grid grid-cols-1 gap-3 @xl/stage:grid-cols-2">
          {remaining.map(({ key, title, description, icon }) => (
            <ChoiceTile key={key} icon={icon} label={title} hint={description} isSelected={pickedTypes.has(key)} onClick={() => toggleType(key)} />
          ))}
        </div>
      </TypeformCard>
    );
  }

  const key = orderedPicked[step];
  const meta = TYPE_CARD_TITLES[key];
  const isLast = step === orderedPicked.length - 1;

  return (
    <TypeformCard
      cardKey={key}
      step={step + 2}
      totalSteps={totalSteps}
      kicker={`Privacy and restrictions · ${RESTRICTION_TYPE_META.find((m) => m.key === key)!.title}`}
      title={meta.title}
      description={meta.description}
      nextDisabled={!isTypeValid(key, draft)}
      nextLabel={isLast ? "Save" : "Continue"}
      showBack
      onBack={() => setStep(step === 0 ? "types" : step - 1)}
      onNext={() => (isLast ? commit() : setStep(step + 1))}
    >
      <RestrictionTypeFields typeKey={key} value={draft} onChange={setDraft} />
    </TypeformCard>
  );
}

// ── Left vertical stage nav + main stage card - matching the real Figma reference for this page
//    (wer8CgO1UoCH3aQw2jQkdy, node 2556:77520) exactly: a persistent vertical Overview/Data
//    Collection and Storage/Privacy and Restrictions switcher on the left, one stage's content on
//    the right, styled after the same nav+card shell option-2's own read-only `OverviewSection`
//    already established (`OverviewStageNav`/`StageCard` in option-2/page.tsx) - reused here as a
//    visual pattern (not cross-imported, since option-2's version has no edit affordances and this
//    page's own cards need the `EditableCard` hover-icon wiring instead). ──

type Stage = "overview" | "data-collection" | "restrictions";

const STAGES: { id: Stage; label: string; icon: FC<{ className?: string }>; kicker: string; title: string; description: string }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: File02,
    kicker: "Project Details",
    title: "Overview",
    description: "Basic information about the project, including title, description, and who owns and manages it.",
  },
  {
    id: "data-collection",
    label: "Data Collection and Storage",
    icon: Database01,
    kicker: "Data Collection",
    title: "Data Collection and Storage",
    description: "Types of data collected, storage methods, and any relevant handling procedures.",
  },
  {
    id: "restrictions",
    label: "Privacy and Restrictions",
    icon: Shield01,
    kicker: "Privacy",
    title: "Privacy and Restrictions",
    description: "Visibility, embargo, and data-sharing options controlling who can access this project's data.",
  },
];

// Built from the real DEW `Tabs`/`TabList`/`Tab` component (`type="button-border"`,
// `orientation="vertical"`) instead of hand-rolled markup - per direct request to match the same
// "look and feel" as the boundary-method tab row on the map search tool / GeoExtentPicker (the
// "Upload Shapefile / Draw on the Map / Choose from a List / Coordinates" row), which is this
// exact component/type, just horizontal. Reusing the real component rather than re-copying its
// colours by hand means the two can never visually drift apart - the same `bg-secondary` tray and
// `bg-primary_alt` + `shadow-sm` selected-pill treatment, just stacked vertically. This also
// replaces the earlier hand-matched Figma-nav colours (a `bg-primary_hover` guess) with this
// codebase's own real, already-established tab styling.
function AboutStageNav({ stage, onSelect }: { stage: Stage; onSelect: (id: Stage) => void }) {
  return (
    <Tabs
      selectedKey={stage}
      onSelectionChange={(key) => onSelect(key as Stage)}
      orientation="vertical"
      className="w-full shrink-0 @4xl/about:sticky @4xl/about:top-6 @4xl/about:w-64"
    >
      {/* `TabList`'s own vertical-orientation default is `w-max` (shrink-wrapped to its content),
          which leaves dead space inside this column's `lg:w-64` and reads as "too much gap" between
          the nav and the content card next to it - overridden here to `w-full` so the tray genuinely
          fills the column. Padding is also widened past the shared `sizes.sm["button-border"]`
          default (`py-2 px-2.5`, tuned for a short horizontal label) - flagged directly as "very
          tight" for this taller vertical list - via `Tab`'s own `className`, not the shared
          component's global default, so the map search tool's own horizontal reuse of this exact
          type/size is untouched. */}
      <TabList aria-label="Project information" type="button-border" size="sm" orientation="vertical" className="w-full">
        {STAGES.map((item) => (
          <Tab key={item.id} id={item.id} label={item.label} icon={item.icon} className="w-full py-3 px-3.5" />
        ))}
      </TabList>
    </Tabs>
  );
}

function StageCard({ stage, children }: { stage: (typeof STAGES)[number]; children: ReactNode }) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-secondary bg-primary p-6 @2xl/about:p-8">
      <div className="flex flex-col gap-1 border-b border-secondary pb-6">
        <span className="text-xs font-semibold tracking-wide text-brand-tertiary uppercase">{stage.kicker}</span>
        <h2 className="text-xl font-semibold text-primary @2xl/about:text-2xl">{stage.title}</h2>
        <p className="text-sm text-tertiary">{stage.description}</p>
      </div>
      <div className="@container/stage flex flex-col gap-6 pt-6">{children}</div>
    </div>
  );
}

// ── Project Details - the Overview stage's own bordered field-list card, matching the reference's
//    own icon-circle + heading + divider + field-list shape exactly (node 2557:78744) - Full
//    Title/Abstract/Start Date/End Date/Status only. Role of Work is deliberately not one of these
//    rows - per direct correction, "The field called Role of work actually belongs to the project
//    publisher's contact details," it now renders on the Published By card instead, next to the
//    primary contact's own name (see `DataOwnerCard`'s `primaryRole` prop). ──

function ProjectDetailsCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-md border border-secondary p-6 transition-colors group-hover:bg-primary_hover">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tertiary">
          <File02 className="size-5 text-quaternary" />
        </div>
        <h2 className="text-sm font-medium text-primary">Project Details</h2>
      </div>
      <div className="flex flex-col gap-4 border-t border-secondary pt-4">{children}</div>
    </div>
  );
}

// ── Record counts - the real Events/Occurrences/Observations/Artefacts & Attachments counts (the
//    exact same `MetricTile` records-view.tsx's own switcher already uses), stacked vertically as
//    its own small card beside the Overview stage's field list, matching the reference's own
//    "Navigation - Project information" card. Each tile is a real click straight into Records'
//    Table view, pre-selected to that exact entity type - not editable data, so it sits outside
//    the hover-edit treatment every other card here gets. ──

const RECORD_METRICS: { id: EntityTab; label: string; icon: typeof Activity }[] = [
  { id: "events", label: "Events", icon: Activity },
  { id: "occurrences", label: "Occurrences", icon: Target05 },
  { id: "observations", label: "Observations", icon: Eye },
];

function RecordCountsCard({ counts, onNavigateToRecords }: { counts: Record<EntityTab, number>; onNavigateToRecords: (tab: EntityTab) => void }) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-2 rounded-2xl border border-secondary bg-secondary p-3 @3xl/stage:w-72">
      {RECORD_METRICS.map((m) => (
        <div key={m.id} className="w-full">
          <MetricTile icon={m.icon} label={m.label} value={counts[m.id]} active={false} onClick={() => onNavigateToRecords(m.id)} />
        </div>
      ))}
      <div className="w-full">
        <MetricTile icon={File06} label="Artefacts & Attachments" value={counts.artefacts} active={false} onClick={() => onNavigateToRecords("artefacts")} />
      </div>
    </div>
  );
}

export function AboutContent({
  project,
  counts,
  onNavigateToRecords,
  onEditRequest,
}: {
  project: SearchEvent;
  counts: Record<EntityTab, number>;
  onNavigateToRecords: (tab: EntityTab) => void;
  onEditRequest: (req: EditRequest) => void;
}) {
  const details = registrationProjectDetails;
  const store = useRecordStore();
  const [stage, setStage] = useState<Stage>("overview");
  const [geoExtent, setGeoExtent] = useState<GeoExtentValue>(registrationDataCollection.geographicExtent);
  const [restrictions, setRestrictions] = useState<RestrictionsState>(registrationRestrictions);
  const activeStage = STAGES.find((s) => s.id === stage)!;

  // Overview - Full Title/Abstract/Start Date/End Date/Status only (the reference's own "Project
  // Details" card, node 2557:78744) - Role of Work is deliberately excluded, see
  // `ProjectDetailsCard`'s own comment above. The date/status fields read and write the exact same
  // `event-<id>:header` store section the page header's own hover-edit uses (see page.tsx's
  // `ProjectHero`) - one shared source, so editing status from either entry point can never leave
  // the other showing a stale value.
  const overviewFields: FieldSpec[] = [
    { id: "fullTitle", label: "Full Title", type: "text" },
    { id: "abstract", label: "Abstract", type: "textarea" },
    { id: "startDate", label: "Start Date", type: "date" },
    { id: "endDate", label: "End Date", type: "date" },
    { id: "status", label: "Status", type: "select", options: PROJECT_STATUS_OPTIONS },
  ];
  const identificationKey = `event-${project.id}:identity`;
  const headerKey = `event-${project.id}:header`;
  const overviewSeed: FieldValues = {
    fullTitle: details.fullTitle,
    abstract: details.abstract,
    startDate: parseProjectDate(project.startDate),
    endDate: parseProjectDate(project.endDate),
    status: project.status,
  };
  const overviewValues = { ...overviewSeed, ...store.getSection(identificationKey), ...store.getSection(headerKey) };

  // Published By - the org, plus the primary contact's own First/Last/Email/Phone *and* their own
  // role (`roleOfWork`) - moved here from the Overview field list per direct correction: "Role of
  // work actually belongs to the project publisher's contact details." `DataOwnerCard`'s own
  // `primaryRole` prop renders it as a "· <role>" suffix next to that contact's name, the exact
  // same treatment `ProjectManagersCard` already gives each manager's own role.
  const dataOwnerFields: FieldSpec[] = [
    { id: "orgName", label: "Organisation Name", type: "text" },
    { id: "primaryRole", label: "Primary Contact's Role", type: "select", options: ROLE_FIELD_OPTIONS },
    { id: "contactFirstName", label: "Contact First Name", type: "text" },
    { id: "contactLastName", label: "Contact Last Name", type: "text" },
    { id: "contactEmail", label: "Contact Email", type: "text" },
    { id: "contactPhone", label: "Contact Phone", type: "text" },
  ];
  const dataOwnerKey = `event-${project.id}:data-owner`;
  const dataOwnerSeed: FieldValues = {
    orgName: details.dataOwnerOrgName,
    primaryRole: details.roleOfWork,
    contactFirstName: details.dataOwnerContacts[0]?.firstName ?? "",
    contactLastName: details.dataOwnerContacts[0]?.lastName ?? "",
    contactEmail: details.dataOwnerContacts[0]?.email ?? "",
    contactPhone: details.dataOwnerContacts[0]?.phone ?? "",
  };
  const dataOwnerValues = { ...dataOwnerSeed, ...store.getSection(dataOwnerKey) };
  const primaryRoleId = typeof dataOwnerValues.primaryRole === "string" ? dataOwnerValues.primaryRole : details.roleOfWork;
  const primaryRoleLabel = roleOfWorkLabel({ ...details, roleOfWork: primaryRoleId });

  const focusSpeciesFields: FieldSpec[] = [
    { id: "focusAreas", label: "Project Focus Areas", type: "multiselect", options: FOCUS_AREA_FIELD_OPTIONS },
    { id: "targetedSpeciesIds", label: "Targeted Species", type: "multiselect", options: SPECIES_FIELD_OPTIONS },
  ];
  const focusSpeciesKey = `event-${project.id}:focus-species`;
  const focusSpeciesSeed: FieldValues = { focusAreas: registrationDataCollection.focusAreas, targetedSpeciesIds: registrationDataCollection.targetedSpeciesIds };
  const focusSpeciesValues = { ...focusSpeciesSeed, ...store.getSection(focusSpeciesKey) };

  const methodFields: FieldSpec[] = [
    { id: "collectionMethod", label: "Method of Data Collection", type: "select", options: COLLECTION_METHOD_FIELD_OPTIONS },
    { id: "methodDetails", label: "Method Details", type: "textarea" },
    { id: "limitationsAndBiases", label: "Limitations and Biases", type: "textarea" },
  ];
  const methodKey = `event-${project.id}:method`;
  const methodSeed: FieldValues = {
    collectionMethod: registrationDataCollection.collectionMethod,
    methodDetails: registrationDataCollection.methodDetails,
    limitationsAndBiases: registrationDataCollection.limitationsAndBiases,
  };
  const methodValues = { ...methodSeed, ...store.getSection(methodKey) };

  const permit = registrationDataCollection.permits[0];
  const permitFields: FieldSpec[] = [
    { id: "permitType", label: "Permit Type", type: "select", options: PERMIT_TYPE_FIELD_OPTIONS },
    { id: "permitNo", label: "Permit No.", type: "text" },
    { id: "uriDoi", label: "URI / DOI Number", type: "text" },
  ];
  const permitKey = `event-${project.id}:permit`;
  const permitSeed: FieldValues = { permitType: permit?.type ?? null, permitNo: permit?.number ?? "", uriDoi: registrationDataCollection.uriDoi };
  const permitValues = { ...permitSeed, ...store.getSection(permitKey) };

  return (
    // Container queries (not viewport breakpoints): this column shrinks whenever the docked edit
    // column opens or is dragged wider, while the viewport stays the same size - `lg:`/`sm:` never
    // noticed, so the Overview kept a desktop layout squeezed into a narrow column.
    <div className="@container/about">
    <div className="flex flex-col gap-4 @4xl/about:flex-row @4xl/about:items-start">
      <AboutStageNav stage={stage} onSelect={setStage} />

      <StageCard stage={activeStage}>
        {stage === "overview" && (
          <>
            <div className="flex flex-col gap-6 @3xl/stage:flex-row @3xl/stage:items-start">
              <div className="min-w-0 flex-1">
                <EditableCard
                  title="Overview"
                  bare
                  onEditRequest={onEditRequest}
                  renderPanel={(onDone) => (
                    <FieldsEditor
                      kicker="Project details"
                      title="Edit project overview"
                      description="Update the project's title, abstract, dates and status."
                      fields={overviewFields}
                      values={overviewValues}
                      onSave={(next) => {
                        store.setSection(identificationKey, { fullTitle: next.fullTitle, abstract: next.abstract });
                        store.setSection(headerKey, { startDate: next.startDate, endDate: next.endDate, status: next.status });
                      }}
                      onDone={onDone}
                    />
                  )}
                >
                  <ProjectDetailsCard>
                    {overviewFields.map((spec) => (
                      <FieldRow key={spec.id} spec={spec} value={overviewValues[spec.id]} editing={false} onChange={() => {}} />
                    ))}
                  </ProjectDetailsCard>
                </EditableCard>
              </div>
              <RecordCountsCard counts={counts} onNavigateToRecords={onNavigateToRecords} />
            </div>

            <div className="flex flex-col gap-4 border-t border-secondary pt-6 @2xl/stage:flex-row">
              <div className="min-w-0 flex-1">
                <EditableCard
                  title="Published By"
                  bare
                  onEditRequest={onEditRequest}
                  renderPanel={(onDone) => (
                    <FieldsEditor
                      kicker="Data ownership"
                      title="Who owns this data?"
                      description="The organisation or person responsible for this project's data."
                      fields={dataOwnerFields}
                      values={dataOwnerValues}
                      onSave={(next) => store.setSection(dataOwnerKey, next)}
                      onDone={onDone}
                    />
                  )}
                >
                  <DataOwnerCard details={details} heading="Published By" primaryRole={primaryRoleLabel} hoverable />
                </EditableCard>
              </div>
              <div className="min-w-0 flex-1">
                <EditableCard
                  title={`Project Manager${details.projectManagers.length > 1 ? "/s" : ""}`}
                  bare
                  onEditRequest={onEditRequest}
                  renderPanel={(onDone) => (
                    <ProjectManagersEditor
                      managers={details.projectManagers}
                      values={details.projectManagers.map((m) => ({ ...managerSeed(m), ...store.getSection(`event-${project.id}:manager-${m.id}`) }))}
                      onSave={(index, next) => store.setSection(`event-${project.id}:manager-${details.projectManagers[index].id}`, next)}
                      onDone={onDone}
                    />
                  )}
                >
                  <ProjectManagersCard managers={details.projectManagers} hoverable />
                </EditableCard>
              </div>
            </div>
          </>
        )}

        {stage === "data-collection" && (
          <>
            <GeographicExtentCard project={project} extent={geoExtent} onSave={setGeoExtent} onEditRequest={onEditRequest} />

            <EditableCard
              title="Project Focus Areas & Targeted Species"
              onEditRequest={onEditRequest}
              renderPanel={(onDone) => (
                <FieldsEditor
                  kicker="Data collection"
                  title="What kind of data does this project focus on?"
                  description="Biological is always included - add any other domains this project also collects data on."
                  fields={focusSpeciesFields}
                  values={focusSpeciesValues}
                  onSave={(next) => store.setSection(focusSpeciesKey, next)}
                  onDone={onDone}
                />
              )}
            >
              {focusSpeciesFields.map((spec) => (
                <FieldRow key={spec.id} spec={spec} value={focusSpeciesValues[spec.id]} editing={false} onChange={() => {}} />
              ))}
            </EditableCard>

            <EditableCard
              title="Method of Data Collection"
              onEditRequest={onEditRequest}
              renderPanel={(onDone) => (
                <FieldsEditor
                  kicker="Data collection"
                  title="How was this data collected?"
                  fields={methodFields}
                  values={methodValues}
                  onSave={(next) => store.setSection(methodKey, next)}
                  onDone={onDone}
                />
              )}
            >
              {methodFields.map((spec) => (
                <FieldRow key={spec.id} spec={spec} value={methodValues[spec.id]} editing={false} onChange={() => {}} />
              ))}
            </EditableCard>

            <EditableCard
              title="Permit & Identifiers"
              onEditRequest={onEditRequest}
              renderPanel={(onDone) => (
                <FieldsEditor
                  kicker="Data collection"
                  title="Permit & Identifiers"
                  description="Any permits or persistent identifiers linked to this project."
                  fields={permitFields}
                  values={permitValues}
                  onSave={(next) => store.setSection(permitKey, next)}
                  onDone={onDone}
                />
              )}
            >
              {permitFields.map((spec) => (
                <FieldRow key={spec.id} spec={spec} value={permitValues[spec.id]} editing={false} onChange={() => {}} />
              ))}
            </EditableCard>
          </>
        )}

        {stage === "restrictions" && (
          <BentoCard>
            <h2 className="text-sm font-medium text-primary">Privacy and Restrictions</h2>
            <RestrictionsSection restrictions={restrictions} onSave={setRestrictions} onEditRequest={onEditRequest} />
          </BentoCard>
        )}
      </StageCard>
    </div>
    </div>
  );
}

// ── A flat field group's edit form - real draft state owned right here (not left invisible to
//    `EditShell`'s own Save button), matching the exact same "local draft, commit on Save" pattern
//    every other editor in this file already uses (`GeoExtentEditor`, `RestrictionsEditor`,
//    `ProjectManagersEditor`). One shared component for every `EditableCard` whose fields are a
//    plain `FieldSpec[]`/`FieldValues` pair - Project Identification, Data Owner, Focus Areas &
//    Targeted Species, Method of Data Collection, Permit & Identifiers all use this directly. ──

export function FieldsEditor({
  kicker,
  title,
  description,
  fields,
  values,
  onSave,
  onDone,
}: {
  kicker: string;
  title: string;
  description?: string;
  fields: FieldSpec[];
  values: FieldValues;
  onSave: (next: FieldValues) => void;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<FieldValues>(values);
  return (
    <EditShell
      kicker={kicker}
      title={title}
      description={description}
      onDone={onDone}
      onSave={() => {
        onSave(draft);
        savedToast();
        onDone();
      }}
    >
      <div className="flex flex-col gap-4">
        {fields.map((spec) => (
          <FieldRow key={spec.id} spec={spec} value={draft[spec.id]} editing onChange={(v) => setDraft((d) => ({ ...d, [spec.id]: v }))} />
        ))}
      </div>
    </EditShell>
  );
}
