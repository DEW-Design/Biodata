"use client";

import { useState, type ReactNode } from "react";
import type { Key } from "react-aria-components";
import { parseDate } from "@internationalized/date";
import { ArrowLeft, Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { InputDate } from "@/components/base/input/input-date";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { TextArea } from "@/components/base/textarea/textarea";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { AddLocationModal } from "@/app/pages/_shared/dla/add-location-modal";
import {
  dlaLevel3Projects,
  dlaLevelMeta,
  dlaLocationMethodLabel,
  emptyDlaDraft,
  errorTab,
  formatShortDate,
  validateDla,
  type Dla,
  type DlaDraft,
  type DlaErrors,
  type DlaFormTab,
  type DlaLocation,
} from "@/app/pages/_shared/dla/dla-data";

// The DLA record form (wireframe "Data Licence Agreement Request", Figma
// YMproGZfrFB5jUqPHPxMhk node 33:43259), re-shaped to fit the shell the same way DSA's own form
// was - see CONTEXT.md, "Data Licencing Agreement (DLA)". The wireframe's own numbered-circle
// stepper (1 Location & License -> 2 Details & Purpose -> 3 Review & Submit) is rebuilt as the
// same Tabs-with-error-count pattern DSA's form already established, not a bespoke stepper
// component, for consistency across this codebase's forms.
//
// No "Save draft" - unlike DSA, the wireframe's own form has no draft action anywhere in it, it
// goes straight from Review & Submit to a submitted request (see dla-store.ts's own comment).

function FormRow({ title, description, required, error, children }: { title: string; description?: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 border-b border-secondary py-6 first:pt-0 last:border-b-0 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-primary">
          {title}
          {required && <span className="text-brand-tertiary"> *</span>}
        </p>
        {description && <p className="text-sm text-balance text-tertiary">{description}</p>}
      </div>
      <div className="flex max-w-[720px] flex-col gap-4">
        {children}
        {error && <p className="text-sm text-error-primary">{error}</p>}
      </div>
    </div>
  );
}

function LocationEditor({ location, error, onChange, onRemove }: { location: DlaLocation; error?: string; onChange: (patch: Partial<DlaLocation>) => void; onRemove: () => void }) {
  const toggleProject = (id: string, checked: boolean) => {
    onChange({ projectIds: checked ? [...location.projectIds, id] : location.projectIds.filter((p) => p !== id) });
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-secondary bg-secondary p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-quaternary">{dlaLocationMethodLabel(location)}</span>
          <span className="text-sm font-semibold text-primary">{location.name}</span>
        </div>
        <Button color="link-destructive" size="sm" iconLeading={Trash01} onPress={onRemove}>
          Remove
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Choose the appropriate data access level</p>
        <RadioGroup size="sm" value={location.level} onChange={(v) => onChange({ level: v as DlaLocation["level"] })} aria-label={`License category for ${location.name}`}>
          {(Object.keys(dlaLevelMeta) as (keyof typeof dlaLevelMeta)[]).map((key) => (
            <RadioButton key={key} value={key} label={dlaLevelMeta[key].label} hint={dlaLevelMeta[key].description} />
          ))}
        </RadioGroup>
      </div>

      {location.level === "level3" && (
        <div className="flex flex-col gap-2 border-t border-primary pt-4">
          <p id={`${location.id}-level3-projects`} className="text-sm font-medium text-primary">
            Select Projects for Level 3 Access *
          </p>
          <div role="group" aria-labelledby={`${location.id}-level3-projects`} className="flex flex-col gap-2">
            {dlaLevel3Projects.map((project) => (
              <Checkbox
                key={project.id}
                label={project.name}
                isSelected={location.projectIds.includes(project.id)}
                onChange={(checked) => toggleProject(project.id, checked)}
              />
            ))}
          </div>
          {error && <p className="text-sm text-error-primary">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function DlaForm({ onBack, onSubmit, renewFrom }: { onBack: () => void; onSubmit: (draft: DlaDraft) => void; renewFrom?: Dla }) {
  const [draft, setDraft] = useState<DlaDraft>(() => {
    if (!renewFrom) return emptyDlaDraft();
    const { locations, purpose, requestPeriodFrom, requestPeriodTo, requestor } = renewFrom;
    return { ...emptyDlaDraft(), locations: structuredClone(locations), purpose, requestPeriodFrom, requestPeriodTo, requestor: structuredClone(requestor) };
  });
  const [tab, setTab] = useState<Key>("locations");
  const [attempted, setAttempted] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsAttempted, setTermsAttempted] = useState(false);

  const errors: DlaErrors = attempted ? validateDla(draft) : {};
  const errorCount = Object.keys(errors).length + (termsAttempted && !agreedToTerms ? 1 : 0);
  const tabErrors: Record<DlaFormTab, number> = { locations: 0, details: 0, review: 0 };
  for (const path of Object.keys(errors)) tabErrors[errorTab(path)] += 1;

  const update = (patch: Partial<DlaDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const updateLocation = (id: string, patch: Partial<DlaLocation>) => update({ locations: draft.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const removeLocation = (id: string) => update({ locations: draft.locations.filter((l) => l.id !== id) });

  const goBack = () => (dirty ? setConfirmBack(true) : onBack());

  const submit = () => {
    setAttempted(true);
    setTermsAttempted(true);
    const found = validateDla(draft);
    const first = Object.keys(found)[0];
    if (first) {
      setTab(errorTab(first));
      return;
    }
    if (!agreedToTerms) {
      setTab("review");
      return;
    }
    onSubmit(draft);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 px-6 pt-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <SectionHeader.Heading>{renewFrom ? `Renew ${renewFrom.id}` : "Data Licence Agreement Request"}</SectionHeader.Heading>
            <SectionHeader.Subheading>Fields marked * are required to submit.</SectionHeader.Subheading>
          </div>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <Tabs selectedKey={tab} onSelectionChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-6 pt-4">
          <TabList aria-label="Request sections" type="underline" size="sm" className="w-full">
            <Tab id="locations" label="Location & License" badge={attempted && tabErrors.locations ? tabErrors.locations : undefined} />
            <Tab id="details" label="Details & Purpose" badge={attempted && tabErrors.details ? tabErrors.details : undefined} />
            <Tab id="review" label="Review & Submit" />
          </TabList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <TabPanel id="locations">
            <FormRow title="Data Locations & License Categories" required description="Add locations and specify an access level for each." error={errors.locations}>
              <div className="flex flex-col gap-4">
                {draft.locations.map((location) => (
                  <LocationEditor
                    key={location.id}
                    location={location}
                    error={errors[`locations.${location.id}.projectIds`]}
                    onChange={(patch) => updateLocation(location.id, patch)}
                    onRemove={() => removeLocation(location.id)}
                  />
                ))}
              </div>
              <div>
                <Button color="secondary" size="md" iconLeading={Plus} onPress={() => setAddLocationOpen(true)}>
                  Add Location
                </Button>
              </div>
            </FormRow>
          </TabPanel>

          <TabPanel id="details">
            <FormRow title="Purpose of Data Use" required description="Explain how you plan to use this data." error={errors.purpose}>
              <TextArea
                label="Describe your intended use"
                hideRequiredIndicator
                isRequired
                isInvalid={!!errors.purpose}
                rows={4}
                placeholder="Describe how this data supports your research or decision-making. E.g. monitoring biodiversity health, assessing threatened species distribution, etc"
                value={draft.purpose}
                onChange={(v) => update({ purpose: v })}
              />
            </FormRow>
            <FormRow title="Agreement Period" required description="When do you need access to the data?">
              <div className="grid gap-4 sm:grid-cols-2">
                <InputDate
                  label="Start Date"
                  isRequired
                  value={draft.requestPeriodFrom ? parseDate(draft.requestPeriodFrom) : null}
                  onChange={(v) => update({ requestPeriodFrom: v ? v.toString() : "" })}
                  isInvalid={!!errors.requestPeriodFrom}
                  hint={errors.requestPeriodFrom}
                />
                <InputDate
                  label="End Date"
                  isRequired
                  value={draft.requestPeriodTo ? parseDate(draft.requestPeriodTo) : null}
                  onChange={(v) => update({ requestPeriodTo: v ? v.toString() : "" })}
                  isInvalid={!!errors.requestPeriodTo}
                  hint={errors.requestPeriodTo}
                />
              </div>
            </FormRow>
            <FormRow title="Your Information" required description="Tell us about yourself and your organisation.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="First Name"
                  isRequired
                  value={draft.requestor.firstName}
                  onChange={(v) => update({ requestor: { ...draft.requestor, firstName: v } })}
                  isInvalid={!!errors["requestor.firstName"]}
                  hint={errors["requestor.firstName"]}
                />
                <Input
                  label="Last Name"
                  isRequired
                  value={draft.requestor.lastName}
                  onChange={(v) => update({ requestor: { ...draft.requestor, lastName: v } })}
                  isInvalid={!!errors["requestor.lastName"]}
                  hint={errors["requestor.lastName"]}
                />
                <Input
                  label="Organisation"
                  isRequired
                  className="sm:col-span-2"
                  value={draft.requestor.organisation}
                  onChange={(v) => update({ requestor: { ...draft.requestor, organisation: v } })}
                  isInvalid={!!errors["requestor.organisation"]}
                  hint={errors["requestor.organisation"]}
                />
                <Input
                  label="Email"
                  isRequired
                  type="email"
                  value={draft.requestor.email}
                  onChange={(v) => update({ requestor: { ...draft.requestor, email: v } })}
                  isInvalid={!!errors["requestor.email"]}
                  hint={errors["requestor.email"]}
                />
                <Input label="Contact No." value={draft.requestor.phone} onChange={(v) => update({ requestor: { ...draft.requestor, phone: v } })} />
              </div>
            </FormRow>
          </TabPanel>

          <TabPanel id="review">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-primary">Data Locations &amp; License Categories</p>
                <div className="flex flex-col gap-4 rounded-lg border border-secondary bg-secondary p-4">
                  {draft.locations.length === 0 ? (
                    <p className="text-sm text-quaternary">No locations added yet.</p>
                  ) : (
                    draft.locations.map((location, index) => (
                      <div key={location.id} className={index > 0 ? "border-t border-primary pt-3" : undefined}>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-quaternary">{index + 1}.</span>
                          <span className="text-xs font-medium text-quaternary">{dlaLocationMethodLabel(location)}</span>
                        </div>
                        <p className="pl-5 text-sm font-medium text-primary">{location.name}</p>
                        <div className="pl-5">
                          <span className="text-xs font-medium text-quaternary">License Category</span>
                          <p className="text-sm text-secondary">{dlaLevelMeta[location.level].label}</p>
                        </div>
                        {location.level === "level3" && location.projectIds.length > 0 && (
                          <div className="pl-5">
                            <span className="text-xs font-medium text-quaternary">Projects for Level 3 Access</span>
                            <p className="text-sm text-secondary">{location.projectIds.map((id) => dlaLevel3Projects.find((p) => p.id === id)?.name ?? id).join(", ")}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-primary">Details &amp; Purpose</p>
                <div className="flex flex-col gap-3 rounded-lg border border-secondary bg-secondary p-4">
                  <div>
                    <span className="text-xs font-medium text-quaternary">Intended use of Data</span>
                    <p className="text-sm text-secondary">{draft.purpose || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-quaternary">Agreement Period</span>
                    <p className="text-sm text-secondary">
                      {draft.requestPeriodFrom && draft.requestPeriodTo ? `${formatShortDate(draft.requestPeriodFrom)} to ${formatShortDate(draft.requestPeriodTo)}` : "Not set"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-quaternary">Data Requestor</span>
                    <p className="text-sm text-secondary">
                      {[draft.requestor.firstName, draft.requestor.lastName].filter(Boolean).join(" ") || "Not provided"}
                      {draft.requestor.organisation ? ` · ${draft.requestor.organisation}` : ""}
                    </p>
                    <p className="text-sm text-tertiary">{draft.requestor.email || "Not provided"}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-secondary pt-4">
                <p className="text-sm font-semibold text-primary">Terms and Conditions</p>
                <p className="text-sm text-balance text-tertiary">
                  Before submitting your request, please review our Terms of Use and Privacy Notice to understand how you can use BioData SA and how your information will be
                  handled. By submitting this request, you agree to use the data solely for the stated purpose and in compliance with all applicable regulations and ethical
                  guidelines.
                </p>
                <Checkbox
                  label="I agree to the Terms of Use and acknowledge that I've read and understood the Privacy Notice"
                  isSelected={agreedToTerms}
                  onChange={setAgreedToTerms}
                />
                {termsAttempted && !agreedToTerms && <p className="text-sm text-error-primary">You must agree before submitting.</p>}
              </div>
            </div>
          </TabPanel>
        </div>
      </Tabs>

      {/* pr-20 keeps Submit clear of the RoleSwitcher FAB, which is pinned bottom-right on every /pages screen. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-secondary bg-primary py-4 pr-20 pl-6">
        <Button color="link-gray" iconLeading={ArrowLeft} onPress={goBack}>
          Back
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          {(attempted || termsAttempted) && errorCount > 0 && (
            <p className="text-sm text-error-primary">
              {errorCount} {errorCount === 1 ? "field needs" : "fields need"} attention
            </p>
          )}
          <Button color="primary" onPress={submit}>
            Submit
          </Button>
        </div>
      </div>

      <AddLocationModal isOpen={addLocationOpen} onOpenChange={setAddLocationOpen} onAdd={(location) => update({ locations: [...draft.locations, location] })} />

      <ConfirmationModal
        isOpen={confirmBack}
        onOpenChange={setConfirmBack}
        title="Discard your request?"
        description="You have unsaved changes to this request. Going back will lose them."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirmBack(false);
          onBack();
        }}
      />
    </div>
  );
}
