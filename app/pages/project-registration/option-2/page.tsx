"use client";

// Add Project, option 2 (30 Oct 2026): the form as option 1 has it, with a Datasets step after the geographic extent. The business is
// considering a dataset upload while a project is being created ("Project is the container, the dataset informs what the project
// holds"). Built in slices; this is the first: the step and its place in the flow, with nothing yet filled in from the file.
// Option 1 (../page.tsx) is not changed by it. The flow itself is `RegistrationFlow` with its opt-in `datasetStep`; the modules
// beside this file (registration-flow.tsx, sections.ts, form-sections.tsx ...) are option 1's, in a folder that kept its old name
// (context/decisions/2026-10-23-01-*), and the pieces that are option 2's own are in ../with-dataset.

import { Suspense } from "react";
import { RegistrationLayoutSwitcher } from "../layout-switcher";
import { DatasetRegistrationFlow } from "../with-dataset/dataset-registration-flow";

export default function ProjectRegistrationOption2Page() {
  return (
    <Suspense fallback={null}>
      <DatasetRegistrationFlow />
      <RegistrationLayoutSwitcher current="option-2" />
    </Suspense>
  );
}
