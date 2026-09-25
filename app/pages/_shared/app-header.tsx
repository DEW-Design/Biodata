"use client";

import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { CreateMenu } from "@/app/pages/_shared/create-menu";
import { GlobalSearch } from "@/app/pages/_shared/global-search";
import { GuestAuthActions } from "@/app/pages/_shared/guest-auth-actions";
import { ProfileMenu } from "@/app/pages/_shared/profile-menu";
import { assetPath } from "@/lib/base-path";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useUserRole } from "@/lib/use-user-role";
import { orgLabelForRole } from "@/lib/user-role";

// THE header. Every real /pages/** screen renders this and nothing else at the top - never a
// hand-rolled `<header>` (see CONTEXT.md, "Final check": the header contract). It owns everything
// that must not differ between screens: the logo lockup, the BioData SA wordmark, the breadcrumb
// with its role-driven org pill, the global search, the "Add" menu, and the account controls
// (profile menu for a signed-in persona, Log in / Sign up for a guest). A screen supplies only what
// is genuinely its own: its mobile-nav trigger and its breadcrumb.
//
// Role-specific behaviour lives here, driven by the role and the role-access matrix, so a persona
// sees the same header on every screen:
// - org pill: only where `orgSwitcher` allows it (DEW for biodata roles, ORG for privileged roles),
// - "Add" menu: the items `lib/create-menu.ts` lists for the role (a guest gets the sign-up invite),
// - account: `ProfileMenu`, or `GuestAuthActions` for public-user.
//
// Position in the tree: a top-level sibling *before* the rail + sidebar + main row, spanning the
// full width - never inside `main`.
export function AppHeader({
  mobileNav,
  section,
  current,
  renderBreadcrumb,
}: {
  /** The screen's `MobileNavTrigger` (its contextual content is screen-specific). Omit on a screen with no rail. */
  mobileNav?: ReactNode;
  /** The current top-level section: a label, or an interactive element in its place. Omit for Home. */
  section?: ReactNode;
  /** A final, page-specific crumb after `section`. */
  current?: string;
  /** For a screen whose breadcrumb is a longer chain: build it here, given the org pill text to pass on. Overrides `section`/`current`. */
  renderBreadcrumb?: (orgLabel: string | undefined) => ReactNode;
}) {
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const showOrgSwitcher = useFeatureAccess("orgSwitcher");
  const orgLabel = showOrgSwitcher ? orgLabelForRole(role) : undefined;

  return (
    <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-secondary bg-primary px-4 py-3">
      {/* min-w-0 so this block can shrink (and a long breadcrumb truncate) instead of forcing the
          header to wrap "search + actions" onto a second row. */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
        {mobileNav}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath("/pages/dashboard/gov-sa-dew-lockup.png")} alt="Government of South Australia, Department for Environment and Water" className="h-[37px] w-auto" />
        <div className="h-6 w-px bg-[var(--ui-border-primary)]" />
        {/* Wordmark and breadcrumb share one text baseline (17px semibold beside 14px text sat on
            different baselines when both were centred in the row). */}
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
          {renderBreadcrumb ? renderBreadcrumb(orgLabel) : <Breadcrumb section={section} current={current} orgLabel={orgLabel} />}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-64 lg:w-[395px]">
            <GlobalSearch />
          </div>
          <CreateMenu />
        </div>
        {isPublicUser ? <GuestAuthActions /> : <ProfileMenu />}
      </div>
    </header>
  );
}
