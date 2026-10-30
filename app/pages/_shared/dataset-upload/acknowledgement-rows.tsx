"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { FormRow } from "@/app/pages/_shared/form-row";
import {
  dataLicenceOptions,
  firstNationsOptions,
  needsIiaReference,
  securityClassificationOptions,
  type FirstNationsConsideration,
  type UploadDraft,
} from "@/app/pages/_shared/dataset-upload/dataset-data";

// What a person agrees to when they upload a dataset: its licence, its security classification, the First Nations
// considerations (with the approving authority when there are some) and the privacy and restriction confirmation. The rows of
// the upload form's "Data upload acknowledgement" section (Figma YMproGZfrFB5jUqPHPxMhk node 67:33213), taken out of it so that
// a dataset added while a project is being created asks exactly the same questions in exactly the same words (0.9). The line
// under the privacy confirmation says where the project's own restrictions are, which is different in each place, so the caller gives it.

export type Acknowledgement = Omit<UploadDraft, "files">;

export const emptyAcknowledgement: Acknowledgement = { licence: "", classification: "", firstNations: "", iiaReference: "", privacyConfirmed: false };

export function AcknowledgementRows({
  answers,
  update,
  showErrors,
  privacyNote,
}: {
  answers: Acknowledgement;
  update: (change: Partial<Acknowledgement>) => void;
  showErrors: boolean;
  /** The sentence under the confirmation, on where this project's own privacy and restrictions are set. */
  privacyNote: ReactNode;
}) {
  return (
    <>
      <FormRow title="Data licence" required description="Select one." error={showErrors && !answers.licence ? "Select a data licence" : undefined}>
        <RadioGroup aria-label="Data licence" value={answers.licence} onChange={(v) => update({ licence: v as UploadDraft["licence"] })}>
          {dataLicenceOptions.map((o) => (
            <RadioButton key={o.id} value={o.id} label={o.label} />
          ))}
        </RadioGroup>
      </FormRow>
      <FormRow title="Security classification" required description="Select one." error={showErrors && !answers.classification ? "Select a security classification" : undefined}>
        <RadioGroup aria-label="Security classification" value={answers.classification} onChange={(v) => update({ classification: v as UploadDraft["classification"] })}>
          {securityClassificationOptions.map((o) => (
            <RadioButton key={o.id} value={o.id} label={o.label} />
          ))}
        </RadioGroup>
      </FormRow>
      <FormRow title="First Nations considerations" required description="Select one." error={showErrors && !answers.firstNations ? "Select a First Nations consideration" : undefined}>
        <RadioGroup
          aria-label="First Nations considerations"
          value={answers.firstNations}
          onChange={(v) => update({ firstNations: v as FirstNationsConsideration, ...(needsIiaReference(v as FirstNationsConsideration) ? {} : { iiaReference: "" }) })}
        >
          {firstNationsOptions.map((o) => (
            <RadioButton key={o.id} value={o.id} label={o.label} />
          ))}
        </RadioGroup>
        {needsIiaReference(answers.firstNations) && (
          <div className="flex flex-col gap-3 pl-6">
            <p className="text-sm text-balance text-tertiary">
              <span className="font-medium text-secondary">Authorised or Restricted is selected.</span> Please specify the approving authority.
            </p>
            <Input
              label="IIA reference / authority name"
              isRequired
              value={answers.iiaReference}
              isInvalid={showErrors && !answers.iiaReference.trim()}
              hint={showErrors && !answers.iiaReference.trim() ? "Enter the IIA reference or authority name" : undefined}
              onChange={(v) => update({ iiaReference: v })}
            />
          </div>
        )}
      </FormRow>
      <FormRow title="Privacy and restriction" required error={showErrors && !answers.privacyConfirmed ? "Confirm you have reviewed the privacy and restriction settings" : undefined}>
        <Checkbox
          isSelected={answers.privacyConfirmed}
          onChange={(v) => update({ privacyConfirmed: v })}
          label="I confirm that I have reviewed the privacy and restriction settings for this dataset."
        />
        {privacyNote}
      </FormRow>
    </>
  );
}
