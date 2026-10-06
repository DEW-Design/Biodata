"use client";

import { useAgreementScope, type AgreementScope } from "@/app/pages/_shared/agreement-scope";
import { useFeatureAccess } from "@/lib/use-feature-access";

// Which requests a role sees on the Data Licence Agreements screens (designer, 6 Oct 2026): every role but BioData Admin has "My
// requests" alone, so `?scope=all` in their address changes nothing; BioData Admin also has "All requests" and opens on it.
export function useDlaScope(): { canAll: boolean; scope: AgreementScope } {
  const canAll = useFeatureAccess("dlaAllView");
  const canReview = useFeatureAccess("dlaApproval");
  const requested = useAgreementScope(canReview ? "all" : "mine");
  return { canAll, scope: canAll ? requested : "mine" };
}
