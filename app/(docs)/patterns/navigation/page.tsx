"use client";

import { Suspense, useState } from "react";
import type { ReactNode } from "react";
import { HomeLine, Folder, Map01, FileLock01, Upload01, Plus } from "@untitledui/icons";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { cx } from "@/utils/cx";
import { assetPath } from "@/lib/base-path";

// `fullBleed` breaks the card out of the docs shell's normal `max-w-5xl` reading column
// (app/(docs)/layout.tsx) on the RIGHT only - left edge stays exactly where normal flow already
// puts it (flush with every heading/paragraph above and below), only the width grows past the
// column's ~928px cap so the card doesn't also drift left and look stuck to the sidebar (flagged
// directly by the user off the first version, which cancelled the column's padding on both sides
// via `-mx-12` and left-shifted the whole card by 48px). Only used for the top nav demo below: at
// the column's normal width, that header's real content (full breadcrumb chain, both header
// actions) doesn't fit on one line without either wrapping or cutting content - flagged directly by
// the user on both counts ("jumbled" when it wrapped, "incomplete" when it was trimmed to fit
// instead). A live, real-sized WYSIWYG demo of a real 64px header needs real width, not a narrower
// stand-in. `17rem` = the sidebar (`w-56`, 14rem) plus the column's own left padding (`px-12`,
// 3rem) - the same offset every other element on this page already sits at; `2rem` is this card's
// own breathing margin from the true viewport edge.
const Section = ({ label, children, fullBleed = false }: { label: string; children: ReactNode; fullBleed?: boolean }) => (
  <div
    className={cx("flex flex-col items-start gap-4 rounded-xl border border-secondary bg-secondary p-6")}
    style={fullBleed ? { width: "calc(100vw - 17rem - 2rem)" } : undefined}
  >
    <p className="text-xs font-semibold text-quaternary uppercase tracking-widest text-balance">{label}</p>
    {children}
  </div>
);

// Same slice of the real IA (lib/registered-user-nav.ts) the side nav demo below is built from -
// just enough to demonstrate the anatomy, not a copy of the real nav tree's full 7 sections.
const demoSections = [
  { label: "Home", icon: HomeLine },
  { label: "Projects", icon: Folder },
  { label: "Explore", icon: Map01 },
  { label: "Data Licencing Agreement (DLA)", icon: FileLock01 },
];

// A self-contained illustrative recreation of the icon rail + contextual sidebar, not an import of
// a shared component - see the "Not fully reusable" note below for why. Local `useState`, same as
// the real page's own copy of this chrome (dashboard/page.tsx's `activeSection`), so clicking a
// rail icon here behaves the same way it does on a real screen.
function SideNavDemo() {
  const [active, setActive] = useState("Home");

  return (
    <div className="flex h-80 w-full overflow-hidden rounded-lg border border-secondary bg-primary">
      {/* Primary icon rail - w-16 (64px), bg-secondary, one icon per top-level IA section. */}
      <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-secondary py-4">
        {demoSections.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => setActive(label)}
            aria-label={label}
            className={cx(
              "flex size-12 items-center justify-center rounded-lg transition duration-100 ease-linear",
              active === label ? "bg-brand-solid text-white" : "text-quaternary hover:bg-tertiary hover:text-primary",
            )}
          >
            <Icon className="size-5" />
          </button>
        ))}
      </nav>

      {/* Contextual sidebar - w-[286px] (demo uses a narrower w-56 to fit the card), bg-secondary,
          shows only the active section's own children. */}
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-secondary bg-secondary p-4 sm:flex">
        <p className="mb-2 text-xs font-semibold tracking-wide text-quaternary uppercase">{active}</p>
        <p className="rounded-md bg-brand-secondary px-2 py-2 text-sm font-medium text-brand-secondary">{active} overview</p>
        <p className="rounded-md px-2 py-2 text-sm text-tertiary">Related item</p>
      </aside>

      {/* Main content - the page's own content, third column. */}
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-sm text-tertiary">Main content for &ldquo;{active}&rdquo;</p>
      </div>
    </div>
  );
}

// Option-1's persistent header bar - unlike SideNavDemo above, this one is built from real,
// imported DEW/scaffold pieces rather than a hand-rolled approximation, since two of its three
// sections already are real shared components: the logo is the real asset every page points at,
// and `Breadcrumb` (components/scaffold/breadcrumb.tsx) is genuinely shared, not page-local.
// Wrapped in `Suspense` - `Breadcrumb` reads the active role via `useRoleHref` -> `useUserRole` ->
// `useSearchParams`, same requirement every real page already has.
function TopNavDemo() {
  return (
    <Suspense fallback={null}>
      <header className="flex h-16 w-full shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg border border-secondary bg-primary px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath("/pages/dashboard/gov-sa-dew-lockup.png")}
            alt="Government of South Australia, Department for Environment and Water"
            className="h-[37px] w-auto"
          />
          <div className="h-6 w-px bg-[var(--ui-border-primary)]" />
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
          <Breadcrumb section="Projects" current="Adelaide Hills Bushland Survey" orgLabel="DEW" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" color="primary" iconLeading={Plus}>Add project</Button>
          <Button size="sm" color="secondary" iconLeading={Upload01}>Upload dataset</Button>
          <Avatar size="md" initials="OW" alt="Olivia Wyatt" />
        </div>
      </header>
    </Suspense>
  );
}

