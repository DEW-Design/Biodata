"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { UmShell } from "@/app/pages/_shared/user-management/um-shell";
import { RoleDetail, UmNotFound } from "@/app/pages/_shared/user-management/um-detail";
import { useRole, useUmHydrated } from "@/app/pages/_shared/user-management/um-store";

export default function DetailPage() {
  return (
    <Suspense fallback={null}>
      <Detail />
    </Suspense>
  );
}

function Detail() {
  const { id } = useParams<{ id: string }>();
  const record = useRole(id);
  const hydrated = useUmHydrated();
  return (
    <UmShell area="roles" recordId={id} breadcrumbCurrent={record ? record.name : id}>
      {record ? <RoleDetail key={record.id} role={record} /> : hydrated ? <UmNotFound kind="role" id={id} backHref="/pages/user-management/roles" /> : null}
    </UmShell>
  );
}
