"use client";

import { Fragment, useState, type Key } from "react";
import { Plus, Trash01 } from "@untitledui/icons";
import { Accordion } from "@/components/base/accordion/accordion";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { FormRow } from "@/app/pages/_shared/form-row";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { COLLECTION_METHOD_OPTIONS, COLLECTION_METHOD_OPTIONS_V2, FOCUS_AREA_OPTIONS, PERMIT_TYPE_OPTIONS, REGISTRATION_SPECIES, ROLE_OF_WORK_OPTIONS } from "../data";
import { GeoExtentPicker } from "../geo-extent-picker";
import { LogoUpload } from "../logo-upload";
import { MethodologySelect, OTHER_METHODOLOGY, SurveyTypeRadios, useMethodologyOptions } from "../methodology-fields";
import { ManagerCard } from "../step-1-project-details";
import { OFFERED_RESTRICTION_TYPES, RESTRICTION_TYPE_META, RestrictionTypeFields } from "../step-3-privacy-restrictions";
import { emptyContact, emptyPermitRow, emptyProjectContact, emptyProjectManager, type CollectionMethod, type DataCollectionState, type MethodologyChoice, type ProjectContact, type ProjectDetailsState, type ProjectManager, type RestrictionsState } from "../types";
import { contactsOf, PROJECT_NAME_MAX, type FormState, type FormVersion, type SectionId } from "./sections";

// One component per section of the second Add Project layout. Every field is a real DEW component
// (`Input`, `TextArea`, `Select`, `MultiSelect`, `RadioGroup`, `Checkbox`, `Accordion`); the two
// custom pieces - the calendar date picker and the logo upload - are the same ones the first
// layout uses, since DEW has no calendar picker or file dropzone yet. Required fields show an
// inline message only after the person tries to move on (`showErrors`), never while they are still
// typing their first answer.

interface SectionProps {
  state: FormState;
  onChange: (next: FormState) => void;
  /** True once Continue/Create was pressed on this section with something missing. */
  showErrors: boolean;
  /** Option 2's version (see `FormVersion` in sections.ts). Defaults to 1, which the project page's edit form also uses. */
  version?: FormVersion;
}

const SPECIES_ITEMS = REGISTRATION_SPECIES.map((s) => ({ id: s.id, label: `${s.commonName} (${s.species})` }));
const REQUIRED = "This field is required";

function useSectionPatches(state: FormState, onChange: (next: FormState) => void) {
  return {
    patchDetails: (p: Partial<ProjectDetailsState>) => onChange({ ...state, details: { ...state.details, ...p } }),
    patchCollection: (p: Partial<DataCollectionState>) => onChange({ ...state, collection: { ...state.collection, ...p } }),
    patchRestrictions: (p: Partial<RestrictionsState>) => onChange({ ...state, restrictions: { ...state.restrictions, ...p } }),
  };
}

// ── Step 1 ──

