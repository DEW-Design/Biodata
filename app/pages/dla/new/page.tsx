"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { DlaForm } from "@/app/pages/_shared/dla/dla-form";
import { DlaShell } from "@/app/pages/_shared/dla/dla-shell";
import { saveDla, useDla } from "@/app/pages/_shared/dla/dla-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/dla/new - the request form. Saving lands on the new request's deep dive - either as a
// Draft, or Submitted once the requester actually submits (see CONTEXT.md, "Unified DSA/DLA status
// model" for why DLA gained a real Draft status). `?renewFrom=<id>` (from a closed agreement's
// "Renew Licence" button) pre-fills the form from that agreement's own locations/purpose/requestor
// rather than starting blank; the closed record itself is untouched, so its own history stays intact.
export default function NewDlaPage() {
  return (
    <Suspense fallback={null}>
      <NewDla />
    </Suspense>
  );
}

function NewDla() {
  const router = useRouter();
  const roleHref = useRoleHref();
  const renewFromId = useSearchParams().get("renewFrom") ?? undefined;
  const renewFrom = useDla(renewFromId);

  return (
    <DlaShell breadcrumbCurrent={renewFrom ? `Renew ${renewFrom.id}` : "New request"} formSidebar>
      <DlaForm
        renewFrom={renewFrom}
        onBack={() => router.push(roleHref("/pages/dla"))}
        onSaveDraft={(draft) => {
          const record = saveDla(draft, "draft");
          toast.success("Draft saved", { description: record.id });
          router.push(roleHref(`/pages/dla/${record.id}`));
        }}
        onSubmit={(draft) => {
          const record = saveDla(draft, "submit");
          toast.success("Request submitted", { description: record.id });
          router.push(roleHref(`/pages/dla/${record.id}`));
        }}
      />
    </DlaShell>
  );
}
