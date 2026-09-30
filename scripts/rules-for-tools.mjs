#!/usr/bin/env node
// Claude Code hook: make sure the scoped rules for an area are in context whenever work touches it
// (CONTRACTS.md 5.5).
//
// Claude Code loads a `.claude/rules/*.md` file with `paths` only when a matching file is opened with the
// Read tool. Every other way of touching a file loads nothing, so this hook covers them:
//   - Before a change (PreToolUse on Write, Edit, and Bash): if the files being written have rules that
//     are not in context, the change is refused with the list, so the agent Reads them and tries again.
//     For Bash, "written" means a redirect target, the operands of a writing command (mv, cp, rm, tee,
//     sed -i, git mv, --write/--fix), or the files a python/node script heredoc names when it writes.
//     This is what covers creating a new file, which the Read tool never sees.
//   - After a look (PostToolUse on Bash, Grep, Glob): lists the rule files for the paths it read that are
//     not in context, so the agent Reads them before working there. Glancing (ls, test, stat, wc, echo,
//     git status/log, find without -exec) is not reading, and lists nothing.
//
// What is already in context is read from the agent's own transcript, not remembered by the hook: a
// rule counts as loaded only if, since the last compaction, the Read tool injected it (a
// `nested_memory` entry) or the agent Read the rule file itself. A compaction or /clear drops rules
// from context, and the transcript shows exactly that, so nothing can go stale. If the transcript is
// missing or its format is not recognised, the hook says so on screen (a `systemMessage`), lists every
// matching rule, and does not refuse a change, since the refusal could then never clear.

import { readFileSync, readdirSync, existsSync, statSync, openSync, readSync, fstatSync, closeSync } from "node:fs";
import { join, relative, isAbsolute, dirname, basename } from "node:path";
import { frontmatterPaths, ruleMatcher } from "./rule-paths.mjs";

const readStdin = () => {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return null;
  }
};

// Glob to regex for the patterns rule files use: `**`, `*`, literal characters.
// ── Reading a shell command ──

