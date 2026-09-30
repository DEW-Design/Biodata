"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { NominationForm } from "@/app/pages/_shared/nominations/nomination-form";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import { saveNomination } from "@/app/pages/_shared/nominations/nomination-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/nominations/new - a new nomination. Saving lands on its record page, as a Draft or Submitted.
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

  return (
    <NominationShell breadcrumbCurrent="New nomination" formSidebar>
      <NominationForm
        onBack={() => router.push(roleHref("/pages/nominations"))}
        onSaveDraft={(draft) => {
          const record = saveNomination(draft, "draft");
          toast.success("Draft saved", { description: record.id });
          router.push(roleHref(`/pages/nominations/${record.id}`));
        }}
        onSubmit={(draft) => {
          const record = saveNomination(draft, "submit");
          toast.success("Nomination submitted", { description: `${record.id} is with the sensitive species panel.` });
          router.push(roleHref(`/pages/nominations/${record.id}`));
        }}
      />
    </NominationShell>
  );
}
