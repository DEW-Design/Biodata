"use client";

import { useState } from "react";
import type React from "react";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar, ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { ProgressBarCircle, ProgressBarHalfCircle } from "@/components/base/progress-indicators/progress-circles";
import { ContextualConfigPanel } from "@/components/ContextualConfigPanel";
import { ScaffoldLabel, ScaffoldNumberInput, SegmentedControl } from "@/components/scaffold/controls";
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
  { key: "linear", label: "Linear" },
  { key: "circle", label: "Circle" },
  { key: "halfCircle", label: "Half circle" },
  { key: "usage", label: "Usage" },
  { key: "figma", label: "Figma" },
];

const labelPositions = ["none", "right", "bottom", "top-floating", "bottom-floating"] as const;
type LabelPosition = (typeof labelPositions)[number];
type ProgressType = "linear" | "circle" | "half-circle";
type CircleSize = "xxs" | "xs" | "sm" | "md" | "lg";

const linearProps = [
  { name: "value", type: "number", default: "-" },
  { name: "min", type: "number", default: "0" },
  { name: "max", type: "number", default: "100" },
  { name: "className", type: "string", default: "-" },
  { name: "progressClassName", type: "string", default: "-" },
  { name: "valueFormatter", type: "(value, percentage) => string | number", default: "-" },
];

const progressBarOnlyProps = [
  { name: "labelPosition", type: '"right" | "bottom" | "top-floating" | "bottom-floating"', default: "-" },
];

const circleProps = [
  { name: "value", type: "number", default: "-" },
  { name: "min", type: "number", default: "0" },
  { name: "max", type: "number", default: "100" },
  { name: "size", type: '"xxs" | "xs" | "sm" | "md" | "lg"', default: "-" },
  { name: "label", type: "string", default: "-" },
  { name: "valueFormatter", type: "(value, percentage) => string | number", default: "-" },
];

