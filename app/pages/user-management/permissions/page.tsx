"use client";

import { Suspense } from "react";
import { UmShell } from "@/app/pages/_shared/user-management/um-shell";
import { PermissionsList } from "@/app/pages/_shared/user-management/um-lists";

// /pages/user-management/permissions - the permission catalogue. A row opens /pages/user-management/permissions/<id>.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <UmShell area="permissions">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <PermissionsList />
        </div>
      </UmShell>
    </Suspense>
  );
}
