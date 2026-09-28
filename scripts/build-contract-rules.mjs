#!/usr/bin/env node
// Generates .claude/rules/contracts-*.md from CONTRACTS.md (CONTRACTS.md 5.5), so a session loads only
// the clauses relevant to the files it touches. CONTRACTS.md stays the one canonical text and keeps its
// clause numbers; contracts/rule-scopes.json says which generated file holds each clause.
//
//   npm run contracts:rules                       rewrite the generated files
//   node scripts/build-contract-rules.mjs --check exit 1 if they are out of date or a clause has no scope
//
// Claude Code loads a rule file with no `paths` at launch, and one with `paths` when a matching file is
// READ (not when one is created), which is why the core file carries a one-line index of every clause.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const RULES_DIR = join(".claude", "rules");
const GENERATED = "<!-- GENERATED from CONTRACTS.md by scripts/build-contract-rules.mjs (CONTRACTS.md 5.5). Do not edit: change CONTRACTS.md, then run `npm run contracts:rules`. -->";

/** Split CONTRACTS.md into its intro and its clauses (heading `### §x.y Title`, body to the next rule). */
export function parseContracts(text) {
  const lines = text.split("\n");
  const first = lines.findIndex((l) => l.startsWith("### §"));
  const intro = lines.slice(0, lines.findIndex((l) => l.trim() === "---")).join("\n").trim();
  const clauses = [];
  for (let i = first; i < lines.length; i++) {
    const m = lines[i].match(/^### §(\d+\.\d+) (.+)$/);
    if (!m) continue;
    let end = i + 1;
    while (end < lines.length && !/^### §/.test(lines[end]) && lines[end].trim() !== "---" && !/^## PART/.test(lines[end])) end++;
    clauses.push({ id: m[1], title: m[2], body: lines.slice(i, end).join("\n").trim() });
  }
  return { intro, clauses };
}

const slug = (g) => `contracts-${g}.md`;
const frontmatter = (paths) => (paths ? `---\npaths:\n${paths.map((p) => `  - "${p}"`).join("\n")}\n---\n\n` : "");

export function buildRuleFiles(root = process.cwd()) {
  const text = readFileSync(join(root, "CONTRACTS.md"), "utf8");
  const scopes = JSON.parse(readFileSync(join(root, "contracts", "rule-scopes.json"), "utf8"));
  const { intro, clauses } = parseContracts(text);
  const problems = [];
  for (const c of clauses) if (!scopes.clauses[c.id]) problems.push(`Clause §${c.id} (${c.title}) has no scope in contracts/rule-scopes.json.`);
  for (const [id, g] of Object.entries(scopes.clauses)) {
    if (!scopes.groups[g]) problems.push(`Clause §${id} names an unknown group "${g}".`);
    if (!clauses.some((c) => c.id === id)) problems.push(`contracts/rule-scopes.json lists §${id}, which is not in CONTRACTS.md.`);
  }

  const files = new Map();
  for (const [g, def] of Object.entries(scopes.groups)) {
    const mine = clauses.filter((c) => scopes.clauses[c.id] === g);
    if (g !== "core" && mine.length === 0) continue;
    let out = `${frontmatter(def.paths)}${GENERATED}\n\n`;
    if (g === "core") {
      const rows = clauses.map((c) => `- §${c.id} ${c.title} (${scopes.clauses[c.id] === "core" ? "below" : slug(scopes.clauses[c.id])})`);
      out += `${intro}\n\n## Clause index\n\nClauses marked "below" are in this file. The others load when a matching file is read, and MUST be read\nfirst when starting a new file in that area (a scoped rule triggers on reading, not on creating):\n\n${Object.entries(scopes.groups).filter(([k, v]) => k !== "core" && v.paths).map(([k, v]) => `- \`.claude/rules/${slug(k)}\`: ${v.summary} Paths: ${v.paths.map((p) => `\`${p}\``).join(", ")}`).join("\n")}\n\n${rows.join("\n")}\n\n---\n\n`;
    } else {
      out += `# DEW contracts: ${g}\n\n${def.summary} Full text and numbering: CONTRACTS.md.\n\n`;
    }
    out += mine.map((c) => c.body).join("\n\n") + "\n";
    files.set(slug(g), out);
  }
  return { files, problems };
}

/** For check-contracts: an array of problems, empty when everything is in sync. */
export function checkRules(root = process.cwd()) {
  const { files, problems } = buildRuleFiles(root);
  const dir = join(root, RULES_DIR);
  for (const [name, content] of files) {
    const p = join(dir, name);
    if (!existsSync(p) || readFileSync(p, "utf8") !== content) problems.push(`.claude/rules/${name} is missing or out of date with CONTRACTS.md. Run \`npm run contracts:rules\` (never edit it by hand).`);
  }
  if (existsSync(dir)) for (const f of readdirSync(dir)) if (/^contracts-.*\.md$/.test(f) && !files.has(f)) problems.push(`.claude/rules/${f} no longer matches any scope group. Run \`npm run contracts:rules\`.`);
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const problems = checkRules();
    if (problems.length) {
      console.error(problems.join("\n"));
      process.exit(1);
    }
    console.log("Generated contract rules are up to date.");
  } else {
    const { files, problems } = buildRuleFiles();
    if (problems.length) {
      console.error(problems.join("\n"));
      process.exit(1);
    }
    mkdirSync(RULES_DIR, { recursive: true });
    for (const f of readdirSync(RULES_DIR)) if (/^contracts-.*\.md$/.test(f) && !files.has(f)) rmSync(join(RULES_DIR, f));
    for (const [name, content] of files) writeFileSync(join(RULES_DIR, name), content);
    for (const [name, content] of files) console.log(`${name}: ${content.split("\n").length} lines, ~${Math.round(content.length / 4)} tokens`);
  }
}
