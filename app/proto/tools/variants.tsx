"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight,
  Sliders01,
  XClose,
} from "@untitledui/icons";
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Popover,
  Toolbar,
} from "react-aria-components";
import { cx } from "@/utils/cx";
import {
  OverrideDot,
  TOOLS_Z,
  ToolMenu,
  valueLabel,
  type Tool,
} from "./tools-model";
import { useDragPosition } from "./use-drag-position";

// Three ways to arrange the preview tools, on one axis: how much they show while you are not using
// them. All three are one draggable cluster (CONTRACTS 3.8), start bottom-right above a footer bar,
// and list only the tools the current page has.

const DEFAULT_POSITION = { right: 20, bottom: 88 };
// react-aria sets data-focus-visible only for keyboard focus, so a mouse click never leaves a ring.
const focusRingDark =
  "outline-none outline-white/60 data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-offset-2";

// ─── 1. Dock ─────────────────────────────────────────────────────────────────────────────────
// Figma frames 3 and 4: one dark capsule of round buttons. The tool you used last shows its value;
// the rest are icons. X folds the capsule into a single button.

export function DockVariant({ tools }: { tools: Tool[] }) {
  const [dragEpoch, setDragEpoch] = useState(0);
  const drag = useDragPosition("dock", DEFAULT_POSITION, () =>
    setDragEpoch((n) => n + 1),
  );
  const [collapsed, setCollapsed] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const lead =
    tools.find((t) => t.id === leadId) ??
    tools.find((t) => t.override) ??
    tools[0];
  const anyOverride = tools.some((t) => t.override);

  if (collapsed) {
    return (
      <div
        className={cx("fixed font-sans touch-none select-none", TOOLS_Z)}
        style={drag.style}
        onPointerDownCapture={drag.onPointerDown}
      >
        <AriaButton
          aria-label="Show preview tools"
          onPress={() => !drag.wasDrag() && setCollapsed(false)}
          className={cx(
            "relative flex size-12 items-center justify-center rounded-full bg-primary-solid text-white shadow-xl ring-1 ring-white/10 transition-transform duration-150 ease-out active:scale-[0.96]",
            drag.isDragging ? "cursor-grabbing" : "cursor-grab",
            focusRingDark,
          )}
        >
          <Sliders01 className="size-5" aria-hidden="true" />
          {anyOverride && (
            <OverrideDot className="top-1 right-1 ring-[var(--ui-bg-primary-solid)]" />
          )}
        </AriaButton>
      </div>
    );
  }

  return (
    <div
      className={cx("fixed touch-none select-none", TOOLS_Z)}
      style={drag.style}
      onPointerDownCapture={drag.onPointerDown}
    >
      <Toolbar
        aria-label="Preview tools"
        className={cx(
          "flex items-center gap-1.5 rounded-full bg-gray-900 p-1.5 font-sans shadow-xl ring-1 ring-white/10",
          drag.isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {tools.map((tool) => {
          const isLead = tool.id === lead?.id;
          const Icon = tool.icon;
          const withLead: Tool = {
            ...tool,
            onChange: (id) => (tool.onChange(id), setLeadId(tool.id)),
          };
          return (
            <ToolMenu
              key={tool.id}
              tool={withLead}
              theme="dark"
              wasDrag={drag.wasDrag}
              closeKey={dragEpoch}
              triggerClassName={(open) =>
                cx(
                  "relative flex h-10 shrink-0 items-center justify-center gap-2 rounded-full text-white transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]",
                  isLead ? "max-w-52 pr-4 pl-3" : "w-10",
                  open ? "bg-gray-800" : "bg-primary-solid hover:bg-gray-800",
                  focusRingDark,
                )
              }
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {isLead && (
                <span className="truncate text-sm font-medium">
                  {valueLabel(tool)}
                </span>
              )}
              {tool.override && (
                <OverrideDot className="top-0 right-0.5 ring-gray-900" />
              )}
            </ToolMenu>
          );
        })}
        <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-white/15" />
        <AriaButton
          aria-label="Hide preview tools"
          onPress={() => !drag.wasDrag() && setCollapsed(true)}
          className={cx(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors duration-150 ease-out hover:bg-white/10 hover:text-white",
            focusRingDark,
          )}
        >
          <XClose className="size-4" aria-hidden="true" />
        </AriaButton>
      </Toolbar>
    </div>
  );
}

// ─── 2. Status bar ── lives in status-bar.tsx.

// ─── 3. Launcher ─────────────────────────────────────────────────────────────────────────────
// One button that stays out of the way. It opens a small panel listing every tool with its value;
// ` (backtick) opens and closes it from the keyboard.

export function LauncherVariant({ tools }: { tools: Tool[] }) {
  const [open, setOpen] = useState(false);
  const drag = useDragPosition("launcher", DEFAULT_POSITION, () =>
    setOpen(false),
  );
  const overrides = tools.filter((t) => t.override);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "`" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)
        return;
      e.preventDefault();
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className={cx("fixed font-sans touch-none select-none", TOOLS_Z)}
      style={drag.style}
      onPointerDownCapture={drag.onPointerDown}
    >
      <DialogTrigger
        isOpen={open}
        onOpenChange={(next) => setOpen(next && !drag.wasDrag())}
      >
        <AriaButton
          aria-label="Preview tools (`)"
          className={cx(
            "relative flex size-12 items-center justify-center rounded-full bg-primary-solid text-white shadow-xl ring-1 ring-white/10 transition-transform duration-150 ease-out active:scale-[0.96]",
            drag.isDragging ? "cursor-grabbing" : "cursor-grab",
            focusRingDark,
          )}
        >
          <Sliders01 className="size-5" aria-hidden="true" />
          {overrides.length > 0 && (
            <OverrideDot className="top-1 right-1 ring-[var(--ui-bg-primary-solid)]" />
          )}
        </AriaButton>
        <Popover
          placement="top end"
          offset={8}
          className={(state) =>
            cx(
              "w-72 origin-(--trigger-anchor-point) rounded-2xl bg-primary-solid p-1.5 font-sans text-white shadow-xl ring-1 ring-white/10 outline-hidden",
              state.isEntering &&
                "animate-in fade-in zoom-in-95 duration-150 ease-out",
              state.isExiting &&
                "animate-out fade-out zoom-out-95 duration-100 ease-in",
            )
          }
        >
          <Dialog aria-label="Preview tools" className="outline-hidden">
            <div className="flex items-center justify-between px-2.5 pt-1.5 pb-2">
              <p className="text-sm font-semibold">Preview tools</p>
              <kbd className="flex h-5 min-w-5 items-center justify-center rounded-md px-1 font-mono text-xs text-white/60 ring-1 ring-white/15">
                `
              </kbd>
            </div>
            <div className="flex flex-col gap-0.5">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <ToolMenu
                    key={tool.id}
                    tool={tool}
                    theme="dark"
                    wasDrag={() => false}
                    placement="left top"
                    triggerClassName={(menuOpen) =>
                      cx(
                        "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 ease-out",
                        menuOpen ? "bg-white/15" : "hover:bg-white/10",
                        focusRingDark,
                      )
                    }
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-xs text-white/50">
                        {tool.label}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">{valueLabel(tool)}</span>
                        {tool.override && (
                          <span
                            aria-hidden="true"
                            className="size-1.5 shrink-0 rounded-full bg-error-solid"
                          />
                        )}
                      </span>
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-white/40"
                      aria-hidden="true"
                    />
                  </ToolMenu>
                );
              })}
            </div>
          </Dialog>
        </Popover>
      </DialogTrigger>
    </div>
  );
}