export default function ProgressPage() {
  const { config: liveConfig } = useConfig();
  const config = liveConfig.progress;
  const sizes = enabledVariants(config.sizes);

  const defaults = {
    value: 60,
    type: "linear" as ProgressType,
    labelPosition: "right" as LabelPosition,
    size: "md" as CircleSize,
  };

  const [value, setValue] = useState(defaults.value);
  const [type, setType] = useState(defaults.type);
  const [labelPosition, setLabelPosition] = useState<LabelPosition>(defaults.labelPosition);
  const [size, setSize] = useState<CircleSize>(defaults.size);

  const isDefault =
    value === defaults.value && type === defaults.type && labelPosition === defaults.labelPosition && size === defaults.size;

  const resetPreview = () => {
    setValue(defaults.value);
    setType(defaults.type);
    setLabelPosition(defaults.labelPosition);
    setSize(defaults.size);
  };

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Progress"
        description="Linear progress bars (4 label layouts) and circular/half-circle indicators (5 sizes) - components/base/progress-indicators/progress-indicators.tsx and progress-circles.tsx."
        actions={<ContextualConfigPanel slug="progress" title="Progress" sections={sectionToggles} />}
      />

      {/* ── Component Playground ── */}
      {isFeatureEnabled(config, "playground") && (
        <>
          <h2 className="text-balance">Component Playground</h2>
          <p className="text-balance">Live instance.</p>
          <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
            <div
              className="relative flex min-h-[280px] w-full items-center justify-center bg-primary_alt p-12"
              style={{
                backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <div className="w-full max-w-md rounded-xl bg-primary p-8 shadow-md">
                {type === "linear" ? (
                  labelPosition === "none" ? (
                    <ProgressBarBase value={value} />
                  ) : (
                    <ProgressBar value={value} labelPosition={labelPosition} />
                  )
                ) : type === "circle" ? (
                  <div className="flex justify-center">
                    <ProgressBarCircle value={value} size={size} label="Complete" />
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <ProgressBarHalfCircle value={value} size={size} label="Complete" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-5 border-t border-secondary bg-primary p-6">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold text-quaternary uppercase tracking-widest text-balance">Controls</p>
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
                <ScaffoldLabel>Type</ScaffoldLabel>
                <SegmentedControl
                  options={[
                    { key: "linear" as const, label: "Linear" },
                    { key: "circle" as const, label: "Circle" },
                    { key: "half-circle" as const, label: "Half circle" },
                  ]}
                  value={type}
                  onChange={setType}
                />
              </div>

              <ScaffoldNumberInput label="Value" value={value} onChange={setValue} min={0} max={100} />

              {type === "linear" ? (
                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Label position</ScaffoldLabel>
                  <SegmentedControl
                    options={labelPositions.map((p) => ({ key: p, label: p }))}
                    value={labelPosition}
                    onChange={setLabelPosition}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Size</ScaffoldLabel>
                  <SegmentedControl options={sizes.map((s) => ({ key: s.key as CircleSize, label: s.key }))} value={size} onChange={setSize} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Linear ── */}
      {isFeatureEnabled(config, "linear") && (
        <>
          <h2 className="text-balance">Linear</h2>
          <p className="text-balance">
            <code>ProgressBarBase</code> is the bare track - no label. <code>ProgressBar</code> wraps it with a{" "}
            <code>labelPosition</code>: inline to the right, below the bar, or a floating tooltip above/below the
            fill.
          </p>
          <Section label="ProgressBarBase (no label)">
            <div className="w-full max-w-md">
              <ProgressBarBase value={45} />
            </div>
          </Section>
          <Section label="right / bottom">
            <div className="flex w-full max-w-md flex-col gap-6">
              <ProgressBar value={40} labelPosition="right" />
              <ProgressBar value={65} labelPosition="bottom" />
            </div>
          </Section>
          <Section label="top-floating / bottom-floating">
            <div className="flex w-full max-w-md flex-col gap-10 py-4">
              <ProgressBar value={30} labelPosition="top-floating" />
              <ProgressBar value={80} labelPosition="bottom-floating" />
            </div>
          </Section>
        </>
      )}

      {/* ── Circle ── */}
      {isFeatureEnabled(config, "circle") && sizes.length > 0 && (
        <>
          <h2 className="text-balance">Circle</h2>
          <p className="text-balance">
            5 sizes - <code>xxs</code> through <code>lg</code>. A <code>label</code> (e.g. &quot;Complete&quot;)
            renders above the percentage once the circle is big enough to hold both (everything but{" "}
            <code>xxs</code>).
          </p>
          <Section label={sizes.map((s) => s.label).join(" / ")}>
            {sizes.map((s) => (
              <ProgressBarCircle key={s.key} value={68} size={s.key as CircleSize} />
            ))}
          </Section>
        </>
      )}

      {/* ── Half circle ── */}
      {isFeatureEnabled(config, "halfCircle") && sizes.length > 0 && (
        <>
          <h2 className="text-balance">Half circle</h2>
          <p className="text-balance">Same API and sizes as <code>ProgressBarCircle</code>, a gauge shape instead of a full ring.</p>
          <Section label={sizes.map((s) => s.label).join(" / ")}>
            {sizes.map((s) => (
              <ProgressBarHalfCircle key={s.key} value={68} size={s.key as CircleSize} />
            ))}
          </Section>
        </>
      )}

      {/* ── API ── */}
      <h2 className="text-balance">API</h2>
      <h3 className="text-balance">ProgressBarBase / ProgressBar</h3>
      <p className="text-balance"><code>ProgressBar</code> extends <code>ProgressBarBase</code>&apos;s props with <code>labelPosition</code>.</p>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {[...linearProps, ...progressBarOnlyProps].map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="mt-8 text-balance">ProgressBarCircle / ProgressBarHalfCircle</h3>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {circleProps.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Usage ── */}
      {isFeatureEnabled(config, "usage") && (
        <>
          <h2 className="text-balance">Usage</h2>
          <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
            <code className="font-mono text-[13px] text-secondary">
{`import { ProgressBar, ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { ProgressBarCircle, ProgressBarHalfCircle } from "@/components/base/progress-indicators/progress-circles";

<ProgressBarBase value={45} />
<ProgressBar value={65} labelPosition="right" />

<ProgressBarCircle value={68} size="md" label="Complete" />
<ProgressBarHalfCircle value={68} size="md" />`}
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
