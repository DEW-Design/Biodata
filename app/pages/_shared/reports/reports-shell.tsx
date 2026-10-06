"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { REPORTS } from "@/app/pages/_shared/reports/reports-data";
import { ReportSwitcher } from "@/app/pages/_shared/reports/report-switcher";
import { CreateReportModal } from "@/app/pages/_shared/reports/create-report-modal";
import { ReportsNav } from "@/app/pages/_shared/reports/reports-nav";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { REPORTS_SECTION_LABEL, keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";

// The Reports section's shell, the same shape as the Template Finder's and NominationShell. The landing
// page (/pages/reports) lists the reports as cards and each report has its own route under it, so column 2
// is the section label alone: the reports are the landing page's cards, not a second list beside them, and
// column 2 holds no information (CONTRACTS 3.10). `current` names the report on a report's own page, for the
// breadcrumb.
const CURRENT_KEY = "reports";

function SectionPlaceholder({ node }: { node: NavNode }) {
  const relatedLink = node.key ? node : node.items?.find((item) => item.key);
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">{node.label}</h1>
      <p className="max-w-sm text-sm text-tertiary">
        {relatedLink ? "This section has its own page - it isn't embedded here." : "This section's content hasn't been scoped yet - only its place in the navigation is decided so far."}
      </p>
      {relatedLink && (
        <Button color="link-color" size="sm" href={roleHref(keyHref(relatedLink.key!))} iconTrailing={ArrowNarrowRight}>
          Go to {relatedLink.label}
        </Button>
      )}
    </div>
  );
}

export function ReportsShell({ children, current }: { children: ReactNode; current?: string }) {
  const router = useRouter();
  const role = useUserRole();
  const canAccess = useFeatureAccess("reports");
  const nav = navForRole(role);
  const roleHref = useRoleHref();

  const reportsLabel = nav.find((section) => section.key === CURRENT_KEY)?.label ?? REPORTS_SECTION_LABEL;
  const [localSection, setLocalSection] = useState<string | null>(null);
  const activeSection = localSection ?? reportsLabel;
  const otherSection = localSection ? nav.find((section) => section.label === localSection) : undefined;

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key === CURRENT_KEY) setLocalSection(null);
    else if (relatedLink?.key) router.push(roleHref(keyHref(relatedLink.key)));
    else setLocalSection(section.label);
  };

  let main: ReactNode = children;
  if (otherSection) main = <SectionPlaceholder node={otherSection} />;
  else if (!canAccess)
    main = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-lg font-semibold text-primary">Reports</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">Reports need a free BioData SA account. Create one to see reports on your uploads and the projects you contribute to.</p>
        <Button color="link-color" size="sm" href={roleHref("/pages/dashboard")} iconTrailing={ArrowNarrowRight}>
          Go to Home
        </Button>
      </div>
    );

  // A record's page (a user, a request, a report ...) has no column 2: the whole width is the record (CONTRACTS 3.7). Its
  // navigation is the breadcrumb switcher, and its actions are in the record's own card.
  const recordPage = canAccess && !otherSection && !!current;

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={activeSection}
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          >
            {canAccess && !otherSection && !recordPage ? () => <ReportsNav /> : undefined}
          </MobileNavTrigger>
        }
        section={current && !otherSection ? <ReportSwitcher label={activeSection} currentReportId={REPORTS.find((r) => r.title === current)?.id} /> : activeSection}
        current={current}
      />

      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection={canAccess || otherSection ? activeSection : null} onSelectSection={goToSection} />

        {!recordPage && (
          <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
            {canAccess && !otherSection ? (
              <ReportsNav />
            ) : (
              <div className="flex flex-col gap-1">
                <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{otherSection?.label ?? "Reports"}</p>
                {otherSection?.items?.map((item) => (
                  <p key={item.label} className="px-2 py-2 text-sm text-tertiary">
                    {item.label}
                  </p>
                ))}
              </div>
            )}
          </aside>
        )}

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{main}</main>
        {canAccess && <CreateReportModal />}
      </div>
    </div>
  );
}
