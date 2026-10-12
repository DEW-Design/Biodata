"use client";

// The project page for someone who has come to read it: a citizen, a student, a researcher deciding whether the data is
// what they need. The page it replaces was a stack of about fourteen bordered cards, each a table of label and value rows
// with an Edit button, so the first thing anyone saw was the machinery of editing and the abstract sat in row four of the
// fourth card. Here the same fields (nothing is dropped) are one document in the order a reader asks:
//   About                      what it is, in the project's own words, then its title and reference
//   In this project            how much data there is, and where to open it
//   Where                      the place, on a map
//   How the data was collected method, focus, species, limits, permits
//   Using this data            whether it is open, and what is held back and why
//   Contacts                   who to ask
// One white sheet on the panel, sections divided by a line, not a card each. Facts are a label over a value; prose is held to
// a readable measure; the technical coordinate table and the permit numbers sit behind a disclosure or small, since only
// some readers need them. Editing is not here: it is the "Edit details" view of the project (the page as it was), so a reader
// never meets an Edit button. A fact is shown once: the status, dates and publisher are in the title block above, not again here.
// Type is the product's own: section heading text-lg semibold (the project page's Section), the lead text-base, facts and prose
// text-sm, labels the small uppercase label of the record hero and "On this page".
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useMemo, type FC, type ReactNode } from "react";
import { ChevronRight, Database01, Flag01, Mail01, Paperclip, Phone01 } from "@untitledui/icons";
import { Accordion } from "@/components/base/accordion/accordion";
import { Badge } from "@/components/base/badges/badges";
import { LocationDetailsTable } from "@/app/pages/_shared/location-details-table";
import { ExpandableMap } from "@/app/pages/_shared/map-search/expandable-map";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { conceptLabel, conceptValueLabel } from "@/app/pages/project-registration/concept-rows";
import {
  COLLECTION_METHOD_OPTIONS,
  EMBARGO_TYPE_OPTIONS,
  FOCUS_AREA_OPTIONS,
  PERMIT_TYPE_OPTIONS,
  PROJECT_METADATA_CONCEPTS,
  REGISTRATION_SPECIES,
  SPECIES_CONCEPTS,
  SURVEY_TYPE_OPTIONS,
} from "@/app/pages/project-registration/data";
import { geoExtentSummary } from "@/app/pages/project-registration/geo-extent-picker";
import { RESTRICTION_TYPE_META } from "@/app/pages/project-registration/step-3-privacy-restrictions";
import { useEditStore } from "@/app/pages/project-detail/edit-store";
import { useCanReview } from "@/app/pages/project-detail/field-notes";
import { CARD_TITLES, contactRole, roleLabel } from "@/app/pages/project-detail/project-edit";
import { OnThisPage, RESTRICTION_DESCRIPTIONS, formatDay, type TocItem } from "@/app/pages/project-detail/project-tab";
import { useReviewItems } from "@/app/pages/project-detail/review-view";
import type { RecordKind } from "@/app/pages/project-detail/survey-data";
import { useProjectSpecies } from "@/app/pages/project-detail/species-view";
import { useFeatureAccess } from "@/lib/use-feature-access";

type Icon = FC<{ className?: string }>;

export const label = "m-0 text-xs font-semibold tracking-wide text-quaternary uppercase";
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ── Building blocks ──

/** A section of the sheet: its heading, then its content, divided from the one above by a line. */
function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-4 flex-col gap-5 border-t border-secondary p-6 first:border-t-0">
      <h2 className="m-0 text-lg font-semibold text-primary">{title}</h2>
      {children}
    </section>
  );
}

