"use client";

// Read-only display cards for everything the real Add Project wizard collects
// (project-registration/**) beyond the handful of fields the first pass of this page showed - per
// direct request to walk that flow and build a project detail page that actually shows all of it,
// organised as one continuous, well-sectioned page rather than split across separate tabs (see
// page.tsx's own Overview tab). Every option list/label lookup below reuses the wizard's own real
// vocabularies (project-registration/data.ts) rather than a second, disconnected copy - editing
// isn't wired up for this data (unlike the Permit/URI-DOI/Custom Property fields, which stay real
// FieldSections): the ask here is display quality, not a second inline copy of the wizard's own
// multi-select/contact-list editing UI.

import type { ReactNode } from "react";
import { getLocalTimeZone } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { Mail01, Phone01, Building07, FileLock01, Target04 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import {
  COLLECTION_METHOD_OPTIONS,
  EMBARGO_TYPE_OPTIONS,
  FOCUS_AREA_OPTIONS,
  PERMIT_TYPE_OPTIONS,
  REGISTRATION_SPECIES,
  ROLE_OF_WORK_OPTIONS,
  SPECIES_CONCEPTS,
} from "@/app/pages/project-registration/data";
import { conceptLabel, conceptValueLabel } from "@/app/pages/project-registration/concept-rows";
import { geoExtentSummary } from "@/app/pages/project-registration/geo-extent-picker";
import type { ContactPerson, DataCollectionState, ProjectDetailsState, ProjectManager, RestrictionsState } from "@/app/pages/project-registration/types";

export function formatDateValue(value: DateValue | null): string {
  if (!value) return "-";
  return value.toDate(getLocalTimeZone()).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function roleOfWorkLabel(details: ProjectDetailsState): string {
  if (details.roleOfWork === "other") return details.roleOfWorkOther || "Other";
  return ROLE_OF_WORK_OPTIONS.find((o) => o.id === details.roleOfWork)?.label ?? "-";
}

export function focusAreaLabels(collection: DataCollectionState): string[] {
  return collection.focusAreas.map((id) => (id === "other" ? collection.focusAreaOther || "Other" : (FOCUS_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id)));
}

export function targetedSpecies(collection: DataCollectionState) {
  return collection.targetedSpeciesIds.map((id) => REGISTRATION_SPECIES.find((s) => s.id === id)).filter((s): s is (typeof REGISTRATION_SPECIES)[number] => !!s);
}

export function permitTypeLabel(typeId: string | null): string {
  return PERMIT_TYPE_OPTIONS.find((o) => o.id === typeId)?.label ?? "-";
}

export function collectionMethodOption(id: string | null) {
  return COLLECTION_METHOD_OPTIONS.find((o) => o.id === id);
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-secondary bg-secondary px-2.5 py-1 text-xs font-medium text-secondary">{children}</span>;
}

// ── Identification ──

export function IdentificationRow({ details }: { details: ProjectDetailsState }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip>{roleOfWorkLabel(details)}</Chip>
      {!details.sameAsShortTitle && details.fullTitle && details.fullTitle !== details.shortTitle && (
        <span className="text-xs text-tertiary">
          Full title: <span className="font-medium text-secondary">{details.fullTitle}</span>
        </span>
      )}
    </div>
  );
}

// ── Data Owner + Project Manager(s) ──

/** `isPrimary`/`role` mirror `ProjectManagersCard`'s own row treatment below exactly (a "Primary"
 *  pill + "· <role>" suffix after the name) - per direct correction: "The field called Role of
 *  work actually belongs to the project publisher's contact details" - `roleOfWork` describes
 *  this contact's own role, not a bare project-level fact, so it renders here, not as a separate
 *  top-level row elsewhere on the page. Only ever passed for the Data Owner's own primary contact,
 *  the same "one real point of contact" convention `ProjectManager.isPrimary` already uses. */
function ContactRow({ contact, isPrimary, role }: { contact: ContactPerson; isPrimary?: boolean; role?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
        {contact.firstName} {contact.lastName}
        {isPrimary && <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-secondary uppercase">Primary</span>}
        {role && <span className="font-normal text-tertiary"> · {role}</span>}
      </p>
      {contact.organisation && <p className="text-xs text-tertiary">{contact.organisation}</p>}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tertiary">
        <span className="flex items-center gap-1.5">
          <Mail01 className="size-3.5 text-quaternary" />
          {contact.email}
        </span>
        {contact.phone && (
          <span className="flex items-center gap-1.5">
            <Phone01 className="size-3.5 text-quaternary" />
            {contact.phone}
          </span>
        )}
      </div>
    </div>
  );
}

export function DataOwnerCard({
  details,
  heading = "Data Owner",
  primaryRole,
  hoverable,
}: {
  details: ProjectDetailsState;
  heading?: string;
  /** The primary contact's own role label (e.g. `roleOfWorkLabel(details)`) - shown as a "· <role>"
   *  suffix next to their name, same as `ProjectManagersCard`'s own primary-manager row. Omitted
   *  by default so option-2's own existing usage (no role shown) is unaffected. */
  primaryRole?: string;
  /** Tints the card's own background on hover (`group-hover:bg-primary_hover` - relies on an
   *  ancestor carrying the real `group` class, e.g. option-3's own `EditableCard` wrapper) - real
   *  hover affordance for "this whole card is editable," not just its small corner icon. Off by
   *  default so option-2's own read-only usage (no editing, no `group` ancestor) is unaffected. */
  hoverable?: boolean;
}) {
  return (
    <BentoCard className={hoverable ? "transition-colors group-hover:bg-primary_hover" : undefined}>
      <div className="flex items-center gap-3">
        {details.dataOwnerType === "organisation" ? (
          details.dataOwnerOrgLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={details.dataOwnerOrgLogo.previewUrl} alt="" className="size-10 shrink-0 rounded-md border border-secondary object-contain" />
          ) : (
            <FeaturedIcon icon={Building07} color="gray" theme="light" size="md" />
          )
        ) : (
          <Avatar size="md" initials={`${details.dataOwnerContacts[0]?.firstName?.[0] ?? ""}${details.dataOwnerContacts[0]?.lastName?.[0] ?? ""}`} />
        )}
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-medium text-primary">{heading}</h2>
          <p className="text-sm text-tertiary">{details.dataOwnerType === "organisation" ? details.dataOwnerOrgName : "Individual"}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-secondary pt-4">
        {details.dataOwnerContacts.map((c, i) => (
          <ContactRow key={c.id} contact={c} isPrimary={i === 0 && !!primaryRole} role={i === 0 ? primaryRole : undefined} />
        ))}
      </div>
    </BentoCard>
  );
}

export function ProjectManagersCard({
  managers,
  hoverable,
}: {
  managers: ProjectManager[];
  /** Same `group-hover:bg-primary_hover` opt-in as `DataOwnerCard`'s own `hoverable` prop - see
   *  its comment above. */
  hoverable?: boolean;
}) {
  return (
    <BentoCard className={hoverable ? "transition-colors group-hover:bg-primary_hover" : undefined}>
      <h2 className="text-sm font-medium text-primary">Project Manager{managers.length > 1 ? "/s" : ""}</h2>
      <div className="flex flex-col gap-4 border-t border-secondary pt-4">
        {managers.map((m) => (
          <div key={m.id} className="flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
              {m.firstName} {m.lastName}
              {m.isPrimary && (
                <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-secondary uppercase">Primary</span>
              )}
              {m.role && <span className="font-normal text-tertiary"> · {ROLE_OF_WORK_OPTIONS.find((o) => o.id === m.role)?.label ?? m.roleOther}</span>}
            </p>
            {m.organisation && <p className="text-xs text-tertiary">{m.organisation}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tertiary">
              <span className="flex items-center gap-1.5">
                <Mail01 className="size-3.5 text-quaternary" />
                {m.email}
              </span>
              {m.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone01 className="size-3.5 text-quaternary" />
                  {m.phone}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

// ── Geographic extent ──

export function GeographicExtentSummary({ collection }: { collection: DataCollectionState }) {
  return <p className="text-sm text-secondary">{geoExtentSummary(collection.geographicExtent)}</p>;
}

// ── Data Collection ──

export function DataCollectionCard({ collection, bare = false }: { collection: DataCollectionState; bare?: boolean }) {
  const method = collectionMethodOption(collection.collectionMethod);
  const species = targetedSpecies(collection);

  const body = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project Focus Areas</p>
          <div className="flex flex-wrap gap-2">
            {focusAreaLabels(collection).map((label) => (
              <Chip key={label}>{label}</Chip>
            ))}
          </div>
        </div>

        {species.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-secondary pt-4">
            <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Targeted Species</p>
            <div className="flex flex-wrap gap-2">
              {species.map((s) => (
                <span key={s!.id} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs">
                  <span className="italic text-tertiary">{s!.species}</span>
                  <span className="font-medium text-secondary">· {s!.commonName}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 border-t border-secondary pt-4 sm:flex-row sm:gap-6">
          <span className="shrink-0 text-sm text-tertiary sm:w-44">Method of Data Collection</span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium text-primary">{method?.label ?? "-"}</span>
            {collection.methodDetails && <span className="text-sm text-tertiary">{collection.methodDetails}</span>}
          </div>
        </div>

        {collection.limitationsAndBiases && (
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
            <span className="shrink-0 text-sm text-tertiary sm:w-44">Limitations and biases</span>
            <span className="min-w-0 flex-1 text-sm text-primary">{collection.limitationsAndBiases}</span>
          </div>
        )}
      </div>
  );

  if (bare) return body;

  return (
    <BentoCard>
      <h2 className="text-md font-medium text-primary">Data Collection</h2>
      {body}
    </BentoCard>
  );
}

// ── Restrictions ──

export function RestrictionsCard({ restrictions, bare = false }: { restrictions: RestrictionsState; bare?: boolean }) {
  if (!restrictions.hasRestrictions || restrictions.enabledTypes.size === 0) {
    const emptyState = <p className="text-sm text-tertiary">This project&apos;s data is publicly available - no restrictions were set during registration.</p>;
    if (bare) return emptyState;
    return (
      <BentoCard>
        <h2 className="text-md font-medium text-primary">Privacy and Restrictions</h2>
        {emptyState}
      </BentoCard>
    );
  }

  const embargoActive = restrictions.enabledTypes.has("embargo") && restrictions.embargo.types.length > 0;
  const speciesActive = restrictions.enabledTypes.has("species") && restrictions.species.length > 0;

  const body = (
      <div className="flex flex-col gap-4">
        {embargoActive && (
          <div className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-25 p-4">
            <FeaturedIcon icon={FileLock01} color="warning" theme="light" size="sm" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-primary">
                Embargo · {restrictions.embargo.types.map((t) => EMBARGO_TYPE_OPTIONS.find((o) => o.id === t)?.label).join(", ")}
              </p>
              <p className="text-sm text-secondary">{restrictions.embargo.reason}</p>
              <p className="text-xs text-tertiary">Ends {formatDateValue(restrictions.embargo.endDate)}</p>
            </div>
          </div>
        )}
        {speciesActive &&
          restrictions.species.map((entry) => {
            const species = REGISTRATION_SPECIES.find((s) => s.id === entry.speciesId);
            return (
              <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-secondary bg-secondary/40 p-4">
                <FeaturedIcon icon={Target04} color="gray" theme="light" size="sm" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-primary">
                    Species restriction · {species?.commonName ?? entry.speciesId}
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-normal text-tertiary">
                      {entry.scope === "all" ? "All concepts" : "Selected concepts"}
                    </span>
                  </p>
                  {entry.scope === "selected" &&
                    entry.concepts.map((c) => (
                      <p key={c.id} className="text-sm text-secondary">
                        {conceptLabel(c, SPECIES_CONCEPTS)}: <span className="font-medium">{conceptValueLabel(c, SPECIES_CONCEPTS)}</span>
                      </p>
                    ))}
                  <p className="text-xs text-tertiary">{entry.justification}</p>
                </div>
              </div>
            );
          })}
      </div>
  );

  if (bare) return body;

  return (
    <BentoCard>
      <h2 className="text-md font-medium text-primary">Privacy and Restrictions</h2>
      {body}
    </BentoCard>
  );
}
