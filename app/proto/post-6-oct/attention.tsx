"use client";

// What needs the role's attention, one notification each, for the bell (notifications-popover.tsx). A Registered User has the
// three tasks Home shows. A reviewer has what they act on, one row per item and by the same rule as the banner on each list
// (`DlaBanner`: requests under review; `NominationBanner`: nominations submitted and waiting for the panel), so the bell and the
// page never give two numbers for one fact: each request waiting for a decision, each nomination waiting for the panel, and the
// flagged concepts open across the projects as one row (there are too many for one each). Other roles have none in the preview.
// A row is a sentence with its key words in bold, a tinted icon and, where the data has a date, when it happened. It opens a tab in
// the lab (`open`) or, for a page the lab does not hold, the real page (`href`).
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

export type Tone = "brand" | "gray" | "success" | "warning" | "error";

export interface AttentionTask {
  id: string;
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

  const flagged = useMemo(
    () => [...collectReviewItems(notes, SURVEY_RECORDS).open.map((i) => toEntry(i, "open")), ...portfolio.filter((e) => e.status === "open")],
    [notes, portfolio],
  );

  return useMemo(() => {
    if (role === "registered-user") {
      return dashboardTasks.map((t, i): AttentionTask => ({
        id: `task-${i}`,
        segments: [{ text: wording(t.title), bold: true }, { text: `. ${t.detail}` }],
        icon: t.icon,
        tone: t.statusColor === "success" || t.statusColor === "warning" || t.statusColor === "error" ? t.statusColor : "brand",
        href: t.actionHref,
      }));
    }
    const out: AttentionTask[] = [];
    if (canReviewDla) {
      for (const d of dlas.filter((x) => x.status === "under_review")) {
        out.push({
          id: `dla:${d.id}`,
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
        segments: [{ text: plural(flagged.length, "flagged concept", "flagged concepts"), bold: true }, { text: ` ${flagged.length === 1 ? "is" : "are"} open across ${plural(projects, "project", "projects")}` }],
        icon: Flag01,
        tone: "error",
        href: "/pages/flagged-concepts",
      });
    }
    return out;
  }, [role, dlas, nominations, flagged, canReviewDla, canReviewNominations, canReviewFlagged]);
}
