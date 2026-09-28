"use client";

import { useCallback, useRef, useState } from "react";
import { DropZone, FileTrigger, Text, type DropZoneProps } from "react-aria-components";
import { CheckCircle, File05, Trash01, Upload01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ACCEPTED_EXTENSIONS, formatFileSize, isAcceptedFile } from "@/app/pages/_shared/dataset-upload/dataset-data";
import { cx } from "@/utils/cx";

// The upload area and its file queue, from the wireframe (Figma YMproGZfrFB5jUqPHPxMhk node 67:33213):
// "Click to upload or drag and drop here", then one row per file with its size, "Complete" and a
// progress bar. No DEW file-upload component exists yet, so this is composed on react-aria's real
// `DropZone` and `FileTrigger` (keyboard and drag-and-drop for free) with the DEW `Button`,
// `FeaturedIcon` and `ProgressBarBase`, and lives in app/pages, not components/** (CONTRACTS 1.4).
// It is a candidate for the Untitled UI File upload component when the designer wants it ingested.
// The XLS file glyph in the wireframe is a file-type icon asset that is not in the icon set (the
// "File Type Icon" gap logged earlier), so the queue uses the generic file icon.
//
// Progress is real: each file is read in the browser with `FileReader` and the bar follows its
// `progress` events. Nothing leaves the browser (there is no server here), and the contents are not
// kept, only the name and size.

export interface QueuedFile {
  id: string;
  name: string;
  size: number;
  loaded: number;
  status: "uploading" | "complete" | "error";
}

/** The queue's state and the reading of each file. */
export function useFileQueue() {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const counter = useRef(0);

  const patch = useCallback((id: string, change: Partial<QueuedFile>) => setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...change } : f))), []);

  const add = useCallback(
    (incoming: File[]) => {
      const accepted = incoming.filter((f) => isAcceptedFile(f.name));
      setRejected(incoming.filter((f) => !isAcceptedFile(f.name)).map((f) => f.name));
      if (accepted.length === 0) return;
      const entries = accepted.map((file) => ({ file, entry: { id: `file-${(counter.current += 1)}`, name: file.name, size: file.size, loaded: 0, status: "uploading" as const } }));
      setFiles((prev) => [...prev, ...entries.map((e) => e.entry)]);
      for (const { file, entry } of entries) {
        const reader = new FileReader();
        reader.onprogress = (e) => e.lengthComputable && patch(entry.id, { loaded: e.loaded });
        reader.onload = () => patch(entry.id, { loaded: file.size, status: "complete" });
        reader.onerror = () => patch(entry.id, { status: "error" });
        reader.readAsArrayBuffer(file);
      }
    },
    [patch],
  );

  const remove = useCallback((id: string) => setFiles((prev) => prev.filter((f) => f.id !== id)), []);
  return { files, rejected, add, remove, uploading: files.some((f) => f.status === "uploading") };
}

export function UploadDropzone({ onAdd, isInvalid }: { onAdd: (files: File[]) => void; isInvalid?: boolean }) {
  const onDrop: NonNullable<DropZoneProps["onDrop"]> = async (e) => {
    const dropped = await Promise.all(e.items.flatMap((item) => (item.kind === "file" ? [item.getFile()] : [])));
    onAdd(dropped);
  };

  return (
    <DropZone
      onDrop={onDrop}
      className={({ isDropTarget, isFocusVisible }) =>
        cx(
          "font-barlow flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-primary px-6 py-8 text-center transition duration-100 ease-linear",
          isInvalid ? "border-error" : "border-primary",
          isDropTarget && "border-brand bg-brand-50",
          isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
        )
      }
    >
      <FeaturedIcon icon={Upload01} theme="modern" color="gray" size="md" />
      <Text slot="label" className="flex flex-wrap items-baseline justify-center gap-x-1 text-sm text-tertiary">
        <FileTrigger acceptedFileTypes={ACCEPTED_EXTENSIONS} allowsMultiple onSelect={(list) => list && onAdd(Array.from(list))}>
          <Button color="link-color" size="sm">
            Click to upload
          </Button>
        </FileTrigger>
        <span>or drag and drop here</span>
      </Text>
      <p className="text-xs text-quaternary">XLS or XLSX</p>
    </DropZone>
  );
}

export function FileQueue({ files, onRemove }: { files: QueuedFile[]; onRemove: (id: string) => void }) {
  if (files.length === 0) return null;
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Files to upload">
      {files.map((file) => {
        const percent = file.size === 0 ? 100 : Math.min(100, Math.round((file.loaded / file.size) * 100));
        return (
          <li key={file.id} className="flex items-start gap-3 rounded-xl border border-secondary bg-primary p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-quaternary">
              <File05 className="size-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="truncate text-sm font-medium text-secondary">{file.name}</p>
                <p className="flex flex-wrap items-center gap-x-2 text-sm text-tertiary">
                  <span>
                    {formatFileSize(file.loaded)} of {formatFileSize(file.size)}
                  </span>
                  {file.status === "complete" && (
                    <span className="flex items-center gap-1 text-success-primary">
                      <CheckCircle className="size-4" />
                      Complete
                    </span>
                  )}
                  {file.status === "error" && <span className="text-error-primary">Couldn&apos;t read this file. Remove it and try again.</span>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ProgressBarBase value={percent} className="flex-1" />
                <span className="w-10 shrink-0 text-right text-sm font-medium text-secondary tabular-nums">{percent}%</span>
              </div>
            </div>
            <Button color="tertiary" size="sm" iconLeading={Trash01} aria-label={`Remove ${file.name}`} onPress={() => onRemove(file.id)} />
          </li>
        );
      })}
    </ul>
  );
}
