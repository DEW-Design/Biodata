"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { DsaForm } from "@/app/pages/_shared/dsa/dsa-form";
import { DsaShell } from "@/app/pages/_shared/dsa/dsa-shell";
import { saveDsa } from "@/app/pages/_shared/dsa/dsa-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/dsa/new - the record form for a new agreement. Saving lands on the new agreement's deep dive.
export default function NewDsaPage() {
  return (
    <Suspense fallback={null}>
      <NewDsa />
    </Suspense>
  );
}

function NewDsa() {
  const router = useRouter();
  const roleHref = useRoleHref();

  return (
    <DsaShell breadcrumbCurrent="New agreement">
      <DsaForm
        onBack={() => router.push(roleHref("/pages/dsa"))}
        onSaveDraft={(draft) => {
          const record = saveDsa(draft, "draft");
          toast.success("Draft saved", { description: record.id });
          router.push(roleHref(`/pages/dsa/${record.id}`));
        }}
        onSubmit={(draft) => {
          const record = saveDsa(draft, "submit");
          toast.success("Agreement submitted", { description: record.id });
          router.push(roleHref(`/pages/dsa/${record.id}`));
        }}
      />
    </DsaShell>
  );
}
