"use client";

import type { ReactNode } from "react";
import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { ActionsGroup, downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { BATCHES, BATCH_STATUS, SOURCES, SOURCE_LABEL, readDate, type VmSource } from "@/app/pages/_shared/vouchers/vm-data";
import { VmOptionSwitcher, useVmRoot } from "@/app/pages/_shared/vouchers/vm-root";
import { useBatchSummaries } from "@/app/pages/_shared/vouchers/vm-store";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { VOUCHER_SECTION_LABEL, keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";

// The one shell every Voucher Management route renders through (the batch list, a batch, a record in
// a batch): header, rail, column 2 and main (CONTRACTS 3.7), with the restriction in main for every
// role below BioData Super Admin. Built on NtShell.
//
// Column 2 is navigation and actions only (CONTRACTS 3.10): the two sources a scan runs against, the
// Herbarium and the SA Museum, each run separately (the designer, 1 Oct 2026: "the left panel will
// allow for the admin to view batches ran for SA Museum and Herbarium ... not batch numbers"). The
// count beside a source is its batches still needing review; a source with none has no count. Inside a
// batch, its source stays selected.
const CURRENT_KEY = "vouchers";

function SectionPlaceholder({ node }: { node: NavNode }) {
  const relatedLink = node.key ? node : node.items?.find((item) => item.key);
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">{node.label}</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">
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

function SourceNav({ source }: { source: VmSource | "" }) {
  const summaries = useBatchSummaries();
  const router = useRouter();
  const roleHref = useRoleHref();
  const root = useVmRoot();
  const needing = (s?: VmSource) => BATCHES.filter((b) => (!s || b.source === s) && summaries.get(b.id)?.status === "review").length;
  const badge = (n: number) => (n > 0 ? n : undefined);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Sources</p>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Tabs orientation="vertical" selectedKey={source || "all"} onSelectionChange={(key) => router.push(roleHref(key === "all" ? root : `${root}?source=${String(key)}`))}>
          <TabList aria-label="Sources" orientation="vertical" type="button-brand" fullWidth className="w-full">
            <Tab id="all" label="All batches" badge={badge(needing())} />
            {SOURCES.map((s) => (
              <Tab key={s} id={s} label={SOURCE_LABEL[s]} badge={badge(needing(s))} />
            ))}
          </TabList>
        </Tabs>
      </div>
      <ActionsGroup
        showCreateReport={false}
        onExportCsv={() =>
          downloadCsv(
            "voucher-scan-batches.csv",
            ["Batch", "Source", "Ran on", "Records checked", "Different", "Missing in BioData", "Updated", "Ignored", "Records to review", "Status"],
            BATCHES.filter((b) => !source || b.source === source).map((b) => {
              const s = summaries.get(b.id)!;
              return [b.id, SOURCE_LABEL[b.source], readDate(b.ranOn), String(b.checked), String(s.different), String(s.missing), String(s.updated), String(s.ignored), String(s.toReview), BATCH_STATUS[s.status].label];
            }),
          )
        }
      />
    </div>
  );
}

export function VmShell({
  source = "",
  breadcrumb = [],
  children,
}: {
  /** The source highlighted in column 2: the list's, or the open batch's. */
  source?: VmSource | "";
  /** Crumbs after the section, each linking back except the last ("Batch 1012", then a record). */
  breadcrumb?: { label: string; href?: string }[];
  children: ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();
  const canManage = useFeatureAccess("voucherManagement");
  const nav = navForRole(role);
  const roleHref = useRoleHref();
  const root = useVmRoot();

  const [localSection, setLocalSection] = useState<string | null>(null);
  const activeSection = localSection ?? VOUCHER_SECTION_LABEL;
  const otherSection = localSection ? nav.find((section) => section.label === localSection) : undefined;
  const showNav = canManage && !otherSection;

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key === CURRENT_KEY) setLocalSection(null);
    else if (relatedLink?.key) router.push(roleHref(keyHref(relatedLink.key)));
    else setLocalSection(section.label);
  };

  let main: ReactNode = children;
  if (otherSection) main = <SectionPlaceholder node={otherSection} />;
  else if (!canManage)
    main = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-lg font-semibold text-primary">{VOUCHER_SECTION_LABEL}</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">Voucher records are managed by BioData Super Admins. Your account doesn&apos;t have access to this section.</p>
        <Button color="link-color" size="sm" href={roleHref("/pages/dashboard")} iconTrailing={ArrowNarrowRight}>
          Go to Home
        </Button>
      </div>
    );

  const crumbs = otherSection || !canManage ? [] : breadcrumb;
  const last = crumbs[crumbs.length - 1];
  const middle = crumbs.slice(0, -1);

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      {canManage && <VmOptionSwitcher />}
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
            {showNav ? () => <SourceNav source={source} /> : undefined}
          </MobileNavTrigger>
        }
        section={
          last ? (
            <>
              <Link href={roleHref(root)} className="hover:text-primary">
                {activeSection}
              </Link>
              {middle.map((c) => (
                <Fragment key={c.label}>
                  <span>/</span>
                  <Link href={roleHref(c.href!)} className="hover:text-primary">
                    {c.label}
                  </Link>
                </Fragment>
              ))}
            </>
          ) : (
            activeSection
          )
        }
        current={last?.label}
      />

      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection={canManage || otherSection ? activeSection : null} onSelectSection={goToSection} />

        <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          {showNav ? (
            <SourceNav source={source} />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{otherSection?.label ?? VOUCHER_SECTION_LABEL}</p>
              {otherSection?.items?.map((item) => (
                <p key={item.label} className="px-2 py-2 text-sm text-tertiary">
                  {item.label}
                </p>
              ))}
            </div>
          )}
          <SidebarFooterLinks />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{main}</main>
      </div>
    </div>
  );
}
