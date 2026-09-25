"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Key } from "react-aria-components";
import { Tabs } from "react-aria-components";
import { TabList, Tab, TabPanel } from "@/components/application/tabs/tabs";
import { ChevronDown, ArrowNarrowRight, Folder, Database01, User01, PieChart03 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { HomeTabPanels } from "@/app/pages/_shared/home-tab-panels";
import { DataOverviewContent } from "@/app/pages/_shared/data-overview";
import { ProjectListContent } from "@/app/pages/_shared/project-list-content";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { ProjectActions } from "@/app/pages/_shared/project-actions";
import { GuestAboutAside, GuestGradientCard } from "@/app/pages/_shared/guest-home";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { navForRole, keyHref, type NavNode } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";

// The projects list on the sidebar-nav shell (primary icon rail + contextual sidebar), reusing
// app/pages/dashboard's three-column header/rail/sidebar chrome verbatim - see that file's comment
// for the full rationale. (The top-nav alternative it was compared against has been deleted.)
//
// No Figma frame yet for a Projects list screen, so - same as the dashboard body's metric/filter/
// map panels - this is built structurally: every contained widget (search, buttons, avatar, badge)
// is a real DEW component used exactly, the project rows are a structural shell composed from real
// tokens (no `?` marker, same "structural pattern organizing the whole screen" exemption as those
// dashboard panels). The primary icon rail is the real top-level IA (lib/registered-user-nav.ts),
// the contextual sidebar shows only the selected section's children - same NavTree/ProfileMenu
// treatment as dashboard, "Projects" selected by default since that's the active section
// here.

// Same icon map as dashboard - kept local (not in lib/registered-user-nav.ts) since it's
// presentation-only and option-2's top-nav has no use for it.
// This screen's own page key - Projects is a leaf with its own key now (see
// lib/registered-user-nav.ts), same shape as Home, so this only matters for goToSection below
// (deciding whether a Projects icon-rail click should navigate or stay put); the icon rail itself
// highlights by label, not by this constant.
const CURRENT_KEY = "project-list";

function NavTree({ node, depth = 0, defaultOpen = false }: { node: NavNode; depth?: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = !!node.items?.length;
  const href = node.key ? keyHref(node.key) : undefined;
  const isCurrent = !!node.key && node.key === CURRENT_KEY;
  const indent = { paddingLeft: 8 + depth * 12, paddingRight: 8 };

  if (!hasChildren) {
    return href ? (
      <Link
        href={href}
        style={indent}
        aria-current={isCurrent ? "page" : undefined}
        // Hover is the same neutral `bg-tertiary` the Home/Projects Tabs switcher's own hover
        // state uses (components/application/tabs/tabs.tsx's `button-brand` type) - previously
        // this matched the active/selected fill instead, previewing "selected" on a plain hover,
        // the exact mismatch against the primary icon rail flagged directly by the user. Fixed at
        // the design-system level in tabs.tsx and mirrored here since NavTree isn't itself a `Tab`.
        className={cx(
          "rounded-md py-2 text-sm font-medium transition-colors duration-100 ease-linear",
          isCurrent ? "bg-brand-secondary text-brand-secondary" : "text-primary hover:bg-tertiary",
        )}
      >
        {node.label}
      </Link>
    ) : (
      // No real page yet - text-tertiary (not text-primary/font-medium like the links above) so
      // the sidebar itself shows which of its items are actual destinations, not just labels
      // holding a place in the IA.
      <p style={indent} className="py-2 text-sm text-tertiary">
        {node.label}
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={indent}
        className={cx(
          "flex w-full items-center justify-between gap-2 py-2 text-left",
          depth === 0 ? "text-xs font-semibold tracking-wide text-quaternary uppercase" : "text-sm font-medium text-primary",
        )}
      >
        {node.label}
        <ChevronDown className={cx("size-3.5 shrink-0 text-quaternary transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-0.5">
          {node.items!.map((child) => (
            <NavTree key={child.label} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}


// What column 3 shows for every section besides this screen's own (Projects, here). Two honest
// states, not one: a section either has a real page elsewhere (Home -> dashboard) - say so and
// link to it, don't claim it's unscoped when it demonstrably isn't - or it genuinely has no page
// yet, which does get the "not scoped" copy. Conflating the two read as a bug: clicking Home from
// another screen showed "hasn't been scoped yet" directly above a working "Go to Home" link.
function SectionPlaceholder({ node }: { node: NavNode }) {
  // A section can itself be the link (a leaf like Home) or have one keyed child (like Projects).
  const relatedLink = node.key ? node : node.items?.find((item) => item.key);
  // A bare path drops the active role - see lib/use-role-href.ts. Another instance of the same
  // dead end fixed everywhere else, missed here the first time round.
  const roleHref = useRoleHref();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-medium text-primary">{node.label}</h1>
      <p className="max-w-sm text-sm text-tertiary">
        {relatedLink
          ? "This section has its own page - it isn't embedded here."
          : "This section's content hasn't been scoped yet - only its place in the navigation is decided so far."}
      </p>
      {relatedLink && (
        <Button color="link-color" size="sm" href={roleHref(keyHref(relatedLink.key!))} iconTrailing={ArrowNarrowRight}>
          Go to {relatedLink.label}
        </Button>
      )}
    </div>
  );
}

export default function ProjectListPage() {
  return (
    <Suspense fallback={null}>
      <ProjectList />
    </Suspense>
  );
}

function ProjectList() {
  const router = useRouter();
  // public-user reads a different, smaller nav tree entirely - see dashboard's copy of
  // this same branch for the full rationale.
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = navForRole(role);
  const roleHref = useRoleHref();
  const [activeSection, setActiveSection] = useState("Projects");
  const [homeTab, setHomeTab] = useState<Key>("dashboard");
  const [projectsTab, setProjectsTab] = useState<Key>("projects");
  // public-user's own Flora and Fauna Dashboard tab (Overview/Flora/Fauna/Projects) - separate from
  // `homeTab` above, which is registered-user's My BioData/Flora-Dashboard switcher and doesn't
  // apply to a guest (see the isPublicUser branch below). Lifted here, not left uncontrolled inside
  // DataOverviewContent, so the gradient card's copy can change with it.
  const [guestDashboardTab, setGuestDashboardTab] = useState<Key>("overview");
  const activeSectionNode = nav.find((section) => section.label === activeSection) ?? nav[0];

  // Home and Projects both have a real page of their own - clicking either from a *different*
  // page's shell now actually navigates there instead of faking the content in place. Sections
  // with no real page yet stay a local, in-place section switch. See dashboard's copy of
  // this same fix for the full rationale - flagged directly by the user off a screenshot. `roleHref`
  // (not a bare path) so the active role survives the navigation instead of silently reverting to
  // `registered-user` - see lib/use-role-href.ts.
  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key && relatedLink.key !== CURRENT_KEY) {
      router.push(roleHref(keyHref(relatedLink.key)));
    } else {
      setActiveSection(section.label);
    }
  };

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <RoleSwitcher />
      {/* ── Header ── */}
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
            {/* public-user's Home/Projects are each a single view (see publicUserNav) - no peer
                tab to switch between, so no extra mobile-menu content for either. */}
            {!isPublicUser && activeSection === "Home"
              ? ((close: () => void) => (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setHomeTab("dashboard");
                        close();
                      }}
                      className={cx(
                        "rounded-md px-3 py-2 text-left text-sm font-medium outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
                        homeTab === "dashboard" ? "bg-secondary text-primary" : "text-primary hover:bg-secondary",
                      )}
                    >
                      My BioData
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHomeTab("overview");
                        close();
                      }}
                      className={cx(
                        "rounded-md px-3 py-2 text-left text-sm font-medium outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
                        homeTab === "overview" ? "bg-secondary text-primary" : "text-primary hover:bg-secondary",
                      )}
                    >
                      Flora and Fauna Dashboard
                    </button>
                  </>
                ))
              : !isPublicUser && activeSection === "Projects"
                ? ((close: () => void) => (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setProjectsTab("projects");
                          close();
                        }}
                        className={cx(
                          "rounded-md px-3 py-2 text-left text-sm font-medium outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
                          projectsTab === "projects" ? "bg-secondary text-primary" : "text-primary hover:bg-secondary",
                        )}
                      >
                        Projects
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProjectsTab("datasets");
                          close();
                        }}
                        className={cx(
                          "rounded-md px-3 py-2 text-left text-sm font-medium outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
                          projectsTab === "datasets" ? "bg-secondary text-primary" : "text-primary hover:bg-secondary",
                        )}
                      >
                        Datasets
                      </button>
                    </>
                  ))
                : undefined}
          </MobileNavTrigger>
        }
        section={activeSection === "Home" ? undefined : activeSectionNode.label}
      />

      {/* ── Primary icon rail: top-level IA (nav chrome - not pixel-matched) ── */}
      {(() => {
        const iconRail = (
          <PrimaryRail sections={nav} activeSection={activeSection}  onSelectSection={goToSection} />
        );

        // public-user's Home and Projects are each a single view (see publicUserNav) - no Tabs
        // boundary, no contextual-sidebar column at all (an aside holding only a section-label
        // heading is dead space, not minimalism - see dashboard's copy of this branch for
        // the full rationale, flagged directly by the user off that exact empty column). Checked
        // first so the two-peer-tab branches below never run for this role.
        // Column 2 is `GuestAboutAside` ("What is BioData SA?" + Guides, the "Reference" variant
        // picked from `/proto/public-user` after comparing it against a boxed-accordion
        // "Disclosure" and a stepped "How it works") - not the empty box the pre-Sept-21 version of
        // this branch dropped entirely for lack of anything to put in it. Same content for Home and
        // Projects (only the eyebrow label differs), matching the lab exactly. See dashboard's copy
        // of this same branch for the full rationale.
        if (isPublicUser && (activeSection === "Home" || activeSection === "Projects")) {
          return (
            <div className="flex flex-1 overflow-hidden">
              {iconRail}
              <GuestAboutAside sectionLabel={activeSection} actions={activeSection === "Projects" ? <ProjectActions withTopRule={false} /> : undefined} />

              <main className="flex flex-1 flex-col overflow-y-auto">
                {activeSection === "Home" ? (
                  <>
                    <div className="p-6">
                      <GuestGradientCard tab={guestDashboardTab} />
                    </div>
                    <DataOverviewContent activeTab={guestDashboardTab} onActiveTabChange={setGuestDashboardTab} />
                  </>
                ) : (
                  <ProjectListContent />
                )}
              </main>
            </div>
          );
        }

        // Home's two views (My BioData / Flora and Fauna Dashboard) get their own Tabs boundary, mounted
        // only while Home is active - not one Tabs wrapping the whole page permanently. React-aria's
        // Tabs keeps a single internal collection for its whole lifetime; a Tabs that always exists
        // while its TabList only mounts once you switch to Home crashes the first time TabList
        // mounts ("Cannot destructure property 'onAction' ... as it is undefined") - caught on
        // project-detail, fixed the same way here since this file has the identical shape.
        if (activeSection === "Home") {
          return (
            <Tabs orientation="vertical" selectedKey={homeTab} onSelectionChange={setHomeTab} className="flex flex-1 overflow-hidden">
              {iconRail}

              {/* ── Contextual sidebar: Home's My BioData/Flora and Fauna Dashboard tab list (nav chrome - not pixel-matched) ── */}
              <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
                <div className="flex flex-col gap-1">
                  <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{activeSectionNode.label}</p>
                  <TabList aria-label="Home views" orientation="vertical" type="button-brand" fullWidth className="w-full">
                    <Tab id="dashboard" label="My BioData" icon={User01} />
                    <Tab id="overview" label="Flora and Fauna Dashboard" icon={PieChart03} />
                  </TabList>
                </div>
                <SidebarFooterLinks />
              </aside>

              {/* ── Main content: Home's tab panels render the shared real dashboard content
                  (see app/pages/_shared/home-dashboard.tsx and data-overview.tsx) ── */}
              <main className="flex flex-1 flex-col overflow-y-auto">
                <HomeTabPanels />
              </main>
            </Tabs>
          );
        }

        // Projects' two views (Projects / Datasets) get the same "own Tabs boundary, own two peer
        // tabs" treatment as Home's My BioData/Flora and Fauna Dashboard - a single "Manage Project
        // and Datasets" link used to blend these into one destination, flagged directly by the
        // user off this exact sidebar. Datasets has no reference/content yet, so it's the honest
        // "hasn't been scoped yet" placeholder rather than an invented list.
        if (activeSection === "Projects") {
          return (
            <Tabs orientation="vertical" selectedKey={projectsTab} onSelectionChange={setProjectsTab} className="flex flex-1 overflow-hidden">
              {iconRail}

              {/* ── Contextual sidebar: Projects/Datasets tab list (nav chrome - not pixel-matched) ── */}
              <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
                <div className="flex flex-col gap-1">
                  <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{activeSectionNode.label}</p>
                  <TabList aria-label="Projects views" orientation="vertical" type="button-brand" fullWidth className="w-full">
                    <Tab id="projects" label="Projects" icon={Folder} />
                    <Tab id="datasets" label="Datasets" icon={Database01} />
                  </TabList>
                  <ProjectActions />
                </div>
                <SidebarFooterLinks />
              </aside>

              {/* ── Main content: Projects has this screen's own content; Datasets is unscoped ── */}
              <main className="flex flex-1 flex-col overflow-y-auto">
                <TabPanel id="projects" className="flex min-h-0 flex-1 flex-col">
                  <ProjectListContent />
                </TabPanel>
                <TabPanel id="datasets">
                  <SectionPlaceholder node={{ label: "Datasets" }} />
                </TabPanel>
              </main>
            </Tabs>
          );
        }

        return (
          <div className="flex flex-1 overflow-hidden">
            {iconRail}

            {/* ── Contextual sidebar: selected section's children (nav chrome - not pixel-matched) ── */}
            <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
              <div className="flex flex-col gap-1">
                <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{activeSectionNode.label}</p>
                {activeSectionNode.items?.map((item) => <NavTree key={item.label} node={item} depth={1} />)}
              </div>
              <SidebarFooterLinks />
            </aside>

            {/* ── Main content: Home and Projects are intercepted above (their own Tabs
                boundary) - every other section is an honest placeholder until it's scoped ── */}
            <main className="flex flex-1 flex-col overflow-y-auto">
              <SectionPlaceholder node={activeSectionNode} />
            </main>
          </div>
        );
      })()}
    </div>
  );
}
