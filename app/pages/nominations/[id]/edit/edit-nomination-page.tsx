"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { ArrowNarrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { NominationNotFound } from "@/app/pages/_shared/nominations/nomination-detail";
import { NominationForm } from "@/app/pages/_shared/nominations/nomination-form";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import { saveNomination, useNomination, useNominationsHydrated } from "@/app/pages/_shared/nominations/nomination-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/nominations/<id>/edit - the same form on a draft, a submitted nomination (before review),
// or one returned for more information (resubmitting sends it back to Submitted).
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
  const detailHref = roleHref(`/pages/nominations/${id}`);
  // Only the nominator edits, and only before the panel has started (or after it returned it).
  const editable = !!nomination && nomination.nominator.name === CURRENT_USER_NAME && ["draft", "submitted", "returned"].includes(nomination.status);

  return (
    <NominationShell breadcrumbCurrent={`Edit ${id}`} formSidebar>
      {nomination && !editable ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
          <h1 className="text-lg font-semibold text-primary">This nomination can&apos;t be edited</h1>
          <p className="max-w-sm text-sm text-balance text-tertiary">Only the nominator can edit a nomination, and only before the panel starts its review or after it is returned for more information.</p>
          <Button color="link-color" size="sm" href={detailHref} iconLeading={ArrowNarrowLeft}>
            Back to {nomination.id}
          </Button>
        </div>
      ) : nomination ? (
        <NominationForm
          key={nomination.id}
          initial={nomination}
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
