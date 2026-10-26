"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { NOMINATION_ROOT } from "@/app/pages/_shared/nominations/nomination-data";
import { NominationForm } from "@/app/pages/_shared/nominations/nomination-form";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import { saveNomination } from "@/app/pages/_shared/nominations/nomination-store";
import { useRoleHref } from "@/lib/use-role-href";

// A new nomination (/pages/nominations/new). Saving lands on its record page, as a Draft or Submitted. ?kind=location nominates
// a location in the same form and steps. Every role follows the same workflow: an admin's nomination is submitted to the panel too
// (the designer, 26 Oct 2026), it is not approved at once.
export default function NewNominationPage() {
  return (
    <Suspense fallback={null}>
      <NewNomination />
    </Suspense>
  );
}

function NewNomination() {
  const router = useRouter();
  const roleHref = useRoleHref();
  const params = useSearchParams();
  const kind = params.get("kind") === "location" ? "location" : "species";

  return (
    <NominationShell breadcrumbCurrent={kind === "location" ? "New location nomination" : "New nomination"} formSidebar>
      <NominationForm
        key={kind}
        kind={kind}
        onBack={() => router.push(roleHref(NOMINATION_ROOT))}
        onSaveDraft={(draft) => {
          const record = saveNomination(draft, "draft");
          toast.success("Draft saved", { description: record.id });
          router.push(roleHref(`${NOMINATION_ROOT}/${record.id}`));
        }}
        onSubmit={(draft) => {
          const record = saveNomination(draft, "submit");
          toast.success("Nomination submitted", { description: `${record.id} is with the sensitive species panel.` });
          router.push(roleHref(`${NOMINATION_ROOT}/${record.id}`));
        }}
      />
    </NominationShell>
  );
}
