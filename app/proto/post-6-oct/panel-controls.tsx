"use client";

// The controls at the right of the panel's bar, shared by a project and by every section. In this layout there is no
// column 2, so what column 2 held becomes the bar's two controls: the view menu (a project's views, a list's scope or
// areas: All requests and My requests, Users and Roles and Permissions, Flora and Fauna) and the "..." menu (a section's
// Actions group: Export CSV). Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import type { FC } from "react";
import { Button as AriaButton } from "react-aria-components";
import { ChevronDown, DotsHorizontal, Download01 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { cx } from "@/utils/cx";

export type Icon = FC<{ className?: string }>;

/** A name as this lab writes it: without the DLA and DSA acronyms in brackets (designer, 12 Oct 2026). The shared labels keep them, so lookups by label still work. */
export const plain = (name: string) => name.replace(/\s*\((DLA|DSA)\)/g, "");

export interface PanelView {
  id: string;
  label: string;
  icon: Icon;
}

export const pill =
  "flex h-7 items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 text-tertiary shadow-xs outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-primary focus-visible:outline-2";
export const roundBtn =
  "grid size-7 place-items-center rounded-full border border-secondary bg-primary text-tertiary shadow-xs outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-primary focus-visible:outline-2";

/** The pill: the current view's icon and a caret. Nothing is drawn for a single view (a one-option switcher is dishonest). */
export function ViewMenu({ views, current, onChange, ariaLabel }: { views: PanelView[]; current: string; onChange: (id: string) => void; ariaLabel: string }) {
  if (views.length < 2) return null;
  const now = views.find((v) => v.id === current) ?? views[0];
  const NowIcon = now.icon;
  return (
    <Dropdown.Root>
      <AriaButton aria-label={`${ariaLabel}: ${now.label}`} className={pill}>
        <NowIcon className="size-4" />
        <ChevronDown className="size-3.5" aria-hidden />
      </AriaButton>
      <Dropdown.Popover placement="bottom right">
        <Dropdown.Menu
          aria-label={ariaLabel}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[now.id]}
          onSelectionChange={(keys) => {
            const next = [...keys][0];
            if (next) onChange(String(next));
          }}
        >
          {views.map((v) => (
            <Dropdown.Item key={v.id} id={v.id} icon={v.icon} label={v.label} selectionIndicator="checkmark-end" />
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

/** A section's "..." menu: the Actions group that sat in column 2. Only Export CSV exists on the lists so far. */
export function ExportMenu({ onExport }: { onExport: () => void }) {
  return (
    <Dropdown.Root>
      <AriaButton aria-label="More actions" className={cx(roundBtn)}>
        <DotsHorizontal className="size-4" />
      </AriaButton>
      <Dropdown.Popover placement="bottom right">
        <Dropdown.Menu aria-label="More actions" onAction={onExport}>
          <Dropdown.Item id="export" label="Export CSV" icon={Download01} />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
