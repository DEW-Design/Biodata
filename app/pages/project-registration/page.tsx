"use client";

// Add Project, option 1 (the designer, 16 Oct 2026): the form pattern, sections in column 2. Every "Add project" (the
// header's Add menu, lib/create-menu.ts) opens it here. It was option 2 version 2 until then; version 1 was retired and
// the one-question-per-card wizard became option 2 (./option-2). The flow and its modules live in ./option-2 (registration-flow.tsx,
// sections.ts, form-sections.tsx), where they were built, because the project page's edit form imports them from there.

import { Suspense } from "react";
import { RegistrationFlow } from "./option-2/registration-flow";
import { RegistrationLayoutSwitcher } from "./layout-switcher";

export default function ProjectRegistrationPage() {
  return (
    <Suspense fallback={null}>
      <RegistrationFlow />
      <RegistrationLayoutSwitcher current="option-1" />
    </Suspense>
  );
}
