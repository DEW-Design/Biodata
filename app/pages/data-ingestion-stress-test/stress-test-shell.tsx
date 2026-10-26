"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// The shell of the Data ingestion stress test (CONTRACTS 3.1 to 3.7): the header, the rail, column 2 and main, for every role.
// The stress test is a sandbox with no section of its own in the rail, so no section is lit; column 2 names where you are, and
// main holds the tool (the structure tree it draws is part of the tool's own Structure tab, not navigation). It is open to every
// role, signed out included: it parses a file in the browser and sends nothing anywhere.
export function StressTestShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const role = useUserRole();
  const nav = navForRole(role);
  const roleHref = useRoleHref();

  const goToSection = (section: NavNode) => {
    const link = section.key ? section : section.items?.find((item) => item.key);
    if (link?.key) router.push(roleHref(keyHref(link.key)));
  };

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection=""
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          />
        }
        current="Data ingestion stress test"
      />
      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection={null} onSelectSection={goToSection} />
        <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Data ingestion stress test</p>
        </aside>
        <main className="min-h-0 flex-1 overflow-y-auto bg-primary p-8 [scrollbar-gutter:stable]">{children}</main>
      </div>
    </div>
  );
}
