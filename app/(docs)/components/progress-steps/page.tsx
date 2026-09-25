"use client";

import { useState } from "react";
import type React from "react";
import { CheckCircle, Database01, Folder, Lock01 } from "@untitledui/icons";
import { PageHeader } from "@/components/PageHeader";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressFeaturedIconType, ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { ContextualConfigPanel } from "@/components/ContextualConfigPanel";
import { ScaffoldCheckbox, ScaffoldLabel, ScaffoldNumberInput, SegmentedControl } from "@/components/scaffold/controls";
import { enabledVariants, isFeatureEnabled } from "@/config/design-system.config";
import { useConfig } from "@/lib/config-context";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-6 rounded-xl border border-secondary bg-secondary p-6">
    <p className="text-xs font-semibold tracking-widest text-quaternary uppercase text-balance">{label}</p>
    {children}
  </div>
);

const sectionToggles = [
  { key: "playground", label: "Component Playground" },
  { key: "iconsWithText", label: "Icons with text" },
  { key: "minimalIcons", label: "Minimal icons" },
  { key: "textWithLine", label: "Text with line" },
  { key: "usage", label: "Usage" },
  { key: "figma", label: "Figma" },
];

type Layout = "icons-with-text" | "minimal-icons" | "minimal-connected" | "text-with-line";
type StepType = "icon" | "number" | "featured-icon";
type Orientation = "vertical" | "horizontal";
type Size = "sm" | "md";

// Sample content: the Add Project flow's own steps, so the demo reads like a real form.
const sample = [
  { title: "Project details", description: "Name, abstract and dates.", icon: Folder },
  { title: "Data collection", description: "Extent, focus and method.", icon: Database01 },
  { title: "Privacy", description: "Embargo and restrictions.", icon: Lock01 },
  { title: "Review", description: "Check and create.", icon: CheckCircle },
];

function buildSteps(currentIndex: number): ProgressFeaturedIconType[] {
  return sample.map((s, i) => ({ ...s, status: i < currentIndex ? "complete" : i === currentIndex ? "current" : "incomplete" }));
}

