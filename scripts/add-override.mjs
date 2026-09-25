#!/usr/bin/env node
// Records a designer override for a new component (CONTRACTS.md 1.4 / 9.2).
//   npm run contracts:override -- --component components/custom/foo/foo.tsx \
//     --designer "Name" --approvedBy "Name" --reason "Why no existing component works"
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
data.overrides.push({ id, component: args.component, designer: args.designer, approvedBy: args.approvedBy, date: new Date().toLocaleDateString("sv-SE"), reason: args.reason, status: "active" });
writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log(`Recorded ${id} for ${args.component}. It will appear in the next audit.`);
