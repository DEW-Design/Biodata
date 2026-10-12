"use client";

// "Needs your attention" for the bell (and the rail card, when it comes back), by role. A Registered User has the three tasks Home shows. A
// reviewer has the queues they act on, counted from the same stores and by the same rule as the banner on each list
// (`DlaBanner`: requests under review; `NominationBanner`: nominations submitted and waiting for the panel), so the card and the
// page never give two numbers for one fact; and flagged concepts open across the projects. Other roles have none in the preview.
// A task opens a tab in the lab (`open`) or, for a record the lab does not hold, the real page (`href`).
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useMemo } from "react";
import { Feather, FileLock01, Flag01 } from "@untitledui/icons";
import type { BadgeColor } from "@/components/base/badges/badges";
import { dashboardTasks } from "@/app/pages/_shared/home-dashboard";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { useFieldNotes } from "@/app/pages/project-detail/field-notes-store";
import { usePortfolioEntries } from "@/app/pages/project-detail/flagged-portfolio";
import { collectReviewItems, toEntry } from "@/app/pages/project-detail/review-view";
import { SURVEY_RECORDS } from "@/app/pages/project-detail/survey-data";
import { useCanReview } from "@/app/pages/project-detail/field-notes";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useUserRole } from "@/lib/use-user-role";
import type { SectionKey } from "./sections";

export interface AttentionTask {
  id: string;
  title: string;
  detail: string;
  /** A status badge for the bell, when the task has one. */
  status?: string;
  statusColor?: BadgeColor<"pill-color">;
  actionLabel: string;
  /** Opens a section tab in the lab, optionally narrowed to some statuses. */
  open?: { section: SectionKey; statuses?: string[] };
  /** A page the lab does not hold: opens the real page. */
  href?: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

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
      return dashboardTasks.map((t, i) => ({ id: `task-${i}`, title: t.title, detail: t.detail, status: t.status, statusColor: t.statusColor, actionLabel: t.actionLabel ?? "Open", href: t.actionHref }));
    }
    const out: AttentionTask[] = [];
    const waitingDla = dlas.filter((d) => d.status === "under_review").length;
    if (canReviewDla && waitingDla > 0) {
      out.push({
        id: "dla",
        title: `${plural(waitingDla, "data licence request", "data licence requests")} waiting for a decision`,
        detail: "Under review. Approve or reject each one.",
        actionLabel: "Review requests",
        open: { section: "dla", statuses: ["under_review"] },
      });
    }
    const waitingNominations = nominations.filter((n) => n.status === "submitted").length;
    if (canReviewNominations && waitingNominations > 0) {
      out.push({
        id: "nominations",
        title: `${plural(waitingNominations, "nomination", "nominations")} waiting for the panel`,
        detail: "Sensitive species nominations submitted and waiting for a review to start.",
        actionLabel: "Review nominations",
        open: { section: "nominations", statuses: ["submitted"] },
      });
    }
    if (canReviewFlagged && flagged.length > 0) {
      const projects = new Set(flagged.map((e) => e.projectCode)).size;
      out.push({
        id: "flagged",
        title: `${plural(flagged.length, "flagged concept", "flagged concepts")} open`,
        detail: `Across ${plural(projects, "project", "projects")}. The longest has waited ${Math.max(0, ...flagged.map((e) => e.daysWaiting ?? 0))} days.`,
        actionLabel: "Review concepts",
        href: "/pages/flagged-concepts",
      });
    }
    return out;
  }, [role, dlas, nominations, flagged, canReviewDla, canReviewNominations, canReviewFlagged]);
}

/** The icon a task carries in the bell. */
export const taskIcon = (task: AttentionTask) => (task.id === "dla" ? FileLock01 : task.id === "nominations" ? Feather : task.id === "flagged" ? Flag01 : undefined);
