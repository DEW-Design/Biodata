"use client";

import { useState, type Key } from "react";
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
import { COLLECTION_METHOD_OPTIONS, FOCUS_AREA_OPTIONS, PERMIT_TYPE_OPTIONS, REGISTRATION_SPECIES, ROLE_OF_WORK_OPTIONS } from "../data";
import { GeoExtentPicker } from "../geo-extent-picker";
import { LogoUpload } from "../logo-upload";
import { ManagerCard } from "../step-1-project-details";
import { RESTRICTION_TYPE_META, RestrictionTypeFields } from "../step-3-privacy-restrictions";
import { emptyContact, emptyPermitRow, emptyProjectManager, type CollectionMethod, type DataCollectionState, type ProjectDetailsState, type ProjectManager, type RestrictionsState } from "../types";
import type { FormState, SectionId } from "./sections";

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

function BasicsSection({ state, onChange, showErrors }: SectionProps) {
  const { patchDetails } = useSectionPatches(state, onChange);
  const d = state.details;
  const [showFullTitle, setShowFullTitle] = useState(!d.sameAsShortTitle);

  return (
    <>
      <FormRow title="Project name" required description="A short, user-facing name people see first.">
        <Input
          aria-label="Project name"
          isRequired
          placeholder="E.g., Biodiversity Monitoring of the Coorong Wetlands 2025"
          value={d.shortTitle}
          onChange={(v) => patchDetails({ shortTitle: v })}
          isInvalid={showErrors && !d.shortTitle.trim()}
          hint={showErrors && !d.shortTitle.trim() ? "Enter a project name" : undefined}
        />
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
      </FormRow>
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

function OwnerSection({ state, onChange, showErrors }: SectionProps) {
  const { patchDetails } = useSectionPatches(state, onChange);
  const d = state.details;
  const contact = d.dataOwnerContacts[0];
  const updateContact = (id: number, p: Partial<typeof contact>) => patchDetails({ dataOwnerContacts: d.dataOwnerContacts.map((c) => (c.id === id ? { ...c, ...p } : c)) });
  const addContact = () => patchDetails({ dataOwnerContacts: [...d.dataOwnerContacts, emptyContact(Math.max(0, ...d.dataOwnerContacts.map((c) => c.id)) + 1)] });
  const missing = (v: string) => showErrors && !v.trim();

  return (
    <>
      <FormRow title="Data owner" required description="The organisation or person responsible for this project's data.">
        <RadioGroup
          aria-label="Data owner type"
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

function TeamSection({ state, onChange, showErrors }: SectionProps) {
  const { patchDetails } = useSectionPatches(state, onChange);
  const d = state.details;
  const updateManager = (id: number, p: Partial<ProjectManager>) => patchDetails({ projectManagers: d.projectManagers.map((m) => (m.id === id ? { ...m, ...p } : m)) });
  const removeManager = (id: number) => {
    const removingPrimary = d.projectManagers.find((m) => m.id === id)?.isPrimary;
    const remaining = d.projectManagers.filter((m) => m.id !== id);
    patchDetails({ projectManagers: removingPrimary && remaining.length ? remaining.map((m, i) => (i === 0 ? { ...m, isPrimary: true } : m)) : remaining });
  };
  const roleMissing = showErrors && (!d.roleOfWork || (d.roleOfWork === "other" && !d.roleOfWorkOther.trim()));
  const managersMissing = showErrors && !d.projectManagers.some((m) => m.firstName.trim() && m.lastName.trim() && m.email.trim());

  return (
    <>
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

function ExtentSection({ state, onChange, showErrors }: SectionProps) {
  const { patchCollection } = useSectionPatches(state, onChange);
  const c = state.collection;
  const toggleFocusArea = (id: string, on: boolean) => {
    if (id === "biological") return; // always included
    patchCollection({ focusAreas: on ? [...c.focusAreas, id] : c.focusAreas.filter((f) => f !== id), focusAreaOther: id === "other" && !on ? "" : c.focusAreaOther });
  };
  const extentMissing = showErrors && !(c.geographicExtent.method && (c.geographicExtent.boundary || c.geographicExtent.parkId || c.geographicExtent.shapefileName));
  const otherMissing = showErrors && c.focusAreas.includes("other") && !c.focusAreaOther.trim();

  return (
    <>
      <FormRow title="Geographic extent" required description="The area this project's data collection covers." error={extentMissing ? "Define the geographic extent" : undefined}>
        <GeoExtentPicker value={c.geographicExtent} onChange={(geographicExtent) => patchCollection({ geographicExtent })} />
      </FormRow>
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
    </>
  );
}

function OptionalMethodDetails({ state, onChange }: Pick<SectionProps, "state" | "onChange">) {
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
        {
          id: "limitations",
          title: "Limitations and biases",
          content: (
            <TextArea aria-label="Limitations and biases" rows={3} placeholder="Only targeted native species and weeds were excluded" hint="What biases were used with the methodology used." value={c.limitationsAndBiases} onChange={(v) => patchCollection({ limitationsAndBiases: v })} />
          ),
        },
      ]}
    />
  );
}

function MethodSection({ state, onChange, showErrors }: SectionProps) {
  const { patchCollection } = useSectionPatches(state, onChange);
  const c = state.collection;

  return (
    <>
      <FormRow title="Method of data collection" required description="Pick the closest match." error={showErrors && !c.collectionMethod ? "Choose a method" : undefined}>
        <RadioGroup aria-label="Method of data collection" value={c.collectionMethod ?? ""} onChange={(v) => patchCollection({ collectionMethod: v as CollectionMethod })}>
          {COLLECTION_METHOD_OPTIONS.map((option) => (
            <RadioButton key={option.id} value={option.id} label={option.label} hint={option.description} />
          ))}
        </RadioGroup>
      </FormRow>
      <FormRow title="Method details" required description="Survey techniques, whether qualitative or quantitative.">
        <TextArea
          aria-label="Method details"
          isRequired
          rows={4}
          placeholder="Provide details of your survey methods such as qualitative or quantitative techniques."
          value={c.methodDetails}
          onChange={(v) => patchCollection({ methodDetails: v })}
          isInvalid={showErrors && !c.methodDetails.trim()}
          hint={showErrors && !c.methodDetails.trim() ? "Describe the survey method" : undefined}
        />
      </FormRow>
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
          {RESTRICTION_TYPE_META.map(({ key, title, description }) => (
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
    case "team":
      return <TeamSection {...props} />;
    case "extent":
      return <ExtentSection {...props} />;
    case "method":
      return <MethodSection {...props} />;
    case "restrictions":
      return <RestrictionsSection {...props} />;
    default:
      return <RestrictionTypeSection typeKey={id} state={props.state} onChange={props.onChange} />;
  }
}
