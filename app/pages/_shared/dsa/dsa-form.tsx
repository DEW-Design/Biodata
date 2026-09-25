"use client";

import { useState, type Key as ReactKey } from "react";
import type { Key, Selection } from "react-aria-components";
import { parseDate } from "@internationalized/date";
import { Eye, EyeOff, Plus, RefreshCcw01, Trash01 } from "@untitledui/icons";
import { Accordion, type AccordionItemType } from "@/components/base/accordion/accordion";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { InputDate } from "@/components/base/input/input-date";
import { InputFile } from "@/components/base/input/input-file";
import { MultiSelect } from "@/components/base/select/multi-select";
import { TextArea } from "@/components/base/textarea/textarea";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormSectionList, FormSidebar, deriveSectionStatus } from "@/app/pages/_shared/form-section-list";
import { FormRow } from "@/app/pages/_shared/form-row";
import { ConfirmationModal, DestructiveModal } from "@/components/application/modals/modal";
import {
  dsaScopeOptions,
  dsaStatusMeta,
  emptyDsaDraft,
  emptyDsaSystem,
  errorTab,
  mockToken,
  validateDsa,
  type Dsa,
  type DsaContact,
  type DsaDraft,
  type DsaErrors,
  type DsaFormTab,
  type DsaScope,
  type DsaSystem,
} from "@/app/pages/_shared/dsa/dsa-data";

// The DSA record form (lo-fi frame "Data Sharing Agreement (DSA) Record", Figma node 3:15268),
// re-shaped to fit the shell. The lo-fi is one flat scroll of ~8 field groups plus a repeatable
// system block - exactly the overload CONTEXT.md's cognitive-load principles call out - so it is
// tiered into three sections (listed in column 2) by what belongs together: Agreement (who, why, when, the signed PDF),
// Contacts (requester and DEW custodian), Data sharing (offline and/or system integrations). The
// system block only exists once "System" is ticked, as in the lo-fi, and each system is its own
// boxed accordion item instead of a stack of always-open cards.
//
// Gap, logged in CONTEXT.md:
// - "Upload Agreement" is a drag-and-drop zone in the lo-fi; the real `InputFile` (button + file
//   name) does the same job with the same accepted types, so it stands in for the dropzone.

const MAX_FILE_BYTES = 5 * 1024 * 1024;

type Attempt = null | "draft" | "submit";

// One lo-fi row: the group's name on the left, its fields on the right. Stacks below `lg`.
function ContactFields({
  prefix,
  value,
  onChange,
  errors,
  isPhoneOptional = true,
}: {
  prefix: string;
  value: DsaContact;
  onChange: (patch: Partial<DsaContact>) => void;
  errors: DsaErrors;
  isPhoneOptional?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="First name" isRequired value={value.firstName} onChange={(v) => onChange({ firstName: v })} isInvalid={!!errors[`${prefix}.firstName`]} hint={errors[`${prefix}.firstName`]} />
      <Input label="Last name" isRequired value={value.lastName} onChange={(v) => onChange({ lastName: v })} isInvalid={!!errors[`${prefix}.lastName`]} hint={errors[`${prefix}.lastName`]} />
      <Input label="Email" type="email" isRequired value={value.email} onChange={(v) => onChange({ email: v })} isInvalid={!!errors[`${prefix}.email`]} hint={errors[`${prefix}.email`]} />
      <Input
        label="Contact no."
        type="tel"
        isRequired={!isPhoneOptional}
        value={value.phone}
        onChange={(v) => onChange({ phone: v })}
        isInvalid={!!errors[`${prefix}.phone`]}
        hint={errors[`${prefix}.phone`]}
      />
    </div>
  );
}

