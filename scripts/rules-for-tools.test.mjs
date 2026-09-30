#!/usr/bin/env node
// Tests for the rules hook (scripts/rules-for-tools.mjs, CONTRACTS.md 5.5). The hook guards every change,
// so a change to it runs these first: `npm run test:rules-hook`. Each case pipes a synthetic hook input
// (and, where it matters, a synthetic transcript) through the hook and checks what it lists or refuses.
// Exit 1 on any failure.

import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ruleMatcher } from "./rule-paths.mjs";

const root = process.cwd();
const dir = mkdtempSync(join(tmpdir(), "rules-hook-test-"));
const rule = (n) => `${root}/.claude/rules/${n}.md`;
const nm = (n) => JSON.stringify({ type: "attachment", attachment: { type: "nested_memory", path: rule(n) } });
const read = (n) => JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name: "Read", input: { file_path: rule(n) } }] } });
const boundary = JSON.stringify({ type: "system", subtype: "compact_boundary" });
const user = JSON.stringify({ type: "user", message: { content: "hi" } });
const filler = Array.from({ length: 9000 }, (_, i) => JSON.stringify({ type: "user", pad: "x".repeat(1000), i })).join("\n"); // ~9 MB: several read chunks

const transcript = (name, lines) => {
  const p = join(dir, `${name}.jsonl`);
  writeFileSync(p, lines.join("\n") + "\n");
  return p;
};
const T = {
  empty: transcript("empty", [boundary, user]),
  pages: transcript("pages", ["contracts-build", "contracts-prototyping", "contracts-shell", "ref-shell"].map(nm)),
  shellOnly: transcript("shellOnly", [nm("contracts-shell")]),
  compacted: transcript("compacted", [nm("contracts-shell"), nm("contracts-build"), boundary]),
  compactedThenRead: transcript("compactedThenRead", [nm("contracts-shell"), boundary, read("contracts-shell")]),
  quotedMarker: transcript("quotedMarker", [nm("contracts-shell"), JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", content: boundary }] } })]),
  farBoundaryBefore: transcript("farBoundaryBefore", [nm("contracts-shell"), boundary, filler]),
  farBoundaryAfter: transcript("farBoundaryAfter", [boundary, filler, nm("contracts-shell")]),
  alien: transcript("alien", Array.from({ length: 50 }, () => JSON.stringify({ kind: "event", v: 2 }))),
};
mkdirSync(join(dir, "S", "subagents"), { recursive: true });
writeFileSync(join(dir, "S.jsonl"), nm("contracts-shell") + "\n");
writeFileSync(join(dir, "S", "subagents", "agent-abc.jsonl"), nm("ref-shell") + "\n");

const run = (event, tool, args, t = T.empty, extra = {}) => {
  const input = { session_id: "t", cwd: root, transcript_path: t, hook_event_name: event, tool_name: tool, tool_input: args, ...extra };
  const out = execFileSync("node", ["scripts/rules-for-tools.mjs"], { input: JSON.stringify(input), env: { ...process.env, CLAUDE_PROJECT_DIR: root } }).toString();
  if (!out) return { kind: event === "PreToolUse" ? "allowed" : "none", rules: [] };
  const o = JSON.parse(out);
  const h = o.hookSpecificOutput || {};
  const rules = ((h.additionalContext || h.permissionDecisionReason || "").match(/rules\/[\w-]+\.md/g) || []).map((s) => s.slice(6, -3)).sort();
  return { kind: h.permissionDecision === "deny" ? "refused" : rules.length ? "listed" : event === "PreToolUse" ? "allowed" : "none", rules, warned: !!o.systemMessage };
};
const bash = (command) => ({ command });
const PAGES = ["contracts-build", "contracts-prototyping", "contracts-shell", "ref-shell"];
const COMPONENTS = ["contracts-build", "contracts-components", "ref-ingest", "ref-scaffold"];
const DOCS = ["contracts-build", "contracts-docs", "ref-ingest", "ref-scaffold"];

// [name, [event, tool, args, transcript?, extra?], expected kind, expected rules?, expect warning?]
const cases = [
  // Reading through the shell lists missing rules.
  ["shell read of a screen", ["PostToolUse", "Bash", bash("sed -n 1p app/pages/dashboard/page.tsx")], "listed", PAGES],
  ["folder search on the command line", ["PostToolUse", "Bash", bash("grep -rn Badge components/base")], "listed", COMPONENTS],
  ["route group path", ["PostToolUse", "Bash", bash('head -3 "app/(docs)/components/tooltip/page.tsx"')], "listed", DOCS],
  ["command substitution", ["PostToolUse", "Bash", bash("echo $(cat lib/nav.ts)")], "listed", ["contracts-docs", "ref-ingest"]],
  ["relative path after cd", ["PostToolUse", "Bash", bash("cd app/pages && grep -rn x dashboard")], "listed", PAGES],
  ["find -exec reads", ["PostToolUse", "Bash", bash("find components -name x -exec cat {} +")], "listed", COMPONENTS],
  // Heredocs: prose names nothing; a script counts only for real files.
  ["prose in a script heredoc", ["PostToolUse", "Bash", bash("python3 - <<'EOF'\ns='the folder app/pages/ and components'\nEOF")], "none"],
  ["script heredoc opening a file", ["PostToolUse", "Bash", bash("python3 - <<'EOF'\nopen('app/proto/tools/page.tsx').read()\nEOF")], "listed", ["contracts-build", "contracts-prototyping", "ref-scaffold"]],
  ["text heredoc naming a real file", ["PostToolUse", "Bash", bash("cat > /tmp/x.md <<EOF\nsee components/base/badges/badges.tsx\nEOF")], "none"],
  // Glancing lists nothing.
  ["existence check", ["PostToolUse", "Bash", bash("[ -e components/scaffold/gap.tsx ] && echo ok")], "none"],
  ["ls", ["PostToolUse", "Bash", bash("ls components/custom app/pages")], "none"],
  ["git status", ["PostToolUse", "Bash", bash("git status --short app/pages")], "none"],
  ["find without -exec", ["PostToolUse", "Bash", bash("find components -name '*.tsx'")], "none"],
  // Searches.
  ["Glob by pattern", ["PostToolUse", "Glob", { pattern: "components/**/*.tsx" }], "listed", COMPONENTS],
  ["Glob by folder", ["PostToolUse", "Glob", { pattern: "**/*.tsx", path: `${root}/app/pages` }], "listed", PAGES],
  ["Glob repo-wide", ["PostToolUse", "Glob", { pattern: "**/*.tsx" }], "none"],
  ["Grep in a folder", ["PostToolUse", "Grep", { pattern: "x", path: "app/(docs)" }], "listed", DOCS],
  // Writes are refused until the rules are loaded.
  ["Write a new file, rules missing", ["PreToolUse", "Write", { file_path: `${root}/app/(docs)/zz/page.tsx` }], "refused", DOCS],
  ["Write a new file, rules loaded", ["PreToolUse", "Write", { file_path: `${root}/app/pages/zz/page.tsx` }, T.pages], "allowed"],
  ["Edit refused for the missing rules only", ["PreToolUse", "Edit", { file_path: `${root}/app/pages/dashboard/page.tsx` }, T.shellOnly], "refused", ["contracts-build", "contracts-prototyping", "ref-shell"]],
  ["sed -i with | inside quotes", ["PreToolUse", "Bash", bash("sed -i '' 's|a|b|' app/pages/dashboard/page.tsx")], "refused", PAGES],
  ["sed -i, rules loaded", ["PreToolUse", "Bash", bash("sed -i '' 's|a|b|' app/pages/dashboard/page.tsx"), T.pages], "allowed"],
  ["redirect into a new file", ["PreToolUse", "Bash", bash("cat > components/custom/x/new.tsx <<'EOF'\nexport {}\nEOF")], "refused", COMPONENTS],
  ["echo glances but its redirect writes", ["PreToolUse", "Bash", bash("echo x > 'app/(docs)/y.tsx'")], "refused", DOCS],
  ["mv", ["PreToolUse", "Bash", bash("mv lib/nav.ts lib/nav2.ts")], "refused", ["contracts-docs", "ref-ingest"]],
  ["--write", ["PreToolUse", "Bash", bash("npx prettier --write components/base")], "refused", COMPONENTS],
  ["script heredoc that writes", ["PreToolUse", "Bash", bash("python3 - <<'EOF'\np='lib/nav.ts'; s=open(p).read(); open(p,'w').write(s)\nEOF")], "refused", ["contracts-docs", "ref-ingest"]],
  ["script heredoc that only reads", ["PreToolUse", "Bash", bash("python3 - <<'EOF'\nprint(open('lib/nav.ts').read())\nEOF")], "allowed"],
  ["fd redirects are not writes", ["PreToolUse", "Bash", bash("cat lib/nav.ts 2>/dev/null >&2")], "allowed"],
  ["writing outside the repo", ["PreToolUse", "Bash", bash("echo x > /tmp/x.txt")], "allowed"],
  ["Write outside the repo", ["PreToolUse", "Write", { file_path: "/tmp/x.md" }], "allowed"],
  ["Write to a file no rule covers", ["PreToolUse", "Write", { file_path: `${root}/CONTEXT.md` }], "allowed"],
  // What is in context comes from the transcript, since the last compaction.
  ["loaded before a compaction", ["PostToolUse", "Bash", bash("sed -n 1p app/pages/dashboard/page.tsx"), T.compacted], "listed", PAGES],
  ["Read again after a compaction", ["PostToolUse", "Bash", bash("sed -n 1p app/pages/dashboard/page.tsx"), T.compactedThenRead], "listed", ["contracts-build", "contracts-prototyping", "ref-shell"]],
  ["a quoted marker is not a compaction", ["PostToolUse", "Bash", bash("sed -n 1p app/pages/dashboard/page.tsx"), T.quotedMarker], "listed", ["contracts-build", "contracts-prototyping", "ref-shell"]],
  ["compaction 9 MB back, loaded before it", ["PostToolUse", "Bash", bash("sed -n 1p app/pages/dashboard/page.tsx"), T.farBoundaryBefore], "listed", PAGES],
  ["compaction 9 MB back, loaded after it", ["PostToolUse", "Bash", bash("sed -n 1p app/pages/dashboard/page.tsx"), T.farBoundaryAfter], "listed", ["contracts-build", "contracts-prototyping", "ref-shell"]],
  ["subagent judged by its own transcript", ["PostToolUse", "Bash", bash("sed -n 1p app/pages/dashboard/page.tsx"), join(dir, "S.jsonl"), { agent_id: "abc" }], "listed", ["contracts-build", "contracts-prototyping", "contracts-shell"]],
  // A broken check is never silent.
  ["missing transcript: list all, warn", ["PostToolUse", "Bash", bash("cat lib/nav.ts"), join(dir, "none.jsonl")], "listed", ["contracts-docs", "ref-ingest"], true],
  ["unrecognised format: list all, warn", ["PostToolUse", "Bash", bash("cat lib/nav.ts"), T.alien], "listed", ["contracts-docs", "ref-ingest"], true],
  ["unrecognised format: allow a write, warn", ["PreToolUse", "Write", { file_path: `${root}/app/(docs)/zz/page.tsx` }, T.alien], "allowed", [], true],
];

// The matcher against what Claude Code's loader actually did: each row was observed with a throwaway probe
// rule and a fresh subagent (context/decisions/2026-09-29-35). If Claude Code changes how it matches, a
// new probe run updates these rows and rule-paths.mjs together.
const D = "app/pages/dashboard/page.tsx";
const TT = "app/(docs)/components/tooltip/page.tsx";
const B = "components/base/buttons/button.tsx";
const observed = [
  ["app/pages/dashboard/**", D, true], ["pages/dashboard/**", D, false], ["dashboard/**", D, true], ["pages/**", D, true],
  ["dashboard/page.tsx", D, false], ["dashboard/*.tsx", D, false], ["app/pages/**", D, true], ["nothere/**", D, false], ["page.tsx", D, true],
  ["tooltip/**", TT, true], ["components/**", TT, true], ["app/*docs*/**", TT, true], ["components/**", "lib/nav.ts", false],
  ["lib/nav.ts", "lib/nav.ts", true], ["app/pages/_shared/nominations/**", "app/pages/_shared/nominations/nomination-shell.tsx", true],
  ["/components/**", B, true], ["components/*", B, true], ["/components/**", TT, false], ["components/*", TT, false],
];
let failed = 0;
for (const [pattern, path, want] of observed) {
  const ok = ruleMatcher(pattern)(path) === want;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} loader match: "${pattern}" ${want ? "covers" : "does not cover"} ${path}`);
}
for (const [name, [event, tool, args, t, extra], kind, rules = [], warned = false] of cases) {
  const got = run(event, tool, args, t, extra);
  const ok = got.kind === kind && JSON.stringify(got.rules) === JSON.stringify([...rules].sort()) && !!got.warned === warned;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `: expected ${kind} [${rules}]${warned ? " + warning" : ""}, got ${got.kind} [${got.rules}]${got.warned ? " + warning" : ""}`}`);
}
rmSync(dir, { recursive: true, force: true });
const total = cases.length + observed.length;
console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
