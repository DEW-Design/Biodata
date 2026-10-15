"use client";

import { FormSectionList, deriveSectionStatus, type SectionStatus } from "@/app/pages/_shared/form-section-list";
import { isSectionValid, sectionMeta, STEP_TITLES, type FormState, type FormVersion, type SectionId } from "./sections";

// Column 2 of the second Add Project layout: the shared `FormSectionList`, fed with this flow's
// sections grouped under its three steps.
export function sectionStatus(id: SectionId, current: SectionId, state: FormState, visited: Set<SectionId>, attempted: Set<SectionId>, version: FormVersion = 1): SectionStatus {
  return deriveSectionStatus({ isCurrent: id === current, isValid: isSectionValid(id, state, version), visited: visited.has(id), attempted: attempted.has(id) });
}

export function RegistrationProgress({
  sections,
  current,
  state,
  visited,
  attempted,
  version = 1,
  onSelect,
}: {
  sections: SectionId[];
  current: SectionId;
  state: FormState;
  visited: Set<SectionId>;
  attempted: Set<SectionId>;
  version?: FormVersion;
  onSelect: (id: SectionId) => void;
}) {
  const editable = sections.filter((id) => id !== "review");
  const item = (id: SectionId) => ({ id, title: sectionMeta(id, version).title, status: sectionStatus(id, current, state, visited, attempted, version) });
  return (
    <FormSectionList
      heading="Add project"
      progress={{ done: editable.filter((id) => visited.has(id) && isSectionValid(id, state, version)).length, total: editable.length }}
      groups={([1, 2, 3] as const).map((step) => ({ step, title: STEP_TITLES[step], sections: editable.filter((id) => sectionMeta(id, version).step === step).map(item) }))}
      closing={item("review")}
      onSelect={(id) => onSelect(id as SectionId)}
    />
  );
}
