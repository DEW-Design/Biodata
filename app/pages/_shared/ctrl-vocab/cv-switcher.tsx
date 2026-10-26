"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { CV_ROOT } from "@/app/pages/_shared/ctrl-vocab/cv-data";
import { useCvs } from "@/app/pages/_shared/ctrl-vocab/cv-store";
import { useRoleHref } from "@/lib/use-role-href";
import { CTRL_VOCAB_SECTION_LABEL } from "@/lib/registered-user-nav";

// The section crumb of a vocabulary's record page: a searchable switcher over the vocabularies the list shows (to the one role
// that can reach Controlled Vocabulary), A-Z by name with the ID beside it, with the current one ticked and a "View all
// vocabularies" bar to the list. Picking a vocabulary opens it.
export function VocabularySwitcher({ currentId }: { currentId: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const cvs = useCvs();

  const items = useMemo(
    () => cvs.map((cv) => ({ id: cv.id, label: cv.name, addon: cv.id })).sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id)),
    [cvs],
  );

  return (
    <BreadcrumbSwitcher
      label={CTRL_VOCAB_SECTION_LABEL}
      ariaLabel="Switch vocabulary"
      placeholder="Search vocabularies"
      items={items}
      currentId={currentId}
      onSelect={(id) => router.push(roleHref(`${CV_ROOT}/${id}`))}
      viewAllLabel="View all vocabularies"
      onViewAll={() => router.push(roleHref(CV_ROOT))}
    />
  );
}
