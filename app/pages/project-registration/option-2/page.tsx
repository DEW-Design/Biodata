"use client";

// Add Project, second layout, version 1. The flow itself is in registration-flow.tsx; version 2 is at ./version-2.

import { Suspense } from "react";
import { RegistrationFlow } from "./registration-flow";

export default function ProjectRegistrationOption2Page() {
  return (
    <Suspense fallback={null}>
      <RegistrationFlow version={1} />
    </Suspense>
  );
}
