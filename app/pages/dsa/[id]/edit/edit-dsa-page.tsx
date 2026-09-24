"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { DsaNotFound } from "@/app/pages/_shared/dsa/dsa-detail";
import { DsaForm } from "@/app/pages/_shared/dsa/dsa-form";
import { DsaShell } from "@/app/pages/_shared/dsa/dsa-shell";
import { saveDsa, useDsa } from "@/app/pages/_shared/dsa/dsa-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/dsa/<id>/edit - the same record form, opened on an existing agreement or draft.
export default function EditDsaPage() {
  return (
    <Suspense fallback={null}>
      <EditDsa />
    </Suspense>
  );
}

function EditDsa() {
  const { id } = useParams<{ id: string }>();
  const dsa = useDsa(id);
  const router = useRouter();
  const roleHref = useRoleHref();
  const detailHref = roleHref(`/pages/dsa/${id}`);

  return (
    <DsaShell activeStatus={dsa?.status} breadcrumbCurrent={`Edit ${id}`}>
      {dsa ? (
        <DsaForm
          key={dsa.id}
          initial={dsa}
          onBack={() => router.push(detailHref)}
          onSaveDraft={(draft) => {
            saveDsa(draft, "draft", dsa.id);
            toast.success("Draft saved", { description: dsa.id });
            router.push(detailHref);
          }}
          onSubmit={(draft) => {
            saveDsa(draft, "submit", dsa.id);
            toast.success(dsa.status === "draft" ? "Agreement created" : "Agreement updated", { description: dsa.id });
            router.push(detailHref);
          }}
        />
      ) : (
        <DsaNotFound id={id} />
      )}
    </DsaShell>
  );
}
