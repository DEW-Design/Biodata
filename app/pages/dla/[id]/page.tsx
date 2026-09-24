"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { DlaDetail, DlaNotFound } from "@/app/pages/_shared/dla/dla-detail";
import { DlaShell } from "@/app/pages/_shared/dla/dla-shell";
import { addDlaLocation, approveDla, cancelDla, deleteDla, holdDlaReview, rejectDla, resumeDlaReview, startDlaReview, useDla } from "@/app/pages/_shared/dla/dla-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/dla/<id> - one request's deep dive, step two of the list -> deep dive pattern. Column 2
// stays the status buckets, with this request's bucket highlighted.
export default function DlaDetailPage() {
  return (
    <Suspense fallback={null}>
      <DlaDeepDive />
    </Suspense>
  );
}

function DlaDeepDive() {
  const { id } = useParams<{ id: string }>();
  const dla = useDla(id);
  const router = useRouter();
  const roleHref = useRoleHref();

  return (
    <DlaShell activeStatus={dla?.status} breadcrumbCurrent={id}>
      {dla ? (
        <DlaDetail
          key={dla.id}
          dla={dla}
          onEdit={() => router.push(roleHref(`/pages/dla/${dla.id}/edit`))}
          onDeleteDraft={() => {
            deleteDla(dla.id);
            toast.success("Draft deleted", { description: dla.id });
            router.push(roleHref("/pages/dla?status=draft"));
          }}
          onStartReview={() => {
            startDlaReview(dla.id);
            toast.success("Review started", { description: `${dla.id} is now Under Review.` });
          }}
          onHold={() => {
            holdDlaReview(dla.id);
            toast.success("Review on hold", { description: dla.id });
          }}
          onResume={() => {
            resumeDlaReview(dla.id);
            toast.success("Review resumed", { description: `${dla.id} is Under Review again.` });
          }}
          onApprove={(input) => {
            approveDla(dla.id, input);
            toast.success("Request approved", { description: dla.id });
          }}
          onReject={(reason) => {
            rejectDla(dla.id, reason);
            toast.success("Request rejected", { description: dla.id });
          }}
          onCancel={() => {
            cancelDla(dla.id);
            toast.success("Cancelled", { description: `${dla.id} moved to Cancelled.` });
          }}
          onAddLocation={(location) => {
            addDlaLocation(dla.id, location);
            toast.success("Location added", { description: location.name });
          }}
        />
      ) : (
        <DlaNotFound id={id} />
      )}
    </DlaShell>
  );
}
