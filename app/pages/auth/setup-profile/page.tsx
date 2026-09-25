"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Upload01, User01, SearchLg, Plus, ArrowLeft, Trash01 } from "@untitledui/icons";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Select } from "@/components/base/select/select";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { AuthShell, AuthWordmark } from "@/app/pages/auth/_shared/auth-shell";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { cx } from "@/utils/cx";

// Figma: file wer8CgO1UoCH3aQw2jQkdy, nodes 49:744 ("Setup 1"/Your details), 62:794 ("Setup 2"/
// Organisation details, + node 65:7883 "Row Added" for the repeatable role/org row shape), 65:3159
// ("Setup 3"/Privacy & Terms of Use) - the 3-step post-signup profile wizard. All 3 steps share
// one route/page (step tracked via `?step=1|2|3`, so the URL stays shareable/refreshable) and one
// local form-state object, since nothing here needs to survive a real page reload in this
// no-backend build.
//
// Step 2's "primary role and organisation" selection (a card per role/org row, a real RadioGroup
// letting the user mark exactly one as primary, a per-row remove action) was later given its own
// Figma reference, node 2504:57758 - a card per row (`bg-brand-50`/`border-brand-500` when
// selected as primary, matching this frame's real token dump, not the earlier `border-brand-300`
// guess), a "Set as primary" radio + an icon-only trash utility button in every row's header (no
// numbered badge or separate "Primary" pill - trimmed to match, per "Figma is the source of
// truth"). The trash button is disabled (not hidden) once only one row remains, since Figma's own
// 2-row example never shows a 1-row state and removing your only affiliation isn't a real action.
//
// Selecting "Other" for a row's Role or Organisation/Institution (not in Figma - built per direct
// request) reveals a real text input asking for the name, required before that row validates.

const ROLE_OPTIONS = [
  { id: "researcher", label: "Researcher" },
  { id: "citizen-scientist", label: "Citizen Scientist" },
  { id: "field-surveyor", label: "Field Surveyor" },
  { id: "data-manager", label: "Data Manager" },
  { id: "other", label: "Other" },
];

const ORG_OPTIONS = [
  { id: "birds-sa", label: "Birds SA (SAOA)" },
  { id: "birdlife-australia", label: "BirdLife Australia" },
  { id: "sa-museum", label: "South Australian Museum" },
  { id: "adelaide-hills-landcare", label: "Adelaide Hills Landcare" },
  { id: "other", label: "Other" },
];

type RoleOrgRow = { id: number; role: string | null; org: string | null; roleOther: string; orgOther: string };

function SetupProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = (Number(searchParams.get("step")) === 2 ? 2 : Number(searchParams.get("step")) === 3 ? 3 : 1) as 1 | 2 | 3;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [fileName, setFileName] = useState("");
  const [roleOrgRows, setRoleOrgRows] = useState<RoleOrgRow[]>([{ id: 1, role: null, org: null, roleOther: "", orgOther: "" }]);
  const [primaryRoleId, setPrimaryRoleId] = useState<number>(1);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const goToStep = (next: 1 | 2 | 3) => router.push(`/pages/auth/setup-profile?step=${next}`);

  const updateRoleOrgRow = (id: number, patch: Partial<RoleOrgRow>) =>
    setRoleOrgRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRoleOrgRow = () =>
    setRoleOrgRows((rows) => [
      ...rows,
      { id: rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1, role: null, org: null, roleOther: "", orgOther: "" },
    ]);

  const removeRoleOrgRow = (id: number) => {
    setRoleOrgRows((rows) => rows.filter((r) => r.id !== id));
    if (primaryRoleId === id) {
      const nextPrimary = roleOrgRows.find((r) => r.id !== id);
      if (nextPrimary) setPrimaryRoleId(nextPrimary.id);
    }
  };

  const step1Valid = firstName.trim() && lastName.trim() && displayName.trim();
  const step2Valid = roleOrgRows.every(
    (row) => row.role && (row.role !== "other" || row.roleOther.trim()) && row.org && (row.org !== "other" || row.orgOther.trim()),
  );
  const step3Valid = agreeTerms && agreePrivacy;

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/pages/dashboard?userRole=registered-user");
  };

  return (
    <AuthShell wide>
      <div className="flex flex-col items-center gap-2 text-center">
        <AuthWordmark />
        <p className="text-xl font-semibold text-primary">Setup your Profile</p>
      </div>

      {/* Figma "Setup your Profile" progress steps (nodes 49:799 / 62:799 / 65:3164): three titled steps
          joined by a line, over a rule. */}
      <div className="w-full border-b border-secondary pb-4">
        <Progress.IconsWithText
          type="icon"
          orientation="horizontal"
          size="sm"
          items={SETUP_STEPS.map((title, i) => ({ title, status: i + 1 < step ? "complete" : i + 1 === step ? "current" : "incomplete" }))}
        />
      </div>

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goToStep(2);
          }}
          className="flex w-full flex-col gap-10"
        >
          <div className="flex w-full flex-col gap-10">
            <p className="text-display-xs font-semibold text-brand-tertiary">Your details</p>
            <div className="flex w-full flex-col gap-4">
              <div className="flex w-full gap-6">
                <Input label="First Name" placeholder="First name" value={firstName} onChange={setFirstName} isRequired className="flex-1" />
                <Input label="Last Name" placeholder="Last name" value={lastName} onChange={setLastName} isRequired className="flex-1" />
              </div>
              <Input
                label="Display Name / Alias"
                placeholder="Enter your preferred alias name"
                value={displayName}
                onChange={setDisplayName}
                isRequired
                tooltip="Shown next to your contributions instead of your full name"
              />
              <InputGroup
                label="Contact No."
                leadingAddon={
                  <InputGroup.Prefix position="leading" className="items-center gap-0.5">
                    +61 <ChevronDown className="size-4" />
                  </InputGroup.Prefix>
                }
              >
                <InputBase aria-label="Contact number" placeholder="Enter contact no" value={contactNo} onChange={(e) => setContactNo(e.target.value)} />
              </InputGroup>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-secondary">Profile picture</p>
                <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-secondary p-3">
                  <div className="flex flex-col items-center gap-1">
                    <span className="flex size-12 items-center justify-center overflow-hidden rounded-full border border-secondary bg-tertiary">
                      <User01 className="size-5 text-fg-quaternary" />
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-brand-secondary">
                      <Upload01 className="size-5" />
                      Upload
                    </span>
                  </div>
                  <p className="text-xs text-tertiary">PNG, JPEG, or WebP. Up to 2 MB</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                  />
                </label>
                {fileName && <p className="text-xs text-tertiary">Selected: {fileName}</p>}
              </div>
            </div>
          </div>
          <Button type="submit" color="primary" size="md" className="w-full" isDisabled={!step1Valid}>
            Continue
          </Button>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goToStep(3);
          }}
          className="flex w-full flex-col gap-10"
        >
          <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-1">
              <p className="text-display-xs font-semibold text-brand-tertiary">Organisation details</p>
              <p className="text-sm text-tertiary">
                Add every role and organisation you contribute under. If you have more than one, choose the one that best represents you as your primary -
                other BioData SA users will see it first on your profile.
              </p>
            </div>
            <RadioGroup
              aria-label="Primary role and organisation"
              value={String(primaryRoleId)}
              onChange={(value) => setPrimaryRoleId(Number(value))}
              className="flex w-full flex-col gap-4"
            >
              {roleOrgRows.map((row, i) => {
                const isPrimary = row.id === primaryRoleId;
                const isOnlyRow = roleOrgRows.length === 1;
                return (
                  <BentoCard key={row.id} className={cx("gap-4 transition-colors", isPrimary && "border-brand-500 bg-brand-50")}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <RadioButton value={String(row.id)} label="Set as primary" size="sm" />
                      <Button
                        color="secondary"
                        size="sm"
                        iconLeading={Trash01}
                        aria-label={`Remove affiliation ${i + 1}`}
                        isDisabled={isOnlyRow}
                        onClick={() => removeRoleOrgRow(row.id)}
                      />
                    </div>
                    <div className="flex w-full gap-6">
                      <div className="flex flex-1 flex-col gap-4">
                        <Select
                          aria-label={`Role ${i + 1}`}
                          label="Role"
                          icon={SearchLg}
                          placeholder="Select role"
                          items={ROLE_OPTIONS}
                          selectedKey={row.role}
                          onSelectionChange={(key) => updateRoleOrgRow(row.id, { role: key as string, roleOther: key === "other" ? row.roleOther : "" })}
                          className="w-full"
                        >
                          {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                        </Select>
                        {row.role === "other" && (
                          <Input
                            label="Your role"
                            placeholder="Enter your role"
                            value={row.roleOther}
                            onChange={(value) => updateRoleOrgRow(row.id, { roleOther: value })}
                            isRequired
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-4">
                        <Select
                          aria-label={`Organisation ${i + 1}`}
                          label="Organisation / Institution"
                          icon={SearchLg}
                          placeholder="Select organisation"
                          items={ORG_OPTIONS}
                          selectedKey={row.org}
                          onSelectionChange={(key) => updateRoleOrgRow(row.id, { org: key as string, orgOther: key === "other" ? row.orgOther : "" })}
                          className="w-full"
                        >
                          {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                        </Select>
                        {row.org === "other" && (
                          <Input
                            label="Your organisation / institution"
                            placeholder="Enter your organisation or institution"
                            value={row.orgOther}
                            onChange={(value) => updateRoleOrgRow(row.id, { orgOther: value })}
                            isRequired
                          />
                        )}
                      </div>
                    </div>
                  </BentoCard>
                );
              })}
            </RadioGroup>
            <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={addRoleOrgRow}>
              Add another role
            </Button>
          </div>
          <div className="flex w-full flex-col items-center gap-6">
            <Button type="submit" color="primary" size="md" className="w-full" isDisabled={!step2Valid}>
              Continue
            </Button>
            <Button color="link-gray" size="sm" iconLeading={ArrowLeft} onClick={() => goToStep(1)}>
              Go back
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleFinish} className="flex w-full flex-col gap-10">
          <div className="flex w-full flex-col gap-10">
            <p className="text-display-xs font-semibold text-brand-tertiary">Privacy &amp; Terms of Use</p>
            <div className="flex w-full flex-col gap-4">
              <div className="w-full rounded-lg bg-[var(--color-brand-25)] p-3.5">
                <p className="text-base text-secondary">
                  Before accessing your BioData SA account, please read our <span className="font-semibold">Terms of Use</span> and{" "}
                  <span className="font-semibold">Privacy Notice.</span>
                </p>
                <p className="mt-4 text-base text-secondary">
                  These explain how you can use the BioData SA portal and how the Department for Environment and Water manages and protects your personal
                  information.
                </p>
                <p className="mt-4 text-base text-secondary">
                  By continuing, you agree to the <span className="font-semibold">Terms of Use</span> and acknowledge that you&rsquo;ve read the{" "}
                  <span className="font-semibold">Privacy Notice.</span>
                </p>
              </div>
              <label className="flex w-full items-start gap-2 rounded-xl border border-secondary bg-primary p-4">
                <Checkbox size="sm" isSelected={agreeTerms} onChange={setAgreeTerms} />
                <span className="text-sm font-medium text-secondary">I have read and agree to the terms.</span>
              </label>
              <label className="flex w-full items-start gap-2 rounded-xl border border-secondary bg-primary p-4">
                <Checkbox size="sm" isSelected={agreePrivacy} onChange={setAgreePrivacy} />
                <span className="text-sm font-medium text-secondary">I have read and understand the privacy notice.</span>
              </label>
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-6">
            <Button type="submit" color="primary" size="md" className="w-full" isDisabled={!step3Valid}>
              Continue
            </Button>
            <Button color="link-gray" size="sm" iconLeading={ArrowLeft} onClick={() => goToStep(2)}>
              Go back
            </Button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

const SETUP_STEPS = ["Your details", "Organisation details", "Privacy & Terms of Use"] as const;

export default function SetupProfilePage() {
  return (
    <Suspense fallback={null}>
      <SetupProfileForm />
    </Suspense>
  );
}
