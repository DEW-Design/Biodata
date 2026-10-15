"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { NominationForm } from "@/app/pages/_shared/nominations/nomination-form";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import { approveNomination, saveNomination } from "@/app/pages/_shared/nominations/nomination-store";
import { NominationVersionProvider, useNominationVersion, type NominationVersion } from "@/app/pages/_shared/nominations/nomination-version";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";

// A new nomination, for both versions' routes (/pages/nominations/new, /pages/nominations/version-3/new). Saving lands on its
// record page, as a Draft or Submitted. Version 2: ?kind=location nominates a location in the same form and steps, and a
// BioData Admin or Super Admin approves their nomination at once (the Super Admin rating it first).
export default function NewNominationPage({ version = 1 }: { version?: NominationVersion }) {
  return (
    <NominationVersionProvider version={version}>
      <Suspense fallback={null}>
        <NewNomination />
      </Suspense>
    </NominationVersionProvider>
  );
}

function NewNomination() {
  const router = useRouter();
  const roleHref = useRoleHref();
  const params = useSearchParams();
  const { version, base } = useNominationVersion();
  const canReview = useFeatureAccess("nominationReview");
  const canRate = useFeatureAccess("nominationRating");
  const kind = version >= 2 && params.get("kind") === "location" ? "location" : "species";

  return (
    <NominationShell breadcrumbCurrent={kind === "location" ? "New location nomination" : "New nomination"} formSidebar>
      <NominationForm
        key={kind}
        kind={kind}
        canApprove={version >= 2 && canReview}
        canRate={version >= 2 && canRate}
        onBack={() => router.push(roleHref(base))}
        onSaveDraft={(draft) => {
          const record = saveNomination(draft, "draft");
          toast.success("Draft saved", { description: record.id });
          router.push(roleHref(`${base}/${record.id}`));
        }}
        onSubmit={(draft) => {
          const record = saveNomination(draft, "submit");
          toast.success("Nomination submitted", { description: `${record.id} is with the sensitive species panel.` });
          router.push(roleHref(`${base}/${record.id}`));
        }}
        onApprove={(draft, ratings) => {
          const record = approveNomination(draft, ratings);
          toast.success("Nomination approved", { description: record.id });
          router.push(roleHref(`${base}/${record.id}`));
        }}
      />
    </NominationShell>
  );
}
