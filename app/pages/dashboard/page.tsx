"use client";

import type { FC } from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Key } from "react-aria-components";
import { Button as AriaButton, Dialog, DialogTrigger, Tabs } from "react-aria-components";
import { TabList, Tab, TabPanel } from "@/components/application/tabs/tabs";
import { Upload01, Plus, ChevronDown, ArrowNarrowRight, HomeLine, Folder, Database01, Map01, FileLock01, Feather, BarChart01, FileSearch01, User01, PieChart03 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Popover } from "@/components/base/select/popover";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { HomeTabPanels } from "@/app/pages/_shared/home-tab-panels";
import { DataOverviewContent } from "@/app/pages/_shared/data-overview";
import { dashboardTasks } from "@/app/pages/_shared/home-dashboard";
import { ProjectListContent } from "@/app/pages/_shared/project-list-content";
import { GlobalProjectSearch } from "@/app/pages/_shared/global-search";
import { GuestActionButton } from "@/app/pages/_shared/guest-action-gate";
import { GuestAuthActions } from "@/app/pages/_shared/guest-auth-actions";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { orgLabelForRole } from "@/lib/user-role";
import { registeredUserNav, publicUserNav, registeredUserAccountMenu, registeredUserFooterLinks, keyHref, type NavNode } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";

// One icon per top-level section, for the primary icon rail below - presentation-only, so it
// lives here rather than in lib/registered-user-nav.ts (which stays shell-agnostic; option-2's
// top-nav has no use for icons).
const sectionIcons: Record<string, FC<{ className?: string }>> = {
  Home: HomeLine,
  Projects: Folder,
  Explore: Map01,
  "Data Licencing Agreement (DLA)": FileLock01,
  "Nominate Sensitive Species": Feather,
  "Reports (Own Submissions)": BarChart01,
  "Template Finder": FileSearch01,
};

// The canonical Registered User dashboard, on the sidebar (icon-rail + contextual-sidebar) shell -
// per the Sept 16 layout decision, this shell direction is the one going forward, so this page lost
// its `/option-1` suffix and folded into the plain `/pages/dashboard` route. `app/pages/dashboard/
// option-2` (the top-nav shell alternative this was compared against) is kept in place as a record
// of that exploration, per this codebase's "never delete a prototype/explored direction" convention
// - it's just no longer linked to from anywhere real.
//
// A task-first dashboard for a registered user. Personal activity stats (KPI row) stay at the top,
// directly under the greeting - that positioning is a fixed convention, not something to relitigate
// per redesign. "Needs your attention" (a pending DLA request, a nomination under review, a draft
// project) follows below it - that's the "task first" part: it's the dashboard's actual primary
// content, the reason personal contribution stats and org-wide accountability numbers (total
// records, flora/fauna species counts, the map) that used to live here have been trimmed to just
// the KPI row. Decided directly by the user: a registered user has limited scope on this platform,
// so the dashboard's job is to surface what's actually theirs to act on, not to be a smaller version
// of an org-wide reporting surface - see CONTEXT.md's "Registered User dashboard scope".
//
// Figma source: https://www.figma.com/design/SQ58QgwP9Xz0uo3tBpuf6e/DEW-Toolkit--version-1.0-?node-id=103-105
// "SCREEN" (BioData SA dashboard shell, 1440px) - an exploratory layout per CONTEXT.md's
// "Exploratory page layouts (/pages/<page-name>, /pages/<page-name>/<variant>)" section.
// Unlike a /test-* screen (a fixed, already-decided Figma frame), this explores what the
// dashboard could look like while the surrounding IA - primary icon rail, contextual sidebar,
// breadcrumb - is still undecided, so that chrome is built as simplified structural placeholder
// from real tokens rather than pixel-matched or ?-blocked. Every contained widget (search,
// buttons, avatar, alert) still goes through the same "real DEW or honest ? gap" rule as a
// /test-* screen - except the date range control, which graduated from a `?` gap marker to a
// real custom component (components/custom/date-range/date-range-control.tsx, documented under
// "Custom components") once its shape was clear enough to build, ahead of a stakeholder decision
// on where it belongs long-term. Figma's yellow "GENERAL NOTES" sticky note (a designer's comment
// layer, not product UI) is excluded entirely.

