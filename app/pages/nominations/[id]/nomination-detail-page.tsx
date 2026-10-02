"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { NominationDetail, NominationNotFound } from "@/app/pages/_shared/nominations/nomination-detail";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import {
  acceptNomination,
  deleteNomination,
  rejectNomination,
  returnNomination,
  startNominationReview,
  useNomination,
  useNominationsHydrated,
} from "@/app/pages/_shared/nominations/nomination-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/nominations/<id> - one nomination's record page.
export default function NominationDetailPage() {
  return (
    <Suspense fallback={null}>
      <NominationRecord />
    </Suspense>
  );
}

function NominationRecord() {
  const { id } = useParams<{ id: string }>();
  const nomination = useNomination(id);
  const hydrated = useNominationsHydrated();
  const router = useRouter();
  const roleHref = useRoleHref();

  return (
    <NominationShell recordId={id} breadcrumbCurrent={id}>
      {nomination ? (
        <NominationDetail
          key={nomination.id}
          nomination={nomination}
          onEdit={() => router.push(roleHref(`/pages/nominations/${nomination.id}/edit`))}
          onDelete={() => {
            deleteNomination(nomination.id);
            toast.success("Draft deleted", { description: nomination.id });
            router.push(roleHref("/pages/nominations"));
          }}
          onStartReview={() => {
            startNominationReview(nomination.id);
            toast.success("Review started", { description: `${nomination.id} is now under review.` });
          }}
          onAccept={() => {
            acceptNomination(nomination.id);
            toast.success("Nomination accepted", { description: nomination.id });
          }}
          onReject={(reason) => {
            rejectNomination(nomination.id, reason);
            toast.success("Nomination rejected", { description: nomination.id });
          }}
          onReturn={(note) => {
            returnNomination(nomination.id, note);
            toast.success("Returned for more information", { description: `${nomination.id} is back with ${nomination.nominator.name}.` });
          }}
        />
      ) : hydrated ? (
        <NominationNotFound id={id} />
      ) : null}
    </NominationShell>
  );
}
