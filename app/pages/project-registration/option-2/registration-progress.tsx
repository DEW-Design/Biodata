"use client";

import { FormSectionList, deriveSectionStatus, type SectionStatus } from "@/app/pages/_shared/form-section-list";
import { isSectionValid, sectionMeta, STEP_TITLES, type FormState, type FormVersion, type SectionId } from "./sections";

// Column 2 of the second Add Project layout: the shared `FormSectionList`, fed with this flow's
// sections grouped under its three steps.
export function sectionStatus(id: SectionId, current: SectionId, state: FormState, visited: Set<SectionId>, attempted: Set<SectionId>, version: FormVersion = 1, validOf?: (id: SectionId) => boolean): SectionStatus {
  return deriveSectionStatus({ isCurrent: id === current, isValid: validOf ? validOf(id) : isSectionValid(id, state, version), visited: visited.has(id), attempted: attempted.has(id) });
}

export function RegistrationProgress({
  sections,
  current,
  state,
  visited,
  attempted,
  version = 1,
  steps,
  validOf,
  onSelect,
}: {
  sections: SectionId[];
  current: SectionId;
  state: FormState;
  visited: Set<SectionId>;
  attempted: Set<SectionId>;
  version?: FormVersion;
  /** Option 2 groups its sections in four steps and answers for the sections option 1 does not have; the default is option 1's three. */
  steps?: { title: string; of: (id: SectionId) => boolean }[];
  validOf?: (id: SectionId) => boolean;
  onSelect: (id: SectionId) => void;
}) {
  const editable = sections.filter((id) => id !== "review");
  const valid = (id: SectionId) => (validOf ? validOf(id) : isSectionValid(id, state, version));
  const item = (id: SectionId) => ({ id, title: sectionMeta(id, version).title, status: sectionStatus(id, current, state, visited, attempted, version, validOf) });
  const groups = steps
    ? steps.map((s, i) => ({ step: i + 1, title: s.title, sections: editable.filter(s.of).map(item) }))
    : ([1, 2, 3] as const).map((step) => ({ step, title: STEP_TITLES[step], sections: editable.filter((id) => sectionMeta(id, version).step === step).map(item) }));
  return (
    <FormSectionList
      heading="Add project"
      progress={{ done: editable.filter((id) => visited.has(id) && valid(id)).length, total: editable.length }}
      groups={groups}
      closing={item("review")}
      onSelect={(id) => onSelect(id as SectionId)}
    />
  );
}