// ─────────────────────────────────────────────────────────────────────────
// Local screen chrome - NOT real DEW components. Nav rail/sidebar/footer links
// are exempt from fidelity per CONTEXT.md (IA isn't decided yet); KPI row,
// metric cards, filter panel, and map panel are structural shells composed
// from real tokens because nothing under components/base|application/** models
// these patterns yet.
//
// Three-column shell (Mobbin/Supabase-style): the primary icon rail is the real top-level IA
// (lib/registered-user-nav.ts) - one icon per section, click to select - the contextual sidebar
// shows only the selected section's children as a plain expand/collapse tree built from tokens,
// same exemption as the rest of this nav chrome (no Accordion component exists or is warranted
// for content this undecided), and the third column is the page's own main content. Only the two
// items with a real page (`key` set) are actual links; everything else is inert text until it has
// somewhere to go.
// ─────────────────────────────────────────────────────────────────────────

// This screen's own page key, so its own entry in the tree (Home > BioData Dashboard) can show a
// selected state - it's the page the user is already on by default, so the nav should say so
// rather than looking identical to every unvisited item. Flagged directly by the user off a
// screenshot of this exact link with no active styling.
const CURRENT_KEY = "dashboard";

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
        // Active fill matches the Home views TabList's `button-brand` selected state
        // (components/application/tabs/tabs.tsx) - the "flow this through every column-2
        // candidate" ask, applied here since NavTree's real links are the other column-2
        // selectable-item list, not just the Home switcher. Hover is the same neutral
        // `bg-tertiary`/`text-primary` that type's own hover state now uses (previously this
        // matched the active/selected fill, previewing "selected" on a plain hover - the exact
        // mismatch against the primary icon rail flagged directly by the user, fixed at the
        // design-system level in tabs.tsx and mirrored here since NavTree isn't itself a `Tab`).
        // NavTree stays real `Link`s (this is navigation between pages, not panels within one), so
        // it borrows the tokens rather than becoming a Tabs instance itself.
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

// What column 3 shows for every section besides this screen's own (Home, here). Two honest
// states, not one: a section either has a real page elsewhere (Home -> this very dashboard,
// Projects -> project-list) - in which case say so and link to it, don't claim it's unscoped when
// it demonstrably isn't - or it genuinely has no page yet, which does get the "not scoped" copy.
// Conflating the two read as a bug: clicking Home from another screen showed "hasn't been scoped
// yet" directly above a working "Go to Home" link, flagged directly by the user off a screenshot.
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

// DialogTrigger + our real Popover (react-aria) instead of a hand-rolled useState toggle - gets
// outside-click and Escape dismissal for free, same primitive DateRangeControl already uses for
// its overlay. Any hand-rolled dropdown (a switcher, an org-switcher when that gets built) should
// use this, not a plain conditional div - flagged directly by the user after the project switcher
// shipped without it.
function ProfileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <DialogTrigger onOpenChange={setOpen}>
      <AriaButton className="flex items-center gap-1 rounded-md outline-brand focus-visible:outline-2 focus-visible:outline-offset-2">
        <Avatar size="md" initials="OW" alt="Olivia Wyatt" />
        <ChevronDown className={cx("size-3.5 text-quaternary transition-transform", open && "rotate-180")} />
      </AriaButton>
      <Popover size="sm" className="w-48 p-1">
        <Dialog className="outline-hidden">
          <p className="px-3 py-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Profile</p>
          {registeredUserAccountMenu.map((item) => (
            <p key={item} className="cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">
              {item}
            </p>
          ))}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

