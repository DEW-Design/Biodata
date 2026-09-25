"use client";

import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { dashboardTasks } from "@/app/pages/_shared/home-dashboard";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { useUserRole } from "@/lib/use-user-role";
import type { NavNode } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";

// Column 1 of the shell: THE primary icon rail (see CONTEXT.md, "Final check": the shell contract).
// Every real screen renders this, never its own `<nav aria-label="Primary">`. Which sections it
// lists comes from the persona's nav tree (`navForRole`); what a click does is the screen's call
// (`onSelectSection`), since a section either navigates to its own page or shows in place.
export function PrimaryRail({
  sections,
  activeSection,
  onSelectSection,
}: {
  sections: NavNode[];
  /** The label of the highlighted section, or null when none should be (e.g. a page the persona cannot open). */
  activeSection: string | null;
  onSelectSection: (section: NavNode) => void;
}) {
  // Home's badge is the count of a registered user's own pending tasks ("Needs your attention"), so
  // it shows for registered-user only - a guest has no personal tasks, and biodata-admin's Home
  // shows different, operational content that this count does not describe. Decided here once, so
  // every screen badges Home identically.
  const role = useUserRole();
  return (
    <nav aria-label="Primary" className="hidden w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-secondary bg-secondary py-4 lg:flex">
      {sections.map((section) => {
        const Icon = sectionIcons[section.label];
        const active = section.label === activeSection;
        const badgeCount = role === "registered-user" && section.label === "Home" ? dashboardTasks.length : 0;
        return (
          <Tooltip key={section.label} title={section.label} placement="right">
            <TooltipTrigger
              onPress={() => onSelectSection(section)}
              aria-label={section.label}
              className={cx(
                "relative flex size-12 items-center justify-center rounded-lg transition duration-100 ease-linear active:scale-[0.96]",
                active ? "bg-brand-solid text-white" : "text-quaternary hover:bg-tertiary hover:text-primary",
              )}
            >
              {Icon && <Icon className="size-5" />}
              {badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-error-solid text-[10px] font-semibold tabular-nums text-white">{badgeCount}</span>
              )}
            </TooltipTrigger>
          </Tooltip>
        );
      })}
    </nav>
  );
}
