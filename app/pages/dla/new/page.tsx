"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { DlaForm } from "@/app/pages/_shared/dla/dla-form";
import { DlaShell } from "@/app/pages/_shared/dla/dla-shell";
import { submitDla, useDla } from "@/app/pages/_shared/dla/dla-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/dla/new - the request form. Submitting always creates a new request (Under Review) and
// lands on its deep dive - see dla-store.ts's own comment on why there's no "save draft" or
// "edit" here. `?renewFrom=<id>` (from an expired agreement's "Renew Licence" button) pre-fills
// the form from that agreement's own locations/purpose/requestor rather than starting blank; the
// expired record itself is untouched, so its own history stays intact.
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
    <DlaShell breadcrumbCurrent={renewFrom ? `Renew ${renewFrom.id}` : "New request"}>
      <DlaForm
        renewFrom={renewFrom}
        onBack={() => router.push(roleHref("/pages/dla"))}
        onSubmit={(draft) => {
          const record = submitDla(draft);
          toast.success("Request submitted", { description: record.id });
          router.push(roleHref(`/pages/dla/${record.id}`));
        }}
      />
    </DlaShell>
  );
}