// User roles - see CONTEXT.md's "User roles" section. Full 6-role hierarchy is defined in
// lib/user-role.ts, but build focus right now is just registered-user (default) and public-user -
// don't build features for the other four ahead of being told to. Gated features (like the org
// switcher below) read config/role-access.config.ts's role-access matrix via useFeatureAccess
// rather than checking the role inline - that matrix is the single place feature visibility is
// decided, owned separately from this screen. Switch roles via the `userRole` URL search param,
// e.g. `?userRole=public-user`. No real auth/session in this exploratory build, so the URL is the
// only source of truth for "who's looking at this".
export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const router = useRouter();
  const showOrgSwitcher = useFeatureAccess("orgSwitcher");
  // public-user ("Guest User") reads a different, smaller nav tree entirely - not a filtered view
  // of registeredUserNav, since whole sections (DLA, Nominate Sensitive Species, Reports, Template
  // Finder) don't exist for a signed-out visitor, not just individual leaves inside them. See
  // lib/registered-user-nav.ts's publicUserNav and CONTEXT.md's "User roles" section for the real
  // IA this is built from.
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = isPublicUser ? publicUserNav : registeredUserNav;
  const roleHref = useRoleHref();
  const [activeSection, setActiveSection] = useState("Home");
  const [homeTab, setHomeTab] = useState<Key>("dashboard");
  const [projectsTab, setProjectsTab] = useState<Key>("projects");
  const activeSectionNode = nav.find((section) => section.label === activeSection) ?? nav[0];

  // Home and Projects both have a real page of their own - clicking either from a *different*
  // page's shell now actually navigates there instead of faking the content in place, so the URL,
  // back/forward, and refresh all behave honestly. Sections with no real page yet (Observations,
  // DLA, ...) stay a local, in-place section switch, same as before. Flagged directly by the user
  // off a screenshot: leaving project-list/option-1's URL in the bar while showing Home's content
  // was "a bit odd". `roleHref` (not a bare path) - a plain `/pages/...` path drops the active
  // role, silently falling back to `registered-user` on the destination page. Flagged directly by
  // the user as a dead end: switching Home -> Projects as `public-user` landed on
  // `registered-user`'s view instead.
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pages/dashboard/gov-sa-dew-lockup.png"
            alt="Government of South Australia, Department for Environment and Water"
            className="h-[37px] w-auto"
          />
          <div className="h-6 w-px bg-secondary" />
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
          <Breadcrumb
            section={activeSection === "Home" ? undefined : activeSectionNode.label}
            orgLabel={showOrgSwitcher ? orgLabelForRole(role) : undefined}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-64 lg:w-[395px]">
              <GlobalProjectSearch />
            </div>
            {/* Creating requires an account - visible for every role including public-user (a
                signed-out guest reaching for these is a real moment, not one to hide), but a
                guest's click opens a sign-up invite instead of doing nothing. See
                app/pages/_shared/guest-action-gate.tsx. Flagged directly by the user: turn the
                "you can't do this" moment into a delight moment, not a wall. */}
            <GuestActionButton
              icon={Plus}
              label="Add project"
              color="primary"
              isGuest={isPublicUser}
              modalTitle="Sign up to add a project"
              modalDescription="Create a free BioData SA account to start contributing projects to South Australia's biodiversity record."
              href="/pages/project-registration"
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

      {/* ── Primary icon rail: top-level IA (nav chrome - not pixel-matched) ── */}
      {(() => {
        const iconRail = (
          <nav aria-label="Primary" className="hidden w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-secondary bg-secondary py-4 lg:flex">
            {nav.map((section) => {
              const Icon = sectionIcons[section.label];
              const active = section.label === activeSection;
              // "Needs your attention"'s count, badged on Home instead of only showing once you're
              // already there - the same count `HomeDashboardContent` renders, not a second copy.
              // Only shown for registered-user - that list is a signed-in registered user's own
              // pending tasks (a draft project, a DLA request); a guest's Home has no such personal
              // content, and biodata-admin's Home shows a different, operational content set
              // (AdminHomeDashboardContent) that this count doesn't describe.
              const badgeCount = role === "registered-user" && section.label === "Home" ? dashboardTasks.length : 0;
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
                    {badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-error-solid text-[10px] font-semibold tabular-nums text-white">
                        {badgeCount}
                      </span>
                    )}
                  </TooltipTrigger>
                </Tooltip>
              );
            })}
          </nav>
        );

        // public-user's Home and Projects are each a single view (see publicUserNav) - no peer tab
        // to switch between, so no Tabs boundary at all, just the section's one real content
        // directly. Checked before the two-peer-tab branches below so those never run for this
        // role. A two-tab switcher with only one real tab would be dishonest UI - a control
        // implying a choice that doesn't exist - not just a visual downgrade.
        //
        // No contextual-sidebar column at all here, deliberately - not the usual aside with a
        // section-label heading and nothing else in it. That shape works when the aside holds real
        // selectable content (a NavTree, a Tabs switcher); with neither, it's just a 286px-wide
        // empty box with the footer links stranded at the bottom - dead space, not minimalism.
        // Flagged directly by the user as looking empty/unfinished. Since public-user is explicitly
        // "a bare bones version of the platform," dropping the column and letting main content use
        // the full width reads as a deliberately leaner layout instead of a broken one. The footer
        // links this column would've carried are still reachable from Observations' own aside
        // (the one section left that still uses it) - not worth inventing a new place to repeat
        // them just so every section carries the exact same chrome.
        if (isPublicUser && (activeSection === "Home" || activeSection === "Projects")) {
          return (
            <div className="flex flex-1 overflow-hidden">
              {iconRail}

              <main className="flex flex-1 flex-col overflow-y-auto">
                {activeSection === "Home" ? <DataOverviewContent /> : <ProjectListContent />}
              </main>
            </div>
          );
        }

        // Home's two views (My BioData / Flora and Fauna Dashboard) get their own Tabs boundary, mounted
        // only while Home is active - not one Tabs wrapping the whole page permanently. React-aria's
        // Tabs keeps a single internal collection for its whole lifetime; a Tabs that always exists
        // while its TabList only mounts once you switch to Home crashes the first time TabList
        // mounts ("Cannot destructure property 'onAction' ... as it is undefined") - caught on
        // project-detail/option-1, fixed the same way here since this file has the identical shape.
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
                <div className="flex flex-col gap-2 border-t border-secondary pt-4 text-xs text-quaternary">
                  {registeredUserFooterLinks.map((link) => (
                    <p key={link}>{link}</p>
                  ))}
                </div>
              </aside>

              {/* ── Main content: Home's tab panels render the real dashboard content (shared
                  with project-list and project-detail, see app/pages/_shared/home-dashboard.tsx
                  and data-overview.tsx) ── */}
              <main className="flex flex-1 flex-col overflow-y-auto">
                <HomeTabPanels />
              </main>
            </Tabs>
          );
        }

        // Projects' two views (Projects / Datasets) get the same "own Tabs boundary, own two peer
        // tabs" treatment as Home's My BioData/Flora and Fauna Dashboard - a single "Manage Project
        // and Datasets" link used to blend these into one destination, flagged directly by the
        // user off project-list/option-1's sidebar. Datasets has no reference/content yet, so it's
        // the honest "hasn't been scoped yet" placeholder rather than an invented list.
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
                </div>
                <div className="flex flex-col gap-2 border-t border-secondary pt-4 text-xs text-quaternary">
                  {registeredUserFooterLinks.map((link) => (
                    <p key={link}>{link}</p>
                  ))}
                </div>
              </aside>

              {/* ── Main content: Projects has this screen's own content; Datasets is unscoped ── */}
              <main className="flex flex-1 flex-col overflow-y-auto">
                <TabPanel id="projects">
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
              <div className="flex flex-col gap-2 border-t border-secondary pt-4 text-xs text-quaternary">
                {registeredUserFooterLinks.map((link) => (
                  <p key={link}>{link}</p>
                ))}
              </div>
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
