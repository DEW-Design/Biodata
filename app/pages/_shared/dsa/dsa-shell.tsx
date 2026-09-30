"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ActionsGroup, downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { dsaStatusMeta } from "@/app/pages/_shared/dsa/dsa-data";
import { useDsas } from "@/app/pages/_shared/dsa/dsa-store";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { FormSidebarSlotContext } from "@/app/pages/_shared/form-section-list";
import { AgreementScopeNav } from "@/app/pages/_shared/agreement-scope";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { DSA_SECTION_LABEL, keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";

// The one shell every DSA route renders through (the agreement list, an agreement's deep dive, the
// new/edit form), so the three-column structure - primary icon rail, contextual sidebar, main - is
// the same on all of them, and for every persona: a role without access still gets all three
// columns, with the restricted message in main. Header, rail and section switching follow
// project-list/page.tsx; see .claude/rules/ref-shell.md, "List -> deep dive".
//
// Column 2 is the My agreements / All agreements switcher (`AgreementScopeNav`, `?scope=`) and,
// below it, the "Actions" group (Export CSV / Create report), folded in from /proto/collection-sidebar's
// own "Actions" baseline - see context/decisions/2026-09-24-05-proto-collection-sidebar-s-actions-group-and-its.md.
// Status is a filter on the list (`?status=` seeds it), not a place in column 2.
const CURRENT_KEY = "dsa";

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

// Column 2's content. Also rendered inside the mobile navigation menu, where the aside is hidden.
// `Actions` (Export CSV / Create report) below the status list is folded in directly from
// /proto/collection-sidebar's own "Actions" baseline (see context/decisions/2026-09-24-05-proto-collection-sidebar-s-actions-group-and-its.md) - real navigation, real data.
function ScopeNav() {
  const dsas = useDsas();

  return (
    <div className="flex flex-col gap-1">
      <AgreementScopeNav heading="Agreements" basePath="/pages/dsa" defaultScope="all" myLabel="My agreements" allLabel="All agreements" />
      <ActionsGroup
        onExportCsv={() =>
          downloadCsv(
            "data-sharing-agreements.csv",
            ["ID", "Data partner", "Status", "Valid to"],
            dsas.map((d) => [d.id, d.partner, dsaStatusMeta[d.status].label, d.validTo]),
          )
        }
      />
    </div>
  );
}

export function DsaShell({
  breadcrumbCurrent,
  formSidebar = false,
  children,
}: {
  /** The page-specific final crumb (an agreement ID, "New agreement"). When set, the section crumb becomes a link back to the list. */
  breadcrumbCurrent?: string;
  /** A create/edit form is rendered: column 2 becomes the form's own section list (the form portals into it via `FormSidebar`) instead of the scope switcher. */
  formSidebar?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();
  const canManage = useFeatureAccess("dsaManagement");
  const nav = navForRole(role);
  const roleHref = useRoleHref();

  // null = this DSA route's own section; anything else is a rail click on a section with no page
  // yet, shown in place, same as the other shells.
  const [localSection, setLocalSection] = useState<string | null>(null);
  const activeSection = localSection ?? DSA_SECTION_LABEL;
  const otherSection = localSection ? nav.find((section) => section.label === localSection) : undefined;
  const [formSlot, setFormSlot] = useState<HTMLElement | null>(null);
  const showStatusNav = canManage && !otherSection;

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
  else if (!canManage)
    main = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-lg font-semibold text-primary">{DSA_SECTION_LABEL}</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">Data Sharing Agreements are managed by BioData Admins. Your account doesn&apos;t have access to this section.</p>
        <Button color="link-color" size="sm" href={roleHref("/pages/dashboard")} iconTrailing={ArrowNarrowRight}>
          Go to Home
        </Button>
      </div>
    );

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
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
                <Link href={roleHref("/pages/dsa")} className="hover:text-primary">
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
        <PrimaryRail sections={nav} activeSection={canManage || otherSection ? activeSection : null} onSelectSection={goToSection} />

        {/* ── Contextual sidebar: always present, on every route and for every role ── */}
        <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          {showStatusNav && formSidebar ? (
            <div ref={setFormSlot} />
          ) : showStatusNav ? (
            <ScopeNav />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{otherSection?.label ?? DSA_SECTION_LABEL}</p>
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
