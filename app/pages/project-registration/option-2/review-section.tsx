"use client";

import { Edit05 } from "@untitledui/icons";
import { getLocalTimeZone } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { COLLECTION_METHOD_OPTIONS, FOCUS_AREA_OPTIONS, ROLE_OF_WORK_OPTIONS } from "../data";
import { geoExtentSummary } from "../geo-extent-picker";
import { restrictionsSummaryRows } from "../step-3-privacy-restrictions";
import { STEP_TITLES, type FormState, type SectionId } from "./sections";

// The last section: every answer grouped by step, each row with an Edit link back to its section,
// and - if anything is still missing - the sections that need attention listed at the top with a
// link to each. "Create project" itself lives in the page footer, like every other section's
// Continue.

const formatDate = (d: DateValue | null) => (d ? d.toDate(getLocalTimeZone()).toLocaleDateString("en-AU") : "");

function SummaryRow({ label, value, onEdit }: { label: string; value?: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
        {value ? <p className="line-clamp-2 text-sm text-balance text-secondary">{value}</p> : <p className="text-sm text-quaternary">Not provided</p>}
      </div>
      <Button color="link-gray" size="sm" iconLeading={Edit05} aria-label={`Edit ${label}`} onClick={onEdit} />
    </div>
  );
}

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-secondary">
      <h3 className="m-0! border-b border-secondary bg-secondary px-4 py-2.5 text-sm! font-semibold! tracking-normal! text-primary!">{title}</h3>
      <div className="flex flex-col [&>*+*]:border-t [&>*+*]:border-[var(--ui-border-secondary)]">{children}</div>
    </section>
  );
}

export function ReviewSection({ state, onEdit }: { state: FormState; onEdit: (id: SectionId) => void }) {
  const { details: d, collection: c, restrictions: r } = state;
  const contact = d.dataOwnerContacts[0];
  const person = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim();
  const roleLabel = d.roleOfWork === "other" ? d.roleOfWorkOther : ROLE_OF_WORK_OPTIONS.find((o) => o.id === d.roleOfWork)?.label;
  const managers = d.projectManagers.map(person).filter(Boolean).join(", ");
  const focus = c.focusAreas.map((id) => (id === "other" && c.focusAreaOther ? c.focusAreaOther : (FOCUS_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id))).join(", ");
  const method = COLLECTION_METHOD_OPTIONS.find((o) => o.id === c.collectionMethod)?.label;
  const dates = d.startDate ? `${formatDate(d.startDate)} to ${d.endDate ? formatDate(d.endDate) : "ongoing"}` : "";
  const restrictionRows = restrictionsSummaryRows(r);

  return (
    <div className="flex max-w-[720px] flex-col gap-6">
      <StepCard title={STEP_TITLES[1]}>
        <SummaryRow label="Project name" value={d.shortTitle} onEdit={() => onEdit("basics")} />
        <SummaryRow label="Abstract" value={d.abstract} onEdit={() => onEdit("basics")} />
        <SummaryRow label="Dates" value={dates} onEdit={() => onEdit("basics")} />
        <SummaryRow label="Data owner" value={d.dataOwnerType === "organisation" ? d.dataOwnerOrgName : person(contact)} onEdit={() => onEdit("owner")} />
        <SummaryRow label="Primary contact" value={person(contact) ? `${person(contact)}${contact.email ? ` - ${contact.email}` : ""}` : ""} onEdit={() => onEdit("owner")} />
        <SummaryRow label="Your role" value={roleLabel} onEdit={() => onEdit("team")} />
        <SummaryRow label="Project managers" value={managers} onEdit={() => onEdit("team")} />
      </StepCard>

      <StepCard title={STEP_TITLES[2]}>
        <SummaryRow label="Geographic extent" value={c.geographicExtent.method ? geoExtentSummary(c.geographicExtent) : ""} onEdit={() => onEdit("extent")} />
        <SummaryRow label="Focus areas" value={focus} onEdit={() => onEdit("extent")} />
        <SummaryRow label="Method of data collection" value={method} onEdit={() => onEdit("method")} />
      </StepCard>

      <StepCard title={STEP_TITLES[3]}>
        <SummaryRow label="Restrictions" value={r.hasRestrictions ? "Yes, apply restrictions" : "No restrictions - openly available to every BioData SA user"} onEdit={() => onEdit("restrictions")} />
        {restrictionRows.map((row) => (
          <SummaryRow key={row.key} label={row.title} value={row.summary} onEdit={() => onEdit(row.key)} />
        ))}
      </StepCard>
    </div>
  );
}