/** A label over its value. A fact with no value is left out, not written as "Not provided". */
export function Facts({ items }: { items: { label: string; value?: ReactNode }[] }) {
  const shown = items.filter((i) => i.value);
  if (shown.length === 0) return null;
  return (
    <dl className="m-0 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {shown.map((i) => (
        <div key={i.label} className="flex min-w-0 flex-col gap-1">
          <dt className={label}>{i.label}</dt>
          <dd className="m-0 text-sm text-balance text-primary">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A paragraph under its label, held to a readable line. */
export function Prose({ title, children }: { title: string; children?: string }) {
  if (!children) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className={label}>{title}</p>
      <p className="m-0 max-w-prose text-sm text-pretty text-secondary">{children}</p>
    </div>
  );
}

export function Chips({ title, items }: { title: string; items: string[] }) {
  const shown = items.filter(Boolean);
  if (shown.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className={label}>{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((i) => (
          <span key={i} className="inline-flex items-center rounded-full border border-secondary bg-secondary px-2.5 py-1 text-xs font-medium text-secondary">
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A row that opens another view of the project: what it holds, then where it goes. */
export function OpenRow({ icon: RowIcon, lead, rest, onPress, leading }: { icon?: Icon; lead: string; rest?: string; onPress: () => void; leading?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="group -mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-focus-ring transition duration-100 ease-linear hover:bg-secondary focus-visible:outline-2"
    >
      {leading ?? (RowIcon && <RowIcon className="size-5 shrink-0 text-quaternary" />)}
      <span className="min-w-0 flex-1 text-sm text-tertiary">
        <span className="font-medium text-primary tabular-nums">{lead}</span>
        {rest && <> {rest}</>}
      </span>
      <ChevronRight className="size-4 shrink-0 text-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
    </button>
  );
}

export function Person({ name, role, team, email, phone }: { name: string; role?: string; team?: string; email?: string; phone?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className="m-0 text-sm font-medium text-primary">{name || "Name not provided"}</p>
      {(role || team) && <p className="m-0 text-sm text-tertiary">{[role, team].filter(Boolean).join(" · ")}</p>}
      {email && (
        <a href={`mailto:${email}`} className="flex w-fit max-w-full items-center gap-1.5 rounded-sm text-sm text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2">
          <Mail01 className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{email}</span>
        </a>
      )}
      {phone && (
        <p className="m-0 flex items-center gap-1.5 text-sm text-tertiary">
          <Phone01 className="size-3.5 shrink-0 text-quaternary" aria-hidden />
          {phone}
        </p>
      )}
    </div>
  );
}

// ── The blocks of the Overview, each reading the project from the store, so the Linear-style page (project-linear.tsx) reuses them ──

export function WhereBlock() {
  const { project } = useEditStore();
  const d = project.details;
  const c = project.collection;
  const boundary = c.geographicExtent.boundary;
  const circle = boundary?.kind === "circle" ? boundary : null;
  return (
    <>
      {circle ? (
        <div className="flex flex-col gap-5">
          <ExpandableMap
            title={`${d.shortTitle} · geographic extent`}
            boundaries={[{ id: "project-extent", kind: "circle", center: circle.center, radiusKm: circle.radiusKm }]}
            onBoundaryAdd={() => {}}
            activeDrawTool={null}
            onDrawToolChange={() => {}}
            className="h-72 w-full"
          />
          <Facts
            items={[
              { label: "Centre", value: `${circle.center[0]}, ${circle.center[1]}` },
              { label: "Radius", value: `${circle.radiusKm} km` },
            ]}
          />
          <Accordion
            variant="compact"
            items={[{ id: "coordinates", title: "Coordinate details", content: <div className="pb-3"><LocationDetailsTable lat={circle.center[0]} lon={circle.center[1]} /></div> }]}
          />
        </div>
      ) : (
        <p className="m-0 text-sm text-primary">{c.geographicExtent.method ? geoExtentSummary(c.geographicExtent) : "No location has been provided."}</p>
      )}

    </>
  );
}

export function MethodBlock() {
  const { project } = useEditStore();
  const c = project.collection;
  const method = COLLECTION_METHOD_OPTIONS.find((o) => o.id === c.collectionMethod);
  const survey = SURVEY_TYPE_OPTIONS.find((o) => o.id === c.surveyType);
  const focus = c.focusAreas.map((id) => (id === "other" ? c.focusAreaOther || "Other" : (FOCUS_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id)));
  const targeted = c.targetedSpeciesIds.map((id) => REGISTRATION_SPECIES.find((s) => s.id === id)?.commonName ?? id);
  const permits = c.permits.flatMap((p) => {
    const type = PERMIT_TYPE_OPTIONS.find((o) => o.id === p.type)?.label ?? "";
    return type || p.number ? [{ label: type || "Permit", value: p.number }] : [];
  });
  return (
    <>
      <Facts items={[{ label: "Survey type", value: survey?.label }, { label: "Collection method", value: method?.label }]} />
      <Chips title="Focus areas" items={focus} />
      <Chips title="Targeted species" items={targeted} />
      <Prose title="Methodology">{c.methodDetails}</Prose>
      <Prose title="Limitations and biases">{c.limitationsAndBiases}</Prose>
      {permits.length > 0 && <Facts items={permits.map((p, i) => ({ label: permits.length > 1 && !p.label ? `Permit ${i + 1}` : p.label, value: p.value }))} />}

    </>
  );
}

export function AccessBlock() {
  const { project } = useEditStore();
  const r = project.restrictions;
  const enabled = r.hasRestrictions ? RESTRICTION_TYPE_META.filter((m) => r.enabledTypes.has(m.key)) : [];
  return (
    <>
      {enabled.length === 0 ? (
        <p className="m-0 flex items-center gap-2 text-sm text-primary">
          <Badge size="sm" color="success">
            Open
          </Badge>
          Everything in this project is openly available.
        </p>
      ) : (
        <>
          <p className="m-0 flex flex-wrap items-center gap-2 text-sm text-primary">
            <Badge size="sm" color="warning">
              Some data is restricted
            </Badge>
            Part of this project is held back from public release. What, and why, is below.
          </p>
          <div className="flex flex-col gap-5">
            {enabled.map((m) => (
              <div key={m.key} className="flex flex-col gap-3 border-t border-secondary pt-5 first:border-t-0 first:pt-0">
                <div className="flex flex-col gap-0.5">
                  <h3 className="m-0 text-sm font-semibold text-primary">{CARD_TITLES[m.key]}</h3>
                  <p className="m-0 text-sm text-tertiary">{RESTRICTION_DESCRIPTIONS[m.key]}</p>
                </div>
                {m.key === "embargo" && (
                  <Facts
                    items={[
                      { label: "Type", value: r.embargo.types.map((t) => (t === "other" ? r.embargo.typeOther || "Other" : EMBARGO_TYPE_OPTIONS.find((o) => o.id === t)?.label)).join(", ") },
                      { label: "Ends", value: formatDay(r.embargo.endDate) },
                      { label: "Reason", value: r.embargo.reason },
                    ]}
                  />
                )}
                {m.key === "species" &&
                  (r.species.length === 0 ? (
                    <p className="m-0 text-sm text-quaternary">No species nominated yet.</p>
                  ) : (
                    r.species.map((s) => (
                      <Facts
                        key={s.id}
                        items={[
                          { label: "Species", value: REGISTRATION_SPECIES.find((x) => x.id === s.speciesId)?.commonName ?? s.speciesId },
                          { label: "Withheld", value: s.scope === "all" ? "All concepts" : s.concepts.filter((cr) => cr.concept).map((cr) => conceptLabel(cr, SPECIES_CONCEPTS)).join(", ") },
                          ...(s.scope === "selected" ? [{ label: "Rule", value: s.concepts.filter((cr) => cr.concept).map((cr) => conceptValueLabel(cr, SPECIES_CONCEPTS) || "Withheld").join(", ") }] : []),
                          { label: "Why", value: s.scope === "all" ? s.justification : s.concepts.filter((cr) => cr.concept).map((cr) => cr.justification).filter(Boolean).join(" ") },
                        ]}
                      />
                    ))
                  ))}
                {m.key === "locations" &&
                  (r.locations.length === 0 ? (
                    <p className="m-0 text-sm text-quaternary">No locations nominated yet.</p>
                  ) : (
                    r.locations.map((l) => (
                      <Facts key={l.id} items={[{ label: "Location", value: l.name }, { label: "Extent", value: geoExtentSummary(l.extent) }, { label: "Why", value: l.justification }]} />
                    ))
                  ))}
                {m.key === "metadata" && (
                  <Facts
                    items={r.metadata.concepts
                      .filter((cr) => cr.concept)
                      .flatMap((cr) => [
                        { label: conceptLabel(cr, PROJECT_METADATA_CONCEPTS), value: conceptValueLabel(cr, PROJECT_METADATA_CONCEPTS) },
                        { label: "Why", value: cr.justification },
                      ])}
                  />
                )}
                {m.key === "other" && <Facts items={[{ label: "Restriction", value: r.otherRestrictions }]} />}
              </div>
            ))}
          </div>
        </>
      )}

    </>
  );
}

export function ContactsBlock({ stacked = false }: { stacked?: boolean }) {
  const { project } = useEditStore();
  const d = project.details;
  const owner = d.dataOwnerType === "organisation" ? d.dataOwnerOrgName : "Individual";
  return (
    <>
      <div className={stacked ? "flex flex-col gap-6" : "grid gap-8 sm:grid-cols-2"}>
        <div className="flex flex-col gap-4">
          <p className={label}>Published by</p>
          <div className="flex items-center gap-3">
            {d.dataOwnerType === "organisation" && d.dataOwnerOrgLogo && (
              // eslint-disable-next-line @next/next/no-img-element -- a local object URL picked in this session
              <img src={d.dataOwnerOrgLogo.previewUrl} alt={`${d.dataOwnerOrgName} logo`} className="size-10 rounded-md border border-secondary object-contain" />
            )}
            <p className="m-0 text-sm font-medium text-primary">{owner}</p>
          </div>
          {d.dataOwnerContacts.map((contact, i) => {
            const role = contactRole(d, i);
            return <Person key={contact.id} name={`${contact.firstName} ${contact.lastName}`.trim()} role={roleLabel(role.role, role.roleOther)} team={contact.organisation} email={contact.email} phone={contact.phone} />;
          })}
        </div>
        {d.projectManagers.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className={label}>Project managers</p>
            {d.projectManagers.map((m) => (
              <Person key={m.id} name={`${m.firstName} ${m.lastName}`.trim()} role={roleLabel(m.role, m.roleOther)} team={m.organisation} email={m.email} phone={m.phone} />
            ))}
          </div>
        )}
      </div>

    </>
  );
}

// ── The overview ──

export function ProjectOverview({
  title,
  artefactKinds,
  artefactRecordCount,
  onGoToRecords,
  onGoToSpecies,
  onGoToArtefacts,
  onGoToDatasets,
  onGoToFlagged,
}: {
  /** The title block (eyebrow, name, status line), above the sheet and level with "On this page". */
  title: ReactNode;
  artefactKinds: string[];
  artefactRecordCount: number;
  onGoToRecords: (kind: RecordKind | "all") => void;
  onGoToSpecies: () => void;
  onGoToArtefacts: () => void;
  onGoToDatasets: () => void;
  onGoToFlagged: () => void;
}) {
  const { project, records } = useEditStore();
  const d = project.details;
  const c = project.collection;
  const species = useProjectSpecies();
  const canReview = useCanReview();
  const canUpload = useFeatureAccess("datasetUpload");
  const review = useReviewItems();

  const counts = {
    event: records.filter((x) => x.kind === "event").length,
    occurrence: records.filter((x) => x.kind === "occurrence").length,
    observation: records.filter((x) => x.kind === "observation").length,
  };
  const topSpecies = useMemo(() => [...species].sort((a, b) => b.occurrences.length - a.occurrences.length), [species]);
  const flaggedRecords = new Set(review.open.map((i) => i.record.id)).size;

  const fullTitle = d.sameAsShortTitle ? "" : d.fullTitle;


  const toc: TocItem[] = [
    { id: "about", label: "About" },
    { id: "in-project", label: "In this project" },
    { id: "where", label: "Where" },
    { id: "method", label: "How the data was collected" },
    { id: "access", label: "Using this data" },
    { id: "contacts", label: "Contacts" },
  ];

  const kinds: { kind: RecordKind; label: string; value: number }[] = [
    { kind: "event", label: "Events", value: counts.event },
    { kind: "occurrence", label: "Occurrences", value: counts.occurrence },
    { kind: "observation", label: "Observations", value: counts.observation },
  ];

  return (
    <div className="flex gap-10">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {title}
        <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
          <Part id="about" title="About">
            {d.abstract ? <p className="m-0 max-w-prose text-base text-pretty text-secondary">{d.abstract}</p> : <p className="m-0 text-sm text-quaternary">No description has been provided.</p>}
            <Facts items={[{ label: "Full title", value: fullTitle }, { label: "URI or DOI", value: c.uriDoi }]} />
          </Part>

          <Part id="in-project" title="In this project">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[{ kind: "all" as const, label: "Records", value: records.length }, ...kinds].map((k) => (
                <button
                  key={k.kind}
                  type="button"
                  onClick={() => onGoToRecords(k.kind)}
                  className="flex flex-col gap-1 rounded-lg border border-secondary px-4 py-3 text-left outline-focus-ring transition duration-100 ease-linear hover:bg-secondary focus-visible:outline-2"
                >
                  <span className="text-2xl font-medium text-primary tabular-nums">{k.value}</span>
                  <span className="text-sm text-tertiary">{k.label}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col">
              {species.length > 0 && (
                <OpenRow
                  lead={plural(species.length, "species", "species")}
                  rest={`in ${plural(counts.occurrence, "occurrence", "occurrences")}. Most recorded: ${topSpecies[0]?.common}`}
                  onPress={onGoToSpecies}
                  leading={
                    <span aria-hidden className="flex shrink-0 -space-x-1.5">
                      {topSpecies.slice(0, 3).map((sp) => (
                        <SpeciesPhoto key={sp.id} scientificName={sp.scientific} alt="" fallbackIcon={SPECIES_GROUP_ICON[sp.group]} className="size-5 rounded-full ring-2 ring-bg-primary" />
                      ))}
                    </span>
                  }
                />
              )}
              {artefactKinds.length > 0 && <OpenRow icon={Paperclip} lead={plural(artefactKinds.length, "artefact or attachment", "artefacts and attachments")} rest={`on ${plural(artefactRecordCount, "record", "records")}`} onPress={onGoToArtefacts} />}
              {canUpload && <OpenRow icon={Database01} lead="Datasets" rest="uploaded to this project" onPress={onGoToDatasets} />}
              {canReview && review.open.length > 0 && <OpenRow icon={Flag01} lead={plural(review.open.length, "flagged concept", "flagged concepts")} rest={`on ${plural(flaggedRecords, "record", "records")}`} onPress={onGoToFlagged} />}
              {species.length === 0 && artefactKinds.length === 0 && !canUpload && <p className="m-0 text-sm text-quaternary">No species or files have been added yet.</p>}
            </div>
          </Part>

          <Part id="where" title="Where">
            <WhereBlock />
          </Part>

          <Part id="method" title="How the data was collected">
            <MethodBlock />
          </Part>

          <Part id="access" title="Using this data">
            <AccessBlock />
          </Part>

          <Part id="contacts" title="Contacts">
            <ContactsBlock />
          </Part>
        </div>
      </div>
      <OnThisPage items={toc} />
    </div>
  );
}