// Tokens are secrets: masked until asked for, per system. "Re-generate" is confirmed by the parent
// because it invalidates whatever the receiving system is already using.
function TokenBlock({ system, onRegenerate }: { system: DsaSystem; onRegenerate: () => void }) {
  const [shown, setShown] = useState(false);
  const mask = "•".repeat(48);

  return (
    <div className="flex flex-col gap-3 border-t border-secondary pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { label: "System token", value: system.accessToken },
          { label: "Refresh token", value: system.refreshToken },
        ].map((token) => (
          <div key={token.label} className="flex min-w-0 flex-col gap-1.5">
            <p className="text-sm font-medium text-secondary">{token.label}</p>
            <p className="text-sm break-all text-tertiary">{shown ? token.value : mask}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" color="secondary" iconLeading={RefreshCcw01} onPress={onRegenerate}>
          Re-generate tokens
        </Button>
        <Button size="sm" color="link-gray" iconLeading={shown ? EyeOff : Eye} onPress={() => setShown((s) => !s)}>
          {shown ? "Hide tokens" : "Show tokens"}
        </Button>
      </div>
    </div>
  );
}

function SystemFields({
  system,
  errors,
  onChange,
  onRemove,
  onRegenerate,
}: {
  system: DsaSystem;
  errors: DsaErrors;
  onChange: (patch: Partial<DsaSystem>) => void;
  onRemove: () => void;
  onRegenerate: () => void;
}) {
  const key = `systems.${system.id}`;
  const scopeError = errors[`${key}.scopes`];

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="System / application name"
        isRequired
        placeholder="Enter system or application name"
        value={system.name}
        onChange={(v) => onChange({ name: v })}
        isInvalid={!!errors[`${key}.name`]}
        hint={errors[`${key}.name`]}
      />
      <Input
        label="Redirect URL"
        isRequired
        placeholder="https://"
        value={system.redirectUrl}
        onChange={(v) => onChange({ redirectUrl: v })}
        isInvalid={!!errors[`${key}.redirectUrl`]}
        hint={errors[`${key}.redirectUrl`]}
      />
      <MultiSelect
        label="Scope and permissions request"
        isRequired
        placeholder="Select a scope"
        items={dsaScopeOptions}
        selectedKeys={new Set<Key>(system.scopes)}
        onSelectionChange={(keys: Selection) => onChange({ scopes: keys === "all" ? dsaScopeOptions.map((o) => o.id) : (Array.from(keys) as DsaScope[]) })}
        onReset={() => onChange({ scopes: [] })}
        onSelectAll={() => onChange({ scopes: dsaScopeOptions.map((o) => o.id) })}
        showSearch={false}
        isInvalid={!!scopeError}
        hint={scopeError}
      >
        {(item) => <MultiSelect.Item {...item} selectionIndicator="checkbox" selectionIndicatorAlign="left" />}
      </MultiSelect>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-secondary">Permissions</p>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <Checkbox label="Read data" isSelected={system.canRead} onChange={(v) => onChange({ canRead: v })} />
          <Checkbox label="Write data" isSelected={system.canWrite} onChange={(v) => onChange({ canWrite: v })} />
        </div>
        {errors[`${key}.permissions`] && <p className="text-sm text-error-primary">{errors[`${key}.permissions`]}</p>}
      </div>

      <div className="flex flex-col gap-4 border-t border-secondary pt-4">
        <p className="text-sm font-semibold text-primary">Organisation / institution details</p>
        <Input
          label="Organisation / institution name"
          isRequired
          value={system.org.name}
          onChange={(v) => onChange({ org: { ...system.org, name: v } })}
          isInvalid={!!errors[`${key}.org.name`]}
          hint={errors[`${key}.org.name`]}
        />
        <ContactFields prefix={`${key}.org`} value={system.org} onChange={(patch) => onChange({ org: { ...system.org, ...patch } })} errors={errors} />
      </div>

      <TokenBlock system={system} onRegenerate={onRegenerate} />

      <div className="flex justify-end border-t border-secondary pt-4">
        <Button size="sm" color="link-destructive" iconLeading={Trash01} onPress={onRemove}>
          Remove system
        </Button>
      </div>
    </div>
  );
}

const DSA_TABS = ["agreement", "contacts", "sharing"] as const;

const DSA_SECTIONS: Record<DsaFormTab, { title: string; description: string }> = {
  agreement: { title: "Agreement", description: "Who the agreement is with, why, for how long, and the signed file." },
  contacts: { title: "Contacts", description: "Who asked for the agreement and which DEW officer is responsible for it." },
  sharing: { title: "Data sharing", description: "How the data is shared, and the systems that connect through the API." },
};

