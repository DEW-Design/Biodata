"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { DlaDetail, DlaNotFound } from "@/app/pages/_shared/dla/dla-detail";
import { DlaShell } from "@/app/pages/_shared/dla/dla-shell";
import { addDlaLocation, approveDla, rejectDla, useDla, withdrawDla } from "@/app/pages/_shared/dla/dla-store";

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

  return (
    <DlaShell activeStatus={dla?.status} breadcrumbCurrent={id}>
      {dla ? (
        <DlaDetail
          key={dla.id}
          dla={dla}
          onApprove={(input) => {
            approveDla(dla.id, input);
            toast.success("Request approved", { description: `${dla.id} is now Active.` });
          }}
          onReject={(reason) => {
            rejectDla(dla.id, reason);
            toast.success("Request rejected", { description: dla.id });
          }}
          onWithdraw={() => {
            withdrawDla(dla.id);
            toast.success("Withdrawn", { description: `${dla.id} moved to Withdrawn.` });
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
