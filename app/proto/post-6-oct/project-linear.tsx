"use client";

// Step 5 of the subtraction (steps.ts): the project page the way Linear draws a project (Mobbin, 12 Oct 2026: a short title, one
// line of property chips under it, small pill tabs, the description flowing as a document on a white page, and a right rail of
// collapsible Properties, Progress and Activity). Taken from the step before (project-overview.tsx), this removes the sheet and
// its rules (the sections just follow each other), "On this page" (the page is short enough to scroll, and the rail now holds the
// facts you would jump to), the eyebrow, and the view pill in the bar (the pills here are the views). It adds a property line and
// the rail. The same fields, the same blocks (`WhereBlock`, `MethodBlock`, `AccessBlock`, `ContactsBlock`), nothing is dropped; the
// facts now live in the rail instead of being repeated through the document.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import type { ReactNode } from "react";
import { ChevronDown } from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { useEditStore } from "@/app/pages/project-detail/edit-store";
import { CARD_TITLES } from "@/app/pages/project-detail/project-edit";
import { formatDay } from "@/app/pages/project-detail/project-tab";
import { useProjectSpecies } from "@/app/pages/project-detail/species-view";
import type { RecordKind } from "@/app/pages/project-detail/survey-data";
import { COLLECTION_METHOD_OPTIONS, FOCUS_AREA_OPTIONS, SURVEY_TYPE_OPTIONS } from "@/app/pages/project-registration/data";
import { RESTRICTION_TYPE_META } from "@/app/pages/project-registration/step-3-privacy-restrictions";
import { cx } from "@/utils/cx";
import { AccessBlock, ContactsBlock, Facts, MethodBlock, WhereBlock } from "./project-overview";
import type { ProjectView } from "./project-workspace";

const h2 = "m-0 text-lg font-semibold text-primary";

/** A collapsible group in the rail: its name and a small fold arrow, as Linear's "Properties". */
function RailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group border-b border-secondary pb-3 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md py-2 text-sm font-medium text-secondary outline-focus-ring select-none hover:text-primary focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-3.5 -rotate-90 text-quaternary transition-transform duration-100 ease-out group-open:rotate-0" aria-hidden />
      </summary>
      <div className="flex flex-col gap-0.5 pt-1">{children}</div>
    </details>
  );
}

function Prop({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1 text-sm">
      <span className="w-24 shrink-0 text-tertiary">{name}</span>
      <span className="min-w-0 flex-1 text-primary">{children}</span>
    </div>
  );
}

function Count({ name, value, onPress }: { name: string; value: number; onPress: () => void }) {
  return (
    <button type="button" onClick={onPress} className="-mx-2 flex items-center justify-between rounded-md px-2 py-1 text-left text-sm outline-focus-ring hover:bg-secondary focus-visible:outline-2">
      <span className="text-tertiary">{name}</span>
      <span className="font-medium text-primary tabular-nums">{value}</span>
    </button>
  );
}

