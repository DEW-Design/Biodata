"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ActionsGroup, downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { dlaStatusMeta, requestorName } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { FormSidebarSlotContext } from "@/app/pages/_shared/form-section-list";
import { AgreementScopeNav } from "@/app/pages/_shared/agreement-scope";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { DLA_SECTION_LABEL, keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";

// The one shell every DLA route renders through (the request list, a request's deep dive, the new
// request/renew form) - same "List -> deep dive" shape as DSA's own shell
// (app/pages/_shared/dsa/dsa-shell.tsx), which this file mirrors closely. See CONTEXT.md, "Data
// Licencing Agreement (DLA)".
//
// Column 2 is the request status buckets (see agreement-status.ts's shared DSA/DLA workflow -
// Draft/Submitted/Under Review/Approved/Rejected/Active/On Hold/Closed/Cancelled) as links back to
// the list - on the list it's the filter, on a deep dive or the form it shows which bucket the
// request is in and gets you back out. Below the status list, an "Actions" group (Export CSV /
// Create report) is folded in from /proto/collection-sidebar's own "Actions" baseline - see
// CONTEXT.md.
const CURRENT_KEY = "dla";

function SectionPlaceholder({ node }: { node: NavNode }) {
  const relatedLink = node.key ? node : node.items?.find((item) => item.key);
  const roleHref = useRoleHref();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-medium text-primary">{node.label}</h1>
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

// Column 2's content. Also rendered inside the mobile navigation menu, where the aside is hidden.
// `Actions` (Export CSV / Create report) below the status list is folded in directly from
// /proto/collection-sidebar's own "Actions" baseline (see CONTEXT.md) - real navigation, real data.
function ScopeNav() {
  const dlas = useDlas();
  const canReview = useFeatureAccess("dlaApproval");

  return (
    <div className="flex flex-col gap-1">
      <AgreementScopeNav heading="Requests" basePath="/pages/dla" defaultScope={canReview ? "all" : "mine"} myLabel="My requests" allLabel="All requests" />
      <ActionsGroup
        onExportCsv={() =>
          downloadCsv(
            "data-licencing-agreements.csv",
            ["ID", "Requestor", "Status", "Valid to"],
            dlas.map((d) => [d.id, requestorName(d.requestor), dlaStatusMeta[d.status].tabLabel, d.validTo]),
          )
        }
      />
    </div>
  );
}

export function DlaShell({
  breadcrumbCurrent,
  formSidebar = false,
  children,
}: {
  /** The page-specific final crumb (a request ID, "New request"). When set, the section crumb becomes a link back to the list. */
  breadcrumbCurrent?: string;
  /** A create/edit form is rendered: column 2 becomes the form's own section list (the form portals into it via `FormSidebar`) instead of the status buckets. */
  formSidebar?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();
  const canAccess = useFeatureAccess("dlaAccess");
  const nav = navForRole(role);
  const roleHref = useRoleHref();

  // null = this DLA route's own section; anything else is a rail click on a section with no page
  // yet, shown in place, same as the other shells.
  const [localSection, setLocalSection] = useState<string | null>(null);
  const activeSection = localSection ?? DLA_SECTION_LABEL;
  const otherSection = localSection ? nav.find((section) => section.label === localSection) : undefined;
  const [formSlot, setFormSlot] = useState<HTMLElement | null>(null);
  const showStatusNav = canAccess && !otherSection;

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key === CURRENT_KEY) {
      setLocalSection(null);
    } else if (relatedLink?.key) {
      router.push(roleHref(keyHref(relatedLink.key)));
    } else {
      setLocalSection(section.label);
    }
  };

  let main: ReactNode = children;
  if (otherSection) main = <SectionPlaceholder node={otherSection} />;
  else if (!canAccess)
    main = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-lg font-medium text-primary">{DLA_SECTION_LABEL}</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">Data Licencing Agreements need a free BioData SA account. Create one to request or manage your own.</p>
        <Button color="link-color" size="sm" href={roleHref("/pages/dashboard")} iconTrailing={ArrowNarrowRight}>
          Go to Home
        </Button>
      </div>
    );

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <RoleSwitcher />
      {/* ── Header: full width, above the rail + sidebar + main row ── */}
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
            {showStatusNav && !formSidebar ? () => <ScopeNav /> : undefined}
          </MobileNavTrigger>
        }
        section={
              breadcrumbCurrent && !otherSection ? (
                <Link href={roleHref("/pages/dla")} className="hover:text-primary">
                  {activeSection}
                </Link>
              ) : (
                activeSection
              )
            }
        current={otherSection ? undefined : breadcrumbCurrent}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Primary icon rail ── */}
        <PrimaryRail sections={nav} activeSection={canAccess || otherSection ? activeSection : null} onSelectSection={goToSection} />

        {/* ── Contextual sidebar: always present, on every route and for every role ── */}
        <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          {showStatusNav && formSidebar ? (
            <div ref={setFormSlot} />
          ) : showStatusNav ? (
            <ScopeNav />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{otherSection?.label ?? DLA_SECTION_LABEL}</p>
              {otherSection?.items?.map((item) => (
                <p key={item.label} className="px-2 py-2 text-sm text-tertiary">
                  {item.label}
                </p>
              ))}
            </div>
          )}
          <SidebarFooterLinks />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <FormSidebarSlotContext.Provider value={formSlot}>{main}</FormSidebarSlotContext.Provider>
        </main>
      </div>
    </div>
  );
}
