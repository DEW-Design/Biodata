"use client";

// Editing one card of the Project tab in the edit drawer. The cards and their titles are the same as
// the page shows (Project details, Published by, Project managers, Geographic extent, Focus, species
// and method, Permits and identifiers, and one card per restriction). Each card's form is built from
// the Add Project registration's own pieces (`SectionFields` for Project details and each
// restriction, `GeoExtentPicker`, `ManagerCard`, `LogoUpload`, the same option lists), so fields,
// add and remove controls and rules match registration. Save changes applies the one card; Cancel
// asks before discarding.
//
// Data owner contacts each carry their own role (CONTRACTS 4.6). There is no separate role field for
// whoever registered the project anywhere on this page.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Plus, Save01, Trash01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { toast } from "@/components/application/toast/toast";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import { COLLECTION_METHOD_OPTIONS, FOCUS_AREA_OPTIONS, PERMIT_TYPE_OPTIONS, REGISTRATION_SPECIES, ROLE_OF_WORK_OPTIONS } from "@/app/pages/project-registration/data";
import { GeoExtentPicker } from "@/app/pages/project-registration/geo-extent-picker";
import { LogoUpload } from "@/app/pages/project-registration/logo-upload";
import { SectionFields } from "@/app/pages/project-registration/option-2/form-sections";
import { isSectionValid, missingFields } from "@/app/pages/project-registration/option-2/sections";
import { ManagerCard } from "@/app/pages/project-registration/step-1-project-details";
import { RESTRICTION_TYPE_META } from "@/app/pages/project-registration/step-3-privacy-restrictions";
import { emptyContact, emptyPermitRow, emptyProjectManager, isGeoExtentComplete, type CollectionMethod, type ContactPerson, type ProjectDetailsState, type ProjectManager, type RestrictionTypeKey } from "@/app/pages/project-registration/types";
import { EditDrawer } from "./edit-drawer";
import { PROJECT_STATUSES, useEditStore, type ProjectState, type ProjectStatus } from "./edit-store";

/** The cards of the Project tab. Restriction cards use the registration's restriction keys. */
export type ProjectCardId = "details" | "owner" | "managers" | "extent" | "collection" | "permits" | "add-restriction" | RestrictionTypeKey;

export const CARD_TITLES: Record<ProjectCardId, string> = {
  details: "Project details",
  owner: "Published by",
  managers: "Project managers",
  extent: "Geographic extent",
  collection: "Focus, species and method",
  permits: "Permits and identifiers",
  "add-restriction": "Add a restriction",
  embargo: "Embargo",
  species: "Species restriction",
  locations: "Location restriction",
  metadata: "Project metadata restriction",
  other: "Other restriction",
};

const CARD_GROUP: Record<ProjectCardId, string> = {
  details: "Overview",
  owner: "Overview",
  managers: "Overview",
  extent: "Data collection and storage",
  collection: "Data collection and storage",
  permits: "Data collection and storage",
  "add-restriction": "Privacy and restrictions",
  embargo: "Privacy and restrictions",
  species: "Privacy and restrictions",
  locations: "Privacy and restrictions",
  metadata: "Privacy and restrictions",
  other: "Privacy and restrictions",
};

const STATUS_ITEMS = PROJECT_STATUSES.map((s) => ({ id: s, label: s }));
const SPECIES_ITEMS = REGISTRATION_SPECIES.map((s) => ({ id: s.id, label: `${s.commonName} (${s.species})` }));
const REQUIRED = "This field is required";

/** A data owner contact's role: its own, or for the first contact the registration's `roleOfWork`. */
export function contactRole(d: ProjectDetailsState, index: number): { role: string | null; roleOther: string } {
  const c = d.dataOwnerContacts[index];
  if (!c) return { role: null, roleOther: "" };
  if (c.role !== undefined) return { role: c.role ?? null, roleOther: c.roleOther ?? "" };
  return index === 0 ? { role: d.roleOfWork, roleOther: d.roleOfWorkOther } : { role: null, roleOther: "" };
}

export function roleLabel(role: string | null, other: string): string {
  if (role === "other") return other || "Other";
  return ROLE_OF_WORK_OPTIONS.find((o) => o.id === role)?.label ?? "";
}

const blank = (v: string) => !v.trim();

