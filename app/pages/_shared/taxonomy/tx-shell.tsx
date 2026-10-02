"use client";

import type { FC, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight, Dataflow03 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { FormSidebarSlotContext } from "@/app/pages/_shared/form-section-list";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { TX_ROOT } from "@/app/pages/_shared/taxonomy/tx-data";
import { useTaxa } from "@/app/pages/_shared/taxonomy/tx-store";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { TAXONOMY_SECTION_LABEL, keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";

// The one shell every Taxonomy Management route renders through: header, rail, column 2 and main
// (CONTRACTS 3.7), with the restriction in main for every role below BioData Admin. Built on CvShell.
//
// Column 2 is navigation only (3.10): where you are among the species (All, Flora, Fauna). While a
// taxon change is being made, column 2 is that form's steps (4.1).
//
// Options 1 (as drawn in Figma) and 2 (species first, prefilled Figma forms) were retired on Oct 1
// 2026 when the designer chose Option 3 (the guided change); see context/decisions.

const CURRENT_KEY = "taxonomy";

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

function NavList({ heading, items, current }: { heading: string; items: { id: string; label: string; href: string; badge?: number; icon: FC<{ className?: string }> }[]; current: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-col gap-1">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{heading}</p>
      <Tabs orientation="vertical" selectedKey={current} onSelectionChange={(key) => router.push(roleHref(items.find((i) => i.id === key)?.href ?? TX_ROOT))}>
        <TabList aria-label={heading} orientation="vertical" type="button-brand" fullWidth className="w-full" items={items}>
          {(item) => <Tab id={item.id} label={item.label} icon={item.icon} badge={item.badge} />}
        </TabList>
      </Tabs>
    </div>
  );
}

/** Where you are among the species. */
function KingdomNav({ current }: { current: string }) {
  const base = TX_ROOT;
  const taxa = useTaxa().filter((t) => t.current);
  const items = [
    { id: "all", label: "All species", href: base, badge: taxa.length, icon: Dataflow03 },
    { id: "Flora", label: "Flora", href: `${base}?kingdom=Flora`, badge: taxa.filter((t) => t.kingdom === "Flora").length, icon: SPECIES_GROUP_ICON.Plant },
    { id: "Fauna", label: "Fauna", href: `${base}?kingdom=Fauna`, badge: taxa.filter((t) => t.kingdom === "Fauna").length, icon: SPECIES_GROUP_ICON.Mammal },
  ];
  return <NavList heading="Species" items={items} current={current} />;
}

export function TxShell({
  current,
  breadcrumbCurrent,
  formSidebar = false,
  children,
}: {
  /** The column 2 item that is selected: "all", "Flora" or "Fauna". */
  current: string;
  /** The final crumb (a species, "Rename Taxon"). When set, the section crumb links back. */
  breadcrumbCurrent?: string;
  /** A form with steps is open: column 2 becomes its section list (the form portals into it). */
  formSidebar?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();
  const canManage = useFeatureAccess("taxonomyManagement");
  const nav = navForRole(role);
  const roleHref = useRoleHref();

  const [localSection, setLocalSection] = useState<string | null>(null);
  const activeSection = localSection ?? TAXONOMY_SECTION_LABEL;
  const otherSection = localSection ? nav.find((section) => section.label === localSection) : undefined;
  const [formSlot, setFormSlot] = useState<HTMLElement | null>(null);
  const showNav = canManage && !otherSection;

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key === CURRENT_KEY) setLocalSection(null);
    else if (relatedLink?.key) router.push(roleHref(keyHref(relatedLink.key)));
    else setLocalSection(section.label);
  };

  const column2 = <KingdomNav current={current} />;

  let main: ReactNode = children;
  if (otherSection) main = <SectionPlaceholder node={otherSection} />;
  else if (!canManage)
    main = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-lg font-semibold text-primary">{TAXONOMY_SECTION_LABEL}</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">Taxonomy is managed by BioData Admins. Your account doesn&apos;t have access to this section.</p>
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
            {showNav && !formSidebar ? () => column2 : undefined}
          </MobileNavTrigger>
        }
        section={
          breadcrumbCurrent && !otherSection && canManage ? (
            <Link href={roleHref(TX_ROOT)} className="hover:text-primary">
              {activeSection}
            </Link>
          ) : (
            activeSection
          )
        }
        current={otherSection || !canManage ? undefined : breadcrumbCurrent}
      />

      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection={canManage || otherSection ? activeSection : null} onSelectSection={goToSection} />

        <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          {showNav && formSidebar ? (
            <div ref={setFormSlot} />
          ) : showNav ? (
            column2
          ) : (
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{otherSection?.label ?? TAXONOMY_SECTION_LABEL}</p>
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
