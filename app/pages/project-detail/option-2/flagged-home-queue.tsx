"use client";

// The admin's Home view of flagged concepts across every project (29 Sept 2026): how many are open,
// in how many projects, and the ones waiting longest, each a link to the all-projects Flagged
// concepts page with that one open (`/pages/flagged-concepts?item=...`). "Review all" opens that page.
//
// BD-5039's items come from the persisted field-notes store with the seed records (edits made on
// project detail are held for that page's session only); the other projects' come from the
// flagged-portfolio store.

import Link from "next/link";
import { useMemo } from "react";
import { ArrowNarrowRight, Flag01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CountBadge } from "@/components/base/badges/badges";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { useRoleHref } from "@/lib/use-role-href";
import { useFieldNotes } from "./field-notes-store";
import { usePortfolioEntries } from "./flagged-portfolio";
import { collectReviewItems, toEntry, waited } from "./review-view";
import { SURVEY_RECORDS } from "./survey-data";

const REVIEW_PATH = "/pages/flagged-concepts";
const SHOWN = 5;

export function FlaggedConceptsHomeQueue() {
  const roleHref = useRoleHref();
  const notes = useFieldNotes();
  const portfolio = usePortfolioEntries();
  const all = useMemo(
    () =>
      [
        ...collectReviewItems(notes, SURVEY_RECORDS).open.map((i) =>
          toEntry(i, "open"),
        ),
        ...portfolio.filter((e) => e.status === "open"),
      ].sort((a, b) => (b.daysWaiting ?? 0) - (a.daysWaiting ?? 0)),
    [notes, portfolio],
  );
  const projectCount = new Set(all.map((e) => e.projectCode)).size;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-primary">Flagged concepts</h2>
          <CountBadge count={all.length} />
        </div>
        {all.length > 0 && (
          <Button
            color="link-color"
            size="sm"
            href={roleHref(REVIEW_PATH)}
            iconTrailing={ArrowNarrowRight}
          >
            Review all
          </Button>
        )}
      </div>
      <BentoCard className="gap-0 p-0">
        {all.length === 0 ? (
          <p className="p-5 text-sm text-tertiary">
            No values are flagged for review in any project.
          </p>
        ) : (
          <>
            <p className="border-b border-secondary px-5 py-3 text-sm text-balance text-tertiary">
              {all.length} value{all.length === 1 ? "" : "s"} marked
              questionable across {projectCount} project
              {projectCount === 1 ? "" : "s"}. The oldest has waited{" "}
              {waited(all[0].daysWaiting).toLowerCase()}.
            </p>
            <ul className="flex flex-col">
              {all.slice(0, SHOWN).map((e) => (
                <li
                  key={e.id}
                  className="border-b border-secondary last:border-b-0"
                >
                  <Link
                    href={roleHref(
                      `${REVIEW_PATH}?item=${encodeURIComponent(e.id)}`,
                    )}
                    className="flex items-center gap-3 px-5 py-3 outline-focus-ring transition-colors hover:bg-primary_hover focus-visible:outline-2 focus-visible:-outline-offset-2"
                  >
                    <Flag01 className="size-4 shrink-0 text-fg-warning-primary" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="truncate text-sm font-semibold text-primary">
                        {e.field}
                        <span className="font-normal text-tertiary">
                          {" "}
                          · {e.recordCode} {e.recordName}
                        </span>
                      </p>
                      <p className="truncate text-xs text-tertiary">
                        {e.projectCode} · {e.projectName} · {e.reason}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-quaternary">
                      {waited(e.daysWaiting)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {all.length > SHOWN && (
              <p className="border-t border-secondary px-5 py-3 text-sm text-tertiary">
                {all.length - SHOWN} more in the review queue.
              </p>
            )}
          </>
        )}
      </BentoCard>
    </div>
  );
}