/** What a card still needs before it can be saved. Empty = valid. */
export function cardMissing(id: ProjectCardId, s: ProjectState): string[] {
  const d = s.details;
  const c = s.collection;
  const out: string[] = [];
  switch (id) {
    case "details":
      return missingFields("basics", s);
    case "owner": {
      out.push(...missingFields("owner", s));
      const primary = contactRole(d, 0);
      if (!primary.role) out.push("Primary contact role");
      else if (primary.role === "other" && blank(primary.roleOther)) out.push("Primary contact role (please specify)");
      return out;
    }
    case "managers":
      if (!d.projectManagers.some((m) => m.firstName.trim() && m.lastName.trim() && m.email.trim())) out.push("A project manager with a name and email");
      return out;
    case "extent":
      if (!isGeoExtentComplete(c.geographicExtent)) out.push("Geographic extent");
      return out;
    case "collection":
      if (c.focusAreas.length === 0) out.push("Focus areas");
      if (c.focusAreas.includes("other") && blank(c.focusAreaOther)) out.push("Focus area (please specify)");
      if (!c.collectionMethod) out.push("Method of data collection");
      if (blank(c.methodDetails)) out.push("Method details");
      return out;
    case "permits":
      return out;
    case "add-restriction":
      return out;
    default:
      return isSectionValid(id, s) ? [] : missingFields(id, s);
  }
}

// ── Card forms ──

interface FormProps {
  draft: ProjectState;
  update: (next: ProjectState) => void;
  showErrors: boolean;
}

