"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { UmShell } from "@/app/pages/_shared/user-management/um-shell";
import { PermissionDetail, UmNotFound } from "@/app/pages/_shared/user-management/um-detail";
import { usePermission, useUmHydrated } from "@/app/pages/_shared/user-management/um-store";

export default function DetailPage() {
  return (
    <Suspense fallback={null}>
      <Detail />
    </Suspense>
  );
}

function Detail() {
  const { id } = useParams<{ id: string }>();
  const record = usePermission(id);
  const hydrated = useUmHydrated();
  return (
    <UmShell area="permissions" breadcrumbCurrent={record ? record.name : id}>
      {record ? <PermissionDetail key={record.id} permission={record} /> : hydrated ? <UmNotFound kind="permission" id={id} backHref="/pages/user-management/permissions" /> : null}
    </UmShell>
  );
}
