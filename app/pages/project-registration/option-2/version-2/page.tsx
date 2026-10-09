"use client";

// Add Project, second layout, version 2 (the designer, 9 Oct 2026): the same flow as version 1 with the page feedback
// round applied. What changed is listed in registration-flow.tsx's header and sections.ts's `FormVersion`.

import { Suspense } from "react";
import { RegistrationFlow } from "../registration-flow";

export default function ProjectRegistrationOption2Version2Page() {
  return (
    <Suspense fallback={null}>
      <RegistrationFlow version={2} />
    </Suspense>
  );
}
