"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { DsaDetail, DsaNotFound } from "@/app/pages/_shared/dsa/dsa-detail";
import { DsaShell } from "@/app/pages/_shared/dsa/dsa-shell";
import { approveDsa, cancelDsa, deleteDsa, holdDsaReview, rejectDsa, resumeDsaReview, startDsaReview, useDsa } from "@/app/pages/_shared/dsa/dsa-store";
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
    <DsaShell breadcrumbCurrent={id}>
      {dsa ? (
        <DsaDetail
          key={dsa.id}
          dsa={dsa}
          onEdit={() => router.push(roleHref(`/pages/dsa/${dsa.id}/edit`))}
          onDeleteDraft={() => {
            deleteDsa(dsa.id);
            toast.success("Draft deleted", { description: dsa.id });
            router.push(roleHref("/pages/dsa?status=draft"));
          }}
          onStartReview={() => {
            startDsaReview(dsa.id);
            toast.success("Review started", { description: `${dsa.id} is now Under Review.` });
          }}
          onHold={() => {
            holdDsaReview(dsa.id);
            toast.success("Review on hold", { description: dsa.id });
          }}
          onResume={() => {
            resumeDsaReview(dsa.id);
            toast.success("Review resumed", { description: `${dsa.id} is Under Review again.` });
          }}
          onApprove={() => {
            approveDsa(dsa.id);
            toast.success("Agreement approved", { description: dsa.id });
          }}
          onReject={(reason) => {
            rejectDsa(dsa.id, reason);
            toast.success("Agreement rejected", { description: dsa.id });
          }}
          onCancel={() => {
            cancelDsa(dsa.id);
            toast.success("Agreement cancelled", { description: `${dsa.id} moved to Cancelled.` });
          }}
        />
      ) : (
        <DsaNotFound id={id} />
      )}
    </DsaShell>
  );
}
