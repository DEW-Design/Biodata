import { hasFeatureAccess, type FeatureKey } from "@/config/role-access.config";
import type { UserRole } from "@/lib/user-role";

// Route prefixes whose *entire* page is gated behind one feature, not a control inside it. The one list of what a role
// cannot open at all. Two things read it: the role tool (previewing a role that cannot see the page goes Home) and
// `canOpenPath`, which every link, button and menu item that moves a person to another screen asks first (CONTRACTS
// 3.15: a role is never offered a screen it cannot open). The restriction message itself stays right for someone who
// arrives by typing the address.
const wholePageGates: { prefix?: string; pattern?: RegExp; feature: FeatureKey }[] = [
  { prefix: "/pages/dsa", feature: "dsaManagement" },
  { prefix: "/pages/dla", feature: "dlaAccess" },
  { prefix: "/pages/user-management", feature: "userManagement" },
  { prefix: "/pages/nominations", feature: "nominationAccess" },
  { prefix: "/pages/template-finder", feature: "templateFinder" },
  { prefix: "/pages/ctrl-vocab", feature: "ctrlVocabManagement" },
  { prefix: "/pages/taxonomy", feature: "taxonomyManagement" },
  { prefix: "/pages/notifications", feature: "notificationManagement" },
  { prefix: "/pages/vouchers", feature: "voucherManagement" },
  { prefix: "/pages/reports", feature: "reports" },
  { prefix: "/pages/data-ingestion-stress-test", feature: "ingestionStressTest" },
  { pattern: /^\/pages\/project-list\/[^/]+\/upload$/, feature: "datasetUpload" },
];

/** Whether a role cannot open a page at all (its whole page is gated behind a feature the role lacks). A query string is ignored. */
export function isPageBlockedFor(pathname: string, role: UserRole): boolean {
  const path = pathname.split(/[?#]/)[0];
  return wholePageGates.some(({ prefix, pattern, feature }) => (prefix ? path.startsWith(prefix) : pattern?.test(path)) && !hasFeatureAccess(feature, role));
}

/** The opposite question, for a control that would take a person there. */
export function canOpenPath(pathname: string, role: UserRole): boolean {
  return !isPageBlockedFor(pathname, role);
}
