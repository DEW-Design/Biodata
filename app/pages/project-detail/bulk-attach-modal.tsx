"use client";

// "Upload attachments", from the project card's Upload menu (designer, 25 Oct 2026): many files and web links attached to
// the project's records in one go, with the project's own template (bulk-attachments.ts). The sibling of "Add attachment"
// and "Add web link" (record-quick-actions.tsx), which add one at a time from a record, so it is the same modal and the
// files land the same way: on a field, audio and video waiting for an admin's review.
//
// Three steps, on one screen: download the template, fill it, add the zip. Once added, every row is checked and shown
// with where it goes and whether it is ready, already attached (skipped) or to fix, problems first. The ready rows are
// attached; the rest are left for the person to fix and add again. Borrowed: the drop area from Upload dataset
// (upload-dropzone.tsx), the file row from its queue, and the embedded table (embedded-table.tsx, CONTRACTS 4.2h).

import { useMemo, useState } from "react";
import { Download01, File05, Trash01, Upload01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FormModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { UploadDropzone } from "@/app/pages/_shared/dataset-upload/upload-dropzone";
import { formatFileSize } from "@/app/pages/_shared/dataset-upload/dataset-data";
import { EmbeddedTable } from "@/app/pages/_shared/embedded-table";
import { useUserRole } from "@/lib/use-user-role";
import { useEditStore } from "./edit-store";
import { useCurrentUserName } from "./field-notes";
import { fieldNotesActions, reviewForNewFile, useFieldNotes } from "./field-notes-store";
import {
  buildAttachmentTemplate,
  checkUpload,
  expandUpload,
  templateFileName,
  type CheckedRow,
  type RowStatus,
  type UploadedFile,
} from "./bulk-attachments";

const STATUS: Record<RowStatus, { label: string; color: "success" | "gray" | "error"; order: number }> = {
  problem: { label: "To fix", color: "error", order: 0 },
  ready: { label: "Ready", color: "success", order: 1 },
  attached: { label: "Already attached", color: "gray", order: 2 },
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function BulkAttachModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { records, meta, project } = useEditStore();
  const notes = useFieldNotes();
  const me = useCurrentUserName();
  const role = useUserRole();
  const [upload, setUpload] = useState<{ names: string[]; size: number; files: UploadedFile[] } | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const projectName = project.details.shortTitle;
  const target = useMemo(() => ({ code: meta.code, name: projectName, publisher: meta.publisher }), [meta.code, meta.publisher, projectName]);

  // Checked against the notes as they are now, so a row attached since is shown as already attached.
  const check = useMemo(() => (upload ? checkUpload(upload.files, target, records, notes) : null), [upload, records, notes, target]);
  const rows = useMemo(
    () => [...(check?.rows ?? [])].sort((a, b) => STATUS[a.status].order - STATUS[b.status].order || a.row - b.row).map((r) => ({ ...r, id: String(r.row) })),
    [check],
  );
  const ready = rows.filter((r) => r.status === "ready");
  const readyFiles = ready.filter((r) => r.kind !== "link").length;
  const readyLinks = ready.length - readyFiles;
  const count = (s: RowStatus) => rows.filter((r) => r.status === s).length;

  const reset = () => {
    setUpload(null);
    setReadError(null);
    setTried(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const bytes = buildAttachmentTemplate(target, records);
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFileName(meta.code);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const add = async (dropped: File[]) => {
    if (dropped.length === 0) return;
    setReading(true);
    setReadError(null);
    try {
      const files = await expandUpload(dropped);
      setUpload({ names: dropped.map((f) => f.name), size: dropped.reduce((n, f) => n + f.size, 0), files });
    } catch {
      setUpload(null);
      setReadError(`${dropped.map((f) => f.name).join(", ")} couldn't be opened. Zip the template and files again, then add the zip.`);
    } finally {
      setReading(false);
    }
  };

  const submit = () => {
    setTried(true);
    if (!check || check.error) return;
    if (ready.length === 0) {
      toast.error("Nothing is ready to attach", { description: "Fix the rows marked To fix in the template, then add the zip again." });
      return;
    }
    let waiting = 0;
    for (const r of ready) {
      if (!r.record || !r.field) continue;
      if (r.kind === "link") {
        fieldNotesActions.addLink(r.record.id, r.field.key, { url: r.url, name: r.meta.title || r.url.replace(/^https?:\/\//, ""), meta: r.meta }, me);
      } else if (r.file && r.kind) {
        const review = reviewForNewFile(r.kind, role);
        if (review) waiting += 1;
        fieldNotesActions.attach(r.record.id, r.field.key, { name: r.file.name, sizeBytes: r.file.size, kind: r.kind }, me, review, r.meta);
      }
    }
    const left = count("problem");
    toast.success(`${plural(ready.length, "attachment", "attachments")} added`, {
      description: [
        waiting ? `${plural(waiting, "recording waits", "recordings wait")} for a BioData Admin to review.` : "",
        left ? `${plural(left, "row", "rows")} still to fix: correct them in the template and add the zip again.` : "",
        "Changes are kept in this browser. This preview has no backend.",
      ]
        .filter(Boolean)
        .join(" "),
    });
    close();
  };

  const where = (r: CheckedRow) =>
    r.record && r.field ? (
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-primary" title={`${r.record.code} ${r.record.name}`}>
          {r.record.code} {r.record.name}
        </span>
        <span className="truncate text-sm text-tertiary">{r.field.label}</span>
      </span>
    ) : (
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-primary">{r.recordCode || "Not provided"}</span>
        <span className="truncate text-sm text-tertiary">{r.fieldId || "Not provided"}</span>
      </span>
    );

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => !open && close()}
      size="lg"
      title="Upload attachments"
      description={`Attach many files and web links to ${target.name}'s records at once, with this project's template.`}
      submitLabel={ready.length ? `Attach ${[readyFiles ? plural(readyFiles, "file", "files") : "", readyLinks ? plural(readyLinks, "link", "links") : ""].filter(Boolean).join(" and ")}` : "Attach"}
      submitIcon={Upload01}
      isSubmitLoading={reading}
      onSubmit={submit}
    >
      <ol className="m-0 flex list-decimal flex-col gap-3 pl-5 text-sm text-secondary">
        <li className="text-balance">
          <span className="flex flex-col items-start gap-2">
            Download this project&apos;s template. It lists every record and its concepts, with the IDs to use.
            <Button color="secondary" size="sm" iconLeading={Download01} onPress={downloadTemplate}>
              Download template
            </Button>
          </span>
        </li>
        <li className="text-balance">Add one row for each file or link: the record, the concept it documents, and its details.</li>
        <li className="text-balance">Zip the files with the filled-in template and add the zip here. For web links only, add the template on its own.</li>
      </ol>

      {upload ? (
        <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-quaternary">
            <File05 className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="m-0 truncate text-sm font-medium text-secondary">{upload.names.join(", ")}</p>
            <p className="m-0 text-sm text-tertiary tabular-nums">
              {formatFileSize(upload.size)}
              {check?.template ? `, template ${check.template}` : ""}
            </p>
          </div>
          <Button color="tertiary" size="sm" iconLeading={Trash01} aria-label={`Remove ${upload.names.join(", ")}`} onPress={reset} />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <UploadDropzone
            onAdd={add}
            isInvalid={(tried && !upload) || !!readError}
            acceptedFileTypes={[".zip", ".xlsx", ".xls"]}
            formats="A ZIP of the template and its files, or the template alone for web links"
          />
          {reading && <p className="m-0 text-sm text-tertiary">Reading the zip…</p>}
          {(readError || (tried && !upload)) && (
            <p className="m-0 text-sm text-error-primary">{readError ?? "Add the zip with your filled-in template and its files."}</p>
          )}
        </div>
      )}

      {check?.error && <p className="m-0 text-sm text-balance text-error-primary">{check.error}</p>}

      {check && !check.error && (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm text-balance text-secondary tabular-nums">
            {rows.length === 0
              ? "The template has no rows filled in yet."
              : [
                  `${plural(rows.length, "row", "rows")} read`,
                  [
                    count("ready") ? `${count("ready")} ready` : "",
                    count("attached") ? `${count("attached")} already attached` : "",
                    count("problem") ? `${count("problem")} to fix` : "",
                  ]
                    .filter(Boolean)
                    .join(", "),
                ].join(": ") + "."}
          </p>
          {check.unused.length > 0 && (
            <p className="m-0 text-sm text-balance text-tertiary">
              {plural(check.unused.length, "file in the zip is", "files in the zip are")} not named in the template and won&apos;t be attached:{" "}
              {check.unused.join(", ")}.
            </p>
          )}
          {rows.length > 0 && (
            <EmbeddedTable
              ariaLabel="Rows in the template"
              minWidth="min-w-[600px]"
              columns={[
                { id: "row", label: "Row", className: "w-[9%]", isRowHeader: true },
                { id: "where", label: "Attach to", className: "w-[29%]" },
                { id: "what", label: "File or link", className: "w-[22%]" },
                { id: "status", label: "Status", className: "w-[40%]" },
              ]}
              rows={rows}
              cell={(r, column) => {
                if (column === "row") return <span className="text-sm text-tertiary tabular-nums">{r.row}</span>;
                if (column === "where") return where(r);
                if (column === "what")
                  return (
                    <span className="block truncate text-sm text-secondary" title={r.fileName || r.url}>
                      {r.fileName || r.url || "Not provided"}
                    </span>
                  );
                return (
                  <span className="flex flex-col items-start gap-1">
                    <Badge size="sm" color={STATUS[r.status].color}>
                      {STATUS[r.status].label}
                    </Badge>
                    {r.problems.map((p) => (
                      <span key={p} className="text-sm text-balance text-tertiary">
                        {p}
                      </span>
                    ))}
                  </span>
                );
              }}
            />
          )}
        </div>
      )}
    </FormModal>
  );
}
