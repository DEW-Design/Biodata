"use client";

import { Suspense, useState } from "react";
import type { ReactNode } from "react";
import { HomeLine, Folder, Map01, FileLock01, Upload01, Plus } from "@untitledui/icons";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
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
          <div className="h-6 w-px bg-secondary" />
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

      <h2 className="text-balance">Top nav</h2>
      <p className="text-balance">
        A <strong>64px header</strong>: logo (37px, aspect ratio locked) + product name + breadcrumb on the left, primary actions +
        profile on the right. Every canonical page (<code>/pages/dashboard</code>, <code>/pages/project-detail</code>,{" "}
        <code>/pages/observation-detail</code>, ...) renders this same bar, just with its own section/current crumb.
      </p>
      <Section label="Top nav - anatomy" fullBleed>
        <TopNavDemo />
      </Section>

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
          <strong>Option-2 (the top-nav shell alternative - header + primary nav bar with no icon rail) has been sunset</strong> per
          the Sept 16 2026 layout decision and is not documented here. Its code still exists (<code>dashboard/option-2</code>,{" "}
          <code>project-list/option-2</code>) per this design system&apos;s &ldquo;never delete an explored direction&rdquo;
          convention, but it&apos;s inert - not linked to from anywhere live, and not a pattern to build new work against.
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
