#!/usr/bin/env node
// Creates the next decision file under context/decisions/ and rebuilds the CONTEXT.md index
// (CONTRACTS.md 0.6 item 6 / 5.1).
//   npm run decision:new -- --title "What changed, in one sentence" [--date 2026-09-30]
//
// The file is created with the exclusive flag ("wx"), so two sessions that pick the same number
// cannot overwrite each other: the loser simply takes the next one.
import { mkdirSync, openSync, writeSync, closeSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
if (!args.title || args.title.startsWith("--")) {
  console.error('Missing --title. Usage: npm run decision:new -- --title "What changed" [--date YYYY-MM-DD]');
  process.exit(1);
}
const date = args.date ?? new Date().toLocaleDateString("sv-SE");
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("--date must be YYYY-MM-DD.");
  process.exit(1);
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
const [y, m, d] = date.split("-").map(Number);
const title = args.title.trim().replace(/\.$/, "");
const slug = title.toLowerCase().replace(/[`*_]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").split("-").filter(Boolean).slice(0, 8).join("-").slice(0, 60) || "entry";

const dir = join(process.cwd(), "context", "decisions");
mkdirSync(dir, { recursive: true });
let n = readdirSync(dir).filter((f) => f.startsWith(`${date}-`)).length + 1;
let path;
for (;;) {
  path = join(dir, `${date}-${String(n).padStart(2, "0")}-${slug}.md`);
  try {
    const fd = openSync(path, "wx");
    writeSync(fd, `# ${date} - ${title}\n\n- **${MONTHS[m - 1]} ${d} ${y}: ${title}.** What changed, what was decided, what is still open. Verified: ... Not committed.\n`);
    closeSync(fd);
    break;
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
    n++;
  }
}
execFileSync("node", [join("scripts", "build-context-index.mjs")], { stdio: "inherit" });
console.log(`Created ${path.replace(process.cwd() + "/", "")}. Write the entry, then run npm run context:index again if you change its title.`);
