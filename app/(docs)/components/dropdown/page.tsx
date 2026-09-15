"use client";

import type React from "react";
import { Copy01, Edit01, LogOut01, Settings01, Trash01, UserPlus01 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { PageHeader } from "@/components/PageHeader";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-start gap-6 rounded-xl border border-secondary bg-secondary p-6">
    <p className="mb-1 w-full text-xs font-semibold text-quaternary uppercase tracking-widest text-balance">
      {label}
    </p>
    {children}
  </div>
);

export default function DropdownPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Dropdown"
        description="Menu built on React Aria's Menu/Popover - icon items, sections with a separator, and a swappable selection indicator (checkmark, checkbox, radio, or toggle) for multi/single-select menus."
      />

      <h2 className="text-balance">Actions menu</h2>
      <p className="text-balance">
        The default shape - an icon, a label, nothing selectable. This is exactly what{" "}
        <code>TableRowActionsDropdown</code> on the <a href="/components/table">Table</a> page is built from.
      </p>
      <Section label="Actions">
        <Dropdown.Root>
          <Dropdown.DotsButton />
          <Dropdown.Popover className="w-56">
            <Dropdown.Menu>
              <Dropdown.Item icon={Edit01} label="Edit" />
              <Dropdown.Item icon={Copy01} label="Copy link" />
              <Dropdown.Separator />
              <Dropdown.Item icon={Trash01} label="Delete" />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </Section>

      <h2 className="text-balance">Sections</h2>
      <p className="text-balance">
        <code>Dropdown.Section</code> plus <code>Dropdown.SectionHeader</code> groups related items - e.g. account
        actions separated from a sign-out action.
      </p>
      <Section label="Grouped">
        <Dropdown.Root>
          <Dropdown.DotsButton />
          <Dropdown.Popover className="w-56">
            <Dropdown.Menu>
              <Dropdown.Section>
                <Dropdown.SectionHeader className="px-2.5 pt-2 pb-1 text-xs font-semibold text-quaternary">
                  Account
                </Dropdown.SectionHeader>
                <Dropdown.Item icon={Settings01} label="Settings" />
                <Dropdown.Item icon={UserPlus01} label="Invite people" />
              </Dropdown.Section>
              <Dropdown.Separator />
              <Dropdown.Item icon={LogOut01} label="Sign out" />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </Section>

      <h2 className="text-balance">Selection indicators</h2>
      <p className="text-balance">
        Set <code>selectionMode</code> on <code>Dropdown.Menu</code> and pass a{" "}
        <code>selectionIndicator</code> to each item - <code>&quot;checkmark&quot;</code> (default),{" "}
        <code>&quot;checkbox&quot;</code>, <code>&quot;radio&quot;</code>, or <code>&quot;toggle&quot;</code>. Each
        one reuses the real base component (<code>CheckboxBase</code>, <code>RadioButtonBase</code>,{" "}
        <code>ToggleBase</code>) rather than a lookalike.
      </p>
      <Section label="Checkmark (default) / Checkbox / Radio / Toggle">
        <Dropdown.Root>
          <Dropdown.DotsButton />
          <Dropdown.Popover className="w-52">
            <Dropdown.Menu selectionMode="single" defaultSelectedKeys={["newest"]}>
              <Dropdown.Item id="newest" label="Newest first" />
              <Dropdown.Item id="oldest" label="Oldest first" />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>

        <Dropdown.Root>
          <Dropdown.DotsButton />
          <Dropdown.Popover className="w-52">
            <Dropdown.Menu selectionMode="multiple" defaultSelectedKeys={["email"]}>
              <Dropdown.Item id="email" label="Email" selectionIndicator="checkbox" />
              <Dropdown.Item id="sms" label="SMS" selectionIndicator="checkbox" />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>

        <Dropdown.Root>
          <Dropdown.DotsButton />
          <Dropdown.Popover className="w-52">
            <Dropdown.Menu selectionMode="single" defaultSelectedKeys={["sm"]}>
              <Dropdown.Item id="sm" label="Small" selectionIndicator="radio" />
              <Dropdown.Item id="md" label="Medium" selectionIndicator="radio" />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>

        <Dropdown.Root>
          <Dropdown.DotsButton />
          <Dropdown.Popover className="w-52">
            <Dropdown.Menu selectionMode="multiple" defaultSelectedKeys={["notify"]}>
              <Dropdown.Item id="notify" label="Notify me" selectionIndicator="toggle" />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </Section>

      <h2 className="text-balance">With avatar</h2>
      <p className="text-balance">
        Pass <code>avatarUrl</code> instead of <code>icon</code> for a people-picker style menu - the selection
        indicator moves to the trailing edge automatically. The avatar falls back to initials when the image 404s,
        same as the base <a href="/components/avatar">Avatar</a> component.
      </p>
      <Section label="Assignee picker">
        <Dropdown.Root>
          <Dropdown.DotsButton />
          <Dropdown.Popover className="w-56">
            <Dropdown.Menu selectionMode="single" defaultSelectedKeys={["olivia"]}>
              <Dropdown.Item id="olivia" label="Olivia Rhye" avatarUrl="/avatars/olivia-rhye.jpg" />
              <Dropdown.Item id="phoenix" label="Phoenix Baker" avatarUrl="/avatars/phoenix-baker.jpg" />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </Section>

      <h2 className="text-balance">Usage</h2>
      <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
        <code className="font-mono text-[13px] text-secondary">
{`import { Edit01, Copy01, Trash01 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";

<Dropdown.Root>
  <Dropdown.DotsButton />
  <Dropdown.Popover className="w-56">
    <Dropdown.Menu>
      <Dropdown.Item icon={Edit01} label="Edit" />
      <Dropdown.Item icon={Copy01} label="Copy link" />
      <Dropdown.Separator />
      <Dropdown.Item icon={Trash01} label="Delete" />
    </Dropdown.Menu>
  </Dropdown.Popover>
</Dropdown.Root>`}
        </code>
      </pre>

      <h2 className="text-balance">API</h2>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Component</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: "Dropdown.Root", notes: "React Aria MenuTrigger - wraps a trigger element and the Popover." },
            { name: "Dropdown.DotsButton", notes: "Ready-made vertical-dots trigger button. Use any AriaButton-compatible element instead if you need a different trigger." },
            { name: "Dropdown.Popover", notes: "React Aria PopoverProps. className sets width, e.g. \"w-56\"." },
            { name: "Dropdown.Menu", notes: "React Aria MenuProps - selectionMode, selectedKeys/defaultSelectedKeys, onSelectionChange." },
            { name: "Dropdown.Item", notes: "label, icon, avatarUrl, addon (trailing text), selectionIndicator (\"checkmark\" | \"checkbox\" | \"radio\" | \"toggle\" | \"none\"), unstyled (opt out of default styling for a fully custom row)." },
            { name: "Dropdown.Section / SectionHeader", notes: "React Aria MenuSection/Header - groups items under a label." },
            { name: "Dropdown.Separator", notes: "Hairline divider between items or sections." },
          ].map((r) => (
            <tr key={r.name}>
              <td>
                <code>{r.name}</code>
              </td>
              <td style={{ fontSize: "13px" }}>{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
