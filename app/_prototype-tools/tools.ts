"use client";

import type { ComponentType } from "react";
import { useLayoutEffect, useSyncExternalStore } from "react";

// The Prototype tools: preview controls for this exploratory build (the role, which layout option,
// how a simulated run ends). They are Scaffold, not BioData SA (CONTRACTS 1.5): Geist text,
// react-aria primitives, and a colour the product never uses.
//
// One bar shows them all (`PrototypeTools`). The role is always there; every other tool is added
// by the code that owns it, only while it is on screen and has something to do: a
// screen with layout options to compare registers "layout", a project page with a dataset being
// ingested registers "ingestion". So a screen shows exactly its own tools, and a screen with
// nothing else to preview shows just the role.

export interface ToolOption {
  id: string;
  /** The full name, shown in the menu. */
  label: string;
  /** A shorter form for the bar when the full name is long, e.g. "Fails: our side". */
  short?: string;
  /** One line under the name in the menu, when the name alone doesn't say what you'll see. */
  description?: string;
}

export interface Tool {
  id: string;
  /** The question the menu answers, e.g. "View the app as". Heads the menu. */
  label: string;
  /** What the bar reads before the value, so the pair is a plain phrase: "Viewing as" + "Registered User". */
  barLabel: string;
  /** The value as the bar shows it; defaults to the option's short form or name. */
  barValue?: string;
  icon: ComponentType<{ className?: string }>;
  options: ToolOption[];
  value: string;
  onChange: (id: string) => void;
  /** Set when the tool is forcing something the real product wouldn't do (a failing run). */
  override?: string;
}

export const barValue = (tool: Tool) => {
  if (tool.barValue) return tool.barValue;
  const o = tool.options.find((opt) => opt.id === tool.value);
  return o?.short ?? o?.label ?? tool.value;
};

// Left to right. The role sits last, next to the bar's fixed right edge, so it never moves when
// a screen adds or removes a tool.
const ORDER = ["layout", "ingestion"];

let tools = new Map<string, Tool>();
let snapshot: Tool[] = [];
const listeners = new Set<() => void>();

const rank = (id: string) => {
  const i = ORDER.indexOf(id);
  return i === -1 ? ORDER.length : i;
};

function publish() {
  snapshot = [...tools.values()].sort((a, b) => rank(a.id) - rank(b.id));
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const EMPTY: Tool[] = [];

/** The registered tools (everything but the role), in bar order. */
export function useRegisteredTools() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}

/**
 * Put a tool on the bar while the calling component is mounted. Pass null when it has nothing to
 * do right now. Registered before paint, so a page never loads with a tool popping in.
 */
export function useRegisterTool(tool: Tool | null) {
  useLayoutEffect(() => {
    if (!tool) return;
    tools = new Map(tools).set(tool.id, tool);
    publish();
    return () => {
      if (tools.get(tool.id) !== tool) return;
      tools = new Map(tools);
      tools.delete(tool.id);
      publish();
    };
  });
}
