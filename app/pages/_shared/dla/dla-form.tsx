"use client";

import { useState } from "react";
import { parseDate } from "@internationalized/date";
import { Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { InputDate } from "@/components/base/input/input-date";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { TextArea } from "@/components/base/textarea/textarea";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormSectionList, FormSidebar, deriveSectionStatus } from "@/app/pages/_shared/form-section-list";
import { FormRow } from "@/app/pages/_shared/form-row";
import { ConfirmationModal } from "@/components/application/modals/modal";
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

// The DLA record form (wireframe "New request", Figma
// YMproGZfrFB5jUqPHPxMhk node 33:43259), re-shaped to fit the shell the same way DSA's own form
// was - see CONTEXT.md, "Data Licencing Agreement (DLA)". The wireframe's own numbered-circle
// stepper (1 Location & License -> 2 Details & Purpose -> 3 Review & Submit) is rebuilt as the
// shared form pattern (FormPage + a FormSectionList in column 2, CONTRACTS.md 4.1) that every form
// here uses, not a bespoke stepper or tabs.
//
// "Save draft" is real now - the shared DSA/DLA workflow (agreement-status.ts) gave DLA a genuine
// Draft status it didn't have before, so this form gained the same Save Draft/Submit split DSA's
// own form already has, and `initial` (an existing request or draft being edited) alongside the
// pre-existing `renewFrom` (a closed agreement's own fields, pre-filling a brand new request).

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

type Attempt = null | "draft" | "submit";

const DLA_TABS = ["locations", "details", "review"] as const;

const DLA_SECTIONS: Record<DlaFormTab, { title: string; description: string }> = {
  locations: { title: "Location & License", description: "Add the locations you need data for and choose an access level for each." },
  details: { title: "Details & Purpose", description: "Why the data is needed, for how long, and who is asking." },
  review: { title: "Review & Submit", description: "Check the request and agree to the terms before submitting." },
};

