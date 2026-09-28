"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { ActionsGroup, downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { FormSidebarSlotContext } from "@/app/pages/_shared/form-section-list";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";
import { accessStatusMeta, fullName, organisationLabel, userStatusMeta, userType } from "@/app/pages/_shared/user-management/um-data";
import { usePermissions, useRoles, useUsers } from "@/app/pages/_shared/user-management/um-store";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { USER_MANAGEMENT_SECTION_LABEL, keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";

// The one shell every User Management route renders through (the three lists, each deep dive, the
// add forms), so the three columns are the same on all of them and for every persona. Same shape
// as DsaShell: a persona without access still gets all three columns, with the restriction in main.
//
// Column 2 is the switcher between the three areas the wireframe (Figma YMproGZfrFB5jUqPHPxMhk,
// node 1558:10575) draws as separate two-pane screens - Users, Roles, Permissions - the same
// vertical `Tabs` (`button-brand`) as DLA's My / All, with an Actions group under it. Main is a
// list -> deep dive (CONTEXT.md), not the wireframe's side-by-side list and detail.
const CURRENT_KEY = "user-management";

export type UmArea = "users" | "roles" | "permissions";

export const umAreaPath: Record<UmArea, string> = {
  users: "/pages/user-management",
  roles: "/pages/user-management/roles",
  permissions: "/pages/user-management/permissions",
};

const areaLabel: Record<UmArea, string> = { users: "Users", roles: "Roles", permissions: "Permissions" };

function SectionPlaceholder({ node }: { node: NavNode }) {
  const relatedLink = node.key ? node : node.items?.find((item) => item.key);
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-medium text-primary">{node.label}</h1>
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

// Column 2's content. Also rendered in the mobile navigation menu, where the aside is hidden.
function AreaNav({ area }: { area: UmArea }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const users = useUsers();
  const roles = useRoles();
  const permissions = usePermissions();

  const exportCsv = () => {
    if (area === "users") {
      downloadCsv(
        "users.csv",
        ["User ID", "Name", "Position", "Organisation", "User type", "Status", "Email"],
        users.map((u) => [u.id, fullName(u), u.position, organisationLabel(u), userType(u), userStatusMeta[u.status].label, u.email]),
      );
    } else if (area === "roles") {
      downloadCsv(
        "roles.csv",
        ["Role ID", "Role", "Type", "Department", "Role type", "Permissions", "Status"],
        roles.map((r) => [r.id, r.name, r.kind === "system" ? "System" : "Custom", r.department ?? "", r.roleType, String(r.permissionIds.length), accessStatusMeta[r.status].label]),
      );
    } else {
      downloadCsv(
        "permissions.csv",
        ["Permission ID", "Code", "Permission", "Category", "Status"],
        permissions.map((p) => [p.id, p.code, p.name, p.category, accessStatusMeta[p.status].label]),
      );
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{USER_MANAGEMENT_SECTION_LABEL}</p>
      <Tabs orientation="vertical" selectedKey={area} onSelectionChange={(key) => router.push(roleHref(umAreaPath[key as UmArea]))}>
        <TabList aria-label={USER_MANAGEMENT_SECTION_LABEL} orientation="vertical" type="button-brand" fullWidth className="w-full">
          <Tab id="users" label="Users" badge={users.length} />
          <Tab id="roles" label="Roles" badge={roles.length} />
          <Tab id="permissions" label="Permissions" badge={permissions.length} />
        </TabList>
      </Tabs>
      <ActionsGroup onExportCsv={exportCsv} showCreateReport={false} />
    </div>
  );
}

export function UmShell({
  area,
  breadcrumbCurrent,
  formSidebar = false,
  children,
}: {
  area: UmArea;
  /** The page's final crumb (a name, "Add user"). When set, the area crumb links back to its list. */
  breadcrumbCurrent?: string;
  /** A form with sections: column 2 becomes its section list (the form portals in via `FormSidebar`). */
  formSidebar?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();
  const canManage = useFeatureAccess("userManagement");
  const nav = navForRole(role);
  const roleHref = useRoleHref();

  // null = this route's own section; anything else is a rail click on a section with no page yet.
  const [localSection, setLocalSection] = useState<string | null>(null);
  const activeSection = localSection ?? USER_MANAGEMENT_SECTION_LABEL;
  const otherSection = localSection ? nav.find((section) => section.label === localSection) : undefined;
  const [formSlot, setFormSlot] = useState<HTMLElement | null>(null);
  const showAreaNav = canManage && !otherSection;

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key === CURRENT_KEY) setLocalSection(null);
    else if (relatedLink?.key) router.push(roleHref(keyHref(relatedLink.key)));
    else setLocalSection(section.label);
  };

  let main: ReactNode = children;
  if (otherSection) main = <SectionPlaceholder node={otherSection} />;
  else if (!canManage)
    main = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-lg font-medium text-primary">{USER_MANAGEMENT_SECTION_LABEL}</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">Users, roles and permissions are managed by BioData Admins. Your account doesn&apos;t have access to this section.</p>
        <Button color="link-color" size="sm" href={roleHref("/pages/dashboard")} iconTrailing={ArrowNarrowRight}>
          Go to Home
        </Button>
      </div>
    );

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <RoleSwitcher />
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
            {showAreaNav && !formSidebar ? () => <AreaNav area={area} /> : undefined}
          </MobileNavTrigger>
        }
        // Home / User Management / <area> [/ <record>]: the section slot carries the area crumb too,
        // since the header's final crumb is plain text.
        section={
          otherSection || !canManage ? (
            activeSection
          ) : (
            <>
              <Link href={roleHref(umAreaPath.users)} className="hover:text-primary">
                {activeSection}
              </Link>
              <span>/</span>
              {breadcrumbCurrent ? (
                <Link href={roleHref(umAreaPath[area])} className="hover:text-primary">
                  {areaLabel[area]}
                </Link>
              ) : (
                <span className="text-primary">{areaLabel[area]}</span>
              )}
            </>
          )
        }
        current={otherSection || !canManage ? undefined : breadcrumbCurrent}
      />

      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection={canManage || otherSection ? activeSection : null} onSelectSection={goToSection} />

        <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          {showAreaNav && formSidebar ? (
            <div ref={setFormSlot} />
          ) : showAreaNav ? (
            <AreaNav area={area} />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{otherSection?.label ?? USER_MANAGEMENT_SECTION_LABEL}</p>
              {otherSection?.items?.map((item) => (
                <p key={item.label} className="px-2 py-2 text-sm text-tertiary">
                  {item.label}
                </p>
              ))}
            </div>
          )}
          <SidebarFooterLinks />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <FormSidebarSlotContext.Provider value={formSlot}>{main}</FormSidebarSlotContext.Provider>
        </main>
      </div>
    </div>
  );
}