// The deep-dive crumb, live: the section's name with an up-down caret on a record page. Choosing a record changes the
// "current" crumb here (on a real page it opens that record); "View all" says where it would go.
const SWITCHER_ITEMS = [
  { id: "adelaide-hills", label: "Adelaide Hills Bushland Survey", addon: "BD-5039" },
  { id: "coorong", label: "Coorong Wetlands Bird Count", addon: "BD-5102" },
  { id: "flinders", label: "Flinders Ranges Reptile Atlas", addon: "BD-5137" },
  { id: "kangaroo-island", label: "Kangaroo Island Recovery Monitoring", addon: "BD-4988" },
];

function BreadcrumbSwitcherDemo() {
  const [current, setCurrent] = useState("adelaide-hills");
  const [note, setNote] = useState("");
  const name = SWITCHER_ITEMS.find((i) => i.id === current)?.label;
  return (
    <div className="font-barlow flex flex-col gap-3">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-tertiary">
        <span>Home</span>
        <span>/</span>
        <BreadcrumbSwitcher
          label="Projects"
          ariaLabel="Switch project"
          placeholder="Search projects"
          items={SWITCHER_ITEMS}
          currentId={current}
          onSelect={(id) => {
            setCurrent(id);
            setNote("");
          }}
          viewAllLabel="View all projects"
          onViewAll={() => setNote("On a real page this opens the Projects list.")}
        />
        <span>/</span>
        <span className="text-primary">{name}</span>
      </nav>
      {note && <p className="text-sm text-tertiary">{note}</p>}
    </div>
  );
}

