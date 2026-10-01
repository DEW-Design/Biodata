"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { UmShell } from "@/app/pages/_shared/user-management/um-shell";
import { UserDetail, UmNotFound } from "@/app/pages/_shared/user-management/um-detail";
import { useUser, useUmHydrated } from "@/app/pages/_shared/user-management/um-store";

export default function DetailPage() {
  return (
    <Suspense fallback={null}>
      <Detail />
    </Suspense>
  );
}

function Detail() {
  const { id } = useParams<{ id: string }>();
  const record = useUser(id);
  const hydrated = useUmHydrated();
  return (
    <UmShell area="users" recordId={id} breadcrumbCurrent={record ? `${record.firstName} ${record.lastName}` : id}>
      {record ? <UserDetail key={record.id} user={record} /> : hydrated ? <UmNotFound kind="user" id={id} backHref="/pages/user-management" /> : null}
    </UmShell>
  );
}
