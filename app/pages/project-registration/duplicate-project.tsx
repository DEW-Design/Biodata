"use client";

// "Duplicate previous project" at the top of Add Project's first section (the business, 10 Nov 2026: "[Adding new Project, Event, Occ,
// Obs] Duplicate prev. record"). It starts the new project as a copy of the one created most recently in this browser. Borrowed: the
// in-form action row of the form pattern (a secondary `Button` with its icon, 4.1), and the created projects store the Projects list
// already reads.
//
// What is carried is what the person answered about how the project is run (owner, contacts, extent, method, permits, species,
// restrictions). What is not: the names (so the new project has to be named), the URI or DOI (one project's identifier), the dates
// (they open as they do on a new project) and the logo (a temporary address that does not survive a reload). The project's number is
// assigned on create, as for any project, and datasets are not carried (they are a different step with files). It is offered only while
// the form is untouched, so it can never overwrite what someone has typed, and only where a previous project exists (2.12).

import { getLocalTimeZone, today } from "@internationalized/date";
import { Copy01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FORM_FIELD_WIDTH } from "@/app/pages/_shared/form-row";
import { cx } from "@/utils/cx";
import { createdProjectForm, useLatestCreatedProject, type CreatedProject } from "@/app/pages/_shared/created-projects-store";
import type { FormState } from "./option-2/sections";

/** The form of `project`, ready to start a new one from: named afresh, with its own identifier and dates left empty. */
export function duplicateProjectForm(project: CreatedProject): FormState {
  const form = createdProjectForm(project);
  return {
    ...form,
    details: { ...form.details, shortTitle: "", fullTitle: "", sameAsShortTitle: true, startDate: today(getLocalTimeZone()), endDate: null, dataOwnerOrgLogo: null },
    collection: { ...form.collection, uriDoi: "" },
  };
}

export function DuplicatePreviousProject({ onDuplicate }: { onDuplicate: (form: FormState, from: CreatedProject) => void }) {
  const previous = useLatestCreatedProject();
  if (!previous) return null;
  const { details } = createdProjectForm(previous);
  return (
    <div className={cx(FORM_FIELD_WIDTH, "mb-6 flex flex-wrap items-center gap-x-3 gap-y-2")}>
      <Button color="secondary" size="sm" iconLeading={Copy01} onPress={() => onDuplicate(duplicateProjectForm(previous), previous)}>
        Duplicate previous project
      </Button>
      <p className="text-sm text-tertiary">{details.shortTitle ? `${previous.code} - ${details.shortTitle}` : previous.code}</p>
    </div>
  );
}
