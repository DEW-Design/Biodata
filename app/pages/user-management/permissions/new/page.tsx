"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { UmShell } from "@/app/pages/_shared/user-management/um-shell";
import { AddPermissionForm } from "@/app/pages/_shared/user-management/um-forms";
import { addPermissions } from "@/app/pages/_shared/user-management/um-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/user-management/permissions/new - Add permission, one page, one or several in a category. Saving lands on the first new permission's deep dive.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <NewRecord />
    </Suspense>
  );
}

function NewRecord() {
  const router = useRouter();
  const roleHref = useRoleHref();
  return (
    <UmShell area="permissions" breadcrumbCurrent="Add permission">
      <AddPermissionForm
        onCancel={() => router.push(roleHref("/pages/user-management/permissions"))}
        onSubmit={(draft) => {
          const created = addPermissions(draft);
          toast.success(created.length > 1 ? `${created.length} permissions added` : "Permission added", { description: created.map((p) => p.name).join(", ") });
          router.push(roleHref(`/pages/user-management/permissions/${created[0]!.id}`));
        }}
      />
    </UmShell>
  );
}
