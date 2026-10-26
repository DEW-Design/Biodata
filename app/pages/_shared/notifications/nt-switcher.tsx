"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { NT_ROOT } from "@/app/pages/_shared/notifications/nt-data";
import { useNotifications } from "@/app/pages/_shared/notifications/nt-store";
import { useRoleHref } from "@/lib/use-role-href";
import { NOTIFICATION_SECTION_LABEL } from "@/lib/registered-user-nav";

// The section crumb of a notification's record page: a searchable switcher over the notifications the list shows (every
// status, to the one role that can reach Notification Management), A-Z by name with the ID beside it, with the current one
// ticked and a "View all notifications" bar to the list. Picking a notification opens it.
export function NotificationSwitcher({ currentId }: { currentId: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const notifications = useNotifications();

  const items = useMemo(
    () =>
      notifications
        .map((n) => ({ id: n.id, label: n.name || n.id, addon: n.name ? n.id : undefined }))
        .sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id)),
    [notifications],
  );

  return (
    <BreadcrumbSwitcher
      label={NOTIFICATION_SECTION_LABEL}
      ariaLabel="Switch notification"
      placeholder="Search notifications"
      items={items}
      currentId={currentId}
      onSelect={(id) => router.push(roleHref(`${NT_ROOT}/${id}`))}
      viewAllLabel="View all notifications"
      onViewAll={() => router.push(roleHref(NT_ROOT))}
    />
  );
}
