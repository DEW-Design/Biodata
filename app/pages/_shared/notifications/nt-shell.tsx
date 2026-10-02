"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight, Database01, SearchMd, Bell01, Tag01 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { Button } from "@/components/base/buttons/button";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { ActionsGroup, downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { FormSidebarSlotContext } from "@/app/pages/_shared/form-section-list";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { SENSITIVITY, formatShortDate, ntStateMeta, ntTemplate, recipientsSummary, triggerSummary } from "@/app/pages/_shared/notifications/nt-data";
import { useRecipientLabels, useSampleVolume } from "@/app/pages/_shared/notifications/nt-directory";
import { useCategories, useNotifications } from "@/app/pages/_shared/notifications/nt-store";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { NOTIFICATION_SECTION_LABEL, keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";
import { NtOptionSwitcher, useNtRoot } from "@/app/pages/_shared/notifications/nt-root";

// The one shell every Notification Management route renders through (list, notification page, new,
// edit): header, rail, column 2 and main (CONTRACTS 3.7), with the restriction in main for every role
// below BioData Admin. Built on CvShell.
//
// Column 2 is navigation and actions only (CONTRACTS 3.10). The Figma puts the notifications
// themselves in column 2, grouped by category under Active / Drafts / Disabled tabs. Re-fitted as
// Controlled Vocabulary was: column 2 moves you between the Figma's categories (all eight, with a
// count, so an empty one is visible rather than missing), status is a filter in main, and the list and
// its preview are main's.
const CURRENT_KEY = "notifications";

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

function CategoryNav({ category }: { category: string }) {
  const items = useNotifications();
  const labelFor = useRecipientLabels();
  const all = useCategories();
  const router = useRouter();
  const roleHref = useRoleHref();
  const root = useNtRoot();
  const [find, setFind] = useState("");
  const counts = new Map<string, number>();
  for (const n of items) counts.set(n.category, (counts.get(n.category) ?? 0) + 1);
  const q = find.trim().toLowerCase();
  const categories = q ? all.filter((c) => c.toLowerCase().includes(q)) : all;
  // Categories grow as admins add them: past six, a finder narrows them, and the list scrolls on its
  // own (capped, so Actions follows the list directly and stays in reach) (Controlled Vocabulary's column 2).
  const findable = all.length > 6;

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Categories</p>
      {findable && (
        <div className="mb-2 shrink-0">
          <Input aria-label="Find a category" size="sm" icon={SearchMd} placeholder={`Find among ${all.length} categories`} value={find} onChange={setFind} onClear={find ? () => setFind("") : undefined} />
        </div>
      )}
      <div className="max-h-[45vh] overflow-y-auto">
        <Tabs orientation="vertical" selectedKey={category || "all"} onSelectionChange={(key) => router.push(roleHref(key === "all" ? root : `${root}?category=${encodeURIComponent(String(key))}`))}>
          <TabList aria-label="Categories" orientation="vertical" type="button-brand" fullWidth className="w-full">
            <Tab id="all" label="All notifications" icon={Bell01} badge={items.length} />
            {categories.map((c) => (
              <Tab key={c} id={c} label={c} icon={Tag01} badge={counts.get(c) ?? 0} />
            ))}
          </TabList>
        </Tabs>
        {findable && categories.length === 0 && <p className="px-2 py-2 text-sm text-tertiary">No category matches &ldquo;{find.trim()}&rdquo;.</p>}
      </div>
      <ActionsGroup
        showCreateReport={false}
        onExportCsv={() =>
          downloadCsv(
            "notifications.csv",
            ["ID", "Notification", "Category", "Status", "When", "To", "Template", "Classification", "Subject", "Updated"],
            items.map((n) => [n.id, n.name, n.category, ntStateMeta[n.state].label, triggerSummary(n.trigger), recipientsSummary(n.to, labelFor(n.trigger)), ntTemplate(n.template).name, SENSITIVITY[n.sensitivity].label, n.subject, formatShortDate(n.updatedAt)]),
          )
        }
      />
    </div>
  );
}

export function NtShell({
  category = "",
  breadcrumbCurrent,
  formSidebar = false,
  children,
}: {
  /** The category highlighted in column 2: the list's filter, or the open notification's own. */
  category?: string;
  /** The final crumb (a notification's name, "New notification"). When set, the section crumb links back to the list. */
  breadcrumbCurrent?: string;
  /** A create or edit form is rendered: column 2 becomes its section list (the form portals into it through `FormSidebar`). */
  formSidebar?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();
  const canManage = useFeatureAccess("notificationManagement");
  const nav = navForRole(role);
  const roleHref = useRoleHref();
  const root = useNtRoot();

  const [localSection, setLocalSection] = useState<string | null>(null);
  const activeSection = localSection ?? NOTIFICATION_SECTION_LABEL;
  const otherSection = localSection ? nav.find((section) => section.label === localSection) : undefined;
  const [formSlot, setFormSlot] = useState<HTMLElement | null>(null);
  const showNav = canManage && !otherSection;

  // The Sample size tool: placeholder notifications, categories and people, to see every list at scale.
  const [volume, setVolume] = useSampleVolume();
  useRegisterTool(
    canManage
      ? {
          id: "sample",
          label: "How much data to show",
          barLabel: "Sample size",
          icon: Database01,
          options: [
            { id: "seed", label: "Seed data", description: "The seeded notifications and any you added" },
            { id: "scale", label: "At scale", short: "At scale", description: "Adds 300 placeholder notifications in 40 categories and 2,000 placeholder people. Not saved." },
          ],
          value: volume,
          onChange: (id) => setVolume(id as "seed" | "scale"),
          override: volume === "scale" ? "Placeholders shown" : undefined,
        }
      : null,
  );

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
        <h1 className="text-lg font-semibold text-primary">{NOTIFICATION_SECTION_LABEL}</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">Notifications are managed by BioData Admins. Your account doesn&apos;t have access to this section.</p>
        <Button color="link-color" size="sm" href={roleHref("/pages/dashboard")} iconTrailing={ArrowNarrowRight}>
          Go to Home
        </Button>
      </div>
    );

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      {canManage && <NtOptionSwitcher />}
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
            {showNav && !formSidebar ? () => <CategoryNav category={category} /> : undefined}
          </MobileNavTrigger>
        }
        section={
          breadcrumbCurrent && !otherSection && canManage ? (
            <Link href={roleHref(root)} className="hover:text-primary">
              {activeSection}
            </Link>
          ) : (
            activeSection
          )
        }
        // A role without access sees no notification name, not even in the breadcrumb.
        current={otherSection || !canManage ? undefined : breadcrumbCurrent}
      />

      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection={canManage || otherSection ? activeSection : null} onSelectSection={goToSection} />

        <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          {showNav && formSidebar ? (
            <div ref={setFormSlot} />
          ) : showNav ? (
            <CategoryNav category={category} />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{otherSection?.label ?? NOTIFICATION_SECTION_LABEL}</p>
              {otherSection?.items?.map((item) => (
                <p key={item.label} className="px-2 py-2 text-sm text-tertiary">
                  {item.label}
                </p>
              ))}
            </div>
          )}
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <FormSidebarSlotContext.Provider value={formSlot}>{main}</FormSidebarSlotContext.Provider>
        </main>
      </div>
    </div>
  );
}
