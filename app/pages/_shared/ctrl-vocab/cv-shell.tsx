"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight, Database01, SearchMd, Tag01 } from "@untitledui/icons";
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
import { CV_ROOT, cvStatus, cvStatusMeta, cvTypeLabel, formatShortDate } from "@/app/pages/_shared/ctrl-vocab/cv-data";
import { TemplateActions } from "@/app/pages/_shared/ctrl-vocab/cv-template-ui";
import { useCvs, useSampleVolume } from "@/app/pages/_shared/ctrl-vocab/cv-store";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { CTRL_VOCAB_SECTION_LABEL, keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";

// The one shell every Controlled Vocabulary route renders through (list, vocabulary page, new, edit),
// header, rail, column 2 and main (CONTRACTS 3.7), with the restriction in main for
// every role but BioData Admin. Built on DsaShell.
//
// Column 2 is navigation and actions only (CONTRACTS 3.10). The Figma list frame puts the vocabulary
// list itself in column 2, grouped by category, with Active / Scheduled / Drafts / Archived tabs above
// it. Re-fitted: the list is a table in main (4.2), status is a filter there, and column 2 moves you
// between categories (the Figma's grouping, and how Informatica Reference 360 groups code lists into
// reference data sets), then the Actions group. On a form, column 2 is the form's section list (4.1).
const CURRENT_KEY = "ctrl-vocab";

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

/**
 * Column 2: every category, with its count. "All vocabularies" is the unfiltered list.
 *
 * The categories can run to dozens: a "Find a category" field narrows them, the
 * list scrolls inside column 2 on its own, and the Actions group stays in reach below it instead of
 * being pushed off the bottom. The template flow starts from Actions (cv-template-ui.tsx).
 */
function CategoryNav( { category, currentId }: { category: string; currentId?: string }) {
  const cvs = useCvs();
  const router = useRouter();
  const roleHref = useRoleHref();
  const base = CV_ROOT;
  const [find, setFind] = useState("");
  const counts = new Map<string, number>();
  for (const cv of cvs) if (cv.category.trim()) counts.set(cv.category.trim(), (counts.get(cv.category.trim()) ?? 0) + 1);
  const all = [...counts.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const q = find.trim().toLowerCase();
  const categories = q ? all.filter((c) => c.toLowerCase().includes(q)) : all;
  const count = (c: string) => counts.get(c) ?? 0;
  const findable = all.length > 6;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Categories</p>
      {findable && (
        <div className="mb-2 shrink-0">
          <Input aria-label="Find a category" size="sm" icon={SearchMd} placeholder={`Find among ${all.length} categories`} value={find} onChange={setFind} onClear={find ? () => setFind("") : undefined} />
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
      <Tabs
        orientation="vertical"
        selectedKey={category || "all"}
        onSelectionChange={(key) => router.push(roleHref(key === "all" ? base : `${base}?category=${encodeURIComponent(String(key))}`))}
      >
        <TabList aria-label="Categories" orientation="vertical" type="button-brand" fullWidth className="w-full">
          <Tab id="all" label="All vocabularies" icon={Database01} badge={cvs.length} />
          {categories.map((c) => (
            <Tab key={c} id={c} label={c} icon={Tag01} badge={count(c)} />
          ))}
        </TabList>
      </Tabs>
      {findable && categories.length === 0 && <p className="px-2 py-2 text-sm text-tertiary">No category matches &ldquo;{find.trim()}&rdquo;.</p>}
      </div>
      <ActionsGroup
        showCreateReport={false}
        onExportCsv={() =>
          downloadCsv(
            "controlled-vocabularies.csv",
            ["ID", "Vocabulary name", "Category", "Type", "Status", "Start date", "End date"],
            cvs.map((cv) => [cv.id, cv.name, cv.category, cvTypeLabel[cv.type], cvStatusMeta[cvStatus(cv)].label, formatShortDate(cv.startDate), formatShortDate(cv.endDate)]),
          )
        }
      >
        <TemplateActions currentId={currentId} />
      </ActionsGroup>
    </div>
  );
}

export function CvShell({
  category = "",
  currentId,
  breadcrumbCurrent,
  formSidebar = false,
  children,
}: {
  /** The category highlighted in column 2: the list's filter, or the open vocabulary's own. */
  category?: string;
  /** The vocabulary that is open, preselected when a template is downloaded from Actions. */
  currentId?: string;
  /** The final crumb (a vocabulary ID, "New vocabulary"). When set, the section crumb links back to the list. */
  breadcrumbCurrent?: string;
  /** A create or edit form is rendered: column 2 becomes its section list (the form portals into it through `FormSidebar`). */
  formSidebar?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();
  const canManage = useFeatureAccess("ctrlVocabManagement");
  const nav = navForRole(role);
  const roleHref = useRoleHref();
  const base = CV_ROOT;

  const [localSection, setLocalSection] = useState<string | null>(null);
  const activeSection = localSection ?? CTRL_VOCAB_SECTION_LABEL;
  const otherSection = localSection ? nav.find((section) => section.label === localSection) : undefined;
  const [formSlot, setFormSlot] = useState<HTMLElement | null>(null);
  const showNav = canManage && !otherSection;

  // The Sample size tool: 300 placeholder vocabularies, to see the list at scale.
  const [volume, setVolume] = useSampleVolume();
  useRegisterTool(
    canManage
      ? {
          id: "sample",
          label: "How many vocabularies to show",
          barLabel: "Sample size",
          icon: Database01,
          options: [
            { id: "seed", label: "Seed data", description: "The seeded vocabularies and any you added" },
            { id: "300", label: "300 placeholders", short: "300 more", description: "Adds 300 placeholder vocabularies in 24 categories. Not saved." },
          ],
          value: volume,
          onChange: (id) => setVolume(id as "seed" | "300"),
          override: volume === "300" ? "Placeholders shown" : undefined,
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
        <h1 className="text-lg font-semibold text-primary">{CTRL_VOCAB_SECTION_LABEL}</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">Controlled vocabularies are managed by the BioData Super Admin. Your account doesn&apos;t have access to this section.</p>
        <Button color="link-color" size="sm" href={roleHref("/pages/dashboard")} iconTrailing={ArrowNarrowRight}>
          Go to Home
        </Button>
      </div>
    );

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
            {showNav && !formSidebar ? () => <CategoryNav category={category} currentId={currentId} /> : undefined}
          </MobileNavTrigger>
        }
        section={
          breadcrumbCurrent && !otherSection && canManage ? (
            <Link href={roleHref(base)} className="hover:text-primary">
              {activeSection}
            </Link>
          ) : (
            activeSection
          )
        }
        // A role without access sees no vocabulary name, not even in the breadcrumb.
        current={otherSection || !canManage ? undefined : breadcrumbCurrent}
      />

      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection={canManage || otherSection ? activeSection : null} onSelectSection={goToSection} />

        <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          {showNav && formSidebar ? (
            <div ref={setFormSlot} />
          ) : showNav ? (
            <CategoryNav category={category} currentId={currentId} />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{otherSection?.label ?? CTRL_VOCAB_SECTION_LABEL}</p>
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
