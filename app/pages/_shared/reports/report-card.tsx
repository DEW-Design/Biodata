"use client";

import Link from "next/link";
import { ArrowNarrowRight } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { FavouriteButton, ReportMenu, openedLabel } from "@/app/pages/_shared/reports/report-actions";
import type { ReportEntry } from "@/app/pages/_shared/reports/reports-data";
import { useRoleHref } from "@/lib/use-role-href";

// One report on the landing page: its icon, its name, what it answers, a link, when it was last opened, and a star and a
// "..." menu at the top right. The whole card is the target, through one stretched link on the title (a real link with a
// real name, not a card wrapped in an anchor, so text stays selectable and a screen reader announces one link per report);
// the star and the menu sit above that link (`relative z-10`) so they are their own targets.
export function ReportCard({ report, isFavourite, openedAt }: { report: ReportEntry; isFavourite: boolean; openedAt: number | undefined }) {
  const roleHref = useRoleHref();
  return (
    <BentoCard className="group relative gap-4 transition-colors duration-150 hover:border-primary">
      <div className="flex items-start justify-between gap-3">
        <FeaturedIcon icon={report.icon} theme="light" color="brand" size="lg" />
        <div className="relative z-10 flex items-center gap-1">
          <FavouriteButton report={report} isFavourite={isFavourite} />
          <ReportMenu report={report} isFavourite={isFavourite} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-base font-semibold text-balance text-primary">
          <Link
            href={roleHref(report.path)}
            className="rounded-sm outline-focus-ring after:absolute after:inset-0 after:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {report.title}
          </Link>
        </h2>
        <p className="m-0 text-sm text-balance text-tertiary">{report.description}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="flex items-center gap-1 text-sm font-semibold text-brand-secondary" aria-hidden>
          Open report
          <ArrowNarrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
        <span className="text-xs text-tertiary">{openedAt ? `Opened ${openedLabel(openedAt)}` : openedLabel(openedAt)}</span>
      </div>
    </BentoCard>
  );
}