export function DlaForm({
  initial,
  onBack,
  onSaveDraft,
  onSubmit,
  renewFrom,
}: {
  /** The request being edited - omit for a new one. */
  initial?: Dla;
  onBack: () => void;
  onSaveDraft: (draft: DlaDraft) => void;
  onSubmit: (draft: DlaDraft) => void;
  renewFrom?: Dla;
}) {
  const [draft, setDraft] = useState<DlaDraft>(() => {
    const source = initial ?? renewFrom;
    if (!source) return emptyDlaDraft();
    const { locations, purpose, requestPeriodFrom, requestPeriodTo, requestor, agreementFile, isCustom, customNote, rejectionReason, validFrom, validTo } = source;
    return initial
      ? structuredClone({ locations, purpose, requestPeriodFrom, requestPeriodTo, requestor, agreementFile, isCustom, customNote, rejectionReason, validFrom, validTo })
      : { ...emptyDlaDraft(), locations: structuredClone(locations), purpose, requestPeriodFrom, requestPeriodTo, requestor: structuredClone(requestor) };
  });
  const [tab, setTab] = useState<DlaFormTab>("locations");
  const [visited, setVisited] = useState<Set<DlaFormTab>>(new Set());
  // Sections the person tried to leave with something missing, and whether they pressed Submit. A
  // section they have not reached yet is never marked or counted: nothing is validated ahead of them.
  const [blocked, setBlocked] = useState<Set<DlaFormTab>>(new Set());
  const [submitPressed, setSubmitPressed] = useState(false);
  const goTo = (next: DlaFormTab) => {
    setVisited((v) => new Set(v).add(tab));
    setTab(next);
  };
  const [attempt, setAttempt] = useState<Attempt>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(() => !!initial && initial.status !== "draft");
  const [termsAttempted, setTermsAttempted] = useState(false);

  const tabIndex = Math.max(0, DLA_TABS.indexOf(tab as (typeof DLA_TABS)[number]));
  const isLastTab = tabIndex === DLA_TABS.length - 1;
  const isEditingLive = !!initial && initial.status !== "draft";
  const requestLabel = renewFrom ? `Renew ${renewFrom.id}` : initial ? (isEditingLive ? `Edit ${initial.id}` : `Edit draft ${initial.id}`) : "New request";
  // Inline errors appear only where the person has already tried to move on (or after Submit / Save
  // draft), so arriving at a section they have not reached never shows it in red.
  const rawErrors: DlaErrors = attempt ? validateDla(draft, attempt) : {};
  const errors: DlaErrors = attempt === "draft" || submitPressed ? rawErrors : (Object.fromEntries(Object.entries(rawErrors).filter(([path]) => blocked.has(errorTab(path)))) as DlaErrors);
  const tabErrors: Record<DlaFormTab, number> = { locations: 0, details: 0, review: 0 };
  for (const path of Object.keys(errors)) tabErrors[errorTab(path)] += 1;

  // Column 2's section list: a section is complete once visited with nothing missing, and turns red only
  // after a submit attempt found something wrong in it. Review is complete once the terms are agreed.
  const sectionProblems: Record<DlaFormTab, number> = { locations: 0, details: 0, review: 0 };
  for (const path of Object.keys(validateDla(draft, "submit"))) sectionProblems[errorTab(path)] += 1;
  if (!agreedToTerms) sectionProblems.review += 1;
  // Mandatory details missing from the section being viewed. Continue (and jumping ahead through
  // column 2) will not move on while any are missing: the inline errors switch on and the
  // "Details missing" alert lists them. Going back is always free.
  const allProblems = Object.entries(validateDla(draft, "submit"));
  const currentProblems = [...new Set(allProblems.filter(([path]) => errorTab(path) === tab).map(([, message]) => message))];
  if (tab === "review" && termsAttempted && !agreedToTerms) currentProblems.push("Agree to the terms");
  const otherProblemCount = allProblems.length - allProblems.filter(([path]) => errorTab(path) === tab).length;
  const proceed = (next: DlaFormTab) => {
    if (DLA_TABS.indexOf(next) > tabIndex && currentProblems.length > 0) {
      setAttempt("submit");
      setBlocked((b) => new Set(b).add(tab));
      return;
    }
    goTo(next);
  };
  const sectionItems = DLA_TABS.map((id) => ({
    id,
    title: DLA_SECTIONS[id].title,
    status: deriveSectionStatus({ isCurrent: id === tab, isValid: sectionProblems[id] === 0, visited: visited.has(id), attempted: submitPressed || blocked.has(id) }),
    detail: (submitPressed || blocked.has(id)) && sectionProblems[id] > 0 && id !== tab ? `${sectionProblems[id]} to fix` : undefined,
  }));

  const update = (patch: Partial<DlaDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const updateLocation = (id: string, patch: Partial<DlaLocation>) => update({ locations: draft.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const removeLocation = (id: string) => update({ locations: draft.locations.filter((l) => l.id !== id) });

  const goBack = () => (dirty ? setConfirmBack(true) : onBack());

  const submit = () => {
    setAttempt("submit");
    setSubmitPressed(true);
    setTermsAttempted(true);
    const found = validateDla(draft, "submit");
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

  const saveDraft = () => {
    setAttempt("draft");
    if (Object.keys(validateDla(draft, "draft")).length) {
      setTab("details");
      return;
    }
    onSaveDraft(draft);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FormSidebar>
        <FormSectionList
          heading="Data licence request"
          groups={[{ sections: sectionItems }]}
          progress={{ done: sectionItems.filter((i) => i.status === "complete").length, total: DLA_TABS.length }}
          onSelect={(id) => proceed(id as DlaFormTab)}
        />
      </FormSidebar>

        <FormPage
          eyebrow={`${requestLabel} - Step ${tabIndex + 1} of ${DLA_TABS.length}`}
          title={DLA_SECTIONS[tab].title}
          subtitle={`${DLA_SECTIONS[tab].description} Fields marked * are required to submit; a draft only needs the requestor's organisation.`}
          onCancel={goBack}
          onSaveDraft={isEditingLive ? undefined : saveDraft}
          onBack={tabIndex > 0 ? () => goTo(DLA_TABS[tabIndex - 1]) : undefined}
          problems={(attempt === "submit" || termsAttempted) && currentProblems.length > 0 ? { items: currentProblems, extra: submitPressed && otherProblemCount > 0 ? `${otherProblemCount} more to fix in other sections.` : undefined } : undefined}
          primaryLabel={isLastTab ? (isEditingLive ? "Save changes" : "Submit") : "Continue"}
          primaryIsContinue={!isLastTab}
          onPrimary={isLastTab ? submit : () => proceed(DLA_TABS[tabIndex + 1])}
        >
          {tab === "locations" && (
<>
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
          </>
)}

          {tab === "details" && (
<>
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
          </>
)}

          {tab === "review" && (
<>
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
          </>
)}
        </FormPage>

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
