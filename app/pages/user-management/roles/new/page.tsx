"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { UmShell } from "@/app/pages/_shared/user-management/um-shell";
import { AddRoleForm } from "@/app/pages/_shared/user-management/um-forms";
import { addRole } from "@/app/pages/_shared/user-management/um-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/user-management/roles/new - Add role, one page. Saving lands on the new role's deep dive.
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
    <UmShell area="roles" breadcrumbCurrent="Add role">
      <AddRoleForm
        onCancel={() => router.push(roleHref("/pages/user-management/roles"))}
        onSubmit={(draft) => {
          const record = addRole(draft);
          toast.success("Role added", { description: record.name });
          router.push(roleHref(`/pages/user-management/roles/${record.id}`));
        }}
      />
    </UmShell>
  );
}
