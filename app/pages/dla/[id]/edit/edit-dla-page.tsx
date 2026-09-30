"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { DlaNotFound } from "@/app/pages/_shared/dla/dla-detail";
import { DlaForm } from "@/app/pages/_shared/dla/dla-form";
import { DlaShell } from "@/app/pages/_shared/dla/dla-shell";
import { isDlaEditable } from "@/app/pages/_shared/dla/dla-data";
import { saveDla, useDla, useDlasHydrated } from "@/app/pages/_shared/dla/dla-store";
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
  const hydrated = useDlasHydrated();
  const router = useRouter();
  const roleHref = useRoleHref();
  const detailHref = roleHref(`/pages/dla/${id}`);

  // The Edit action only renders in the UI while `isDlaEditable` (dla-detail.tsx) - this is the
  // same check applied to the route itself, so a direct visit to an Approved/Active request's own
  // edit URL can't do what the missing button already refuses to offer (an access level, once
  // granted, can't change in place - see dla-data.ts's own `isDlaEditable`).
  useEffect(() => {
    if (dla && !isDlaEditable(dla.status)) {
      toast.warning("This request can't be edited anymore", { description: "Its access level has already been decided. Submit a new request for a different level." });
      router.replace(detailHref);
    }
  }, [dla, detailHref, router]);

  return (
    <DlaShell breadcrumbCurrent={`Edit ${id}`} formSidebar>
      {dla && isDlaEditable(dla.status) ? (
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
        hydrated && !dla ? <DlaNotFound id={id} /> : null
      )}
    </DlaShell>
  );
}
