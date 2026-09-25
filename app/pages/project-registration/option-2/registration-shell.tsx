"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";

// The shell for the second Add Project layout, built exactly like the DSA/DLA shells: full-width
// header above a row of primary icon rail (column 1), contextual sidebar (column 2 - here the
// section list, `sidebar`) and main (column 3 - the form). Three columns for every persona: a
// guest still gets all three, with the sign-up prompt in main. Projects is the active rail section
// since this flow is how a project is created.
const ACTIVE_SECTION = "Projects";

export function RegistrationShell({
  sidebar,
  children,
}: {
  /** Column 2's content. A function form gets the close callback so the mobile menu can dismiss itself. */
  sidebar: ReactNode | ((close: () => void) => ReactNode);
  children: ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = navForRole(role);
  const roleHref = useRoleHref();

  // A rail click on a section with no page yet shows a placeholder in place, like the other shells.
  const [localSection, setLocalSection] = useState<string | null>(null);
  const otherSection = localSection ? nav.find((section) => section.label === localSection) : undefined;

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key) router.push(roleHref(keyHref(relatedLink.key)));
    else setLocalSection(section.label);
  };

  const renderSidebar = (close?: () => void) => (typeof sidebar === "function" ? sidebar(close ?? (() => {})) : sidebar);

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <RoleSwitcher />
      {/* ── Header: full width, above the rail + sidebar + main row ── */}
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={localSection ?? ACTIVE_SECTION}
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          >
            {!otherSection && !isPublicUser ? (close: () => void) => renderSidebar(close) : undefined}
          </MobileNavTrigger>
        }
        section={
          <Link href={roleHref("/pages/project-list")} className="hover:text-primary">
            {ACTIVE_SECTION}
          </Link>
        }
        current="Add project"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Column 1: primary icon rail ── */}
        <PrimaryRail sections={nav} activeSection={localSection ?? ACTIVE_SECTION} onSelectSection={goToSection} />

        {/* ── Column 2: contextual sidebar - the section list, on every route and for every role ── */}
        <aside aria-label="Add project sections" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          {otherSection ? (
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{otherSection.label}</p>
              {otherSection.items?.map((item) => (
                <p key={item.label} className="px-2 py-2 text-sm text-tertiary">
                  {item.label}
                </p>
              ))}
            </div>
          ) : (
            renderSidebar()
          )}
          <SidebarFooterLinks />
        </aside>

        {/* ── Column 3: main ── */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {otherSection ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
              <h1 className="text-lg font-medium text-primary">{otherSection.label}</h1>
              <p className="max-w-sm text-sm text-tertiary">This section&apos;s content hasn&apos;t been scoped yet - only its place in the navigation is decided so far.</p>
              <Button color="link-color" size="sm" href={roleHref("/pages/project-list")} iconTrailing={ArrowNarrowRight}>
                Go to Projects
              </Button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
