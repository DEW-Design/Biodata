"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { NT_CATEGORIES, draftOf, emptyNtDraft, ntStateOrder, type NtDraft, type NtState } from "@/app/pages/_shared/notifications/nt-data";
import { NtDetail, NtNotFound } from "@/app/pages/_shared/notifications/nt-detail";
import { NtForm } from "@/app/pages/_shared/notifications/nt-form";
import { NtList } from "@/app/pages/_shared/notifications/nt-list";
import { NtShell } from "@/app/pages/_shared/notifications/nt-shell";
import { allNotifications, deleteDraftNotification, saveNotification, setNotificationState, useNotification, useNotificationsHydrated } from "@/app/pages/_shared/notifications/nt-store";
import { NT_OPTION_2, NtRootProvider, type NtOption, useNtRoot } from "@/app/pages/_shared/notifications/nt-root";
import { NtList2 } from "@/app/pages/_shared/notifications/nt-list-2";
import { useRoleHref } from "@/lib/use-role-href";

// The four Notification Management screens, rendered by app/pages/notifications' page.tsx files. Each
// reads the role (useSearchParams), so each renders inside Suspense for the static export.

function ListScreen() {
  const params = useSearchParams();
  const category = params.get("category") ?? "";
  const statusParam = params.get("status") ?? "";
  const initialStatuses = statusParam.split(",").filter((s): s is NtState => (ntStateOrder as string[]).includes(s));
  const option2 = useNtRoot() === NT_OPTION_2;
  return (
    <NtShell category={category}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {option2 ? (
          <NtList2 key={`${category}:${statusParam}`} category={category} initialStatus={initialStatuses[0]} />
        ) : (
          <NtList key={`${category}:${statusParam}`} category={category} initialStatuses={initialStatuses} />
        )}
      </div>
    </NtShell>
  );
}

function NewScreen() {
  const root = useNtRoot();
  const router = useRouter();
  const roleHref = useRoleHref();
  const params = useSearchParams();
  const fromId = params.get("from") ?? undefined;
  const categoryParam = params.get("category") ?? "";
  const hydrated = useNotificationsHydrated();
  const source = useNotification(fromId);
  // A duplicate starts from its source, renamed; a category chosen in column 2 starts there.
  const [start] = useState<NtDraft | undefined>(() => {
    const category = (NT_CATEGORIES as readonly string[]).includes(categoryParam) ? categoryParam : "";
    return category ? { ...emptyNtDraft(), category } : undefined;
  });
  const duplicate = source ? { ...draftOf(source), name: `Copy of ${source.name}` } : undefined;
  // A duplicate waits for the store, so its source is found.
  if (fromId && !hydrated) return <NtShell breadcrumbCurrent="New notification" formSidebar>{null}</NtShell>;

  return (
    <NtShell breadcrumbCurrent="New notification" formSidebar>
      <NtForm
        flow={root === NT_OPTION_2 ? "guided" : "sections"}
        key={source?.id ?? "new"}
        start={duplicate ?? start}
        duplicatedFrom={source?.id}
        onClose={() => router.push(roleHref(source ? `${root}/${source.id}` : root))}
        onSaveDraft={(draft, label) => {
          const n = saveNotification(draft, "draft", label, undefined, source?.id);
          toast.success("Draft saved", { description: `${n.name} (${n.id})` });
          router.push(roleHref(`${root}/${n.id}`));
        }}
        onPublish={(draft, label) => {
          const n = saveNotification(draft, "publish", label, undefined, source?.id);
          toast.success("Notification added", { description: `${n.name} is now sending.` });
          router.push(roleHref(`${root}/${n.id}`));
        }}
      />
    </NtShell>
  );
}

function DetailScreen() {
  const root = useNtRoot();
  const { id } = useParams<{ id: string }>();
  const n = useNotification(id);
  const hydrated = useNotificationsHydrated();
  const router = useRouter();
  const roleHref = useRoleHref();
  return (
    <NtShell category={n?.category ?? ""} breadcrumbCurrent={n?.name || id}>
      {n ? (
        <NtDetail
          layout={root === NT_OPTION_2 ? "overview" : "tabs"}
          key={n.id}
          n={n}
          onEnable={() => {
            setNotificationState(n.id, "active");
            toast.success("Notification enabled", { description: `${n.name} is sending again.` });
          }}
          onDisable={() => {
            setNotificationState(n.id, "disabled");
            toast.success("Notification disabled", { description: `${n.name} won't be sent until it's enabled.` });
          }}
          onDeleteDraft={() => {
            deleteDraftNotification(n.id);
            toast.success("Draft deleted", { description: n.name || n.id });
            router.push(roleHref(`${root}?status=draft`));
          }}
        />
      ) : hydrated ? (
        <NtNotFound id={id} />
      ) : null}
    </NtShell>
  );
}

function EditScreen() {
  const root = useNtRoot();
  const { id } = useParams<{ id: string }>();
  const n = useNotification(id);
  const hydrated = useNotificationsHydrated();
  const router = useRouter();
  const roleHref = useRoleHref();
  const detailHref = roleHref(`${root}/${id}`);
  return (
    <NtShell breadcrumbCurrent={n ? `Edit ${n.name || n.id}` : `Edit ${id}`} formSidebar>
      {n ? (
        <NtForm
          flow={root === NT_OPTION_2 ? "guided" : "sections"}
          key={n.id}
          initial={n}
          onClose={() => router.push(detailHref)}
          onSaveDraft={(draft, label) => {
            saveNotification(draft, "draft", label, n.id);
            toast.success("Draft saved", { description: draft.name });
            router.push(detailHref);
          }}
          onPublish={(draft, label) => {
            const wasDraft = allNotifications().find((x) => x.id === n.id)?.state === "draft";
            saveNotification(draft, "publish", label, n.id);
            toast.success(wasDraft ? "Notification added" : "Changes saved", { description: draft.name });
            router.push(detailHref);
          }}
        />
      ) : hydrated ? (
        <NtNotFound id={id} />
      ) : null}
    </NtShell>
  );
}

export function NtListRoute({ option = "1" }: { option?: NtOption }) {
  return (
    <NtRootProvider option={option}>
      <Suspense fallback={null}>
        <ListScreen />
      </Suspense>
    </NtRootProvider>
  );
}

export function NtNewRoute({ option = "1" }: { option?: NtOption }) {
  return (
    <NtRootProvider option={option}>
      <Suspense fallback={null}>
        <NewScreen />
      </Suspense>
    </NtRootProvider>
  );
}

export function NtDetailRoute({ option = "1" }: { option?: NtOption }) {
  return (
    <NtRootProvider option={option}>
      <Suspense fallback={null}>
        <DetailScreen />
      </Suspense>
    </NtRootProvider>
  );
}

export function NtEditRoute({ option = "1" }: { option?: NtOption }) {
  return (
    <NtRootProvider option={option}>
      <Suspense fallback={null}>
        <EditScreen />
      </Suspense>
    </NtRootProvider>
  );
}
