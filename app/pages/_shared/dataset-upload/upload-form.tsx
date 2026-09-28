"use client";

import { useState } from "react";
import Link from "next/link";
import { Download01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { Focusable } from "react-aria-components";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import { FormSectionList, FormSidebar, deriveSectionStatus } from "@/app/pages/_shared/form-section-list";
import { FileQueue, UploadDropzone, useFileQueue } from "@/app/pages/_shared/dataset-upload/upload-dropzone";
import {
  UPLOAD_SECTION_ORDER,
  dataLicenceOptions,
  emptyUploadDraft,
  firstNationsOptions,
  missingForUpload,
  needsIiaReference,
  recommendedTemplates,
  securityClassificationOptions,
  uploadSections,
  type DatasetTemplate,
  type FirstNationsConsideration,
  type UploadDraft,
  type UploadSection,
} from "@/app/pages/_shared/dataset-upload/dataset-data";
import { useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import { useRoleHref } from "@/lib/use-role-href";

// The upload-dataset form, fitted from the wireframe (Figma YMproGZfrFB5jUqPHPxMhk node 67:33213)
// into the shared form pattern (FormPage, sections in column 2, CONTRACTS 4.1). The wireframe's one
// screen becomes two sections: Upload files (instructions, the drop area and queue, the recommended
// templates) and Data upload acknowledgement (licence, classification, First Nations, privacy),
// ending in "Confirm and upload". Departures from the wireframe, on purpose:
//   - the three "select one" groups are radio buttons, not checkboxes (a checkbox lets two be ticked);
//   - there is no Save draft: a draft has nothing to save before validation (the workflow sheet's
//     "Save draft" comes after validation passes);
//   - the templates have no images or downloads, because there are no template files yet.
// Mandatory details block Continue for the section being left, never ahead of it.

function TemplateCard({ template }: { template: DatasetTemplate }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-primary">{template.title}</p>
        <p className="text-sm text-balance text-tertiary">{template.description}</p>
      </div>
      <dl className="m-0 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-tertiary">Collection method:</dt>
          <dd className="m-0 font-medium text-secondary">{template.collectionMethod}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-tertiary">Species type:</dt>
          <dd className="m-0 font-medium text-secondary">{template.speciesType}</dd>
        </div>
      </dl>
      <div className="flex items-center gap-2 border-t border-secondary pt-3">
        <span className="text-sm text-tertiary">Download:</span>
        {["Excel", "PDF"].map((format) => (
          <Tooltip key={format} title="Coming soon" description="Template downloads aren't available in this preview.">
            <Focusable>
              <span className="inline-flex">
                <Button color="secondary" size="sm" iconLeading={Download01} isDisabled>
                  {format}
                </Button>
              </span>
            </Focusable>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

export function UploadForm({
  project,
  onCancel,
  onSubmit,
}: {
  project: { id: string; code: string; name: string };
  onCancel: () => void;
  onSubmit: (draft: UploadDraft) => void;
}) {
  useDatasets(); // loads the saved datasets before this one is added
  const roleHref = useRoleHref();
  const queue = useFileQueue();
  const [answers, setAnswers] = useState<Omit<UploadDraft, "files">>({ licence: "", classification: "", firstNations: "", iiaReference: "", privacyConfirmed: false });
  const [section, setSection] = useState<UploadSection>("files");
  const [visited, setVisited] = useState<Set<UploadSection>>(new Set());
  const [blocked, setBlocked] = useState<Set<UploadSection>>(new Set());
  const [submitPressed, setSubmitPressed] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const update = (change: Partial<typeof answers>) => setAnswers((a) => ({ ...a, ...change }));
  const draft: UploadDraft = { ...emptyUploadDraft, ...answers, files: queue.files.filter((f) => f.status === "complete").map((f) => ({ name: f.name, size: f.size })) };
  const missing = missingForUpload(draft, queue.uploading);
  const index = UPLOAD_SECTION_ORDER.indexOf(section);
  const isLast = index === UPLOAD_SECTION_ORDER.length - 1;
  const showErrors = (id: UploadSection) => submitPressed || blocked.has(id);
  const dirty = queue.files.length > 0 || answers.licence !== "" || answers.classification !== "" || answers.firstNations !== "" || answers.privacyConfirmed;

  const goTo = (next: UploadSection) => {
    setVisited((v) => new Set(v).add(section));
    setSection(next);
  };
  // Continue, and jumping ahead in column 2, refuse to leave a section with mandatory details missing.
  const proceed = (next: UploadSection) => {
    if (UPLOAD_SECTION_ORDER.indexOf(next) > index && missing[section].length > 0) {
      setBlocked((b) => new Set(b).add(section));
      return;
    }
    goTo(next);
  };

  const submit = () => {
    setSubmitPressed(true);
    const first = UPLOAD_SECTION_ORDER.find((id) => missing[id].length > 0);
    if (first) {
      setSection(first);
      return;
    }
    onSubmit(draft);
  };

  const sectionItems = UPLOAD_SECTION_ORDER.map((id) => ({
    id,
    title: uploadSections[id].title,
    status: deriveSectionStatus({ isCurrent: id === section, isValid: missing[id].length === 0, visited: visited.has(id), attempted: showErrors(id) }),
    detail: showErrors(id) && missing[id].length > 0 && id !== section ? `${missing[id].length} to fix` : undefined,
  }));

  const problems = showErrors(section) ? missing[section] : [];
  const ack = showErrors("acknowledgement");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FormSidebar>
        <FormSectionList
          heading="Upload dataset"
          groups={[{ sections: sectionItems }]}
          progress={{ done: sectionItems.filter((i) => i.status === "complete").length, total: UPLOAD_SECTION_ORDER.length }}
          onSelect={(id) => proceed(id as UploadSection)}
        />
      </FormSidebar>

      <FormPage
        eyebrow={`${project.name} - Step ${index + 1} of ${UPLOAD_SECTION_ORDER.length}`}
        title={uploadSections[section].title}
        subtitle={uploadSections[section].description}
        onCancel={() => (dirty ? setConfirmDiscard(true) : onCancel())}
        onBack={index > 0 ? () => goTo(UPLOAD_SECTION_ORDER[index - 1]) : undefined}
        problems={problems.length ? { items: problems } : undefined}
        primaryLabel={isLast ? "Confirm and upload" : "Continue"}
        primaryIsContinue={!isLast}
        onPrimary={isLast ? submit : () => proceed(UPLOAD_SECTION_ORDER[index + 1])}
      >
        {section === "files" && (
          <>
            <FormRow title="Data upload instructions">
              <ol className="m-0 flex list-decimal flex-col gap-1 pl-5 text-sm text-secondary">
                <li>Supported file formats: .XLS and .XLSX</li>
                <li>Please use the standard BioData SA templates recommended for this project when preparing and uploading data.</li>
              </ol>
            </FormRow>
            <FormRow
              title="Dataset files"
              required
              description="Add one or more files."
              error={queue.rejected.length ? `Only .XLS and .XLSX files can be uploaded. Not added: ${queue.rejected.join(", ")}.` : undefined}
            >
              <UploadDropzone onAdd={queue.add} isInvalid={showErrors("files") && queue.files.length === 0} />
              <FileQueue files={queue.files} onRemove={queue.remove} />
            </FormRow>
            <FormRow title="Recommended templates" description="Standard templates recommended for this project.">
              <div className="flex flex-col gap-3">
                {recommendedTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </FormRow>
          </>
        )}

        {section === "acknowledgement" && (
          <>
            <FormRow title="Data licence" required description="Select one." error={ack && !answers.licence ? "Select a data licence" : undefined}>
              <RadioGroup aria-label="Data licence" value={answers.licence} onChange={(v) => update({ licence: v as UploadDraft["licence"] })}>
                {dataLicenceOptions.map((o) => (
                  <RadioButton key={o.id} value={o.id} label={o.label} />
                ))}
              </RadioGroup>
            </FormRow>
            <FormRow title="Security classification" required description="Select one." error={ack && !answers.classification ? "Select a security classification" : undefined}>
              <RadioGroup aria-label="Security classification" value={answers.classification} onChange={(v) => update({ classification: v as UploadDraft["classification"] })}>
                {securityClassificationOptions.map((o) => (
                  <RadioButton key={o.id} value={o.id} label={o.label} />
                ))}
              </RadioGroup>
            </FormRow>
            <FormRow title="First Nations considerations" required description="Select one." error={ack && !answers.firstNations ? "Select a First Nations consideration" : undefined}>
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
                    isInvalid={ack && !answers.iiaReference.trim()}
                    hint={ack && !answers.iiaReference.trim() ? "Enter the IIA reference or authority name" : undefined}
                    onChange={(v) => update({ iiaReference: v })}
                  />
                </div>
              )}
            </FormRow>
            <FormRow title="Privacy and restriction" required error={ack && !answers.privacyConfirmed ? "Confirm you have reviewed the privacy and restriction settings" : undefined}>
              <Checkbox
                isSelected={answers.privacyConfirmed}
                onChange={(v) => update({ privacyConfirmed: v })}
                label="I confirm that I have reviewed the privacy and restriction settings for this dataset."
              />
              <p className="text-sm text-balance text-tertiary">
                Project-level privacy controls are already applied. If this dataset needs additional or different restrictions,{" "}
                <Link
                  href={roleHref(projectDetailsPath(project.id))}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand-tertiary underline underline-offset-2 hover:text-brand-secondary"
                >
                  review the project&apos;s Privacy and Restrictions (opens in a new tab)
                </Link>{" "}
                before uploading.
              </p>
            </FormRow>
          </>
        )}
      </FormPage>

      <ConfirmationModal
        isOpen={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard this upload?"
        description="The files you added and the details you entered will be lost."
        confirmLabel="Discard upload"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirmDiscard(false);
          onCancel();
        }}
      />
    </div>
  );
}
