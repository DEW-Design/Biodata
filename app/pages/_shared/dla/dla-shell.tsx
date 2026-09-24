"use client";

import type { FC, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight, BarChart01, CheckCircle, Clock, Edit05, Feather, FileCheck02, FileLock01, FileSearch01, Folder, HomeLine, Map01, MinusCircle, PauseCircle, Plus, Send01, SlashCircle01, Upload01, XCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CountBadge } from "@/components/base/badges/badges";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { ActionsGroup, downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { dlaStatusMeta, dlaStatusOrder, requestorName, type DlaStatus } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { GlobalProjectSearch } from "@/app/pages/_shared/global-search";
import { GuestActionButton } from "@/app/pages/_shared/guest-action-gate";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { GuestAuthActions, ProfileMenu } from "@/app/pages/_shared/profile-menu";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { orgLabelForRole } from "@/lib/user-role";
import { DLA_SECTION_LABEL, DSA_SECTION_LABEL, keyHref, navForRole, registeredUserFooterLinks, type NavNode } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";

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

const sectionIcons: Record<string, FC<{ className?: string }>> = {
  Home: HomeLine,
  Projects: Folder,
  Explore: Map01,
  [DLA_SECTION_LABEL]: FileLock01,
  [DSA_SECTION_LABEL]: FileCheck02,
  "Nominate Sensitive Species": Feather,
  "Reports (Own Submissions)": BarChart01,
  "Template Finder": FileSearch01,
};

const statusIcons: Record<DlaStatus, FC<{ className?: string }>> = {
  draft: Edit05,
  submitted: Send01,
  under_review: Clock,
  on_hold: PauseCircle,
  approved: CheckCircle,
  rejected: XCircle,
  active: CheckCircle,
  closed: SlashCircle01,
  cancelled: MinusCircle,
};

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

function FooterLinks() {
  return (
    <div className="flex flex-col gap-2 border-t border-secondary pt-4 text-xs text-quaternary">
      {registeredUserFooterLinks.map((link) => (
        <p key={link}>{link}</p>
      ))}
    </div>
  );
}

// Column 2's content. Also rendered inside the mobile navigation menu, where the aside is hidden.
// `Actions` (Export CSV / Create report) below the status list is folded in directly from
// /proto/collection-sidebar's own "Actions" baseline (see CONTEXT.md) - real navigation, real data.
function StatusNav({ activeStatus, onNavigate }: { activeStatus?: DlaStatus; onNavigate?: () => void }) {
  const roleHref = useRoleHref();
  const dlas = useDlas();

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Requests</p>
      {dlaStatusOrder.map((status) => {
        const Icon = statusIcons[status];
        const active = status === activeStatus;
        const count = dlas.filter((d) => d.status === status).length;
        return (
          <Link
            key={status}
            href={roleHref(`/pages/dla?status=${status}`)}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold outline-brand transition-colors duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
              active ? "bg-brand-secondary text-brand-secondary" : "text-quaternary hover:bg-tertiary hover:text-primary",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{dlaStatusMeta[status].tabLabel}</span>
            <CountBadge count={count} color={active ? "brand" : "gray"} />
          </Link>
        );
      })}
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
  activeStatus,
  breadcrumbCurrent,
  children,
}: {
  /** The status bucket to highlight in column 2 - omit where none applies (a new request). */
  activeStatus?: DlaStatus;
  /** The page-specific final crumb (a request ID, "New request"). When set, the section crumb becomes a link back to the list. */
  breadcrumbCurrent?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const showOrgSwitcher = useFeatureAccess("orgSwitcher");
  const canAccess = useFeatureAccess("dlaAccess");
  const nav = navForRole(role);
  const roleHref = useRoleHref();

  // null = this DLA route's own section; anything else is a rail click on a section with no page
  // yet, shown in place, same as the other shells.
  const [localSection, setLocalSection] = useState<string | null>(null);
  const activeSection = localSection ?? DLA_SECTION_LABEL;
  const otherSection = localSection ? nav.find((section) => section.label === localSection) : undefined;
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
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-secondary bg-primary px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={activeSection}
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          >
            {showStatusNav ? (close: () => void) => <StatusNav activeStatus={activeStatus} onNavigate={close} /> : undefined}
          </MobileNavTrigger>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pages/dashboard/gov-sa-dew-lockup.png" alt="Government of South Australia, Department for Environment and Water" className="h-[37px] w-auto" />
          <div className="h-6 w-px bg-secondary" />
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
          <Breadcrumb
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
            orgLabel={showOrgSwitcher ? orgLabelForRole(role) : undefined}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-64 lg:w-[395px]">
              <GlobalProjectSearch />
            </div>
            <GuestActionButton
              icon={Plus}
              label="Add project"
              color="primary"
              isGuest={isPublicUser}
              modalTitle="Sign up to add a project"
              modalDescription="Create a free BioData SA account to start contributing projects to South Australia's biodiversity record."
            />
            <GuestActionButton
              icon={Upload01}
              label="Upload dataset"
              color="secondary"
              isGuest={isPublicUser}
              modalTitle="Sign up to upload a dataset"
              modalDescription="Create a free BioData SA account to start contributing datasets to South Australia's biodiversity record."
            />
          </div>
          {isPublicUser ? <GuestAuthActions /> : <ProfileMenu />}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Primary icon rail ── */}
        <nav aria-label="Primary" className="hidden w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-secondary bg-secondary py-4 lg:flex">
          {nav.map((section) => {
            const Icon = sectionIcons[section.label];
            const active = section.label === activeSection && (canAccess || !!otherSection);
            return (
              <Tooltip key={section.label} title={section.label} placement="right">
                <TooltipTrigger
                  onPress={() => goToSection(section)}
                  aria-label={section.label}
                  className={cx(
                    "relative flex size-12 items-center justify-center rounded-lg transition duration-100 ease-linear active:scale-[0.96]",
                    active ? "bg-brand-solid text-white" : "text-quaternary hover:bg-tertiary hover:text-primary",
                  )}
                >
                  {Icon && <Icon className="size-5" />}
                </TooltipTrigger>
              </Tooltip>
            );
          })}
        </nav>

        {/* ── Contextual sidebar: always present, on every route and for every role ── */}
        <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          {showStatusNav ? (
            <StatusNav activeStatus={activeStatus} />
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
          <FooterLinks />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{main}</main>
      </div>
    </div>
  );
}
