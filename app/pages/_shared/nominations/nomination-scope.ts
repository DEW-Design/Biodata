"use client";

import { CURRENT_USER_NAME, useAgreementScope, type AgreementScope } from "@/app/pages/_shared/agreement-scope";
import type { Nomination } from "@/app/pages/_shared/nominations/nomination-data";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useUserRole } from "@/lib/use-user-role";
import { isBiodataAdmin, type UserRole } from "@/lib/user-role";

// Which nominations a role sees, and which views column 2 offers (designer, 6 Oct 2026):
//   - a Registered User sees only what they nominated: column 2 has "My nominations" alone;
//   - a BioData User and the Privileged roles also have "All nominations", which is the nominations of
//     their organisation (not everyone's);
//   - a BioData Admin has "All nominations" (everyone's, submitted ones and their own drafts) and "My nominations".
// A draft that is not yours is never shown: it is not submitted yet.

/**
 * The organisation a role's "All nominations" is limited to, or null for the BioData Admin, whose All is everyone's.
 * PLACEHOLDER: the preview has no real organisation for a signed-in person (the org pill says "DEW" or "ORG", see
 * `orgLabelForRole`), so a BioData User stands for the Department for Environment and Water and the Privileged roles for
 * Birds SA, a partner named in the BDBSA research. The seed has no nomination from a DEW nominator, so a BioData User's
 * All is their own for now.
 */
export function nominationOrganisationFor(role: UserRole): string | null {
  if (isBiodataAdmin(role)) return null;
  return role === "biodata-user" ? "Department for Environment and Water" : "Birds SA";
}

/** Whether a nomination is in a view: yours, or (in All) a submitted one from the organisation the view is limited to. */
export function inNominationScope(n: Nomination, scope: AgreementScope, organisation: string | null): boolean {
  const own = n.nominator.name === CURRENT_USER_NAME;
  if (scope === "mine") return own;
  return own || (n.status !== "draft" && (organisation === null || n.nominator.organisation === organisation));
}

/** The views this role has, the one the address asks for, and what All is limited to. */
export function useNominationScope(): { canAll: boolean; scope: AgreementScope; organisation: string | null } {
  const role = useUserRole();
  const canAll = useFeatureAccess("nominationAllView");
  const requested = useAgreementScope(canAll ? "all" : "mine");
  return { canAll, scope: canAll ? requested : "mine", organisation: nominationOrganisationFor(role) };
}
