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
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { TEMPLATE_FINDER_SECTION_LABEL, keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";

// The Template Finder's shell, the same shape as NominationShell. Column 2 is the section label and the local
// navigation the page hands in (`TemplateNav`: all templates, then the species types and collection methods, which are
// the list's own filter). It holds no actions - Download is on each row - and no information (CONTRACTS 3.10).
const CURRENT_KEY = "template-finder";

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

export function TemplateFinderShell({ localNav, children }: { /** Column 2's local navigation, under the section label. */ localNav?: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const role = useUserRole();
  const canAccess = useFeatureAccess("templateFinder");
  const nav = navForRole(role);
  const roleHref = useRoleHref();

  const [localSection, setLocalSection] = useState<string | null>(null);
  const activeSection = localSection ?? TEMPLATE_FINDER_SECTION_LABEL;
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
        <h1 className="text-lg font-semibold text-primary">{TEMPLATE_FINDER_SECTION_LABEL}</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">Browsing and downloading dataset templates needs a free BioData SA account. Create one to find the template for your data.</p>
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
          />
        }
        section={activeSection}
      />

      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection={canAccess || otherSection ? activeSection : null} onSelectSection={goToSection} />

        <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          <div className="flex flex-col gap-1">
            <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{otherSection?.label ?? TEMPLATE_FINDER_SECTION_LABEL}</p>
            {otherSection?.items?.map((item) => (
              <p key={item.label} className="px-2 py-2 text-sm text-tertiary">
                {item.label}
              </p>
            ))}
            {!otherSection && canAccess ? localNav : null}
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{main}</main>
      </div>
    </div>
  );
}
