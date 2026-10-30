"use client";

import { formatShortDate } from "@/app/pages/_shared/dla/dla-data";
import { RecordRow } from "@/app/pages/_shared/record-hero";
import { mergeFacts, type FileFacts } from "@/app/pages/_shared/dataset-upload/file-facts";

// "From your file": what the files added to the Dataset step state about the project's data, read in the browser. A fact a file does not
// state reads "Not in the file", never a guess (CONTRACTS 0.3). The rows are the ones the project's own fields will be built from.

export type FileRead = { state: "reading" } | { state: "read"; facts: FileFacts } | { state: "error"; file: string };

const NOT_IN_FILE = "Not in the file";
const count = (n: number, one: string, many: string) => (n === 0 ? NOT_IN_FILE : `${n.toLocaleString("en-AU")} ${n === 1 ? one : many}`);

export function FileFactsCard({ reads }: { reads: FileRead[] }) {
  const read = reads.flatMap((r) => (r.state === "read" ? [r.facts] : []));
  const failed = reads.flatMap((r) => (r.state === "error" ? [r] : []));
  const reading = reads.some((r) => r.state === "reading");
  const merged = read.length > 0 ? mergeFacts(read) : null;
  // A file with nothing in it that can be read as a site, a visit or a species says so once, in a sentence, not as a table of "Not in the file".
  const nothing = !!merged && !merged.firstDay && merged.sites === 0 && merged.visits === 0 && merged.records === 0;
  const dates = merged?.firstDay ? (merged.lastDay && merged.lastDay !== merged.firstDay ? `${formatShortDate(merged.firstDay)} to ${formatShortDate(merged.lastDay)}` : formatShortDate(merged.firstDay)) : NOT_IN_FILE;

  return (
    <div className="flex flex-col gap-3">
      {reading && <p className="m-0 text-sm text-tertiary">Reading your file</p>}
      {failed.map((f) => (
        <p key={f.file} className="m-0 text-sm text-balance text-error-primary">
          {f.file} could not be read as a workbook.
        </p>
      ))}
      {merged && nothing && <p className="m-0 text-sm text-balance text-tertiary">Nothing in {read.length === 1 ? "this file" : "these files"} could be read as sites, visits or species, so nothing is filled in from {read.length === 1 ? "it" : "them"}.</p>}
      {merged && !nothing && (
        <div className="rounded-lg border border-secondary">
          <RecordRow label="Dates surveyed">{dates}</RecordRow>
          <RecordRow label="Sites">{count(merged.sites, "site", "sites")}</RecordRow>
          <RecordRow label="Visits">{count(merged.visits, "visit", "visits")}</RecordRow>
          <RecordRow label="Species records">{count(merged.records, "record", "records")}</RecordRow>
          <RecordRow label="Species">{count(merged.species.length, "species", "species")}</RecordRow>
          {read.length === 1 && read[0].readAs && <RecordRow label="Read as">{read[0].readAs}</RecordRow>}
        </div>
      )}
    </div>
  );
}
