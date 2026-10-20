"use client";

// What needs the role's attention, one notification each, for the bell (notifications-popover.tsx). A Registered User has the
// three tasks Home shows. A reviewer has what they act on, one row per item and by the same rule as the banner on each list
// (`DlaBanner`: requests under review; `NominationBanner`: nominations submitted and waiting for the panel), so the bell and the
// page never give two numbers for one fact: each request waiting for a decision, each nomination waiting for the panel, and the
// flagged concepts open across the projects as one row (there are too many for one each). Other roles have none in the preview.
// A row is a sentence with its key words in bold, a tinted icon and, where the data has a date, when it happened. It opens a tab in
// the lab (`open`) or, for a page the lab does not hold, the real page (`href`). Each row has a kind, so the bell can filter by it (uploads, requests, nominations, flagged
// concepts, tasks); finished uploads are rows too (upload-activity.ts), for every signed in role.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useMemo, type FC } from "react";
import { Feather, FileLock01, Flag01 } from "@untitledui/icons";
import { dashboardTasks } from "@/app/pages/_shared/home-dashboard";
import { requestorName } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { useFieldNotes } from "@/app/pages/project-detail/field-notes-store";
import { usePortfolioEntries } from "@/app/pages/project-detail/flagged-portfolio";
import { collectReviewItems, toEntry } from "@/app/pages/project-detail/review-view";
import { SURVEY_RECORDS } from "@/app/pages/project-detail/survey-data";
import { useCanReview } from "@/app/pages/project-detail/field-notes";
import { REGISTRATION_SPECIES } from "@/app/pages/project-registration/data";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useUserRole } from "@/lib/use-user-role";
import type { SectionKey } from "./sections";
import { useUploadActivity } from "./upload-activity";

export type Tone = "brand" | "gray" | "success" | "warning" | "error";

/** What a row is about: the bell's filter. */
export type ActivityKind = "upload" | "request" | "nomination" | "flagged" | "task";

/** The wording for each kind, in the order the bell's kind tabs list them (short enough for five to sit in a 380px popover). */
export const ACTIVITY_KINDS: { id: ActivityKind; label: string }[] = [
  { id: "upload", label: "Uploads" },
  { id: "request", label: "Requests" },
  { id: "nomination", label: "Nominations" },
  { id: "flagged", label: "Flagged" },
  { id: "task", label: "Tasks" },
];

export interface AttentionTask {
  id: string;
  kind: ActivityKind;
  /** Whether it asks something of the person (Inbox, with an unread dot, Done and Archive) or only tells them (Activity: a log, never unread). */
  attention: boolean;
  /** A row of two lines, for an event with a file and a project: what happened, then the muted detail. A row without them is the `segments` sentence. */
  title?: string;
  detail?: string;
  /** What the detail is made of, so rows of the same `group` (same outcome, project and day) can fold into one: "3 uploads added". */
  file?: string;
  project?: string;
  group?: string;
  groupTitle?: (count: number) => string;
  /** The sentence, in pieces: the bold ones are what the row is about. */
  segments: { text: string; bold?: boolean }[];
  icon: FC<{ className?: string }>;
  tone: Tone;
  /** An ISO date, when the data has one for the event; a row without one shows no time (none is invented). */
  at?: string;
  /** Opens a section tab in the lab, optionally narrowed to some statuses. */
  open?: { section: SectionKey; statuses?: string[] };
  /** A page the lab does not hold: opens the real page. */
  href?: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The Home tasks name a page; the page says what the row is about. */
function kindOfHref(href?: string): ActivityKind {
  if (href?.startsWith("/pages/dla")) return "request";
  if (href?.startsWith("/pages/nominations")) return "nomination";
  if (href?.includes("dataset") || href?.includes("upload")) return "upload";
  return "task";
}

/** The lab writes "data licence request", not the acronym (designer, 12 Oct 2026); the shared task copy still carries it. */
const wording = (text: string) => text.replace(/\bDLA request\b/g, "Data licence request");

export function useAttention(): AttentionTask[] {
  const role = useUserRole();
  const canReviewDla = useFeatureAccess("dlaApproval");
  const canReviewNominations = useFeatureAccess("nominationReview");
  const canReviewFlagged = useCanReview();
  const dlas = useDlas();
  const nominations = useNominations();
  const notes = useFieldNotes();
  const portfolio = usePortfolioEntries();
  const uploads = useUploadActivity();

  const flagged = useMemo(
    () => [...collectReviewItems(notes, SURVEY_RECORDS).open.map((i) => toEntry(i, "open")), ...portfolio.filter((e) => e.status === "open")],
    [notes, portfolio],
  );

  return useMemo(() => {
    if (role === "registered-user") {
      const tasks = dashboardTasks.map((t, i): AttentionTask => ({
        id: `task-${i}`,
        kind: kindOfHref(t.actionHref),
        attention: true,
        segments: [{ text: wording(t.title), bold: true }, { text: `. ${t.detail}` }],
        icon: t.icon,
        tone: t.statusColor === "success" || t.statusColor === "warning" || t.statusColor === "error" ? t.statusColor : "brand",
        href: t.actionHref,
      }));
      return [...tasks, ...uploads];
    }
    const out: AttentionTask[] = [];
    if (canReviewDla) {
      for (const d of dlas.filter((x) => x.status === "under_review")) {
        out.push({
          id: `dla:${d.id}`,
          kind: "request",
          attention: true,
          segments: [{ text: "Request " }, { text: d.id, bold: true }, { text: " from " }, { text: requestorName(d.requestor), bold: true }, { text: " is waiting for your decision" }],
          icon: FileLock01,
          tone: "warning",
          at: d.updatedAt,
          open: { section: "dla", statuses: ["under_review"] },
        });
      }
    }
    if (canReviewNominations) {
      for (const n of nominations.filter((x) => x.status === "submitted")) {
        const species = REGISTRATION_SPECIES.find((s) => s.id === n.speciesId)?.commonName ?? n.speciesId;
        out.push({
          id: `nomination:${n.id}`,
          kind: "nomination",
          attention: true,
          segments: [{ text: "The " }, { text: species, bold: true }, { text: " nomination from " }, { text: n.nominator.name, bold: true }, { text: " is waiting for the panel" }],
          icon: Feather,
          tone: "warning",
          at: n.updatedAt,
          open: { section: "nominations", statuses: ["submitted"] },
        });
      }
    }
    if (canReviewFlagged && flagged.length > 0) {
      const projects = new Set(flagged.map((e) => e.projectCode)).size;
      out.push({
        id: "flagged",
        kind: "flagged",
        attention: true,
        segments: [{ text: plural(flagged.length, "flagged concept", "flagged concepts"), bold: true }, { text: ` ${flagged.length === 1 ? "is" : "are"} open across ${plural(projects, "project", "projects")}` }],
        icon: Flag01,
        tone: "error",
        href: "/pages/flagged-concepts",
      });
    }
    return [...out, ...uploads];
  }, [role, dlas, nominations, flagged, canReviewDla, canReviewNominations, canReviewFlagged, uploads]);
}
