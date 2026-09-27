"use client";

import { Suspense } from "react";
import { UmShell } from "@/app/pages/_shared/user-management/um-shell";
import { RolesList } from "@/app/pages/_shared/user-management/um-lists";

// /pages/user-management/roles - system and custom roles. A row opens /pages/user-management/roles/<id>.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <UmShell area="roles">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <RolesList />
        </div>
      </UmShell>
    </Suspense>
  );
}