export default function NavigationPatternPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Patterns"
        title="Navigation"
        description="The sidebar shell's two nav pieces: a primary icon rail + contextual sidebar (side nav), and the persistent header bar above it (top nav)."
      />

      <h2 className="text-balance">Side nav</h2>
      <p className="text-balance">
        A <strong>64px primary icon rail</strong> (one icon per top-level section, always visible) next to a{" "}
        <strong>286px contextual sidebar</strong> (only the active section&apos;s own children), next to the page&apos;s main
        content. Clicking a rail icon either switches the contextual sidebar in place (a section with no page of its own yet) or
        navigates to that section&apos;s real page (Home, Projects) - see <code>goToSection</code> in{" "}
        <code>app/pages/dashboard/page.tsx</code> for the real logic this demo simplifies.
      </p>
      <Section label="Side nav - anatomy">
        <SideNavDemo />
      </Section>

      <h3 className="text-balance">Items in the contextual sidebar</h3>
      <p className="text-balance">
        Every navigation item in the contextual sidebar carries an icon to the left of its label (contract section 3.11), so the
        column scans by shape as well as by word, and the same item has the same icon in the mobile menu.
      </p>
      <ul>
        <li>
          <strong>All and My.</strong> <em>All</em> comes first and takes the section&apos;s own icon from the rail (All projects
          the folder, All requests the licence file); <em>My</em> is that list narrowed to you and takes the person icon.
        </li>
        <li>
          <strong>Area and view tabs</strong> take the icon of what they hold: All users, All roles and All permissions in User Management; My
          BioData and the Flora and Fauna Dashboard on Home.
        </li>
        <li>
          <strong>Actions</strong> carry their action: Export CSV the download arrow, Create report the bar chart.
        </li>
        <li>
          <strong>Built with</strong> <code>Tab icon</code>, <code>ActionRow</code> and, for the extra items in the mobile menu,{" "}
          <code>MobileNavItem</code>. A vertical tab list with an item that has no icon fails <code>npm run check:contracts</code>.
        </li>
      </ul>

      <h2 className="text-balance">Top nav</h2>
      <p className="text-balance">
        A <strong>64px header</strong>: logo (37px, aspect ratio locked) + product name + breadcrumb on the left, primary actions +
        profile on the right. Every canonical page (<code>/pages/dashboard</code>, <code>/pages/project-detail</code>,{" "}
        <code>/pages/observation-detail</code>, ...) renders this same bar, just with its own section/current crumb. The right
        side is one <strong>Add</strong> menu (a project, a data licence request, a data sharing agreement - only what the persona
        can create), the global search, and the account control.
      </p>
      <Section label="Top nav - anatomy" fullBleed>
        <TopNavDemo />
      </Section>

      <h2 className="text-balance">Shared shell components: a contract</h2>
      <p className="text-balance">
        The header and the icon rail are <strong>shared components, never rebuilt per screen</strong>, and they are the same for
        every persona (a guest differs only in its account controls). This is a non-negotiable design system contract, enforced by{" "}
        <code>npm run check:contracts</code>.
      </p>
      <ul>
        <li>
          <code>AppHeader</code> (<code>app/pages/_shared/app-header.tsx</code>): logo lockup, wordmark, breadcrumb with the
          role-driven org pill (DEW for BioData roles, ORG for privileged roles, none otherwise), global search, the <strong>Add</strong>{" "}
          menu, and the profile menu or Log in / Sign up. A screen passes only its mobile-nav trigger and its breadcrumb.
        </li>
        <li>
          <code>CreateMenu</code> and <code>lib/create-menu.ts</code>: what the Add menu offers each persona, filtered by the
          role-access matrix. To let a persona create something new, add one entry there.
        </li>
        <li>
          <code>PrimaryRail</code> (<code>primary-rail.tsx</code>) and <code>sectionIcons</code> (<code>nav-icons.ts</code>): column 1, its
          one icon per section, and the Terms / Privacy / Help links as icons at its foot. Home&apos;s task badge is decided once,
          inside the rail.
        </li>
        <li>
          Never hand-roll a <code>&lt;header&gt;</code>, a primary rail, an icon map, or copy the profile menu into a screen. The
          check fails on any of them under <code>app/pages</code> (labs in <code>app/proto</code>, the marketing landing page and the
          auth flow are exempt).
        </li>
      </ul>

      <h2 className="text-balance">The breadcrumb on a deep-dive page</h2>
      <p>
        On a record page (a project, a report, a data licence request, an agreement, a nomination, a user, role or permission) the
        section crumb is a <strong>switcher</strong>: the section&apos;s name with an up-down caret, opening one popup so a person
        can move to another record of the same collection without going back to the list, searching, and clicking in. The
        crumb after it is the record&apos;s name. On the list page itself the crumb is plain.
      </p>
      <Section label="Breadcrumb switcher (Projects)">
        <BreadcrumbSwitcherDemo />
      </Section>
      <ul>
        <li>
          <strong>The popup:</strong> the design system <code>ComboBox</code> as a search box at the top, with its list directly
          under it (A-Z, name and ID, about six rows then scrolling inside), the current record ticked, and a bar fixed at the
          foot, &quot;View all &lt;things&gt;&quot;, which goes to the list. Search matches the name or the ID. Escape closes it and
          focus returns to the crumb. It lists only the records the signed-in role may see.
        </li>
        <li>
          <strong>One piece, reused:</strong> <code>BreadcrumbSwitcher</code> (<code>app/pages/_shared/breadcrumb-switcher.tsx</code>),
          through a thin wrapper per collection (<code>ProjectSwitcher</code>, <code>ReportSwitcher</code> and one for each of DLA,
          DSA, nominations and user management). A collection never builds its own.
        </li>
        <li>
          <strong>One name:</strong> the section is called the same in the breadcrumb, the rail and column 2 (&quot;Reports&quot;).
          Who sees what is the content&apos;s rule, not part of the name.
        </li>
        <li>
          The rule is CONTRACTS §4.6, item 5.
        </li>
      </ul>

      <h2 className="text-balance">Notes</h2>
      <ul>
        <li>
          <strong>Not fully reusable - most of it is page-local chrome, duplicated per screen on purpose.</strong> The icon rail and
          contextual sidebar have no shared component (each real page keeps its own copy, since the IA and interaction details -
          which sections get a two-peer-tab split, which are inert placeholders - still differ per screen). The header&apos;s{" "}
          <code>Breadcrumb</code> is the one genuinely shared piece (<code>components/scaffold/breadcrumb.tsx</code>) and is used
          directly, unmodified, in the demo above - not recreated.
        </li>
        <li>
          Header height (64px) and the logo lockup&apos;s height (37px, aspect ratio locked via <code>w-auto</code>) are the current,
          confirmed spec, real DEW-sourced measurements.
        </li>
        <li>
          <strong>Option-2 (the top-nav shell alternative - header + primary nav bar with no icon rail) has been sunset and its code
          deleted</strong> - the sidebar shell is the one documented direction. Designers present numbered options to stakeholders
          while a screen is still being explored; once one is chosen the others are removed.
        </li>
        <li>
          Figma source: <a href="https://www.figma.com/design/bgksKvmSaVR7ZptB98LzGr/-HI-FI--Dashboard-Explorations">-HI-FI- Dashboard Explorations</a>.{" "}
          <strong>This page documents the shell in code only</strong> - equivalent documentation on the Figma file itself (the
          project&apos;s source of truth) is still outstanding, flagged directly by the user as their own follow-up, not done here.
        </li>
      </ul>
    </div>
  );
}
