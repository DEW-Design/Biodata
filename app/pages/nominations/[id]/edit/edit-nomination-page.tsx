"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { ArrowNarrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { NOMINATION_ROOT } from "@/app/pages/_shared/nominations/nomination-data";
import { NominationNotFound } from "@/app/pages/_shared/nominations/nomination-record";
import { NominationForm } from "@/app/pages/_shared/nominations/nomination-form";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import { saveNomination, updateNomination, useNomination, useNominationsHydrated } from "@/app/pages/_shared/nominations/nomination-store";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/nominations/<id>/edit - the same form on a draft, a submitted nomination (before review),
// or one returned for more information (resubmitting sends it back to Submitted). It serves a species or a location
// nomination, and both admin roles edit any nomination past its draft, whatever its status: Save changes keeps the status,
// and the Super Admin rates it on Review (the designer, 12 Oct 2026).
export default function EditNominationPage() {
  return (
    <Suspense fallback={null}>
      <EditNomination />
    </Suspense>
  );
}

function EditNomination() {
  const { id } = useParams<{ id: string }>();
  const nomination = useNomination(id);
  const hydrated = useNominationsHydrated();
  const router = useRouter();
  const roleHref = useRoleHref();
  const canReview = useFeatureAccess("nominationReview");
  const canRate = useFeatureAccess("nominationRating");
  const detailHref = roleHref(`${NOMINATION_ROOT}/${id}`);
  // The nominator edits before the panel has started (or after it returned it). An admin edits any past its draft,
  // unless it is their own and the nominator's edit applies (a draft, or one returned to them is resubmitted).
  const ownEdit = !!nomination && nomination.nominator.name === CURRENT_USER_NAME && ["draft", "submitted", "returned"].includes(nomination.status);
  const adminEdit = !!nomination && canReview && nomination.status !== "draft" && !ownEdit;
  const editable = ownEdit || adminEdit;

  return (
    <NominationShell breadcrumbCurrent={`Edit ${id}`} formSidebar>
      {nomination && !editable ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
          <h1 className="text-lg font-semibold text-primary">This nomination can&apos;t be edited</h1>
          <p className="max-w-sm text-sm text-balance text-tertiary">
            The nominator can edit a nomination before the panel starts its review or after it is returned for more information. An admin can edit it once it is submitted.
          </p>
          <Button color="link-color" size="sm" href={detailHref} iconLeading={ArrowNarrowLeft}>
            Back to {nomination.id}
          </Button>
        </div>
      ) : nomination ? (
        <NominationForm
          key={nomination.id}
          initial={nomination}
          canRate={adminEdit && canRate}
          onSaveChanges={
            adminEdit
              ? (draft, ratings) => {
                  updateNomination(nomination.id, draft, canRate ? ratings : undefined);
                  toast.success("Nomination updated", { description: nomination.id });
                  router.push(detailHref);
                }
              : undefined
          }
          onBack={() => router.push(detailHref)}
          onSaveDraft={(draft) => {
            saveNomination(draft, "draft", nomination.id);
            toast.success("Draft saved", { description: nomination.id });
            router.push(detailHref);
          }}
          onSubmit={(draft) => {
            saveNomination(draft, "submit", nomination.id);
            const message = nomination.status === "submitted" ? "Nomination updated" : nomination.status === "returned" ? "Nomination resubmitted" : "Nomination submitted";
            toast.success(message, { description: nomination.id });
            router.push(detailHref);
          }}
        />
      ) : hydrated ? (
        <NominationNotFound id={id} />
      ) : null}
    </NominationShell>
  );
}
