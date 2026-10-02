"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDownload02, Upload01, Download01 } from "@untitledui/icons";
import { FormModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { MultiSelect } from "@/components/base/select/multi-select";
import { ActionRow, downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { CV_ROOT, type Cv } from "@/app/pages/_shared/ctrl-vocab/cv-data";
import { allCvs, recordTemplateDownload, setPendingUpload, useCvs } from "@/app/pages/_shared/ctrl-vocab/cv-store";
import { parseTemplate, templateFileName, templateRows, type ParsedTemplate } from "@/app/pages/_shared/ctrl-vocab/cv-template";
import { useRoleHref } from "@/lib/use-role-href";

// The template, as its own flow (the designer, Sept 30 2026: "keep the template workflow
// separate ... you may use this section to initiate that flow", pointing at column 2's Actions). It
// touches the list and the vocabulary's page nowhere else: no cards, badges or notices.
//
//   Download template        a small dialog to pick the Reference vocabulary (searchable: there may
//                            be hundreds), already set to the one open, then the file. Each download
//                            is noted in that vocabulary's History.
//   Upload filled template   reads the vocabulary from the file's first row, so it works from any
//                            screen and with a renamed file, and opens that vocabulary's Entries step
//                            with the rows merged and marked New or Updated, to check before saving.
//
// The logic (the file's rows, matching by Code or ID) is in cv-template.ts.

/** Downloads a vocabulary's template and notes it in the vocabulary's History. */
export function downloadTemplate(cv: Cv) {
  const { handoutId, at } = recordTemplateDownload(cv.id);
  const fresh = allCvs().find((c) => c.id === cv.id) ?? cv;
  const { first, rest } = templateRows(fresh, handoutId, at);
  downloadCsv(templateFileName(fresh, handoutId), first, rest);
  toast.success("Template downloaded", { description: `Share it to be filled in, then upload it back with "Upload filled template" in Actions.` });
}

/** Sends an uploaded template to its own vocabulary's Entries step, found from the file's first row. */
function useRouteUpload() {
  const router = useRouter();
  const roleHref = useRoleHref();
  return (text: string, fileName: string) => {
    const parsed = parseTemplate(text);
    if ("error" in parsed) return toast.error("This file can't be read", { description: `${parsed.error}. Upload a template downloaded from BioData.` });
    const target = allCvs().find((c) => c.id === parsed.vocabId);
    if (!target) return toast.error("Which vocabulary is this for?", { description: "The file's first row doesn't name a vocabulary. Download a new template and fill that one in." });
    if (target.type !== "reference") return toast.error(`${target.name} reads its values from a table`, { description: "Only a Reference vocabulary takes a template." });
    if (target.state === "archived") return toast.error(`${target.name} is archived`, { description: "Reactivate it first, then upload the template." });
    setPendingUpload(target.id, { ...(parsed as ParsedTemplate), fileName });
    router.push(roleHref(`${CV_ROOT}/${target.id}/edit`));
  };
}

/** The two rows at the top of column 2's Actions. `currentId` preselects the vocabulary that is open. */
export function TemplateActions( { currentId }: { currentId?: string }) {
  const cvs = useCvs();
  const routeUpload = useRouteUpload();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const eligible = cvs.filter((c) => c.type === "reference" && c.state !== "archived" && !c.id.startsWith("PLACEHOLDER-")).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <ActionRow
        icon={FileDownload02}
        onClick={() => {
          setChosen(eligible.some((c) => c.id === currentId) ? currentId! : null);
          setError(undefined);
          setOpen(true);
        }}
      >
        Download template
      </ActionRow>
      <ActionRow icon={Upload01} onClick={() => input.current?.click()}>
        Upload filled template
      </ActionRow>
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) routeUpload(await file.text(), file.name);
        }}
      />
      <FormModal
        submitIcon={Download01}
        isOpen={open}
        onOpenChange={setOpen}
        icon={FileDownload02}
        title="Download a template"
        description="A spreadsheet of the vocabulary's entries, to share with the people who fill it in. Upload it back with Upload filled template: new rows are added and changed rows updated, matched by Code or ID"
        submitLabel="Download"
        onSubmit={() => {
          const cv = eligible.find((c) => c.id === chosen);
          if (!cv) return setError("Choose a vocabulary");
          setOpen(false);
          downloadTemplate(cv);
        }}
      >
        <MultiSelect
          label="Vocabulary"
          selectionMode="single"
          placeholder="Search Reference vocabularies"
          items={eligible.map((c) => ({ id: c.id, label: c.name, supportingText: c.category }))}
          selectedKeys={new Set(chosen ? [chosen] : [])}
          onSelectionChange={(keys) => {
            const next = keys === "all" ? undefined : Array.from(keys as Set<string>)[0];
            if (next) {
              setChosen(String(next));
              setError(undefined);
            }
          }}
          isInvalid={!!error}
          hint={error ?? "Only Reference vocabularies take a template; a Descriptive one reads its table."}
        >
          {(item) => <MultiSelect.Item {...item} />}
        </MultiSelect>
      </FormModal>
    </>
  );
}
