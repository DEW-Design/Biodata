"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { DsaDetail, DsaNotFound } from "@/app/pages/_shared/dsa/dsa-detail";
import { DsaShell } from "@/app/pages/_shared/dsa/dsa-shell";
import { deleteDsa, revokeDsa, useDsa } from "@/app/pages/_shared/dsa/dsa-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/dsa/<id> - one agreement's deep dive, step two of the list -> deep dive pattern. Column 2
// stays the status buckets, with this agreement's bucket highlighted.
export default function DsaDetailPage() {
  return (
    <Suspense fallback={null}>
      <DsaDeepDive />
    </Suspense>
  );
}

function DsaDeepDive() {
  const { id } = useParams<{ id: string }>();
  const dsa = useDsa(id);
  const router = useRouter();
  const roleHref = useRoleHref();

  return (
    <DsaShell activeStatus={dsa?.status} breadcrumbCurrent={id}>
      {dsa ? (
        <DsaDetail
          key={dsa.id}
          dsa={dsa}
          onEdit={() => router.push(roleHref(`/pages/dsa/${dsa.id}/edit`))}
          onRevoke={() => {
            revokeDsa(dsa.id);
            toast.success("Agreement revoked", { description: `${dsa.id} moved to Revoked.` });
          }}
          onDeleteDraft={() => {
            deleteDsa(dsa.id);
            toast.success("Draft deleted", { description: dsa.id });
            router.push(roleHref("/pages/dsa?status=draft"));
          }}
        />
      ) : (
        <DsaNotFound id={id} />
      )}
    </DsaShell>
  );
}