export function DsaForm({
  initial,
  onBack,
  onSaveDraft,
  onSubmit,
}: {
  /** The agreement being edited - omit for a new one. */
  initial?: Dsa;
  onBack: () => void;
  onSaveDraft: (draft: DsaDraft) => void;
  onSubmit: (draft: DsaDraft) => void;
}) {
  const [draft, setDraft] = useState<DsaDraft>(() => {
    if (!initial) return emptyDsaDraft();
    const { partner, purpose, validFrom, validTo, agreementFile, requestedBy, custodian, sharedOffline, sharedViaSystem, systems, rejectionReason } = initial;
    return structuredClone({ partner, purpose, validFrom, validTo, agreementFile, requestedBy, custodian, sharedOffline, sharedViaSystem, systems, rejectionReason });
  });
  const [tab, setTab] = useState<DsaFormTab>("agreement");
  const [visited, setVisited] = useState<Set<DsaFormTab>>(new Set());
  // Sections the person tried to leave with something missing, and whether they pressed Submit. A
  // section they have not reached yet is never marked or counted: nothing is validated ahead of them.
  const [blocked, setBlocked] = useState<Set<DsaFormTab>>(new Set());
  const [submitPressed, setSubmitPressed] = useState(false);
  const goTo = (next: DsaFormTab) => {
    setVisited((v) => new Set(v).add(tab));
    setTab(next);
  };
  const [attempt, setAttempt] = useState<Attempt>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);
  const [regenerateId, setRegenerateId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [openSystems, setOpenSystems] = useState<Set<ReactKey>>(() => new Set(initial?.systems[0] ? [initial.systems[0].id] : []));
  const [fileError, setFileError] = useState<string | undefined>();

  const isEditingLive = !!initial && initial.status !== "draft";
  const tabIndex = Math.max(0, DSA_TABS.indexOf(tab as (typeof DSA_TABS)[number]));
  const isLastTab = tabIndex === DSA_TABS.length - 1;
  // Inline errors appear only where the person has already tried to move on (or after Submit / Save
  // draft), so arriving at a section they have not reached never shows it in red.
  const rawErrors: DsaErrors = attempt ? validateDsa(draft, attempt) : {};
  const errors: DsaErrors = attempt === "draft" || submitPressed ? rawErrors : (Object.fromEntries(Object.entries(rawErrors).filter(([path]) => blocked.has(errorTab(path)))) as DsaErrors);
  const tabErrors: Record<DsaFormTab, number> = { agreement: 0, contacts: 0, sharing: 0 };
  for (const path of Object.keys(errors)) tabErrors[errorTab(path)] += 1;

  const update = (patch: Partial<DsaDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };
  const updateSystem = (id: string, patch: Partial<DsaSystem>) => update({ systems: draft.systems.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const addSystem = () => {
    const system = emptyDsaSystem(draft.partner);
    update({ systems: [...draft.systems, system] });
    setOpenSystems((open) => new Set([...open, system.id]));
  };

  const toggleSystemMethod = (on: boolean) => {
    const seed = on && draft.systems.length === 0 ? emptyDsaSystem(draft.partner) : null;
    update({ sharedViaSystem: on, systems: seed ? [seed] : draft.systems });
    if (seed) setOpenSystems(new Set([seed.id]));
  };

  const goBack = () => (dirty ? setConfirmBack(true) : onBack());

  const submit = () => {
    setAttempt("submit");
    setSubmitPressed(true);
    const found = validateDsa(draft, "submit");
    const first = Object.keys(found)[0];
    if (first) {
      setTab(errorTab(first));
      return;
    }
    onSubmit(draft);
  };

  const saveDraft = () => {
    setAttempt("draft");
    if (Object.keys(validateDsa(draft, "draft")).length) {
      setTab("agreement");
      return;
    }
    onSaveDraft(draft);
  };

  const systemItems: AccordionItemType[] = draft.systems.map((system, index) => ({
    id: system.id,
    title: (
      <span className="flex flex-wrap items-center gap-2">
        {system.name.trim() || `System ${index + 1}`}
        {Object.keys(errors).some((path) => path.startsWith(`systems.${system.id}.`)) && (
          <Badge size="sm" color="error">
            Needs attention
          </Badge>
        )}
      </span>
    ),
    content: (
      <SystemFields
        system={system}
        errors={errors}
        onChange={(patch) => updateSystem(system.id, patch)}
        onRemove={() => setRemoveId(system.id)}
        onRegenerate={() => setRegenerateId(system.id)}
      />
    ),
  }));

  // Column 2's section list: a section is complete once visited with nothing missing, and turns red only
  // after a submit attempt found something wrong in it.
  const sectionProblems: Record<DsaFormTab, number> = { agreement: 0, contacts: 0, sharing: 0 };
  for (const path of Object.keys(validateDsa(draft, "submit"))) sectionProblems[errorTab(path)] += 1;
  // Mandatory details missing from the section being viewed. Continue (and jumping ahead through
  // column 2) will not move on while any are missing: the inline errors switch on and the
  // "Details missing" alert lists them. Going back is always free.
  const allProblems = Object.entries(validateDsa(draft, "submit"));
  const currentProblems = [...new Set(allProblems.filter(([path]) => errorTab(path) === tab).map(([, message]) => message))];
  const otherProblemCount = allProblems.length - allProblems.filter(([path]) => errorTab(path) === tab).length;
  const proceed = (next: DsaFormTab) => {
    if (DSA_TABS.indexOf(next) > tabIndex && currentProblems.length > 0) {
      setAttempt("submit");
      setBlocked((b) => new Set(b).add(tab));
      return;
    }
    goTo(next);
  };
  const sectionItems = DSA_TABS.map((id) => ({
    id,
    title: DSA_SECTIONS[id].title,
    status: deriveSectionStatus({ isCurrent: id === tab, isValid: sectionProblems[id] === 0, visited: visited.has(id), attempted: submitPressed || blocked.has(id) }),
    detail: (submitPressed || blocked.has(id)) && sectionProblems[id] > 0 && id !== tab ? `${sectionProblems[id]} to fix` : undefined,
  }));

  const title = initial ? (isEditingLive ? `Edit ${initial.id}` : `Edit draft ${initial.id}`) : "New agreement";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FormSidebar>
        <FormSectionList
          heading="Data sharing agreement"
          groups={[{ sections: sectionItems }]}
          progress={{ done: sectionItems.filter((i) => i.status === "complete").length, total: DSA_TABS.length }}
          onSelect={(id) => proceed(id as DsaFormTab)}
        />
      </FormSidebar>

        <FormPage
          eyebrow={`${title} - Step ${tabIndex + 1} of ${DSA_TABS.length}`}
          title={DSA_SECTIONS[tab].title}
          badge={
            initial && (
              <Badge size="md" color={dsaStatusMeta[initial.status].badgeColor}>
                {dsaStatusMeta[initial.status].label}
              </Badge>
            )
          }
          subtitle={`${DSA_SECTIONS[tab].description} Fields marked * are required to submit; a draft only needs the institution or organisation.`}
          onCancel={goBack}
          onSaveDraft={isEditingLive ? undefined : saveDraft}
          onBack={tabIndex > 0 ? () => goTo(DSA_TABS[tabIndex - 1]) : undefined}
          problems={attempt === "submit" && currentProblems.length > 0 ? { items: currentProblems, extra: submitPressed && otherProblemCount > 0 ? `${otherProblemCount} more to fix in other sections.` : undefined } : undefined}
          primaryLabel={isLastTab ? (isEditingLive ? "Save changes" : "Submit") : "Continue"}
          primaryIsContinue={!isLastTab}
          onPrimary={isLastTab ? submit : () => proceed(DSA_TABS[tabIndex + 1])}
        >
          {tab === "agreement" && (
<>
            <FormRow title="Data partnership with">
              <Input
                label="Institution / organisation"
                isRequired
                value={draft.partner}
                onChange={(v) => update({ partner: v })}
                isInvalid={!!errors.partner}
                hint={errors.partner}
              />
            </FormRow>
            <FormRow title="Purpose of data sharing" required>
              <TextArea
                label="Purpose"
                hideRequiredIndicator
                hint={errors.purpose ?? "Briefly describe how the data will be used and what outcomes are expected."}
                isRequired
                isInvalid={!!errors.purpose}
                rows={3}
                value={draft.purpose}
                onChange={(v) => update({ purpose: v })}
              />
            </FormRow>
            <FormRow title="Agreement period" required>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputDate
                  label="Valid from"
                  isRequired
                  value={draft.validFrom ? parseDate(draft.validFrom) : null}
                  onChange={(v) => update({ validFrom: v ? v.toString() : "" })}
                  isInvalid={!!errors.validFrom}
                  hint={errors.validFrom}
                />
                <InputDate
                  label="Valid to"
                  isRequired
                  value={draft.validTo ? parseDate(draft.validTo) : null}
                  onChange={(v) => update({ validTo: v ? v.toString() : "" })}
                  isInvalid={!!errors.validTo}
                  hint={errors.validTo}
                />
              </div>
            </FormRow>
            <FormRow title="Upload agreement" required>
              <InputFile
                label="Signed agreement"
                isRequired
                acceptedFileTypes={["application/pdf"]}
                placeholder={draft.agreementFile?.name ?? "Choose a PDF"}
                buttonText="Upload"
                hint="PDF only, 5 MB max."
                isInvalid={!!(errors.agreementFile || fileError)}
                onChange={(files) => {
                  const file = files?.[0];
                  if (!file) return;
                  if (file.type !== "application/pdf") return setFileError("Only PDF files are accepted");
                  if (file.size > MAX_FILE_BYTES) return setFileError("The file is larger than 5 MB");
                  setFileError(undefined);
                  update({ agreementFile: { name: file.name } });
                }}
              />
              {(fileError || errors.agreementFile) && <p className="text-sm text-error-primary">{fileError ?? errors.agreementFile}</p>}
            </FormRow>
          </>
)}

          {tab === "contacts" && (
<>
            <FormRow title="Agreement requested by" description="The person at the partner organisation who asked for the agreement.">
              <ContactFields prefix="requestedBy" value={draft.requestedBy} onChange={(patch) => update({ requestedBy: { ...draft.requestedBy, ...patch } })} errors={errors} />
            </FormRow>
            <FormRow title="Agreement custodian (DEW)" description="The DEW officer responsible for this agreement.">
              <ContactFields prefix="custodian" value={draft.custodian} onChange={(patch) => update({ custodian: { ...draft.custodian, ...patch } })} errors={errors} />
            </FormRow>
          </>
)}

          {tab === "sharing" && (
<>
            <FormRow title="Data shared via" required error={errors.method}>
              <Checkbox label="Offline" hint="Digital copies" isSelected={draft.sharedOffline} onChange={(v) => update({ sharedOffline: v })} />
              <Checkbox label="System" hint="API integrations" isSelected={draft.sharedViaSystem} onChange={toggleSystemMethod} />
            </FormRow>
            {draft.sharedViaSystem && (
              <FormRow title="Systems" description="Each system that connects through the API gets its own credentials." error={errors.systems}>
                <Accordion variant="boxed" items={systemItems} openKeys={openSystems} onOpenKeysChange={setOpenSystems} />
                <div>
                  <Button color="link-color" size="md" iconLeading={Plus} onPress={addSystem}>
                    Add another system
                  </Button>
                </div>
              </FormRow>
            )}
          </>
)}
        </FormPage>

      <ConfirmationModal
        isOpen={confirmBack}
        onOpenChange={setConfirmBack}
        title="Discard your changes?"
        description="You have unsaved changes to this agreement. Going back will lose them."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirmBack(false);
          onBack();
        }}
      />
      <DestructiveModal
        isOpen={regenerateId !== null}
        onOpenChange={(open) => !open && setRegenerateId(null)}
        title="Re-generate tokens?"
        description="The current system and refresh tokens stop working straight away. Share the new ones with the receiving system."
        confirmLabel="Re-generate"
        onConfirm={() => {
          if (regenerateId) updateSystem(regenerateId, { accessToken: mockToken(), refreshToken: mockToken() });
          setRegenerateId(null);
        }}
      />
      <DestructiveModal
        isOpen={removeId !== null}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title="Remove this system?"
        description="Its configuration and credentials are deleted from this agreement."
        confirmLabel="Remove"
        onConfirm={() => {
          if (removeId) update({ systems: draft.systems.filter((s) => s.id !== removeId) });
          setRemoveId(null);
        }}
      />
    </div>
  );
}