const iconsWithTextProps = [
  { name: "items", type: "Step[] (icon required for featured-icon)", default: "-" },
  { name: "type", type: '"icon" | "number" | "featured-icon"', default: '"icon"' },
  { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"' },
  { name: "size", type: '"sm" | "md"', default: '"sm"' },
  { name: "connector", type: "boolean", default: "true" },
  { name: "className", type: "string", default: "-" },
];
const minimalProps = [
  { name: "items", type: "Step[]", default: "-" },
  { name: "size", type: '"sm" | "md"', default: '"sm"' },
  { name: "text", type: "boolean (MinimalIcons only: shows \"Step n of m\")", default: "false" },
  { name: "orientation", type: '"vertical" | "horizontal" (MinimalIconsConnected only)', default: '"horizontal"' },
  { name: "className", type: "string", default: "-" },
];
const stepShape = [
  { name: "title", type: "string", default: "-" },
  { name: "description", type: "string (optional)", default: "-" },
  { name: "status", type: '"incomplete" | "current" | "complete"', default: "-" },
  { name: "icon", type: "icon component (featured-icon type)", default: "-" },
  { name: "connector", type: "boolean (per-step override)", default: "-" },
  { name: "onClick", type: "() => void", default: "-" },
  { name: "error", type: "boolean (icon type)", default: "-" },
];

const PropTable = ({ rows }: { rows: { name: string; type: string; default: string }[] }) => (
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
);

export default function ProgressStepsPage() {
  const { config: liveConfig } = useConfig();
  const config = liveConfig["progress-steps"];
  const types = enabledVariants(config.types);
  const sizes = enabledVariants(config.sizes);

  const defaults = { layout: "icons-with-text" as Layout, type: "icon" as StepType, orientation: "horizontal" as Orientation, size: "sm" as Size, connector: true, current: 2 };
  const [layout, setLayout] = useState<Layout>(defaults.layout);
  const [type, setType] = useState<StepType>(defaults.type);
  const [orientation, setOrientation] = useState<Orientation>(defaults.orientation);
  const [size, setSize] = useState<Size>(defaults.size);
  const [connector, setConnector] = useState(defaults.connector);
  const [current, setCurrent] = useState(defaults.current);

  const isDefault = layout === defaults.layout && type === defaults.type && orientation === defaults.orientation && size === defaults.size && connector === defaults.connector && current === defaults.current;
  const reset = () => {
    setLayout(defaults.layout);
    setType(defaults.type);
    setOrientation(defaults.orientation);
    setSize(defaults.size);
    setConnector(defaults.connector);
    setCurrent(defaults.current);
  };

  const steps = buildSteps(current - 1);
  const plainSteps: ProgressIconType[] = steps;

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Progress steps"
        description="Step-by-step progress for multi-step flows: icon, number or featured-icon steps with text, minimal dot rows, and a text-with-line bar. components/application/progress-steps/."
        actions={<ContextualConfigPanel slug="progress-steps" title="Progress steps" sections={sectionToggles} />}
      />

      <p className="text-balance">
        <strong>Complex component</strong> - it composes <code>FeaturedIcon</code> (foundations) with its own step primitives. Use it to
        show a fixed, short sequence. The sections of a form are shown by this same component, vertically, in column 2: see the <a href="/patterns/forms">form pattern</a>.
      </p>

      {/* ── Component Playground ── */}
      {isFeatureEnabled(config, "playground") && (
        <>
          <h2 className="text-balance">Component Playground</h2>
          <p className="text-balance">Live instance.</p>
          <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
            <div
              className="relative flex min-h-[320px] w-full items-center justify-center bg-primary_alt p-12"
              style={{ backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            >
              <div className="w-full max-w-3xl rounded-xl bg-primary p-8 shadow-md">
                {layout === "icons-with-text" && <Progress.IconsWithText items={steps} type={type} orientation={orientation} size={size} connector={connector} />}
                {layout === "minimal-icons" && <Progress.MinimalIcons items={plainSteps} size={size} text />}
                {layout === "minimal-connected" && <Progress.MinimalIconsConnected items={plainSteps} size={size} orientation={orientation} />}
                {layout === "text-with-line" && <Progress.TextWithLine items={plainSteps} size={size} orientation={orientation} />}
              </div>
            </div>

            <div className="flex flex-col gap-5 border-t border-secondary bg-primary p-6">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold tracking-widest text-quaternary uppercase text-balance">Controls</p>
                <button type="button" onClick={reset} disabled={isDefault} className="text-xs font-medium text-brand-secondary transition-opacity hover:text-brand-secondary_hover disabled:opacity-40">
                  Reset
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                <ScaffoldLabel>Layout</ScaffoldLabel>
                <SegmentedControl
                  options={[
                    { key: "icons-with-text" as const, label: "Icons with text" },
                    { key: "minimal-icons" as const, label: "Minimal icons" },
                    { key: "minimal-connected" as const, label: "Minimal connected" },
                    { key: "text-with-line" as const, label: "Text with line" },
                  ]}
                  value={layout}
                  onChange={setLayout}
                />
              </div>
              {layout === "icons-with-text" && types.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Type</ScaffoldLabel>
                  <SegmentedControl options={types.map((t) => ({ key: t.key as StepType, label: t.label }))} value={type} onChange={setType} />
                </div>
              )}
              {layout !== "minimal-icons" && (
                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Orientation</ScaffoldLabel>
                  <SegmentedControl options={[{ key: "horizontal" as const, label: "Horizontal" }, { key: "vertical" as const, label: "Vertical" }]} value={orientation} onChange={setOrientation} />
                </div>
              )}
              {sizes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Size</ScaffoldLabel>
                  <SegmentedControl options={sizes.map((s) => ({ key: s.key as Size, label: s.label }))} value={size} onChange={setSize} />
                </div>
              )}
              <ScaffoldNumberInput label="Current step" value={current} onChange={setCurrent} min={1} max={sample.length} />
              {layout === "icons-with-text" && <ScaffoldCheckbox label="Connector lines" checked={connector} onChange={setConnector} />}
            </div>
          </div>
        </>
      )}

      {/* ── Icons with text ── */}
      {isFeatureEnabled(config, "iconsWithText") && (
        <>
          <h2 className="text-balance">Icons with text</h2>
          <p className="text-balance">
            <code>Progress.IconsWithText</code>. Give a step <code>onClick</code> to make it a button, for going back to a completed step. Three step types: <code>icon</code> (a dot, with a tick once complete), <code>number</code>{" "}
            (the step number, a tick once complete) and <code>featured-icon</code> (your own icon in a <code>FeaturedIcon</code>).
            Horizontal centres each step over a connector; vertical stacks them with the text on the right.
          </p>
          {types.map((t) => (
            <Section key={t.key} label={`${t.label} - horizontal / vertical`}>
              <Progress.IconsWithText items={steps} type={t.key as StepType} orientation="horizontal" size="sm" />
              <div className="max-w-sm">
                <Progress.IconsWithText items={steps} type={t.key as StepType} orientation="vertical" size="sm" />
              </div>
            </Section>
          ))}
          {sizes.length > 0 && (
            <Section label={`Sizes - ${sizes.map((s) => s.label).join(" / ")}`}>
              {sizes.map((s) => (
                <Progress.IconsWithText key={s.key} items={steps} type="icon" orientation="horizontal" size={s.key as Size} />
              ))}
            </Section>
          )}
        </>
      )}

      {/* ── Minimal icons ── */}
      {isFeatureEnabled(config, "minimalIcons") && (
        <>
          <h2 className="text-balance">Minimal icons</h2>
          <p className="text-balance">
            <code>Progress.MinimalIcons</code> is a row of dots with an optional &quot;Step n of m&quot; label; <code>MinimalIconsConnected</code>{" "}
            joins them with a line. No titles, for tight spaces.
          </p>
          <Section label="MinimalIcons (text) / MinimalIcons / MinimalIconsConnected">
            <Progress.MinimalIcons items={plainSteps} text />
            <Progress.MinimalIcons items={plainSteps} />
            <Progress.MinimalIconsConnected items={plainSteps} />
          </Section>
        </>
      )}

      {/* ── Text with line ── */}
      {isFeatureEnabled(config, "textWithLine") && (
        <>
          <h2 className="text-balance">Text with line</h2>
          <p className="text-balance">
            <code>Progress.TextWithLine</code>: a bar above each title. Filled for complete and current steps, grey for the rest.
          </p>
          <Section label="Horizontal">
            <Progress.TextWithLine items={plainSteps} />
          </Section>
        </>
      )}

      {/* ── API ── */}
      <h2 className="text-balance">API</h2>
      <h3 className="text-balance">Progress.IconsWithText</h3>
      <PropTable rows={iconsWithTextProps} />
      <h3 className="mt-8 text-balance">Progress.MinimalIcons / MinimalIconsConnected / TextWithLine</h3>
      <PropTable rows={minimalProps} />
      <h3 className="mt-8 text-balance">Step (each item)</h3>
      <PropTable rows={stepShape} />

      {/* ── Usage ── */}
      {isFeatureEnabled(config, "usage") && (
        <>
          <h2 className="text-balance">Usage</h2>
          <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
            <code className="font-mono text-[13px] text-secondary">
{`import { Progress } from "@/components/application/progress-steps/progress-steps";
import { Folder, Lock01 } from "@untitledui/icons";

const items = [
  { title: "Project details", description: "Name and dates.", status: "complete", icon: Folder },
  { title: "Privacy", description: "Embargo and restrictions.", status: "current", icon: Lock01 },
];

<Progress.IconsWithText items={items} type="featured-icon" orientation="horizontal" />
<Progress.MinimalIcons items={items} text />
<Progress.TextWithLine items={items} />`}
            </code>
          </pre>
        </>
      )}

      {/* ── Figma ── */}
      {isFeatureEnabled(config, "figma") && (
        <>
          <h2 className="text-balance">Figma</h2>
          <p className="text-balance">
            Not linked yet. This component was pulled in via the Untitled UI CLI. Untitled UI&apos;s own design stands (including the number
            type completing in green while the icon type completes in brand) until the designer normalises it in Figma; the shipped styling is
            not yet audited against a frame.
          </p>
        </>
      )}
    </div>
  );
}
