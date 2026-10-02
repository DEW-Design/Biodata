"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { CV_ROOT, cvStatusOrder, type CvStatus } from "@/app/pages/_shared/ctrl-vocab/cv-data";
import { CvDetail, CvNotFound } from "@/app/pages/_shared/ctrl-vocab/cv-detail";
import { CvForm } from "@/app/pages/_shared/ctrl-vocab/cv-form";
import { CvList } from "@/app/pages/_shared/ctrl-vocab/cv-list";
import { CvShell } from "@/app/pages/_shared/ctrl-vocab/cv-shell";
import { archiveCv, clearPendingUpload, deleteDraftCv, peekPendingUpload, reactivateCv, saveCv, useCv, useCvsHydrated } from "@/app/pages/_shared/ctrl-vocab/cv-store";
import { useRoleHref } from "@/lib/use-role-href";

// The four Controlled Vocabulary screens, rendered by app/pages/ctrl-vocab's page.tsx files. Each reads the role (useSearchParams), so each renders inside Suspense for the
// static export.

function ListScreen() {
  const params = useSearchParams();
  const category = params.get("category") ?? "";
  const statusParam = params.get("status") ?? "";
  const initialStatuses = statusParam.split(",").filter((s): s is CvStatus => (cvStatusOrder as string[]).includes(s));
  return (
    <CvShell category={category}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <CvList key={`${category}:${statusParam}`} category={category} initialStatuses={initialStatuses} />
      </div>
    </CvShell>
  );
}

function NewScreen() {
  const router = useRouter();
  const roleHref = useRoleHref();
  const base = CV_ROOT;
  return (
    <CvShell breadcrumbCurrent="New vocabulary" formSidebar>
      <CvForm
       
        onClose={() => router.push(roleHref(base))}
        onSaveDraft={(draft) => {
          const cv = saveCv(draft, "draft");
          toast.success("Draft saved", { description: `${cv.name} (${cv.id})` });
          router.push(roleHref(`${base}/${cv.id}`));
        }}
        onPublish={(draft) => {
          const cv = saveCv(draft, "publish");
          toast.success("Vocabulary added", { description: `${cv.name} (${cv.id})` });
          router.push(roleHref(`${base}/${cv.id}`));
        }}
      />
    </CvShell>
  );
}

function DetailScreen() {
  const { id } = useParams<{ id: string }>();
  const cv = useCv(id);
  const hydrated = useCvsHydrated();
  const router = useRouter();
  const roleHref = useRoleHref();
  const base = CV_ROOT;
  return (
    <CvShell category={cv?.category ?? ""} currentId={cv?.id} breadcrumbCurrent={cv?.name ?? id}>
      {cv ? (
        <CvDetail
          key={cv.id}
          cv={cv}
         
          onEdit={() => router.push(roleHref(`${base}/${cv.id}/edit`))}
          onArchive={() => {
            archiveCv(cv.id);
            toast.success("Vocabulary archived", { description: `${cv.name} is no longer offered in forms.` });
          }}
          onDeleteDraft={() => {
            deleteDraftCv(cv.id);
            toast.success("Draft deleted", { description: cv.name || cv.id });
            router.push(roleHref(`${base}?status=draft`));
          }}
          onReactivate={(endDate) => {
            reactivateCv(cv.id, endDate);
            toast.success("Vocabulary reactivated", { description: cv.name });
          }}
        />
      ) : hydrated ? (
        <CvNotFound id={id} />
      ) : null}
    </CvShell>
  );
}

function EditScreen() {
  const { id } = useParams<{ id: string }>();
  const cv = useCv(id);
  const hydrated = useCvsHydrated();
  const router = useRouter();
  const roleHref = useRoleHref();
  const detailHref = roleHref(`${CV_ROOT}/${id}`);
  // A filled template uploaded from the list or the vocabulary's page, merged in by the form.
  const [initialUpload] = useState(() => peekPendingUpload(id));
  useEffect(() => () => clearPendingUpload(id), [id]);
  const leave = (href: string) => {
    clearPendingUpload(id);
    router.push(href);
  };
  return (
    <CvShell breadcrumbCurrent={cv ? `Edit ${cv.name}` : `Edit ${id}`} formSidebar>
      {cv ? (
        <CvForm
          key={cv.id}
          initial={cv}
         
          initialUpload={initialUpload}
          onClose={() => leave(detailHref)}
          onSaveDraft={(draft, returned) => {
            saveCv(draft, "draft", cv.id, undefined, returned);
            toast.success(returned ? "Filled template saved to the draft" : "Draft saved", { description: draft.name });
            leave(detailHref);
          }}
          onPublish={(draft, returned) => {
            saveCv(draft, "publish", cv.id, undefined, returned);
            toast.success(returned ? "Filled template saved" : cv.state === "draft" ? "Vocabulary added" : "Changes saved", { description: draft.name });
            leave(detailHref);
          }}
        />
      ) : hydrated ? (
        <CvNotFound id={id} />
      ) : null}
    </CvShell>
  );
}

export function CvListRoute() {
  return (
    <Suspense fallback={null}>
      <ListScreen />
    </Suspense>
  );
}

export function CvNewRoute() {
  return (
    <Suspense fallback={null}>
      <NewScreen />
    </Suspense>
  );
}

export function CvDetailRoute() {
  return (
    <Suspense fallback={null}>
      <DetailScreen />
    </Suspense>
  );
}

export function CvEditRoute() {
  return (
    <Suspense fallback={null}>
      <EditScreen />
    </Suspense>
  );
}
