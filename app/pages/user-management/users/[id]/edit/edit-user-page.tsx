"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { UmShell } from "@/app/pages/_shared/user-management/um-shell";
import { UmNotFound } from "@/app/pages/_shared/user-management/um-detail";
import { AddUserForm } from "@/app/pages/_shared/user-management/um-forms";
import { updateUser, useUmHydrated, useUser } from "@/app/pages/_shared/user-management/um-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/user-management/users/<id>/edit - the same three-section form as Add user, opened on a user who exists (the way
// /pages/dla/<id>/edit opens the request form): its sections in column 2, "Save changes" on the last, and back to the user's page.
export default function EditUserPage() {
  return (
    <Suspense fallback={null}>
      <EditUser />
    </Suspense>
  );
}

function EditUser() {
  const { id } = useParams<{ id: string }>();
  const user = useUser(id);
  const hydrated = useUmHydrated();
  const router = useRouter();
  const roleHref = useRoleHref();
  const detailHref = roleHref(`/pages/user-management/users/${id}`);
  return (
    <UmShell area="users" breadcrumbCurrent={user ? `Edit ${user.firstName} ${user.lastName}` : `Edit ${id}`} formSidebar>
      {user ? (
        <AddUserForm
          key={user.id}
          initial={user}
          onCancel={() => router.push(detailHref)}
          onSubmit={(draft) => {
            updateUser(user.id, draft);
            toast.success("User updated", { description: `${draft.firstName} ${draft.lastName}` });
            router.push(detailHref);
          }}
        />
      ) : hydrated ? (
        <UmNotFound kind="user" id={id} backHref="/pages/user-management" />
      ) : null}
    </UmShell>
  );
}
