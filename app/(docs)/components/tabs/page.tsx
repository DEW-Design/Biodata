"use client";

import { useState } from "react";
import type React from "react";
import { BarChart03, Home02, Settings01, Users01 } from "@untitledui/icons";
import { PageHeader } from "@/components/PageHeader";
import { Tabs } from "@/components/application/tabs/tabs";
import { ContextualConfigPanel } from "@/components/ContextualConfigPanel";
import { ScaffoldCheckbox, ScaffoldLabel, SegmentedControl } from "@/components/scaffold/controls";
import { enabledVariants, isFeatureEnabled } from "@/config/design-system.config";
import { useConfig } from "@/lib/config-context";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-6 rounded-xl border border-secondary bg-secondary p-6">
    <p className="mb-1 w-full text-xs font-semibold text-quaternary uppercase tracking-widest text-balance">
      {label}
    </p>
    {children}
  </div>
);

const sectionToggles = [
  { key: "playground", label: "Component Playground" },
  { key: "fullWidth", label: "Full width" },
  { key: "usage", label: "Usage" },
  { key: "figma", label: "Figma" },
];

// Pulled directly from the prop interfaces in components/application/tabs/tabs.tsx (plus the
// react-aria-components props they extend).
const tabsProps = [
  { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"' },
  { name: "keyboardActivation", type: '"automatic" | "manual"', default: '"manual"' },
  { name: "className", type: "string", default: "-" },
  { name: "children", type: "ReactNode", default: "-" },
];

const tabListProps = [
  { name: "size", type: '"sm" | "md"', default: '"sm"' },
  { name: "type", type: "HorizontalTypes | VerticalTypes (see Types below)", default: '"button-brand"' },
  { name: "orientation", type: '"horizontal" | "vertical"', default: "inherited from Tabs" },
  { name: "fullWidth", type: "boolean", default: "false" },
  { name: "items", type: "T[]", default: "-" },
  { name: "className", type: "string", default: "-" },
];

const tabProps = [
  { name: "id", type: "Key", default: "-" },
  { name: "label", type: "ReactNode", default: "-" },
  { name: "icon", type: "FC<{ className?: string }> | ReactNode", default: "-" },
  { name: "badge", type: "number | string", default: "-" },
  { name: "isDisabled", type: "boolean", default: "false" },
  { name: "children", type: "ReactNode | ((props: TabRenderProps) => ReactNode)", default: "-" },
];

const tabPanelProps = [
  { name: "id", type: "Key", default: "-" },
  { name: "children", type: "ReactNode", default: "-" },
];

const demoTabs = [
  { id: "overview", label: "Overview", icon: Home02, content: "A summary of everything happening in this workspace." },
  { id: "team", label: "Team", icon: Users01, badge: 8, content: "8 people have access to this workspace." },
  { id: "activity", label: "Activity", icon: BarChart03, content: "A log of recent changes across every project." },
  { id: "settings", label: "Settings", icon: Settings01, content: "Workspace name, billing, and integrations." },
];

export default function TabsPage() {
  const { config: liveConfig } = useConfig();
  const config = liveConfig.tabs;
  const sizes = enabledVariants(config.sizes);
  const allTypes = enabledVariants(config.types);
  const horizontalTypes = allTypes.filter((t) => t.group !== "vertical");
  const verticalTypes = allTypes.filter((t) => t.group !== "horizontal");

  const defaults = {
    orientation: "horizontal" as "horizontal" | "vertical",
    type: "button-brand",
    size: "sm" as "sm" | "md",
    fullWidth: false,
    withIcons: true,
    withBadge: true,
  };

  const [orientation, setOrientation] = useState(defaults.orientation);
  const [type, setType] = useState(defaults.type);
  const [size, setSize] = useState(defaults.size);
  const [fullWidth, setFullWidth] = useState(defaults.fullWidth);
  const [withIcons, setWithIcons] = useState(defaults.withIcons);
  const [withBadge, setWithBadge] = useState(defaults.withBadge);

  const isDefault =
    orientation === defaults.orientation &&
    type === defaults.type &&
    size === defaults.size &&
    fullWidth === defaults.fullWidth &&
    withIcons === defaults.withIcons &&
    withBadge === defaults.withBadge;

  const resetPreview = () => {
    setOrientation(defaults.orientation);
    setType(defaults.type);
    setSize(defaults.size);
    setFullWidth(defaults.fullWidth);
    setWithIcons(defaults.withIcons);
    setWithBadge(defaults.withBadge);
  };

  const typeOptions = orientation === "horizontal" ? horizontalTypes : verticalTypes;

  // Switching orientation can leave `type` pointing at a value the other orientation doesn't
  // have (e.g. "underline" while vertical) - fall back to the first valid option rather than
  // rendering a Tabs.List with a `type` its own styles object has no entry for.
  const activeType = typeOptions.some((t) => t.key === type) ? type : (typeOptions[0]?.key ?? defaults.type);

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Tabs"
        description="React Aria Tabs, composed with Badge - 4 shared button types plus an orientation-specific underline/line type, two sizes, optional icon and count badge - driven from config/design-system.config.ts."
        actions={<ContextualConfigPanel slug="tabs" title="Tabs" sections={sectionToggles} />}
      />

      {/* ── Component Playground ── */}
      {isFeatureEnabled(config, "playground") && (
        <>
          <h2 className="text-balance">Component Playground</h2>
          <p className="text-balance">
            Live instance - the controls read their options from the same config that drives the Types section below.
          </p>
          <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
            <div className="grid md:grid-cols-[1fr_300px]">
              <div
                className="relative flex min-h-[320px] items-center justify-center overflow-x-auto bg-primary_alt p-12"
                style={{
                  backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <div className="w-full max-w-lg rounded-xl bg-primary p-6 shadow-md">
                  <Tabs orientation={orientation} className={orientation === "vertical" ? "flex-row gap-6" : undefined}>
                    <Tabs.List type={activeType as never} size={size} orientation={orientation} fullWidth={fullWidth}>
                      {demoTabs.map((tab) => (
                        <Tabs.Item
                          key={tab.id}
                          id={tab.id}
                          label={tab.label}
                          icon={withIcons ? tab.icon : undefined}
                          badge={withBadge ? tab.badge : undefined}
                        />
                      ))}
                    </Tabs.List>
                    <div className={orientation === "vertical" ? "flex-1" : "mt-4"}>
                      {demoTabs.map((tab) => (
                        <Tabs.Panel key={tab.id} id={tab.id}>
                          <p className="text-sm text-tertiary">{tab.content}</p>
                        </Tabs.Panel>
                      ))}
                    </div>
                  </Tabs>
                </div>
              </div>

              <div className="flex flex-col gap-5 border-l border-secondary bg-primary p-6">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold text-quaternary uppercase tracking-widest text-balance">
                    Controls
                  </p>
                  <button
                    type="button"
                    onClick={resetPreview}
                    disabled={isDefault}
                    className="text-xs font-medium text-brand-secondary transition-opacity hover:text-brand-secondary_hover disabled:opacity-40"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Orientation</ScaffoldLabel>
                  <SegmentedControl
                    options={[
                      { key: "horizontal" as const, label: "Horizontal" },
                      { key: "vertical" as const, label: "Vertical" },
                    ]}
                    value={orientation}
                    onChange={setOrientation}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Type</ScaffoldLabel>
                  <SegmentedControl
                    options={typeOptions.map((t) => ({ key: t.key, label: t.label.replace("Button ", "") }))}
                    value={activeType}
                    onChange={setType}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Size</ScaffoldLabel>
                  <SegmentedControl
                    options={sizes.map((s) => ({ key: s.key as "sm" | "md", label: s.key }))}
                    value={size}
                    onChange={setSize}
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <ScaffoldCheckbox
                    label="Full width"
                    checked={fullWidth}
                    onChange={setFullWidth}
                  />
                  <ScaffoldCheckbox label="Icons" checked={withIcons} onChange={setWithIcons} />
                  <ScaffoldCheckbox label="Badge" checked={withBadge} onChange={setWithBadge} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Types ── */}
      {allTypes.length > 0 && (
        <>
          <h2 className="text-balance">Types</h2>
          <p className="text-balance">
            4 types work in either orientation - <code>button-brand</code>, <code>button-gray</code>,{" "}
            <code>button-border</code>, <code>button-minimal</code>. <code>underline</code> is horizontal-only,{" "}
            <code>line</code> is its vertical equivalent.
          </p>
          <h3 className="text-balance">Horizontal</h3>
          <Section label={horizontalTypes.map((t) => t.label).join(" / ")}>
            <div className="flex w-full flex-col gap-6">
              {horizontalTypes.map((t) => (
                <div key={t.key} className="flex flex-col gap-2">
                  <code className="text-xs text-quaternary">{t.key}</code>
                  <Tabs orientation="horizontal">
                    <Tabs.List type={t.key as never} size="sm">
                      <Tabs.Item id="one" label="Overview" />
                      <Tabs.Item id="two" label="Team" badge={8} />
                      <Tabs.Item id="three" label="Settings" />
                    </Tabs.List>
                  </Tabs>
                </div>
              ))}
            </div>
          </Section>

          <h3 className="text-balance">Vertical</h3>
          <Section label={verticalTypes.map((t) => t.label).join(" / ")}>
            <div className="flex w-full flex-wrap gap-8">
              {verticalTypes.map((t) => (
                <div key={t.key} className="flex flex-col gap-2">
                  <code className="text-xs text-quaternary">{t.key}</code>
                  <Tabs orientation="vertical">
                    <Tabs.List type={t.key as never} size="sm" orientation="vertical">
                      <Tabs.Item id="one" label="Overview" />
                      <Tabs.Item id="two" label="Team" badge={8} />
                      <Tabs.Item id="three" label="Settings" />
                    </Tabs.List>
                  </Tabs>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ── Sizes ── */}
      {sizes.length > 0 && (
        <>
          <h2 className="text-balance">Sizes</h2>
          <p className="text-balance">
            Two sizes - <code>sm</code> (default) and <code>md</code>.
          </p>
          <Section label={sizes.map((s) => s.label).join(" / ")}>
            {sizes.map((s) => (
              <Tabs key={s.key} orientation="horizontal">
                <Tabs.List type="button-brand" size={s.key as "sm" | "md"}>
                  <Tabs.Item id="one" label="Overview" />
                  <Tabs.Item id="two" label="Team" />
                </Tabs.List>
              </Tabs>
            ))}
          </Section>
        </>
      )}

      {/* ── Full width ── */}
      {isFeatureEnabled(config, "fullWidth") && (
        <>
          <h2 className="text-balance">Full width</h2>
          <p className="text-balance">
            Pass <code>fullWidth</code> on <code>Tabs.List</code> to stretch tabs across the available width -
            common for the <code>underline</code> type on a page-level tab bar.
          </p>
          <Section label="Full width, underline">
            <Tabs orientation="horizontal" className="w-full">
              <Tabs.List type="underline" size="md" fullWidth>
                <Tabs.Item id="one" label="Overview" />
                <Tabs.Item id="two" label="Team" badge={8} />
                <Tabs.Item id="three" label="Activity" />
                <Tabs.Item id="four" label="Settings" />
              </Tabs.List>
            </Tabs>
          </Section>
        </>
      )}

      {/* ── API ── */}
      <h2 className="text-balance">API</h2>
      <p className="text-balance">
        <code>Tabs</code> holds selection state; <code>Tabs.List</code> (alias <code>TabList</code>) renders the
        clickable row/column of <code>Tabs.Item</code>s (alias <code>Tab</code>); each has a matching{" "}
        <code>Tabs.Panel</code> (alias <code>TabPanel</code>) with the same <code>id</code>.
      </p>
      {[
        { title: "Tabs", rows: tabsProps },
        { title: "Tabs.List", rows: tabListProps },
        { title: "Tabs.Item", rows: tabProps },
        { title: "Tabs.Panel", rows: tabPanelProps },
      ].map(({ title, rows }) => (
        <div key={title}>
          <h3 className="text-balance">{title}</h3>
          <table className="token-table mt-4">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.name}>
                  <td>
                    <code>{p.name}</code>
                  </td>
                  <td>
                    <code style={{ fontSize: "11px" }}>{p.type}</code>
                  </td>
                  <td>
                    <code>{p.default}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* ── Usage ── */}
      {isFeatureEnabled(config, "usage") && (
        <>
          <h2 className="text-balance">Usage</h2>
          <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
            <code className="font-mono text-[13px] text-secondary">
{`import { Tabs } from "@/components/application/tabs/tabs";
import { Users01 } from "@untitledui/icons";

<Tabs orientation="horizontal">
  <Tabs.List type="button-brand" size="sm">
    <Tabs.Item id="overview" label="Overview" />
    <Tabs.Item id="team" label="Team" icon={Users01} badge={8} />
    <Tabs.Item id="settings" label="Settings" />
  </Tabs.List>

  <Tabs.Panel id="overview">Overview content</Tabs.Panel>
  <Tabs.Panel id="team">Team content</Tabs.Panel>
  <Tabs.Panel id="settings">Settings content</Tabs.Panel>
</Tabs>`}
            </code>
          </pre>
        </>
      )}

      {/* ── Figma ── */}
      {isFeatureEnabled(config, "figma") && (
        <>
          <h2 className="text-balance">Figma</h2>
          <p className="text-balance">No linked Figma file yet - this component was pulled in via the Untitled UI CLI, not designed in Figma first.</p>
        </>
      )}
    </div>
  );
}