function BasicsSection({ state, onChange, showErrors, version = 1 }: SectionProps) {
  const { patchDetails } = useSectionPatches(state, onChange);
  const d = state.details;
  const [showFullTitle, setShowFullTitle] = useState(!d.sameAsShortTitle);
  const nameMissing = showErrors && !d.shortTitle.trim();
  const fullTitle = (
    <>
      <Checkbox
        size="sm"
        label="The full official title is different"
        isSelected={showFullTitle}
        onChange={(v) => {
          setShowFullTitle(v);
          patchDetails({ sameAsShortTitle: !v, fullTitle: v ? d.fullTitle : "" });
        }}
      />
      {showFullTitle && (
        <Input label="Full title" placeholder="The project's complete or official name" value={d.fullTitle} onChange={(v) => patchDetails({ fullTitle: v })} />
      )}
    </>
  );

  return (
    <>
      {version === 2 ? (
        // Version 2: the name is a short title with a hard limit (PROJECT_NAME_MAX), and a live count says so while it is typed.
        // A longer official name goes in Full title, which is what makes the limit easy to live with.
        <FormRow title="Project name" required description={`A short title, shown on project cards, lists and search. Up to ${PROJECT_NAME_MAX} characters.`}>
          <Input
            aria-label="Project name"
            isRequired
            maxLength={PROJECT_NAME_MAX}
            placeholder="E.g., Coorong Wetlands Bird Monitoring"
            value={d.shortTitle}
            onChange={(v) => patchDetails({ shortTitle: v })}
            isInvalid={nameMissing}
            hint={
              <span className="flex justify-between gap-4">
                <span>{nameMissing ? "Enter a project name" : d.shortTitle.length >= PROJECT_NAME_MAX ? "That is the limit. Put the full name in Full title." : "Keep it short. Add the full official title below if it is longer."}</span>
                <span className="shrink-0 tabular-nums">
                  {d.shortTitle.length}/{PROJECT_NAME_MAX}
                </span>
              </span>
            }
          />
          {fullTitle}
        </FormRow>
      ) : (
        <FormRow title="Project name" required description="A short, user-facing name people see first.">
          <Input
            aria-label="Project name"
            isRequired
            placeholder="E.g., Biodiversity Monitoring of the Coorong Wetlands 2025"
            value={d.shortTitle}
            onChange={(v) => patchDetails({ shortTitle: v })}
            isInvalid={nameMissing}
            hint={nameMissing ? "Enter a project name" : undefined}
          />
          {fullTitle}
        </FormRow>
      )}
      <FormRow title="Abstract" required description="Include background, aims and objectives: when, where, what, how, why and who.">
        <TextArea
          aria-label="Abstract"
          isRequired
          rows={6}
          placeholder="E.g., Please include background, aims and objectives."
          value={d.abstract}
          onChange={(v) => patchDetails({ abstract: v })}
          isInvalid={showErrors && !d.abstract.trim()}
          hint={showErrors && !d.abstract.trim() ? "Enter an abstract" : undefined}
        />
      </FormRow>
      <FormRow title="Project dates" required description="Leave the end date empty if the project is ongoing.">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputDatePicker
            label="Start date"
            isRequired
            value={d.startDate}
            onChange={(v) => patchDetails({ startDate: v })}
            isInvalid={showErrors && !d.startDate}
            hint={showErrors && !d.startDate ? "Choose a start date" : undefined}
          />
          <InputDatePicker label="End date" value={d.endDate} onChange={(v) => patchDetails({ endDate: v })} minValue={d.startDate ?? undefined} />
        </div>
      </FormRow>
    </>
  );
}

// Your role: one value (`roleOfWork`), asked once. An organisation owner is asked it in Step 2's Method and details; an individual
// owner is the person, so it is asked in the Data owner section (the designer, 6 Oct 2026).
function RoleRow({ state, onChange, showErrors }: SectionProps) {
  const { patchDetails } = useSectionPatches(state, onChange);
  const d = state.details;
  const roleMissing = showErrors && (!d.roleOfWork || (d.roleOfWork === "other" && !d.roleOfWorkOther.trim()));

  return (
    <FormRow title="Your role" required description="Helps us understand who is contributing to BioData SA.">
      <Select
        aria-label="Your role or type of work"
        isRequired
        placeholder="Select role or type of work"
        items={ROLE_OF_WORK_OPTIONS}
        selectedKey={d.roleOfWork}
        onSelectionChange={(key) => patchDetails({ roleOfWork: key as string, roleOfWorkOther: key === "other" ? d.roleOfWorkOther : "" })}
        isInvalid={showErrors && !d.roleOfWork}
        hint={showErrors && !d.roleOfWork ? "Select your role" : undefined}
      >
        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
      </Select>
      {d.roleOfWork === "other" && (
        <Input
          label="Please specify"
          isRequired
          placeholder="Describe your role or type of work"
          value={d.roleOfWorkOther}
          onChange={(v) => patchDetails({ roleOfWorkOther: v })}
          isInvalid={roleMissing && !d.roleOfWorkOther.trim()}
          hint={roleMissing && !d.roleOfWorkOther.trim() ? REQUIRED : undefined}
        />
      )}
    </FormRow>
  );
}

function OwnerSection(props: SectionProps) {
  if (props.version === 2)
    return (
      <>
        <DataOwnerRow {...props} />
        <ContactsRow {...props} />
      </>
    );
  return (
    <>
      <OwnerRows {...props} />
      {props.state.details.dataOwnerType === "individual" ? <RoleRow {...props} /> : <TeamRows {...props} />}
    </>
  );
}

