import { cvStatus, cvStatusMeta, cvTypeLabel, resolvedEntries, type Cv } from "@/app/pages/_shared/ctrl-vocab/cv-data";

// The rows of the Control Vocab Detail Report: one row for each entry of each controlled vocabulary, beside the vocabulary it belongs to, with the
// columns of the designer's wireframe (Figma YMproGZfrFB5jUqPHPxMhk, 165:14635 and its Columns panel, 165:15172). An entry is read as Controlled
// Vocabulary writes it, so a Descriptive vocabulary's entries show the values of the source rows they offer. The wireframe's columns are a
// vocabulary's and an entry's in one row, so they are read like this:
//   - Control vocab ID, Control vocab name, Description, Category, Type, Status, Valid from and Valid until are the vocabulary's: its status is
//     Controlled Vocabulary's (Draft, Scheduled, Active, Archived), the one its valid dates decide, and not an entry's Available or Hidden;
//   - Control vocab code, Title, Name and Order are the entry's. A vocabulary has no code of its own, so Control vocab code is the entry's Code (or its
//     ID, for a vocabulary that is numbered), the thing that identifies the entry in it. Open for the designer (CONTRACTS 0.4);
//   - a vocabulary with no entry yet is one row, with the entry's columns empty, so it is still in the report;
//   - Created by and Modified by are the first and the last person in the vocabulary's own history, Created on and Modified on its days;
//   - Comments is empty: a vocabulary keeps no comment.

export interface VocabRow {
  id: string;
  seq: number;
  vocabId: string;
  code: string;
  vocabName: string;
  description: string;
  category: string;
  type: string;
  title: string;
  name: string;
  order: string;
  status: string;
  start: string;
  end: string;
  createdBy: string;
  created: string;
  modifiedBy: string;
  updated: string;
}

export function vocabRowsFor(cvs: Cv[]): VocabRow[] {
  const rows = cvs.flatMap((cv) => {
    const shared = {
      vocabId: cv.id,
      vocabName: cv.name,
      description: cv.description,
      category: cv.category,
      type: cvTypeLabel[cv.type],
      status: cvStatusMeta[cvStatus(cv)].label,
      start: cv.startDate,
      end: cv.endDate,
      createdBy: cv.history[0]?.by ?? "",
      created: cv.createdAt,
      modifiedBy: cv.history[cv.history.length - 1]?.by ?? "",
      updated: cv.updatedAt,
    };
    const entries = resolvedEntries(cv);
    if (entries.length === 0) return [{ ...shared, id: cv.id, code: "", title: "", name: "", order: "" }];
    return entries.map((e) => ({ ...shared, id: `${cv.id}:${e.id}`, code: e.code, title: e.title, name: e.name, order: e.order }));
  });
  return rows.map((r, i) => ({ ...r, seq: i + 1 }));
}
