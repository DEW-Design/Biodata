"use client";

import { Suspense } from "react";
import { SiteScoresShell } from "./site-scores-shell";
import { SiteScores } from "./site-scores-view";

// /pages/site-scores - a BAM site's scores as one section on its record, for internal business consideration. See
// site-scores-view.tsx for what it shows and why; the shell is the persona shell, for every role.
export default function SiteScoresPage() {
  return (
    <Suspense fallback={null}>
      <SiteScoresShell>
        <SiteScores />
      </SiteScoresShell>
    </Suspense>
  );
}
