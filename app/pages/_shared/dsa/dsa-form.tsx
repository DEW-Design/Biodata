"use client";

import { useState, type Key as ReactKey, type ReactNode } from "react";
import type { Key, Selection } from "react-aria-components";
import { parseDate } from "@internationalized/date";
import { ArrowLeft, Eye, EyeOff, Plus, RefreshCcw01, Trash01 } from "@untitledui/icons";
import { Accordion, type AccordionItemType } from "@/components/base/accordion/accordion";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { InputDate } from "@/components/base/input/input-date";
import { InputFile } from "@/components/base/input/input-file";
import { MultiSelect } from "@/components/base/select/multi-select";
import { TextArea } from "@/components/base/textarea/textarea";
import { ConfirmationModal, DestructiveModal } from "@/components/application/modals/modal";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
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
// tiered into three tabs by what belongs together: Agreement (who, why, when, the signed PDF),
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
    const { partner, purpose, validFrom, validTo, agreementFile, requestedBy, custodian, sharedOffline, sharedViaSystem, systems } = initial;
    return structuredClone({ partner, purpose, validFrom, validTo, agreementFile, requestedBy, custodian, sharedOffline, sharedViaSystem, systems });
  });
  const [tab, setTab] = useState<Key>("agreement");
  const [attempt, setAttempt] = useState<Attempt>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);
  const [regenerateId, setRegenerateId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [openSystems, setOpenSystems] = useState<Set<ReactKey>>(() => new Set(initial?.systems[0] ? [initial.systems[0].id] : []));
  const [fileError, setFileError] = useState<string | undefined>();

  const isEditingLive = !!initial && initial.status !== "draft";
  const errors: DsaErrors = attempt ? validateDsa(draft, attempt) : {};
  const errorCount = Object.keys(errors).length;
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

  const title = initial ? (isEditingLive ? `Edit ${initial.id}` : `Edit draft ${initial.id}`) : "Add New Data Sharing Agreement (DSA) Record";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 px-6 pt-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <SectionHeader.Heading>{title}</SectionHeader.Heading>
              {initial && (
                <Badge size="md" color={dsaStatusMeta[initial.status].badgeColor}>
                  {dsaStatusMeta[initial.status].label}
                </Badge>
              )}
            </div>
            <SectionHeader.Subheading>Fields marked * are required to submit. A draft only needs the institution or organisation.</SectionHeader.Subheading>
          </div>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <Tabs selectedKey={tab} onSelectionChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-6 pt-4">
          <TabList aria-label="Agreement sections" type="underline" size="sm" className="w-full">
            <Tab id="agreement" label="Agreement" badge={attempt && tabErrors.agreement ? tabErrors.agreement : undefined} />
            <Tab id="contacts" label="Contacts" badge={attempt && tabErrors.contacts ? tabErrors.contacts : undefined} />
            <Tab id="sharing" label="Data sharing" badge={attempt && tabErrors.sharing ? tabErrors.sharing : undefined} />
          </TabList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <TabPanel id="agreement">
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
          </TabPanel>

          <TabPanel id="contacts">
            <FormRow title="Agreement requested by" description="The person at the partner organisation who asked for the agreement.">
              <ContactFields prefix="requestedBy" value={draft.requestedBy} onChange={(patch) => update({ requestedBy: { ...draft.requestedBy, ...patch } })} errors={errors} />
            </FormRow>
            <FormRow title="Agreement custodian (DEW)" description="The DEW officer responsible for this agreement.">
              <ContactFields prefix="custodian" value={draft.custodian} onChange={(patch) => update({ custodian: { ...draft.custodian, ...patch } })} errors={errors} />
            </FormRow>
          </TabPanel>

          <TabPanel id="sharing">
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
          </TabPanel>
        </div>
      </Tabs>

      {/* pr-20 keeps Submit clear of the RoleSwitcher FAB, which is pinned bottom-right on every /pages screen. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-secondary bg-primary py-4 pr-20 pl-6">
        <Button color="link-gray" iconLeading={ArrowLeft} onPress={goBack}>
          Back
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          {attempt === "submit" && errorCount > 0 && (
            <p className="text-sm text-error-primary">
              {errorCount} {errorCount === 1 ? "field needs" : "fields need"} attention
            </p>
          )}
          {!isEditingLive && (
            <Button color="tertiary" onPress={saveDraft}>
              Save draft
            </Button>
          )}
          <Button color="primary" onPress={submit}>
            {isEditingLive ? "Save changes" : "Submit"}
          </Button>
        </div>
      </div>

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