function DetailsForm({ draft, update, showErrors }: FormProps) {
  return (
    <>
      <FormRow title="Status" required description="Where the project is in its life. Only Active and Completed projects appear in public search.">
        <Select aria-label="Status" items={STATUS_ITEMS} selectedKey={draft.status} onSelectionChange={(key) => key && update({ ...draft, status: key as ProjectStatus })}>
          {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
        </Select>
      </FormRow>
      <SectionFields id="basics" state={draft} onChange={(next) => update({ ...draft, ...next })} showErrors={showErrors} />
    </>
  );
}

function OwnerForm({ draft, update, showErrors }: FormProps) {
  const d = draft.details;
  const patch = (p: Partial<ProjectDetailsState>) => update({ ...draft, details: { ...d, ...p } });
  // Every contact carries its role. The first contact's role is also written to `roleOfWork`, so the
  // registration's own rules still see it.
  const contacts = d.dataOwnerContacts.map((c, i) => ({ ...c, ...contactRole(d, i) }));
  const setContacts = (next: ContactPerson[]) => {
    const first = next[0];
    patch({ dataOwnerContacts: next, roleOfWork: first?.role ?? null, roleOfWorkOther: first?.roleOther ?? "" });
  };
  const updateContact = (id: number, p: Partial<ContactPerson>) => setContacts(contacts.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const missing = (v: string) => showErrors && blank(v);

  return (
    <>
      <FormRow title="Data owner" required description="The organisation or person responsible for this project's data.">
        <RadioGroup aria-label="Data owner type" value={d.dataOwnerType} onChange={(v) => patch({ dataOwnerType: v as ProjectDetailsState["dataOwnerType"] })}>
          <RadioButton value="organisation" label="Organisation / Institution" />
          <RadioButton value="individual" label="Individual / Person" />
        </RadioGroup>
        {d.dataOwnerType === "organisation" && (
          <>
            <Input
              label="Organisation / Institution name"
              isRequired
              value={d.dataOwnerOrgName}
              onChange={(v) => patch({ dataOwnerOrgName: v })}
              isInvalid={missing(d.dataOwnerOrgName)}
              hint={missing(d.dataOwnerOrgName) ? "Enter the organisation name" : undefined}
            />
            <LogoUpload value={d.dataOwnerOrgLogo} onChange={(dataOwnerOrgLogo) => patch({ dataOwnerOrgLogo })} orgName={d.dataOwnerOrgName} />
          </>
        )}
      </FormRow>
      <FormRow title="Contacts" required description="Who people should contact about this data, and their role. The first contact is the primary contact.">
        {contacts.map((c, i) => {
          const primary = i === 0;
          return (
            <div key={c.id} className="flex flex-col gap-4 rounded-lg border border-secondary p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary">{primary ? "Primary contact" : `Contact ${i + 1}`}</p>
                {!primary && <Button color="secondary" size="sm" iconLeading={Trash01} aria-label={`Remove contact ${i + 1}`} onClick={() => setContacts(contacts.filter((x) => x.id !== c.id))} />}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="First name" isRequired={primary} value={c.firstName} onChange={(v) => updateContact(c.id, { firstName: v })} isInvalid={primary && missing(c.firstName)} hint={primary && missing(c.firstName) ? REQUIRED : undefined} />
                <Input label="Last name" isRequired={primary} value={c.lastName} onChange={(v) => updateContact(c.id, { lastName: v })} isInvalid={primary && missing(c.lastName)} hint={primary && missing(c.lastName) ? REQUIRED : undefined} />
              </div>
              <Select
                label="Role or type of work"
                isRequired={primary}
                placeholder="Select role or type of work"
                items={ROLE_OF_WORK_OPTIONS}
                selectedKey={c.role ?? null}
                onSelectionChange={(key) => updateContact(c.id, { role: key as string, roleOther: key === "other" ? (c.roleOther ?? "") : "" })}
                isInvalid={primary && showErrors && !c.role}
                hint={primary && showErrors && !c.role ? "Select a role" : undefined}
              >
                {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
              </Select>
              {c.role === "other" && <Input label="Please specify" isRequired value={c.roleOther ?? ""} onChange={(v) => updateContact(c.id, { roleOther: v })} />}
              <Input label="Email" type="email" isRequired={primary} value={c.email} onChange={(v) => updateContact(c.id, { email: v })} isInvalid={primary && missing(c.email)} hint={primary && missing(c.email) ? REQUIRED : undefined} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Phone number" value={c.phone} onChange={(v) => updateContact(c.id, { phone: v })} />
                <Input label="Team" placeholder="E.g., DEW Biodiversity Team" value={c.organisation ?? ""} onChange={(v) => updateContact(c.id, { organisation: v })} />
              </div>
            </div>
          );
        })}
        <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={() => setContacts([...contacts, { ...emptyContact(Math.max(0, ...contacts.map((c) => c.id)) + 1), role: null, roleOther: "" }])}>
          Add another contact
        </Button>
      </FormRow>
    </>
  );
}

function ManagersForm({ draft, update, showErrors }: FormProps) {
  const d = draft.details;
  const setManagers = (projectManagers: ProjectManager[]) => update({ ...draft, details: { ...d, projectManagers } });
  const updateManager = (id: number, p: Partial<ProjectManager>) => setManagers(d.projectManagers.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const removeManager = (id: number) => {
    const removingPrimary = d.projectManagers.find((m) => m.id === id)?.isPrimary;
    const remaining = d.projectManagers.filter((m) => m.id !== id);
    setManagers(removingPrimary && remaining.length ? remaining.map((m, i) => (i === 0 ? { ...m, isPrimary: true } : m)) : remaining);
  };
  const noneValid = showErrors && !d.projectManagers.some((m) => m.firstName.trim() && m.lastName.trim() && m.email.trim());
  return (
    <FormRow title="Project managers" required description="At least one manager. Organisation, role and phone are optional." error={noneValid ? "Add at least one manager with a name and email." : undefined}>
      {d.projectManagers.map((manager, i) => (
        <ManagerCard
          key={manager.id}
          manager={manager}
          index={i}
          canRemove={d.projectManagers.length > 1}
          onChange={(p) => updateManager(manager.id, p)}
          onRemove={() => removeManager(manager.id)}
          onSetPrimary={() => setManagers(d.projectManagers.map((m) => ({ ...m, isPrimary: m.id === manager.id })))}
        />
      ))}
      <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={() => setManagers([...d.projectManagers, emptyProjectManager(Math.max(0, ...d.projectManagers.map((m) => m.id)) + 1)])}>
        Add another manager
      </Button>
    </FormRow>
  );
}

function ExtentForm({ draft, update, showErrors }: FormProps) {
  const c = draft.collection;
  return (
    <FormRow title="Geographic extent" required description="The area this project's data collection covers." error={showErrors && !isGeoExtentComplete(c.geographicExtent) ? "Define the geographic extent" : undefined}>
      <GeoExtentPicker value={c.geographicExtent} onChange={(geographicExtent) => update({ ...draft, collection: { ...c, geographicExtent } })} />
    </FormRow>
  );
}

function CollectionForm({ draft, update, showErrors }: FormProps) {
  const c = draft.collection;
  const patch = (p: Partial<typeof c>) => update({ ...draft, collection: { ...c, ...p } });
  const toggleFocus = (id: string, on: boolean) => {
    if (id === "biological") return;
    patch({ focusAreas: on ? [...c.focusAreas, id] : c.focusAreas.filter((f) => f !== id), focusAreaOther: id === "other" && !on ? "" : c.focusAreaOther });
  };
  return (
    <>
      <FormRow title="Focus areas" required description="Biological is always included. Add any other domains the project covers.">
        <div className="grid gap-3 sm:grid-cols-2">
          {FOCUS_AREA_OPTIONS.map((o) => (
            <Checkbox key={o.id} size="sm" label={o.label} hint={o.id === "biological" ? "Always included" : undefined} isSelected={c.focusAreas.includes(o.id)} isDisabled={o.id === "biological"} onChange={(on) => toggleFocus(o.id, on)} />
          ))}
        </div>
        {c.focusAreas.includes("other") && (
          <Input label="Please specify" isRequired value={c.focusAreaOther} onChange={(v) => patch({ focusAreaOther: v })} isInvalid={showErrors && blank(c.focusAreaOther)} hint={showErrors && blank(c.focusAreaOther) ? REQUIRED : undefined} />
        )}
      </FormRow>
      <FormRow title="Targeted species" description="Species the project sets out to record.">
        <MultiSelect
          aria-label="Targeted species"
          placeholder="Search and select species"
          items={SPECIES_ITEMS}
          selectedKeys={new Set(c.targetedSpeciesIds)}
          onSelectionChange={(keys) => patch({ targetedSpeciesIds: Array.from(keys as Set<string>) })}
          onReset={() => patch({ targetedSpeciesIds: [] })}
          onSelectAll={() => patch({ targetedSpeciesIds: SPECIES_ITEMS.map((o) => o.id) })}
        >
          {(item) => <MultiSelect.Item {...item} selectionIndicator="checkbox" selectionIndicatorAlign="left" />}
        </MultiSelect>
      </FormRow>
      <FormRow title="Method of data collection" required description="Pick the closest match." error={showErrors && !c.collectionMethod ? "Choose a method" : undefined}>
        <RadioGroup aria-label="Method of data collection" value={c.collectionMethod ?? ""} onChange={(v) => patch({ collectionMethod: v as CollectionMethod })}>
          {COLLECTION_METHOD_OPTIONS.map((o) => (
            <RadioButton key={o.id} value={o.id} label={o.label} hint={o.description} />
          ))}
        </RadioGroup>
      </FormRow>
      <FormRow title="Method details" required description="Survey techniques, whether qualitative or quantitative.">
        <TextArea aria-label="Method details" isRequired rows={4} value={c.methodDetails} onChange={(v) => patch({ methodDetails: v })} isInvalid={showErrors && blank(c.methodDetails)} hint={showErrors && blank(c.methodDetails) ? "Describe the survey method" : undefined} />
      </FormRow>
      <FormRow title="Limitations and biases" description="What the method may miss or over-represent.">
        <TextArea aria-label="Limitations and biases" rows={3} value={c.limitationsAndBiases} onChange={(v) => patch({ limitationsAndBiases: v })} />
      </FormRow>
    </>
  );
}

function PermitsForm({ draft, update }: FormProps) {
  const c = draft.collection;
  const patch = (p: Partial<typeof c>) => update({ ...draft, collection: { ...c, ...p } });
  const updatePermit = (id: number, p: Partial<(typeof c.permits)[number]>) => patch({ permits: c.permits.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  return (
    <>
      <FormRow title="Permits" description="Any permits the project was carried out under.">
        {c.permits.map((permit, i) => (
          <div key={permit.id} className="flex items-end gap-3">
            <Select label="Permit type" placeholder="Select permit type" items={PERMIT_TYPE_OPTIONS} selectedKey={permit.type} onSelectionChange={(key) => updatePermit(permit.id, { type: key as string })} className="flex-1">
              {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
            </Select>
            <Input label="Permit no." value={permit.number} onChange={(v) => updatePermit(permit.id, { number: v })} className="flex-1" />
            <Button color="secondary" size="md" iconLeading={Trash01} aria-label={`Remove permit ${i + 1}`} onClick={() => patch({ permits: c.permits.filter((x) => x.id !== permit.id) })} />
          </div>
        ))}
        <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={() => patch({ permits: [...c.permits, emptyPermitRow(Math.max(0, ...c.permits.map((p) => p.id)) + 1)] })}>
          Add a permit
        </Button>
      </FormRow>
      <FormRow title="URI / DOI" description="An existing identifier, if the dataset has one.">
        <Input aria-label="URI or DOI number" placeholder="E.g., 10.5281/zenodo.1234567" value={c.uriDoi} onChange={(v) => patch({ uriDoi: v })} />
      </FormRow>
    </>
  );
}

function AddRestrictionForm({ draft, update }: FormProps) {
  const r = draft.restrictions;
  const available = RESTRICTION_TYPE_META.filter((m) => !(r.hasRestrictions && r.enabledTypes.has(m.key)));
  return (
    <FormRow title="Kinds of restriction" description="Tick the ones to add. Each one gets its own card, and you fill in its details next.">
      {available.length === 0 ? (
        <p className="text-sm text-tertiary">Every kind of restriction is already on.</p>
      ) : (
        available.map(({ key, title, description }) => (
          <Checkbox
            key={key}
            size="sm"
            label={title}
            hint={description}
            isSelected={r.hasRestrictions && r.enabledTypes.has(key)}
            onChange={(on) => {
              const enabledTypes = new Set(r.hasRestrictions ? r.enabledTypes : []);
              if (on) enabledTypes.add(key);
              else enabledTypes.delete(key);
              update({ ...draft, restrictions: { ...r, enabledTypes, hasRestrictions: enabledTypes.size > 0 } });
            }}
          />
        ))
      )}
    </FormRow>
  );
}

function CardForm({ id, ...props }: FormProps & { id: ProjectCardId }) {
  switch (id) {
    case "details":
      return <DetailsForm {...props} />;
    case "owner":
      return <OwnerForm {...props} />;
    case "managers":
      return <ManagersForm {...props} />;
    case "extent":
      return <ExtentForm {...props} />;
    case "collection":
      return <CollectionForm {...props} />;
    case "permits":
      return <PermitsForm {...props} />;
    case "add-restriction":
      return <AddRestrictionForm {...props} />;
    default:
      return (
        <div className="max-w-[720px]">
          <SectionFields id={id} state={props.draft} onChange={(next) => props.update({ ...props.draft, ...next })} showErrors={props.showErrors} />
        </div>
      );
  }
}

function CardDrawer({ id, onClose, onOpenNext }: { id: ProjectCardId; onClose: () => void; onOpenNext: (next: ProjectCardId) => void }) {
  const { project, saveProject, meta } = useEditStore();
  const [draft, setDraft] = useState<ProjectState>(project);
  const [dirty, setDirty] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const missing = cardMissing(id, draft);
  const title = CARD_TITLES[id];

  const update = (next: ProjectState) => {
    setDraft(next);
    setDirty(true);
  };
  const save = () => {
    if (missing.length > 0) {
      setAttempted(true);
      return;
    }
    saveProject(draft);
    toast.success(`${title} saved`, { description: "Changes are kept for this session only. This preview has no backend." });
    // A restriction added just now has no details yet: go straight to its own card.
    const added = RESTRICTION_TYPE_META.map((m) => m.key).filter((k) => draft.restrictions.enabledTypes.has(k) && !project.restrictions.enabledTypes.has(k) && !isSectionValid(k, draft));
    onClose();
    if (added.length > 0) onOpenNext(added[0]);
  };

  return (
    <EditDrawer isOpen title={`Edit ${title}`} context={`Project ${meta.code} · ${project.details.shortTitle}`} isDirty={dirty} onClose={onClose}>
      {(requestClose): ReactNode => (
        <FormPage
          eyebrow={`Edit · ${CARD_GROUP[id]}`}
          title={title}
          onCancel={requestClose}
          problems={attempted && missing.length > 0 ? { items: missing } : undefined}
          primaryLabel={id === "add-restriction" ? "Add restrictions" : "Save changes"}
          onPrimary={save}
        >
          <CardForm id={id} draft={draft} update={update} showErrors={attempted} />
        </FormPage>
      )}
    </EditDrawer>
  );
}

/** Opens the drawer for one card of the Project tab; `null` closes it. */
export function ProjectCardDrawer({ card, onChange }: { card: ProjectCardId | null; onChange: (next: ProjectCardId | null) => void }) {
  if (!card) return null;
  // Keyed so each card starts from the current saved project, never a stale draft.
  return <CardDrawer key={card} id={card} onClose={() => onChange(null)} onOpenNext={(next) => onChange(next)} />;
}

/**
 * Version 3: the same card form, edited inline in the card itself instead of the drawer. The fields,
 * rules and "Details missing" alert are exactly the drawer's; Cancel and Save changes sit in the page's
 * sticky footer. Cancel asks before discarding changes.
 *
 * Designer override of CONTRACTS 4.1, logged in CONTEXT.md: an edit form that does not render
 * FormPage, because the designer asked for inline editing on the project's own cards (as on records).
 * Cancel and Save changes sit in the page's sticky footer, like record editing (CONTRACTS 4.7).
 */
export function InlineCardEditor({
  id,
  focusLabel,
  footer,
  onClose,
  onOpenNext,
}: {
  id: ProjectCardId;
  /** The field whose edit icon was pressed: scrolled to and focused. */
  focusLabel?: string;
  /** Where Cancel and Save go: the page's sticky footer, the same bar record editing uses. */
  footer: HTMLElement | null;
  onClose: () => void;
  onOpenNext: (next: ProjectCardId) => void;
}) {
  const { project, saveProject } = useEditStore();
  const [draft, setDraft] = useState<ProjectState>(project);
  const [dirty, setDirty] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const missing = cardMissing(id, draft);
  const title = CARD_TITLES[id];
  const rootRef = useRef<HTMLDivElement>(null);

  // Open at the field whose edit icon was pressed: the row whose title matches its label (or holds
  // it, for a contact's name), scrolled into view with its first input focused.
  useEffect(() => {
    const t = setTimeout(() => {
      const root = rootRef.current;
      if (!root) return;
      const want = focusLabel?.trim().toLowerCase();
      const titles = [...root.querySelectorAll<HTMLElement>("p, label, span")];
      const hit = want ? titles.find((el) => el.textContent?.replace("*", "").trim().toLowerCase() === want) : undefined;
      // A contact is found by its name: the whole name, or the first name in a split first / last field.
      const values = [...root.querySelectorAll<HTMLInputElement>("input")];
      const first = want?.split(/\s+/)[0];
      const byValue = want && !hit ? (values.find((i) => i.value.trim().toLowerCase() === want) ?? values.find((i) => i.value.trim().toLowerCase() === first)) : undefined;
      // The first field after the matching label (a row can hold more than one field).
      const inputs = [...root.querySelectorAll<HTMLElement>("input:not([type=hidden]):not([type=checkbox]), textarea, button[aria-haspopup]")];
      const after = hit ? inputs.find((i) => hit.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_FOLLOWING) : undefined;
      const target = byValue ?? after;
      (target ?? root).scrollIntoView({ block: "center" });
      target?.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(t);
  }, [focusLabel]);

  const update = (next: ProjectState) => {
    setDraft(next);
    setDirty(true);
  };
  const save = () => {
    if (missing.length > 0) {
      setAttempted(true);
      rootRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    saveProject(draft);
    toast.success(`${title} saved`, { description: "Changes are kept for this session only. This preview has no backend." });
    const added = RESTRICTION_TYPE_META.map((m) => m.key).filter((k) => draft.restrictions.enabledTypes.has(k) && !project.restrictions.enabledTypes.has(k) && !isSectionValid(k, draft));
    onClose();
    if (added.length > 0) onOpenNext(added[0]);
  };

  const bar = (
    <div className="border-t border-secondary bg-primary">
      <div className="flex items-center justify-between gap-3 px-6 py-4">
        <p className="text-sm text-tertiary">
          Editing <span className="font-semibold text-primary">{title}</span>
          {dirty && <span className="text-quaternary"> · Unsaved changes</span>}
        </p>
        <div className="flex items-center gap-3">
          <Button iconLeading={XClose} color="secondary" onClick={() => (dirty ? setConfirm(true) : onClose())}>
            Cancel
          </Button>
          <Button iconLeading={Save01} color="primary" onClick={save}>
            {id === "add-restriction" ? "Add restrictions" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="flex scroll-mt-4 flex-col gap-4">
      {attempted && missing.length > 0 && (
        <div role="alert">
          <AlertFullWidth contained tintedBackground wrap color="error" className="max-w-none rounded-lg border border-error-300 bg-error-50" title="Details missing" description={`Complete these to save: ${missing.join(", ")}.`} confirmLabel="OK" />
        </div>
      )}
      <CardForm id={id} draft={draft} update={update} showErrors={attempted} />
      {footer && createPortal(bar, footer)}
      <ConfirmationModal confirmIcon={Trash01} cancelIcon={ArrowLeft}
        isOpen={confirm}
        onOpenChange={setConfirm}
        title="Discard your changes?"
        description="You have changes that haven't been saved. Leaving now will lose them."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirm(false);
          onClose();
        }}
      />
    </div>
  );
}
