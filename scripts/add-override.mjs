#!/usr/bin/env node
// Records a designer override for a new component (CONTRACTS.md 1.4 / 9.2).
//   npm run contracts:override -- --component components/custom/foo/foo.tsx \
//     --designer "Name" --approvedBy "Name" --reason "Why no existing component works" \
//     [--reviewBy 2027-03-25]
//
// reviewBy defaults to 180 days out. It's a real deadline, not a note: check:contracts (CONTRACTS.md
// 1.4b) compares it against today on every run and fails once it passes, so the override forces a
// conscious renew-or-retire decision instead of quietly living forever.
import { readFileSync, writeFileSync } from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
for (const k of ["component", "designer", "approvedBy", "reason"]) {
  if (!args[k] || args[k].startsWith("--")) {
    console.error(`Missing --${k}. Required: --component --designer --approvedBy --reason`);
    process.exit(1);
  }
}
const path = "contracts/overrides.json";
const data = JSON.parse(readFileSync(path, "utf8"));
const id = `OVR-${String(data.overrides.length + 1).padStart(3, "0")}`;
const reviewBy = args.reviewBy || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString("sv-SE");
data.overrides.push({
  id,
  component: args.component,
  designer: args.designer,
  approvedBy: args.approvedBy,
  date: new Date().toLocaleDateString("sv-SE"),
  reviewBy,
  reason: args.reason,
  status: "active",
});
writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log(`Recorded ${id} for ${args.component}, due for review ${reviewBy}. It will appear in the next audit.`);
