"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { UmShell } from "@/app/pages/_shared/user-management/um-shell";
import { AddUserForm } from "@/app/pages/_shared/user-management/um-forms";
import { addUser } from "@/app/pages/_shared/user-management/um-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/user-management/users/new - Add user. Its sections live in column 2 (User details, Organisation and access, Roles). Saving lands on the new user's deep dive, as Invited.
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
    <UmShell area="users" breadcrumbCurrent="Add user" formSidebar>
      <AddUserForm
        onCancel={() => router.push(roleHref("/pages/user-management"))}
        onSubmit={(draft) => {
          const record = addUser(draft);
          toast.success("User added as Invited", { description: `${record.firstName} ${record.lastName} - no email is sent in this preview.` });
          router.push(roleHref(`/pages/user-management/users/${record.id}`));
        }}
      />
    </UmShell>
  );
}