// The data owner, its organisation name and logo. Both versions ask it.
function DataOwnerRow({ state, onChange, showErrors }: SectionProps) {
  const { patchDetails } = useSectionPatches(state, onChange);
  const d = state.details;
  const missing = (v: string) => showErrors && !v.trim();

  return (
    <FormRow title="Data owner" required description="The organisation or person responsible for this project's data.">
      <RadioGroup
        aria-label="Data owner type"
        orientation="horizontal"
        className="gap-6"
        value={d.dataOwnerType}
        onChange={(v) => patchDetails({ dataOwnerType: v as ProjectDetailsState["dataOwnerType"] })}
      >
        <RadioButton value="organisation" label="Organisation / Institution" />
        <RadioButton value="individual" label="Individual / Person" />
      </RadioGroup>
      {d.dataOwnerType === "organisation" && (
        <>
          <Input
            label="Organisation / Institution name"
            isRequired
            placeholder="Department for Housing and Urban Development"
            value={d.dataOwnerOrgName}
            onChange={(v) => patchDetails({ dataOwnerOrgName: v })}
            isInvalid={missing(d.dataOwnerOrgName)}
            hint={missing(d.dataOwnerOrgName) ? "Enter the organisation name" : undefined}
          />
          <LogoUpload value={d.dataOwnerOrgLogo} onChange={(dataOwnerOrgLogo) => patchDetails({ dataOwnerOrgLogo })} orgName={d.dataOwnerOrgName} />
        </>
      )}
    </FormRow>
  );
}

