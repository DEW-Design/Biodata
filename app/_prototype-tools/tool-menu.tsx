"use client";

import type { CSSProperties, ReactNode } from "react";
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
import type { Tool } from "./tools";

// One tool's menu. Built on react-aria primitives, not the DEW `Dropdown`: these tools operate the
// preview, so they are Scaffold (CONTRACTS 1.5). The menu is portaled, so it takes the bar's
// --tool-* colours through `vars`, and Geist through `font-sans`. The open state is controlled so a
// drag that starts on the trigger never opens it.

export function ToolMenu({
  tool,
  vars,
  wasDrag,
  closeKey,
  triggerLabel,
  triggerClassName,
  children,
}: {
  tool: Tool;
  vars: CSSProperties;
  wasDrag: () => boolean;
  /** Changing this closes the menu (the bar started being dragged). */
  closeKey: number;
  triggerLabel: string;
  triggerClassName: (open: boolean) => string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [seenCloseKey, setSeenCloseKey] = useState(closeKey);
  if (seenCloseKey !== closeKey) {
    setSeenCloseKey(closeKey);
    setOpen(false);
  }
  return (
    <MenuTrigger isOpen={open} onOpenChange={(next) => setOpen(next && !wasDrag())}>
      <AriaButton aria-label={triggerLabel} className={triggerClassName(open)}>
        {children}
      </AriaButton>
      <Popover
        placement="top start"
        offset={8}
        style={vars}
        className={(state) =>
          cx(
            "min-w-56 rounded-xl bg-[var(--tool-bg)] p-1 font-sans text-[var(--tool-fg)] shadow-xl ring-1 ring-[var(--tool-ring)] outline-hidden",
            state.isEntering && "animate-in fade-in duration-150 ease-out motion-reduce:animate-none",
            state.isExiting && "animate-out fade-out duration-100 ease-in motion-reduce:animate-none",
          )
        }
      >
        <Menu
          aria-label={tool.label}
          selectionMode="single"
          selectedKeys={[tool.value]}
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const [id] = Array.from(keys) as string[];
            if (id && id !== tool.value) tool.onChange(id);
          }}
          className="outline-hidden"
        >
          <MenuSection>
            <Header className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-[var(--tool-muted)]">{tool.label}</Header>
            {tool.options.map((o) => (
              <MenuItem
                key={o.id}
                id={o.id}
                textValue={o.label}
                className={({ isFocused }) =>
                  cx(
                    "flex cursor-pointer items-center justify-between gap-4 rounded-lg px-2.5 py-1.5 text-sm text-[var(--tool-fg)] outline-hidden select-none",
                    isFocused && "bg-[var(--tool-hover)]",
                  )
                }
              >
                {({ isSelected }) => (
                  <>
                    <span className="flex flex-col">
                      <span>{o.label}</span>
                      {o.description && <span className="text-xs text-[var(--tool-muted)]">{o.description}</span>}
                    </span>
                    <Check className={cx("size-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} aria-hidden="true" />
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
