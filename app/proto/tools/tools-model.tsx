"use client";

import type { ComponentType, CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { Check } from "@untitledui/icons";
import {
  Button as AriaButton,
  Header,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Popover,
} from "react-aria-components";
import { cx } from "@/utils/cx";

// The preview tools every variant arranges, and the one menu they all open.
//
// These are Scaffold (CONTRACTS 1.5): they operate the preview, they are not BioData SA. So they are
// Geist, not Barlow, and built on react-aria primitives rather than DEW components - the live
// `FloatingMenuFab` opens a DEW `Dropdown`, which 1.5 does not allow; promoting any of these
// variants fixes that too.

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
  /** What the tool changes, e.g. "Preview role". Heads its menu. */
  label: string;
  /** One word for tight spaces, e.g. "Role". */
  shortLabel: string;
  /** What the bar reads before the value, so the pair is a plain phrase: "Viewing as" + "Registered User". */
  barLabel: string;
  /** The value as the bar shows it; defaults to the option's short form or name. */
  barValue?: string;
  icon: ComponentType<{ className?: string }>;
  options: ToolOption[];
  value: string;
  onChange: (id: string) => void;
  /** Set when the tool is overriding real behaviour (a forced failure), so it earns a dot. */
  override?: string;
}

export const valueLabel = (tool: Tool) =>
  tool.options.find((o) => o.id === tool.value)?.label ?? tool.value;

export const barValue = (tool: Tool) => {
  if (tool.barValue) return tool.barValue;
  const o = tool.options.find((opt) => opt.id === tool.value);
  return o?.short ?? o?.label ?? tool.value;
};

// z-index: dev tools sit at z-[10000] (CONTRACTS 3.8), above every map pane and the full-screen map.
export const TOOLS_Z = "z-[10000]";

/** The small red "this is overriding something" dot, from the Figma frames. */
export function OverrideDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute size-2 rounded-full bg-error-solid ring-2",
        className,
      )}
    />
  );
}

/**
 * One tool's menu: `renderTrigger` draws the button (each variant has its own), the menu is shared.
 * The open state is controlled so a drag that starts on the trigger never opens it.
 */
export function ToolMenu({
  tool,
  theme,
  vars,
  wasDrag,
  closeKey = 0,
  placement = "top end",
  triggerClassName,
  triggerLabel,
  children,
}: {
  tool: Tool;
  /** "custom" reads the --tool-* CSS variables passed in `vars` (the Status bar's colour options). */
  theme: "dark" | "light" | "custom";
  vars?: CSSProperties;
  wasDrag: () => boolean;
  /** Changing this closes the menu (the cluster started being dragged). */
  closeKey?: number;
  placement?: "top end" | "top start" | "top" | "left top" | "left";
  triggerClassName: string | ((open: boolean) => string);
  /** Accessible name; defaults to "<label>: <value>". */
  triggerLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [seenCloseKey, setSeenCloseKey] = useState(closeKey);
  if (seenCloseKey !== closeKey) {
    setSeenCloseKey(closeKey);
    setOpen(false);
  }
  const dark = theme === "dark";
  const custom = theme === "custom";
  return (
    <MenuTrigger
      isOpen={open}
      onOpenChange={(next) => setOpen(next && !wasDrag())}
    >
      <AriaButton
        aria-label={triggerLabel ?? `${tool.label}: ${valueLabel(tool)}`}
        className={
          typeof triggerClassName === "function"
            ? triggerClassName(open)
            : triggerClassName
        }
      >
        {children}
      </AriaButton>
      <Popover
        placement={placement}
        offset={8}
        className={(state) =>
          cx(
            "font-sans min-w-56 origin-(--trigger-anchor-point) rounded-xl p-1 outline-hidden",
            state.isEntering &&
              "animate-in fade-in duration-150 ease-out motion-reduce:animate-none",
            state.isExiting &&
              "animate-out fade-out duration-100 ease-in motion-reduce:animate-none",
            custom
              ? "bg-[var(--tool-bg)] text-[var(--tool-fg)] shadow-xl ring-1 ring-[var(--tool-ring)]"
              : dark
                ? "bg-primary-solid text-white shadow-xl ring-1 ring-white/10"
                : "bg-primary text-secondary shadow-lg ring-1 ring-secondary",
          )
        }
        style={vars}
      >
        <Menu
          aria-label={tool.label}
          selectionMode="single"
          selectedKeys={[tool.value]}
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const [id] = Array.from(keys) as string[];
            if (id) tool.onChange(id);
          }}
          className="outline-hidden"
        >
          <MenuSection>
            <Header
              className={cx(
                "px-2.5 pt-1.5 pb-1 text-xs font-medium",
                custom
                  ? "text-[var(--tool-muted)]"
                  : dark
                    ? "text-white/50"
                    : "text-quaternary",
              )}
            >
              {tool.label}
            </Header>
            {tool.options.map((o) => (
              <MenuItem
                key={o.id}
                id={o.id}
                textValue={o.label}
                className={({ isFocused }) =>
                  cx(
                    "flex cursor-pointer items-center justify-between gap-4 rounded-lg px-2.5 py-1.5 text-sm outline-hidden select-none",
                    custom
                      ? isFocused
                        ? "bg-[var(--tool-hover)] text-[var(--tool-fg)]"
                        : "text-[var(--tool-fg)]"
                      : dark
                      ? isFocused
                        ? "bg-white/10 text-white"
                        : "text-white/80"
                      : isFocused
                        ? "bg-primary_hover text-primary"
                        : "text-secondary",
                  )
                }
              >
                {({ isSelected }) => (
                  <>
                    <span className="flex flex-col">
                      <span>{o.label}</span>
                      {o.description && (
                        <span
                          className={cx(
                            "text-xs",
                            custom
                              ? "text-[var(--tool-muted)]"
                              : dark
                                ? "text-white/50"
                                : "text-tertiary",
                          )}
                        >
                          {o.description}
                        </span>
                      )}
                    </span>
                    <Check
                      className={cx(
                        "size-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                        custom
                          ? "text-[var(--tool-fg)]"
                          : dark
                            ? "text-white"
                            : "text-brand-secondary",
                      )}
                      aria-hidden="true"
                    />
                  </>
                )}
              </MenuItem>
            ))}
          </MenuSection>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
