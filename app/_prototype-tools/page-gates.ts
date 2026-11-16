// The list of whole-page gates now lives in `lib/page-access.ts`, because the product reads it too (a control never offers a role a screen it cannot
// open, CONTRACTS 3.15). Re-exported here so the Prototype tools keep their import.
export { isPageBlockedFor, canOpenPath } from "@/lib/page-access";
