"use client";

import { useMemo } from "react";
import { Database01 } from "@untitledui/icons";
import { useCvs } from "@/app/pages/_shared/ctrl-vocab/cv-store";
import { dayAttribute, dayColumn, distinct, optionsAttribute, periodAttribute, seqColumn, stampColumns } from "@/app/pages/_shared/reports/admin-report-helpers";
import { vocabRowsFor, type VocabRow } from "@/app/pages/_shared/reports/ctrl-vocab-detail-report-data";
import { REPORT_WIDTH as W, emptyColumn, idColumn, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { DataReport } from "@/app/pages/_shared/reports/report-table";

// The Control Vocab Detail Report (the designer, 16 Oct 2026, Figma YMproGZfrFB5jUqPHPxMhk frame 165:14635 and its Columns panel 165:15172): one row
// for each entry of each controlled vocabulary, every column of the wireframe in its order, in a table that scrolls sideways. BioData Super Admin
// only (`ctrlVocabManagement`, as Controlled Vocabulary itself). ctrl-vocab-detail-report-data.ts says how each column is read. Fitted into the
// shared report pattern (report-table.tsx) with these departures from the wireframe, on purpose:
//   - the wireframe's Filters card is the table's own controls (CONTRACTS 4.6 item 4): Control Vocab Name is the search; Category Name, Type and
//     Status are attributes of the one Filter menu, which also offers the vocabulary's valid period and the day it was last modified (the wireframe's
//     Date); the report is not run on anything, so it has no Parameters;
//   - labels are sentence case ("Control Vocab ID" is "Control vocab ID"), and the wireframe's Filters card calls Category what its Columns panel
//     calls Category and its Filters Category Name: one column, one label.
// The first column, Seq#, is pinned when the table scrolls sideways.

const columns: ViewColumn<VocabRow>[] = [
  seqColumn<VocabRow>(),
  idColumn("vocabId", "Control vocab ID", W.md, (r) => r.vocabId),
  textColumn("code", "Control vocab code", W.md, (r) => r.code),
  textColumn("vocabName", "Control vocab name", W.xl, (r) => r.vocabName, { strong: true }),
  textColumn("description", "Description", W.xl, (r) => r.description, { clamp: true }),
  textColumn("category", "Category", W.lg, (r) => r.category),
  textColumn("type", "Type", W.md, (r) => r.type),
  textColumn("title", "Title", W.lg, (r) => r.title),
  textColumn("name", "Name", W.lg, (r) => r.name),
  numberColumn<VocabRow>("order", "Order", W.xs, (r) => r.order),
  textColumn("status", "Status", W.sm, (r) => r.status),
  dayColumn<VocabRow>("start", "Valid from", W.md, (r) => r.start),
  dayColumn<VocabRow>("end", "Valid until", W.md, (r) => r.end),
  ...stampColumns<VocabRow>({ createdBy: (r) => r.createdBy, createdOn: (r) => r.created, modifiedBy: (r) => r.modifiedBy, modifiedOn: (r) => r.updated }),
  emptyColumn("comments", "Comments", W.xl),
];

export function CtrlVocabDetailReport() {
  const vocabularies = useCvs();
  const rows = useMemo(() => vocabRowsFor(vocabularies), [vocabularies]);
  const attributes = useMemo(
    () => [
      ...optionsAttribute("category", "Category", rows, (r) => r.category, { searchable: true }),
      ...optionsAttribute("type", "Type", rows, (r) => r.type),
      ...optionsAttribute("status", "Status", rows, (r) => r.status),
      periodAttribute<VocabRow>("valid", "Valid period", (r) => r.start, (r) => r.end),
      dayAttribute<VocabRow>("modified", "Modified on", (r) => r.updated),
    ],
    [rows],
  );
  return (
    <DataReport
      title="Control Vocab Detail Report"
      subtitle="Every controlled vocabulary entry beside its vocabulary: the category, type and status, its title, name and order."
      icon={Database01}
      rows={rows}
      rowId={(r) => r.id}
      columns={columns}
      attributes={attributes}
      searchText={(r) => [r.vocabId, r.vocabName, r.code, r.name, r.title, r.category]}
      searchLabel="Search the report"
      searchPlaceholder="Search by vocabulary, code or name"
      tableLabel="Vocabulary entries, one row each"
      noun="entries"
      emptyDescription="Entries appear here once a controlled vocabulary is added."
      initialSort={{ column: "seq", direction: "ascending" }}
      latest={(r) => r.updated}
      facts={(inView) => [
        { label: "Vocabularies", value: distinct(inView, (r) => r.vocabId) },
        { label: "Categories", value: distinct(inView, (r) => r.category) },
      ]}
      exportName="control-vocab-detail-report"
    />
  );
}
