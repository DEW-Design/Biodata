"use client";

import { Suspense } from "react";
import { UmShell } from "@/app/pages/_shared/user-management/um-shell";
import { UsersList } from "@/app/pages/_shared/user-management/um-lists";

// /pages/user-management - User Management's first area, the Users list (BioData Admin only). A row opens /pages/user-management/users/<id>.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <UmShell area="users">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <UsersList />
        </div>
      </UmShell>
    </Suspense>
  );
}