// A heredoc fed to one of these is a script that may open files; fed to anything else (`cat > f`, `tee`)
// it is text being written, and the paths it names are not being worked on.
const INTERPRETER = /\b(python3?|node|bash|sh|zsh|ruby|perl|deno|bun|tsx)\b/;
// A script body that does any of these changes files.
const SCRIPT_WRITES = /\bwrite(FileSync|File|_text|_bytes)?\s*\(|appendFile|rmSync|unlinkSync|renameSync|copyFileSync|\bos\.(remove|rename|unlink|replace)\b|\bshutil\.|\.unlink\(|open\([^)]*['"][wax]b?\+?['"]/;

// Splits a command into the command lines themselves and the bodies of any script heredocs.
const splitHeredocs = (command) => {
  const shell = [];
  const bodies = [];
  let end = null;
  let body = null;
  for (const line of command.split("\n")) {
    if (end !== null) {
      if (line.trim() === end) {
        if (body) bodies.push({ text: body.join("\n"), writes: SCRIPT_WRITES.test(body.join("\n")) });
        end = null;
        body = null;
      } else if (body) body.push(line);
      continue;
    }
    shell.push(line);
    const m = line.match(/<<-?\s*['"]?(\w+)['"]?/);
    if (m) {
      end = m[1];
      body = INTERPRETER.test(line.slice(0, m.index)) ? [] : null;
    }
  }
  if (body) bodies.push({ text: body.join("\n"), writes: SCRIPT_WRITES.test(body.join("\n")) });
  return { shell: shell.join("\n"), bodies };
};

// A small shell reader: splits the command into simple commands at `&&`, `||`, `|`, `;`, `&` and newlines,
// outside quotes, and separates each one's words from its output redirect targets. Quote-aware, so
// `sed -i 's|a|b|' file` stays one command.
const lexSegments = (text) => {
  const segments = [];
  let seg = { words: [], redirects: [] };
  let cur = "";
  let started = false; // the current word has begun, even if it is an empty string ('')
  let q = null;
  let pending = null; // "redirect" | "ignore" (fd duplication, a heredoc delimiter)
  const pushWord = () => {
    if (!started) return;
    if (pending === "redirect") seg.redirects.push(cur);
    else if (!pending) seg.words.push(cur);
    pending = null;
    cur = "";
    started = false;
  };
  const endSeg = () => {
    pushWord();
    if (seg.words.length || seg.redirects.length) segments.push(seg);
    seg = { words: [], redirects: [] };
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === q) q = null;
      else if (c === "\\" && q === '"' && i + 1 < text.length) cur += text[++i];
      else cur += c;
      continue;
    }
    if (c === "'" || c === '"') {
      q = c;
      started = true;
      continue;
    }
    if (c === "\\" && i + 1 < text.length) {
      cur += text[++i];
      started = true;
      continue;
    }
    if (c === "\n" || c === ";") {
      endSeg();
      continue;
    }
    if (c === "&" && text[i + 1] === "&") {
      endSeg();
      i++;
      continue;
    }
    if (c === "|") {
      endSeg();
      if (text[i + 1] === "|") i++;
      continue;
    }
    if (c === ">") {
      const fd = /^\d+$/.test(cur);
      if (fd) {
        cur = "";
        started = false;
      } else pushWord();
      if (text[i + 1] === ">") i++;
      if (text[i + 1] === "&") {
        i++;
        pending = "ignore";
        continue;
      }
      pending = fd ? "ignore" : "redirect";
      continue;
    }
    if (c === "<") {
      pushWord();
      if (text[i + 1] === "<") {
        i++;
        if (text[i + 1] === "-") i++;
        pending = "ignore";
      }
      continue;
    }
    if (c === "&") {
      endSeg();
      continue;
    }
    if (/\s/.test(c)) {
      pushWord();
      continue;
    }
    cur += c;
    started = true;
  }
  endSeg();
  return segments;
};

const KEYWORDS = new Set(["then", "do", "else", "elif", "if", "while", "until", "!", "time", "sudo", "exec", "{", "}", "xargs"]);
// Commands that only look at names, sizes or state, never at contents.
const GLANCE = new Set(["ls", "test", "[", "[[", "]", "stat", "wc", "du", "file", "echo", "printf", "cd", "pwd", "which", "type", "true", "false", "basename", "dirname", "realpath", "readlink", "mkdir", "sleep", "date"]);
const GIT_GLANCE = new Set(["status", "log", "ls-files", "ls-tree", "rev-parse", "branch", "remote"]);
const WRITERS = new Set(["mv", "cp", "rm", "rmdir", "tee", "touch", "ln", "install", "patch", "truncate", "dd"]);
const GIT_WRITERS = new Set(["mv", "rm", "checkout", "restore", "apply"]);

const programOf = (words) => {
  let i = 0;
  while (i < words.length && (KEYWORDS.has(words[i]) || /^\w+=/.test(words[i]) || (words[i - 1] === "xargs" && words[i].startsWith("-")))) i++;
  return { prog: basename((words[i] || "").replace(/^[({]+/, "")), args: words.slice(i + 1) };
};

// A repo-relative path, or null. Parens are trimmed, not split on: Next.js route groups put them inside
// paths (`app/(docs)/...`). A relative path is resolved against the directory a `cd` moved to.
const normalise = (raw, root, base = "") => {
  let t = raw
    .replace(/^[$(]+|\)+$/g, "")
    .replace(/^@\//, "")
    .replace(/[:*?{}[\]]+.*$/, "")
    .replace(/\/+$/, "");
  if (!t || t.startsWith("-") || t.startsWith("http") || t.startsWith("$")) return null;
  if (!isAbsolute(t)) t = join(root, base, t);
  const rel = relative(root, t);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) return null;
  return rel;
};
const looksLikePath = (rel, root) => rel.includes("/") || /\.[a-z0-9]+$/i.test(rel) || existsSync(join(root, rel));

// The repo paths a shell command reads and writes.
const shellPaths = (command, root) => {
  const { shell, bodies } = splitHeredocs(command);
  const read = new Set();
  const written = new Set();
  let base = "";
  const add = (set, raw) => {
    const t = normalise(raw, root, base);
    if (t && looksLikePath(t, root)) set.add(t);
  };
  for (const { words, redirects } of lexSegments(shell)) {
    const { prog, args } = programOf(words);
    for (const r of redirects) add(written, r);
    if (prog === "cd") {
      const target = args.find((a) => !a.startsWith("-"));
      const t = target ? normalise(target, root, base) : null;
      base = t ?? (target && isAbsolute(target) && relative(root, target) === "" ? "" : base);
      continue;
    }
    const operands = args.filter((a) => !a.startsWith("-"));
    const sub = prog === "git" ? operands[0] : null;
    const substitution = words.some((w) => w.includes("$(") || w.includes("`"));
    const glance = !substitution && (GLANCE.has(prog) || (prog === "git" && GIT_GLANCE.has(sub)) || (prog === "find" && !args.some((a) => ["-exec", "-execdir", "-delete", "-ok"].includes(a))));
    const writes =
      WRITERS.has(prog) ||
      (prog === "git" && GIT_WRITERS.has(sub)) ||
      ((prog === "sed" || prog === "perl") && args.some((a) => /^-[a-zA-Z]*i/.test(a) || a.startsWith("--in-place"))) ||
      args.includes("--write") ||
      args.includes("--fix");
    if (writes) for (const a of operands) add(written, a);
    if (!glance) for (const w of words) add(read, w);
  }
  // Inside a script heredoc only an existing file counts: the script opens real files, while prose in its
  // strings only mentions folders.
  for (const { text, writes } of bodies)
    for (const raw of text.split(/[\s'"`;|&<>=,()]+/).filter(Boolean)) {
      const t = normalise(raw, root, base);
      if (!t) continue;
      try {
        if (statSync(join(root, t)).isFile()) (writes ? written : read).add(t);
      } catch {
        // Not a file on disk.
      }
    }
  return { read: [...read], written: [...written] };
};

// ── What is in context ──

// The agent's own transcript: a subagent writes to `<session>/subagents/agent-<id>.jsonl` beside the
// main one, and has its own context, so it is judged by its own transcript.
const transcriptFor = (input) => {
  const main = input.transcript_path;
  if (!main) return null;
  if (input.agent_id) {
    const sub = join(dirname(main), basename(main, ".jsonl"), "subagents", `agent-${input.agent_id}.jsonl`);
    if (existsSync(sub)) return sub;
  }
  return existsSync(main) ? main : null;
};

const isBoundary = (line) => {
  try {
    const o = JSON.parse(line);
    return o.type === "system" && o.subtype === "compact_boundary";
  } catch {
    return false;
  }
};

// The transcript lines since the last compaction (or the whole file if there was none), read backwards
// in chunks: a long session's transcript runs to hundreds of MB, the part since compaction is small.
const linesSinceCompaction = (path) => {
  const marker = Buffer.from('"subtype":"compact_boundary"');
  const CHUNK = 4 * 1024 * 1024;
  const fd = openSync(path, "r");
  try {
    let pos = fstatSync(fd).size;
    let buf = Buffer.alloc(0);
    // Marker matches starting at or after `limit` have been checked already.
    let limit = 0;
    while (pos > 0) {
      const len = Math.min(CHUNK, pos);
      pos -= len;
      const chunk = Buffer.alloc(len);
      readSync(fd, chunk, 0, len, pos);
      buf = Buffer.concat([chunk, buf]);
      limit += len;
      // Walk the unchecked matches from the end. Inside a tool result the marker's quotes are escaped,
      // so a raw match is almost always a real entry; the whole line is parsed to be sure.
      let i = limit - 1 >= 0 ? buf.lastIndexOf(marker, limit - 1) : -1;
      while (i !== -1) {
        const start = buf.lastIndexOf(10, i) + 1;
        if (start === 0 && pos > 0) break; // the line starts in an earlier chunk: check it on the next pass
        const end = buf.indexOf(10, i);
        if (isBoundary(buf.subarray(start, end === -1 ? buf.length : end).toString("utf8"))) return buf.subarray(start).toString("utf8").split("\n");
        i = i > 0 ? buf.lastIndexOf(marker, i - 1) : -1;
      }
      limit = i === -1 ? 0 : i + 1;
    }
    return buf.toString("utf8").split("\n");
  } finally {
    closeSync(fd);
  }
};

const KNOWN_TYPES = new Set(["user", "assistant", "system", "attachment"]);

// Rule files in the agent's context right now: injected by the Read tool, or Read directly, since the
// last compaction. `status` is "ok", "missing" (no transcript) or "unrecognised" (the format changed).
const rulesInContext = (input, rulesDir) => {
  const path = transcriptFor(input);
  if (!path) return { names: null, status: "missing" };
  const lines = linesSinceCompaction(path).filter(Boolean);
  // The format check: recent entries must still look like Claude Code transcript entries.
  const recognised = lines.slice(-40).some((l) => {
    try {
      return KNOWN_TYPES.has(JSON.parse(l).type);
    } catch {
      return false;
    }
  });
  if (!recognised) return { names: null, status: "unrecognised" };
  const names = new Set();
  const note = (p) => {
    if (typeof p === "string" && dirname(p) === rulesDir) names.add(basename(p));
  };
  for (const line of lines) {
    if (!line.includes("nested_memory") && !line.includes('"name":"Read"')) continue;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    if (o.attachment?.type === "nested_memory") note(o.attachment.path);
    const content = o.message?.content;
    if (Array.isArray(content)) for (const b of content) if (b.type === "tool_use" && b.name === "Read") note(b.input?.file_path);
  }
  return { names, status: "ok" };
};

// ── The hook ──

// The repo paths a tool call touches, split into what it writes (checked before) and what it reads
// (listed after). A search's folder counts; a Glob or Grep pattern counts up to its first wildcard.
const pathsFor = (tool, args, root) => {
  if (!args) return { read: [], written: [] };
  if (tool === "Bash") return typeof args.command === "string" ? shellPaths(args.command, root) : { read: [], written: [] };
  const clean = (vals) => [...new Set(vals.filter((v) => typeof v === "string").map((v) => normalise(v, root)).filter(Boolean))];
  if (tool === "Write" || tool === "Edit") return { read: [], written: clean([args.file_path]) };
  if (tool === "Grep") return { read: clean([args.path, args.glob && join(args.path || root, args.glob)]), written: [] };
  if (tool === "Glob") return { read: clean([args.path, args.pattern && join(args.path || root, args.pattern)]), written: [] };
  return { read: [], written: [] };
};

const FORMAT_WARNING = {
  missing: "the session transcript could not be found",
  unrecognised: "the session transcript's format is no longer recognised (Claude Code may have changed it)",
};

const main = () => {
  const input = readStdin();
  if (!input?.tool_input) return;
  const before = input.hook_event_name === "PreToolUse";
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const rulesDir = join(root, ".claude", "rules");
  if (!existsSync(rulesDir)) return;

  const { read, written } = pathsFor(input.tool_name, input.tool_input, root);
  const candidates = before ? written : [...new Set([...read, ...written])];
  if (!candidates.length) return;

  let context = { names: null, status: "missing" };
  try {
    context = rulesInContext(input, rulesDir);
  } catch {
    context = { names: null, status: "unrecognised" };
  }
  const inContext = context.names;

  const missing = [];
  for (const name of readdirSync(rulesDir).filter((f) => f.endsWith(".md")).sort()) {
    if (inContext?.has(name)) continue;
    const globs = frontmatterPaths(readFileSync(join(rulesDir, name), "utf8"));
    if (!globs) continue; // unscoped rules already load at launch
    const matchers = globs.map(ruleMatcher);
    // A path matches a rule as a file, or as a folder the rule's paths sit inside (`grep -r app/pages`).
    const hit = candidates.find((p) => matchers.some((m) => m(p) || m(`${p}/x`)));
    if (hit) missing.push(`- .claude/rules/${name} (matched \`${hit}\`)`);
  }
  if (!missing.length) return;

  // Said on screen, so a broken check is never silent.
  const systemMessage = inContext ? undefined : `Rules hook: ${FORMAT_WARNING[context.status]}, so it can't tell which contract rules are loaded. Check scripts/rules-for-tools.mjs.`;

  if (before) {
    if (!inContext) {
      process.stdout.write(JSON.stringify({ systemMessage }));
      return; // a refusal could never clear
    }
    const permissionDecisionReason =
      `Not changed: the rules for the files this ${input.tool_name === "Bash" ? "command writes" : "change touches"} are not in your context ` +
      `(not loaded since the last compaction), and CONTRACTS.md 5.5 requires them before a file there is created or changed. ` +
      `Read each of these rule files with the Read tool, then make the same change again:\n${missing.join("\n")}`;
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason } }));
    return;
  }
  // A pointer, not the contents: a large payload is cut to a short preview by Claude Code (a command
  // touching several areas matched 55 KB of rules). Reading the files delivers them whole.
  const additionalContext =
    `This ${input.tool_name === "Bash" ? "shell command" : "search"} read paths that scoped contract and reference rules cover (CONTRACTS.md 5.5), and ` +
    (inContext
      ? `these rule files are not in your context (not loaded since the last compaction). Read each one with the Read tool before continuing work in that area:\n`
      : `it could not be checked which are already loaded. Read each one with the Read tool before continuing work in that area, skipping any whose contents are already in your context:\n`) +
    missing.join("\n");
  process.stdout.write(JSON.stringify({ ...(systemMessage && { systemMessage }), hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext } }));
};

try {
  main();
} catch {
  // Never get in the way of a command.
}
