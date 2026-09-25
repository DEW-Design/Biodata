"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { DlaNotFound } from "@/app/pages/_shared/dla/dla-detail";
import { DlaForm } from "@/app/pages/_shared/dla/dla-form";
import { DlaShell } from "@/app/pages/_shared/dla/dla-shell";
import { saveDla, useDla } from "@/app/pages/_shared/dla/dla-store";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/dla/<id>/edit - the same record form, opened on an existing request or draft. New once
// DLA gained a real Draft status of its own (see CONTEXT.md, "Unified DSA/DLA status model") -
// mirrors app/pages/dsa/[id]/edit/page.tsx exactly.
export default function EditDlaPage() {
  return (
    <Suspense fallback={null}>
      <EditDla />
    </Suspense>
  );
}

function EditDla() {
  const { id } = useParams<{ id: string }>();
  const dla = useDla(id);
  const router = useRouter();
  const roleHref = useRoleHref();
  const detailHref = roleHref(`/pages/dla/${id}`);

  return (
    <DlaShell breadcrumbCurrent={`Edit ${id}`} formSidebar>
      {dla ? (
        <DlaForm
          key={dla.id}
          initial={dla}
          onBack={() => router.push(detailHref)}
          onSaveDraft={(draft) => {
            saveDla(draft, "draft", dla.id);
            toast.success("Draft saved", { description: dla.id });
            router.push(detailHref);
          }}
          onSubmit={(draft) => {
            saveDla(draft, "submit", dla.id);
            toast.success(dla.status === "draft" ? "Request submitted" : "Request updated", { description: dla.id });
            router.push(detailHref);
          }}
        />
      ) : (
        <DlaNotFound id={id} />
      )}
    </DlaShell>
  );
}
