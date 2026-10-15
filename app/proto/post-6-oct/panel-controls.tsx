"use client";

// The controls the panel shares across a project and every section. In this layout there is no column 2, so what column 2 held
// is the page's view tabs (a project's views, a list's scope or areas: All requests and My requests, Users and Roles and
// Permissions, Flora and Fauna), at the top of the page where they can be seen, and the "..." menu in the bar (a section's Actions
// group: Export CSV). Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import type { FC } from "react";
import { Button as AriaButton } from "react-aria-components";
import { Database01, DotsHorizontal, Download01, Feather, Folder, Paperclip } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { cx } from "@/utils/cx";
import type { ProjectView } from "./project-workspace";

export type Icon = FC<{ className?: string }>;

/** A name as this lab writes it: without the DLA and DSA acronyms in brackets (designer, 12 Oct 2026). The shared labels keep them, so lookups by label still work. */
export const plain = (name: string) => name.replace(/\s*\((DLA|DSA)\)/g, "");

export interface PanelView {
  id: string;
  label: string;
  icon: Icon;
}

// The project page's own tabs, by name, icon and order (project-detail-template.tsx, CONTRACTS 3.13): Project, Project records,
// Species, Artefacts and attachments. None is invented for the lab; the content of each is the production screen's.
export const PROJECT_VIEWS: { id: ProjectView; label: string; icon: Icon }[] = [
  { id: "project", label: "Project", icon: Folder },
  { id: "records", label: "Project records", icon: Database01 },
  { id: "species", label: "Species", icon: Feather },
  { id: "artefacts", label: "Artefacts and attachments", icon: Paperclip },
];

export const pill =
  "flex h-7 items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 text-tertiary shadow-xs outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-primary focus-visible:outline-2";
export const roundBtn =
  "grid size-7 place-items-center rounded-full border border-secondary bg-primary text-tertiary shadow-xs outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-primary focus-visible:outline-2";

/**
 * The views of one page as tabs you can see, one click each (Linear's "All issues, Active, Backlog" and "Overview, Updates, Issues":
 * Mobbin, 13 Oct 2026). Replaces the icon-only pill that opened a menu: the views of one thing are peers and the way between them
 * should be on screen, not behind a control that does not say where it is (designer, 13 Oct 2026). Nothing is drawn for a single
 * view (a one-option switcher is dishonest).
 * Built the way the design system builds the project page's tabs (CONTRACTS 3.13, 4.6): the DEW underline `TabList`, size md, a gap
 * of 24px, every tab with the icon of what it holds and any count after the label. A first version used the grey button type with
 * no icons; it broke 3.13 and was caught by the designer (13 Oct 2026: "you cannot and must not violate design system contracts").
 */
export function ViewTabs({ views, current, onChange, ariaLabel }: { views: (PanelView & { count?: number })[]; current: string; onChange: (id: string) => void; ariaLabel: string }) {
  if (views.length < 2) return null;
  const now = views.some((v) => v.id === current) ? current : views[0].id;
  return (
    <Tabs selectedKey={now} onSelectionChange={(key) => onChange(String(key))}>
      <TabList aria-label={ariaLabel} type="underline" size="md" className="gap-6">
        {views.map((v) => (
          <Tab key={v.id} id={v.id} label={v.label} icon={v.icon} badge={v.count} />
        ))}
      </TabList>
    </Tabs>
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