function OwnerRows(props: SectionProps) {
  const { state, onChange, showErrors } = props;
  const { patchDetails } = useSectionPatches(state, onChange);
  const d = state.details;
  const contact = d.dataOwnerContacts[0];
  const updateContact = (id: number, p: Partial<typeof contact>) => patchDetails({ dataOwnerContacts: d.dataOwnerContacts.map((c) => (c.id === id ? { ...c, ...p } : c)) });
  const addContact = () => patchDetails({ dataOwnerContacts: [...d.dataOwnerContacts, emptyContact(Math.max(0, ...d.dataOwnerContacts.map((c) => c.id)) + 1)] });
  const missing = (v: string) => showErrors && !v.trim();

  return (
    <>
      <DataOwnerRow {...props} />
      <FormRow title="Primary contact" required description="Who people should contact about this data.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" isRequired placeholder="John" value={contact.firstName} onChange={(v) => updateContact(contact.id, { firstName: v })} isInvalid={missing(contact.firstName)} hint={missing(contact.firstName) ? REQUIRED : undefined} />
          <Input label="Last name" isRequired placeholder="Doe" value={contact.lastName} onChange={(v) => updateContact(contact.id, { lastName: v })} isInvalid={missing(contact.lastName)} hint={missing(contact.lastName) ? REQUIRED : undefined} />
        </div>
        <Input label="Email" type="email" isRequired placeholder="john.doe@sa.gov.au" value={contact.email} onChange={(v) => updateContact(contact.id, { email: v })} isInvalid={missing(contact.email)} hint={missing(contact.email) ? REQUIRED : undefined} />
        <Input label="Phone number" placeholder="Enter contact number" value={contact.phone} onChange={(v) => updateContact(contact.id, { phone: v })} />
        {d.dataOwnerContacts.slice(1).map((c, i) => (
          <div key={c.id} className="flex flex-col gap-4 border-t border-secondary pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-primary">Contact {i + 2}</p>
              <Button color="secondary" size="sm" iconLeading={Trash01} aria-label={`Remove contact ${i + 2}`} onClick={() => patchDetails({ dataOwnerContacts: d.dataOwnerContacts.filter((x) => x.id !== c.id) })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" value={c.firstName} onChange={(v) => updateContact(c.id, { firstName: v })} />
              <Input label="Last name" value={c.lastName} onChange={(v) => updateContact(c.id, { lastName: v })} />
              <Input label="Email" value={c.email} onChange={(v) => updateContact(c.id, { email: v })} />
              <Input label="Phone number" value={c.phone} onChange={(v) => updateContact(c.id, { phone: v })} />
              <Input label="Organisation" placeholder="Their team or organisation" value={c.organisation ?? ""} onChange={(v) => updateContact(c.id, { organisation: v })} className="sm:col-span-2" />
            </div>
          </div>
        ))}
        <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={addContact}>
          Add another contact
        </Button>
      </FormRow>
    </>
  );
}

// Version 2's Project contacts (the designer, 9 Oct 2026): one list instead of a Primary contact block and a Project managers
// block. Each person is a card like the managers' (ManagerCard), with a role in the project, and two ticks: Primary contact
// (exactly one person; ticking it moves it) and Project manager (anyone). It replaces "Your role" as well: the person
// registering adds themselves here with their role (CONTRACTS 4.7: the role belongs to the contact).
function ContactsRow({ state, onChange, showErrors }: SectionProps) {
  const { patchDetails } = useSectionPatches(state, onChange);
  const d = state.details;
  const people = contactsOf(d);
  const set = (projectContacts: ProjectContact[]) => patchDetails({ projectContacts });
  const update = (id: number, p: Partial<ProjectContact>) => set(people.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const remove = (id: number) => {
    const removingPrimary = people.find((m) => m.id === id)?.isPrimary;
    const rest = people.filter((m) => m.id !== id);
    set(removingPrimary && rest.length ? rest.map((m, i) => (i === 0 ? { ...m, isPrimary: true } : m)) : rest);
  };
  const add = () => set([...people, emptyProjectContact(Math.max(0, ...people.map((m) => m.id)) + 1)]);
  const noPrimary = showErrors && !people.some((p) => p.isPrimary);
  const noManager = showErrors && d.dataOwnerType === "organisation" && !people.some((p) => p.isManager);
  const rowError =
    noPrimary && noManager ? "Mark one person as the primary contact and at least one as a project manager." : noPrimary ? "Mark one person as the primary contact." : noManager ? "Mark at least one person as a project manager." : undefined;

  return (
    <FormRow
      title="Project contacts"
      required
      description={
        d.dataOwnerType === "organisation"
          ? "The people to contact about this project. Mark one as the primary contact, and who manages the project."
          : "The people to contact about this project. Mark one as the primary contact."
      }
      error={rowError}
    >
      {people.map((person, i) => (
        <ContactCard
          key={person.id}
          person={person}
          index={i}
          showErrors={showErrors}
          canRemove={people.length > 1}
          onChange={(p) => update(person.id, p)}
          onRemove={() => remove(person.id)}
          onSetPrimary={() => set(people.map((m) => ({ ...m, isPrimary: m.id === person.id })))}
        />
      ))}
      <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={add}>
        Add another contact
      </Button>
    </FormRow>
  );
}

function ContactCard({
  person,
  index,
  showErrors,
  canRemove,
  onChange,
  onRemove,
  onSetPrimary,
}: {
  person: ProjectContact;
  index: number;
  showErrors: boolean;
  canRemove: boolean;
  onChange: (p: Partial<ProjectContact>) => void;
  onRemove: () => void;
  onSetPrimary: () => void;
}) {
  const missing = (v: string) => showErrors && !v.trim();
  const roleMissing = showErrors && !person.role;
  const otherMissing = showErrors && person.role === "other" && !person.roleOther.trim();

  return (
    <BentoCard className="gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary">Contact {index + 1}</p>
        {canRemove && <Button color="secondary" size="sm" iconLeading={Trash01} aria-label={`Remove contact ${index + 1}`} onClick={onRemove} />}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="First name" isRequired placeholder="John" value={person.firstName} onChange={(v) => onChange({ firstName: v })} isInvalid={missing(person.firstName)} hint={missing(person.firstName) ? REQUIRED : undefined} />
        <Input label="Last name" isRequired placeholder="Doe" value={person.lastName} onChange={(v) => onChange({ lastName: v })} isInvalid={missing(person.lastName)} hint={missing(person.lastName) ? REQUIRED : undefined} />
        <Input label="Email" type="email" isRequired placeholder="john.doe@sa.gov.au" value={person.email} onChange={(v) => onChange({ email: v })} isInvalid={missing(person.email)} hint={missing(person.email) ? REQUIRED : undefined} />
        <Input label="Phone number" placeholder="Enter contact number" value={person.phone} onChange={(v) => onChange({ phone: v })} />
      </div>
      <Select
        label="Role in project"
        isRequired
        placeholder="Select a role"
        items={ROLE_OF_WORK_OPTIONS}
        selectedKey={person.role}
        onSelectionChange={(key) => onChange({ role: key as string, roleOther: key === "other" ? person.roleOther : "" })}
        isInvalid={roleMissing}
        hint={roleMissing ? "Select a role" : undefined}
      >
        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
      </Select>
      {person.role === "other" && (
        <Input label="Please specify" isRequired placeholder="Describe their role in the project" value={person.roleOther} onChange={(v) => onChange({ roleOther: v })} isInvalid={otherMissing} hint={otherMissing ? REQUIRED : undefined} />
      )}
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <Checkbox size="sm" label="Primary contact" isSelected={person.isPrimary} onChange={(on) => (on ? onSetPrimary() : onChange({ isPrimary: false }))} />
        <Checkbox size="sm" label="Project manager" isSelected={person.isManager} onChange={(on) => onChange({ isManager: on })} />
      </div>
    </BentoCard>
  );
}

// The project managers. They were part of a "Project team" section with your role; the section went into the
// Data owner section (the designer, 2 Oct 2026), and your role moved on to Step 2's Method and details
// (the designer, 6 Oct 2026), so this is rendered by the Data owner section.
function TeamRows({ state, onChange, showErrors }: SectionProps) {
  const { patchDetails } = useSectionPatches(state, onChange);
  const d = state.details;
  const updateManager = (id: number, p: Partial<ProjectManager>) => patchDetails({ projectManagers: d.projectManagers.map((m) => (m.id === id ? { ...m, ...p } : m)) });
  const removeManager = (id: number) => {
    const removingPrimary = d.projectManagers.find((m) => m.id === id)?.isPrimary;
    const remaining = d.projectManagers.filter((m) => m.id !== id);
    patchDetails({ projectManagers: removingPrimary && remaining.length ? remaining.map((m, i) => (i === 0 ? { ...m, isPrimary: true } : m)) : remaining });
  };
  const managersMissing = showErrors && !d.projectManagers.some((m) => m.firstName.trim() && m.lastName.trim() && m.email.trim());

  return (
    <>
      <FormRow title="Project managers" required description="Add at least one manager. Organisation, role and phone are optional." error={managersMissing ? "Add at least one manager with a name and email." : undefined}>
        {d.projectManagers.map((manager, i) => (
          <ManagerCard
            key={manager.id}
            manager={manager}
            index={i}
            canRemove={d.projectManagers.length > 1}
            onChange={(p) => updateManager(manager.id, p)}
            onRemove={() => removeManager(manager.id)}
            onSetPrimary={() => patchDetails({ projectManagers: d.projectManagers.map((m) => ({ ...m, isPrimary: m.id === manager.id })) })}
          />
        ))}
        <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={() => patchDetails({ projectManagers: [...d.projectManagers, emptyProjectManager(Math.max(0, ...d.projectManagers.map((m) => m.id)) + 1)] })}>
          Add another manager
        </Button>
      </FormRow>
    </>
  );
}

// ── Step 2 ──

function ExtentSection({ state, onChange, showErrors, version = 1 }: SectionProps) {
  const { patchCollection } = useSectionPatches(state, onChange);
  const c = state.collection;
  const extentMissing = showErrors && !(c.geographicExtent.method && (c.geographicExtent.boundary || c.geographicExtent.parkId || c.geographicExtent.shapefileName));

  return (
    <>
      <FormRow title="Geographic extent" required description="The area this project's data collection covers." error={extentMissing ? "Define the geographic extent" : undefined}>
        {/* Version 2 opens the map in the shared Expand dialog, like the project page's map (the designer, 9 Oct 2026). */}
        <GeoExtentPicker value={c.geographicExtent} onChange={(geographicExtent) => patchCollection({ geographicExtent })} expand={version === 2 ? "modal" : "fullscreen"} />
      </FormRow>
      {/* Version 2 asks focus areas in Method and details instead (the designer, 9 Oct 2026). */}
      {version === 1 && <FocusAreasRow state={state} onChange={onChange} showErrors={showErrors} />}
    </>
  );
}

function FocusAreasRow({ state, onChange, showErrors }: SectionProps) {
  const { patchCollection } = useSectionPatches(state, onChange);
  const c = state.collection;
  const toggleFocusArea = (id: string, on: boolean) => {
    if (id === "biological") return; // always included
    patchCollection({ focusAreas: on ? [...c.focusAreas, id] : c.focusAreas.filter((f) => f !== id), focusAreaOther: id === "other" && !on ? "" : c.focusAreaOther });
  };
  const otherMissing = showErrors && c.focusAreas.includes("other") && !c.focusAreaOther.trim();

  return (
    <FormRow title="Focus areas" required description="Biological is always included. Add any other domains the project covers.">
      <div className="grid gap-3 sm:grid-cols-2">
        {FOCUS_AREA_OPTIONS.map((option) => (
          <Checkbox
            key={option.id}
            size="sm"
            label={option.label}
            hint={option.id === "biological" ? "Always included" : undefined}
            isSelected={c.focusAreas.includes(option.id)}
            isDisabled={option.id === "biological"}
            onChange={(on) => toggleFocusArea(option.id, on)}
          />
        ))}
      </div>
      {c.focusAreas.includes("other") && (
        <Input
          label="Please specify"
          isRequired
          placeholder="Describe the other data domain"
          value={c.focusAreaOther}
          onChange={(v) => patchCollection({ focusAreaOther: v })}
          isInvalid={otherMissing}
          hint={otherMissing ? REQUIRED : undefined}
        />
      )}
    </FormRow>
  );
}

function OptionalMethodDetails({ state, onChange, withLimitations = true }: Pick<SectionProps, "state" | "onChange"> & { withLimitations?: boolean }) {
  const { patchCollection } = useSectionPatches(state, onChange);
  const c = state.collection;
  const [open, setOpen] = useState<Set<Key>>(new Set());
  const updatePermit = (id: number, p: Partial<(typeof c.permits)[number]>) => patchCollection({ permits: c.permits.map((x) => (x.id === id ? { ...x, ...p } : x)) });

  return (
    <Accordion
      variant="compact"
      openKeys={open}
      onOpenKeysChange={setOpen}
      items={[
        {
          id: "species",
          title: "Targeted species",
          content: (
            <MultiSelect
              aria-label="Targeted species"
              placeholder="Search and select species"
              items={SPECIES_ITEMS}
              selectedKeys={new Set(c.targetedSpeciesIds)}
              onSelectionChange={(keys) => patchCollection({ targetedSpeciesIds: Array.from(keys as Set<string>) })}
              onReset={() => patchCollection({ targetedSpeciesIds: [] })}
              onSelectAll={() => patchCollection({ targetedSpeciesIds: SPECIES_ITEMS.map((o) => o.id) })}
            >
              {(item) => <MultiSelect.Item {...item} selectionIndicator="checkbox" selectionIndicatorAlign="left" />}
            </MultiSelect>
          ),
        },
        {
          id: "permit",
          title: "Permits",
          content: (
            <div className="flex flex-col gap-3">
              {c.permits.map((permit, i) => (
                <div key={permit.id} className="flex items-end gap-3">
                  <Select label="Permit type" placeholder="Select permit type" items={PERMIT_TYPE_OPTIONS} selectedKey={permit.type} onSelectionChange={(key) => updatePermit(permit.id, { type: key as string })} className="flex-1">
                    {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                  </Select>
                  <Input label="Permit no." placeholder="Enter permit number" value={permit.number} onChange={(v) => updatePermit(permit.id, { number: v })} className="flex-1" />
                  <Button color="secondary" size="md" iconLeading={Trash01} aria-label={`Remove permit ${i + 1}`} isDisabled={c.permits.length === 1} onClick={() => patchCollection({ permits: c.permits.filter((x) => x.id !== permit.id) })} />
                </div>
              ))}
              <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={() => patchCollection({ permits: [...c.permits, emptyPermitRow(Math.max(0, ...c.permits.map((p) => p.id)) + 1)] })}>
                Add another permit
              </Button>
            </div>
          ),
        },
        {
          id: "uri",
          title: "URI / DOI number",
          content: (
            <Input aria-label="URI or DOI number" placeholder="E.g., 10.5281/zenodo.1234567" hint="Enter an existing identifier if known; otherwise, a unique ID will be generated." value={c.uriDoi} onChange={(v) => patchCollection({ uriDoi: v })} />
          ),
        },
        // Version 2 asks for variations, limitations and biases per methodology instead (MethodologyRow).
        ...(withLimitations
          ? [
              {
                id: "limitations",
                title: "Limitations and biases",
                content: (
                  <TextArea aria-label="Limitations and biases" rows={3} placeholder="Only targeted native species and weeds were excluded" hint="What biases were used with the methodology used." value={c.limitationsAndBiases} onChange={(v) => patchCollection({ limitationsAndBiases: v })} />
                ),
              },
            ]
          : []),
      ]}
    />
  );
}

// Version 2's methodologies, from the Survey methodology vocabulary (BIODATA-117), asked only for a Systematic project and
// shown right under that choice, indented to its label, so they read as part of it (the designer, 9 Oct 2026). Added one at a
// time, each with its own field for any variation, limitation or bias, as trap types are on the trap effort editor
// (project-detail/trap-effort.tsx). The list grows as the admins add to the vocabulary, so the picker is the searchable
// single select (MultiSelect selectionMode="single", as the Observers field) instead of a menu: it lists only what is not added
// yet (Other can be added more than once, each with its own name), and clears after each pick. A row's remove icon shows on
// hover or keyboard focus, as a trap type's does.
function MethodologyList({ state, onChange, showErrors }: SectionProps) {
  const { patchCollection } = useSectionPatches(state, onChange);
  const chosen = state.collection.methodologies ?? [];
  const options = useMethodologyOptions(chosen.map((m) => m.id));
  const set = (methodologies: MethodologyChoice[]) => patchCollection({ methodologies });
  const update = (rid: number, patch: Partial<MethodologyChoice>) => set(chosen.map((m) => (m.rid === rid ? { ...m, ...patch } : m)));
  const add = (id: string) => set([...chosen, { rid: Math.max(0, ...chosen.map((m) => m.rid ?? 0)) + 1, id, note: "" }]);
  const addable = options.filter((name) => name === OTHER_METHODOLOGY || !chosen.some((m) => m.id === name));

  return (
    <div className="flex flex-col gap-4 pl-6">
      {chosen.map((m, i) => {
        const isOther = m.id === OTHER_METHODOLOGY;
        const name = isOther ? m.other?.trim() || "other methodology" : m.id;
        const otherMissing = showErrors && isOther && !m.other?.trim();
        return (
          <div key={m.rid ?? i} className="group/methodology flex items-start gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {isOther && (
                <Input
                  label="Other methodology"
                  isRequired
                  placeholder="Name the methodology"
                  value={m.other ?? ""}
                  onChange={(other) => update(m.rid, { other })}
                  isInvalid={otherMissing}
                  hint={otherMissing ? REQUIRED : undefined}
                />
              )}
              <TextArea
                label={isOther ? undefined : m.id}
                aria-label={isOther ? `Variations, limitations and biases: ${name}` : undefined}
                rows={2}
                placeholder="Optional: describe any variation, limitation or bias in how you used it"
                value={m.note}
                onChange={(note) => update(m.rid, { note })}
              />
            </div>
            <Button
              color="tertiary"
              size="sm"
              iconLeading={Trash01}
              aria-label={`Remove ${name}`}
              onClick={() => set(chosen.filter((x) => x.rid !== m.rid))}
              className="mt-6 opacity-0 transition-opacity group-focus-within/methodology:opacity-100 group-hover/methodology:opacity-100 focus-visible:opacity-100"
            />
          </div>
        );
      })}
      <MultiSelect
        aria-label="Add a methodology"
        selectionMode="single"
        placeholder={chosen.length === 0 ? "Search and add a methodology" : "Search and add another methodology"}
        isInvalid={showErrors && chosen.length === 0}
        emptyStateTitle="No methodology found"
        emptyStateDescription="Pick Other and name it."
        items={addable.map((name) => ({ id: name, label: name }))}
        selectedKeys={new Set<string>()}
        onSelectionChange={(keys) => {
          const picked = keys === "all" ? undefined : Array.from(keys)[0];
          if (picked !== undefined) add(String(picked));
        }}
        className="w-[calc(100%-2.75rem)]"
      >
        {(item) => <MultiSelect.Item {...item} />}
      </MultiSelect>
    </div>
  );
}

// Version 2's Method and details: focus areas moved in, survey type and your role taken out, no Unknown method, and Method of
// data collection and Methodology merged into one question (the designer, 9 Oct 2026: "Merge method of data collection and
// methodology into one"). Only Systematic asks which methodologies were used, right under its own choice.
function MethodSectionV2(props: SectionProps) {
  const { state, onChange, showErrors } = props;
  const { patchCollection } = useSectionPatches(state, onChange);
  const c = state.collection;
  const systematic = c.collectionMethod === "systematic";
  const error = !showErrors ? undefined : !c.collectionMethod ? "Choose a method" : systematic && (c.methodologies ?? []).length === 0 ? "Add at least one methodology" : undefined;

  return (
    <>
      <FocusAreasRow {...props} />
      <FormRow title="Methodology" required description="How the data was collected. For a systematic survey, add each methodology used." error={error}>
        <RadioGroup aria-label="Methodology" value={c.collectionMethod ?? ""} onChange={(v) => patchCollection({ collectionMethod: v as CollectionMethod })}>
          {COLLECTION_METHOD_OPTIONS_V2.map((option) => (
            <Fragment key={option.id}>
              <RadioButton value={option.id} label={option.label} hint={option.description} />
              {option.id === "systematic" && systematic && <MethodologyList {...props} />}
            </Fragment>
          ))}
        </RadioGroup>
      </FormRow>
      <FormRow title="Optional details" description="Only add these if they apply to this project.">
        <OptionalMethodDetails state={state} onChange={onChange} withLimitations={false} />
      </FormRow>
    </>
  );
}

function MethodSection({ state, onChange, showErrors }: SectionProps) {
  const { patchCollection } = useSectionPatches(state, onChange);
  const c = state.collection;
  const d = state.details;

  return (
    <>
      <FormRow title="Survey type" required description="The kind of survey this project runs." error={showErrors && !c.surveyType ? "Choose a survey type" : undefined}>
        <SurveyTypeRadios value={c.surveyType} onChange={(surveyType) => patchCollection({ surveyType })} />
      </FormRow>
      <FormRow title="Method of data collection" required description="Pick the closest match." error={showErrors && !c.collectionMethod ? "Choose a method" : undefined}>
        <RadioGroup aria-label="Method of data collection" value={c.collectionMethod ?? ""} onChange={(v) => patchCollection({ collectionMethod: v as CollectionMethod })}>
          {COLLECTION_METHOD_OPTIONS.map((option) => (
            <RadioButton key={option.id} value={option.id} label={option.label} hint={option.description} />
          ))}
        </RadioGroup>
      </FormRow>
      <FormRow title="Methodology" required description="The survey technique used, from the Survey method vocabulary.">
        <MethodologySelect value={c.methodDetails} onChange={(methodDetails) => patchCollection({ methodDetails })} isInvalid={showErrors && !c.methodDetails.trim()} />
      </FormRow>
      {/* An individual owner is asked their role in the Data owner section instead (OwnerRows). */}
      {d.dataOwnerType === "organisation" && <RoleRow state={state} onChange={onChange} showErrors={showErrors} />}
      <FormRow title="Optional details" description="Only add these if they apply to this project.">
        <OptionalMethodDetails state={state} onChange={onChange} />
      </FormRow>
    </>
  );
}

// ── Step 3 ──

function RestrictionsSection({ state, onChange, showErrors }: SectionProps) {
  const { patchRestrictions } = useSectionPatches(state, onChange);
  const r = state.restrictions;
  const toggleType = (key: (typeof RESTRICTION_TYPE_META)[number]["key"], on: boolean) => {
    const enabledTypes = new Set(r.enabledTypes);
    if (on) enabledTypes.add(key);
    else enabledTypes.delete(key);
    patchRestrictions({ enabledTypes });
  };

  return (
    <>
      <FormRow title="Restrictions on distribution" required description="Whether some or all of this project's data needs protecting.">
        <RadioGroup aria-label="Restrictions on distribution" value={r.hasRestrictions ? "yes" : "no"} onChange={(v) => patchRestrictions({ hasRestrictions: v === "yes" })}>
          <RadioButton value="no" label="No restrictions" hint="Everything in this project is openly available." />
          <RadioButton value="yes" label="Yes, apply restrictions" hint="Embargo, sensitive species or locations, or other rules." />
        </RadioGroup>
      </FormRow>
      {r.hasRestrictions && (
        <FormRow title="Kinds of restriction" required description="Each one you tick gets its own section in the list on the left." error={showErrors && r.enabledTypes.size === 0 ? "Select at least one kind of restriction" : undefined}>
          {OFFERED_RESTRICTION_TYPES.map(({ key, title, description }) => (
            <Checkbox key={key} size="sm" label={title} hint={description} isSelected={r.enabledTypes.has(key)} onChange={(on) => toggleType(key, on)} />
          ))}
        </FormRow>
      )}
    </>
  );
}

function RestrictionTypeSection({ typeKey, state, onChange }: { typeKey: (typeof RESTRICTION_TYPE_META)[number]["key"] } & Pick<SectionProps, "state" | "onChange">) {
  return (
    <div className="max-w-[720px]">
      <RestrictionTypeFields typeKey={typeKey} value={state.restrictions} onChange={(restrictions) => onChange({ ...state, restrictions })} />
    </div>
  );
}

/** The fields for one section (everything except Review, which the page renders itself). */
export function SectionFields({ id, ...props }: SectionProps & { id: Exclude<SectionId, "review"> }) {
  switch (id) {
    case "basics":
      return <BasicsSection {...props} />;
    case "owner":
      return <OwnerSection {...props} />;
    case "extent":
      return <ExtentSection {...props} />;
    case "method":
      return props.version === 2 ? <MethodSectionV2 {...props} /> : <MethodSection {...props} />;
    case "restrictions":
      return <RestrictionsSection {...props} />;
    default:
      return <RestrictionTypeSection typeKey={id} state={props.state} onChange={props.onChange} />;
  }
}
