import { hasFeatureAccess, type FeatureKey } from "@/config/role-access.config";
import type { UserRole } from "@/lib/user-role";

// Route prefixes whose *entire* page is gated behind one feature, not a control inside it. Previewing
// a role that can't see the page takes you Home rather than stranding you on the restriction
// message (which stays right for someone arriving by URL).
const wholePageGates: { prefix?: string; pattern?: RegExp; feature: FeatureKey }[] = [
  { prefix: "/pages/dsa", feature: "dsaManagement" },
  { prefix: "/pages/dla", feature: "dlaAccess" },
  { prefix: "/pages/user-management", feature: "userManagement" },
  { prefix: "/pages/nominations/version-2/species-sensitivity", feature: "speciesSensitivity" },
  { prefix: "/pages/nominations", feature: "nominationAccess" },
  { prefix: "/pages/template-finder", feature: "templateFinder" },
  { prefix: "/pages/ctrl-vocab", feature: "ctrlVocabManagement" },
  { prefix: "/pages/taxonomy", feature: "taxonomyManagement" },
  { prefix: "/pages/notifications", feature: "notificationManagement" },
  { prefix: "/pages/vouchers", feature: "voucherManagement" },
  { prefix: "/pages/reports", feature: "reports" },
  { pattern: /^\/pages\/project-list\/[^/]+\/upload$/, feature: "datasetUpload" },
];

/** Whether a role cannot open a page at all (its whole page is gated behind a feature the role lacks). The role tool uses it to
 *  go Home instead of stranding you on a restriction message; the Pages map (`/proto/site-map`) uses it to mark such pages. */
export function isPageBlockedFor(pathname: string, role: UserRole): boolean {
  return wholePageGates.some(({ prefix, pattern, feature }) => (prefix ? pathname.startsWith(prefix) : pattern?.test(pathname)) && !hasFeatureAccess(feature, role));
}