export function ProjectLinear({
  view,
  setView,
  canEdit,
  artefactKinds,
  onGoToRecords,
  children,
}: {
  view: ProjectView;
  setView: (v: ProjectView) => void;
  canEdit: boolean;
  artefactKinds: string[];
  onGoToRecords: (kind: RecordKind | "all") => void;
  /** The body of any view but the Overview. */
  children: ReactNode;
}) {
  const { project, meta, records } = useEditStore();
  const species = useProjectSpecies();
  const d = project.details;
  const c = project.collection;
  const r = project.restrictions;
  const status = project.status;
  const statusColor = status === "Active" ? "success" : status === "Under review" ? "warning" : "gray";
  const owner = d.dataOwnerType === "organisation" ? d.dataOwnerOrgName : `${d.dataOwnerContacts[0]?.firstName ?? ""} ${d.dataOwnerContacts[0]?.lastName ?? ""}`.trim();
  const period = `${formatDay(d.startDate) || "Start not provided"} to ${d.endDate ? formatDay(d.endDate) : "ongoing"}`;
  const survey = SURVEY_TYPE_OPTIONS.find((o) => o.id === c.surveyType)?.label;
  const method = COLLECTION_METHOD_OPTIONS.find((o) => o.id === c.collectionMethod)?.label;
  const focus = c.focusAreas.map((id) => (id === "other" ? c.focusAreaOther || "Other" : (FOCUS_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id))).join(", ");
  const restricted = r.hasRestrictions ? RESTRICTION_TYPE_META.filter((m) => r.enabledTypes.has(m.key)) : [];
  const count = (kind: RecordKind) => records.filter((x) => x.kind === kind).length;
  const fullTitle = d.sameAsShortTitle ? "" : d.fullTitle;

  const tabs: { id: ProjectView; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "records", label: "Records", count: records.length },
    { id: "species", label: "Species", count: species.length },
    { id: "artefacts", label: "Artefacts", count: artefactKinds.length },
    ...(canEdit ? [{ id: "edit" as const, label: "Edit details" }] : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h1 className="m-0 text-2xl font-semibold text-balance text-primary">
          {d.shortTitle} <span className="font-normal text-quaternary">{meta.code}</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <BadgeWithDot size="sm" color={statusColor}>
            {status}
          </BadgeWithDot>
          <span className="rounded-md border border-secondary px-2 py-0.5 text-secondary">{period}</span>
          {owner && <span className="rounded-md border border-secondary px-2 py-0.5 text-secondary">{owner}</span>}
        </div>
      </div>

      <div role="tablist" aria-label="Project views" className="flex flex-wrap items-center gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={view === t.id}
            onClick={() => setView(t.id)}
            className={cx(
              "flex h-7 items-center gap-1.5 rounded-full px-3 text-sm outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2",
              view === t.id ? "bg-tertiary font-medium text-primary" : "text-tertiary hover:bg-secondary hover:text-primary",
            )}
          >
            {t.label}
            {t.count !== undefined && <span className="text-quaternary tabular-nums">{t.count}</span>}
          </button>
        ))}
      </div>

      {view !== "overview" ? (
        children
      ) : (
        <div className="flex gap-12 pt-3">
          <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-10">
            <section className="flex flex-col gap-4">
              {d.abstract ? <p className="m-0 max-w-prose text-base text-pretty text-secondary">{d.abstract}</p> : <p className="m-0 text-sm text-quaternary">No description has been provided.</p>}
              <Facts items={[{ label: "Full title", value: fullTitle }, { label: "URI or DOI", value: c.uriDoi }]} />
            </section>
            <section className="flex flex-col gap-4">
              <h2 className={h2}>Where</h2>
              <WhereBlock />
            </section>
            <section className="flex flex-col gap-4">
              <h2 className={h2}>How the data was collected</h2>
              <MethodBlock />
            </section>
            <section className="flex flex-col gap-4">
              <h2 className={h2}>Using this data</h2>
              <AccessBlock />
            </section>
          </div>

          <aside aria-label="Project properties" className="sticky top-0 hidden max-h-[calc(100dvh-8rem)] w-72 shrink-0 self-start overflow-y-auto xl:block">
            <RailGroup title="Properties">
              {/* Status, period and publisher are in the line under the title; the rail does not say them again. */}
              {survey && <Prop name="Survey">{survey}</Prop>}
              {method && <Prop name="Collection">{method}</Prop>}
              {focus && <Prop name="Focus">{focus}</Prop>}
              <Prop name="Access">
                {restricted.length === 0 ? (
                  <Badge size="sm" color="success">
                    Open
                  </Badge>
                ) : (
                  <span className="flex flex-col gap-1">
                    <Badge size="sm" color="warning" className="w-fit">
                      Some data is restricted
                    </Badge>
                    <span className="text-tertiary">{restricted.map((m) => CARD_TITLES[m.key]).join(", ")}</span>
                  </span>
                )}
              </Prop>
            </RailGroup>
            <RailGroup title="Data">
              <Count name="Records" value={records.length} onPress={() => onGoToRecords("all")} />
              <Count name="Events" value={count("event")} onPress={() => onGoToRecords("event")} />
              <Count name="Occurrences" value={count("occurrence")} onPress={() => onGoToRecords("occurrence")} />
              <Count name="Observations" value={count("observation")} onPress={() => onGoToRecords("observation")} />
              <Count name="Species" value={species.length} onPress={() => setView("species")} />
              <Count name="Artefacts" value={artefactKinds.length} onPress={() => setView("artefacts")} />
            </RailGroup>
            <RailGroup title="Contacts">
              <ContactsBlock stacked />
            </RailGroup>
          </aside>
        </div>
      )}
    </div>
  );
}
