"use client";

import { useState } from "react";
import type React from "react";
import { Copy01, Download01, Edit05, Trash01 } from "@untitledui/icons";
import { PageHeader } from "@/components/PageHeader";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ContextualConfigPanel } from "@/components/ContextualConfigPanel";
import { ScaffoldCheckbox, ScaffoldLabel, ScaffoldTextInput, SegmentedControl } from "@/components/scaffold/controls";
import { enabledVariants, isFeatureEnabled } from "@/config/design-system.config";
import { useConfig } from "@/lib/config-context";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-start gap-6 rounded-xl border border-secondary bg-secondary p-6">
    <p className="mb-1 w-full text-xs font-semibold text-quaternary uppercase tracking-widest text-balance">
      {label}
    </p>
    {children}
  </div>
);

const sectionToggles = [
  { key: "playground", label: "Component Playground" },
  { key: "withTooltip", label: "With tooltip" },
  { key: "asLink", label: "As link" },
  { key: "disabled", label: "Disabled" },
  { key: "usage", label: "Usage" },
  { key: "figma", label: "Figma" },
];

const icons = { edit: Edit05, copy: Copy01, download: Download01, delete: Trash01 };
type IconKey = keyof typeof icons;

// Pulled directly from CommonProps / ButtonProps / LinkProps in components/base/buttons/button-utility.tsx
// (plus the react-aria-components Button and Link props they extend)
const apiProps = [
  { name: "icon",             type: "FC<{ className?: string }> | ReactNode", default: "-" },
  { name: "tooltip",          type: "string",                                 default: "- (also the aria-label)" },
  { name: "tooltipPlacement", type: "Placement",                              default: '"top"' },
  { name: "color",            type: '"secondary" | "tertiary"',               default: '"secondary"' },
  { name: "size",             type: '"xs" | "sm"',                            default: '"sm"' },
  { name: "isDisabled",       type: "boolean",                                default: "false" },
  { name: "href",             type: "string | undefined",                     default: "- (renders a link when set)" },
  { name: "onPress",          type: "(e: PressEvent) => void",                default: "-" },
  { name: "className",        type: "string",                                 default: "-" },
];

export default function ButtonUtilityPage() {
  const { config: liveConfig } = useConfig();
  const config = liveConfig["button-utility"];
  const colors = enabledVariants(config.colors);
  const sizes = enabledVariants(config.sizes);

  const defaults = {
    icon: "edit" as IconKey,
    color: "secondary" as "secondary" | "tertiary",
    size: "sm" as "xs" | "sm",
    tooltip: "Edit",
    disabled: false,
  };

  const [previewIcon, setPreviewIcon] = useState(defaults.icon);
  const [previewColor, setPreviewColor] = useState(defaults.color);
  const [previewSize, setPreviewSize] = useState(defaults.size);
  const [previewTooltip, setPreviewTooltip] = useState(defaults.tooltip);
  const [previewDisabled, setPreviewDisabled] = useState(defaults.disabled);

  const isDefault =
    previewIcon === defaults.icon &&
    previewColor === defaults.color &&
    previewSize === defaults.size &&
    previewTooltip === defaults.tooltip &&
    previewDisabled === defaults.disabled;

  const resetPreview = () => {
    setPreviewIcon(defaults.icon);
    setPreviewColor(defaults.color);
    setPreviewSize(defaults.size);
    setPreviewTooltip(defaults.tooltip);
    setPreviewDisabled(defaults.disabled);
  };

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Button utility"
        description="Icon-only button for toolbars and row actions. Two colours, two sizes, an optional tooltip that doubles as the accessible name, and a link variant when given an href - driven from config/design-system.config.ts."
        actions={<ContextualConfigPanel slug="button-utility" title="Button utility" sections={sectionToggles} />}
      />

      {/* ── Component Playground ── */}
      {isFeatureEnabled(config, "playground") && (
        <>
          <h2 className="text-balance">Component Playground</h2>
          <p className="text-balance">Live instance - the controls read their options from the same config that drives the Variants section below.</p>
          <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
            <div className="grid md:grid-cols-[minmax(0,1fr)_300px]">
              <div
                className="relative flex min-h-[280px] flex-col items-center justify-center gap-3 bg-primary_alt p-12"
                style={{
                  backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <div className="rounded-xl bg-primary p-6 shadow-md">
                  <ButtonUtility
                    icon={icons[previewIcon]}
                    color={previewColor}
                    size={previewSize}
                    tooltip={previewTooltip || undefined}
                    isDisabled={previewDisabled}
                    aria-label={previewTooltip ? undefined : "Edit"}
                  />
                </div>
                <code className="text-xs text-quaternary">
                  {previewColor} · {previewSize} · {previewDisabled ? "disabled" : "enabled"}
                </code>
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
                  <ScaffoldLabel>Colour</ScaffoldLabel>
                  <SegmentedControl
                    options={colors.map((c) => ({ key: c.key as "secondary" | "tertiary", label: c.key }))}
                    value={previewColor}
                    onChange={setPreviewColor}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Size</ScaffoldLabel>
                  <SegmentedControl
                    options={sizes.map((s) => ({ key: s.key as "xs" | "sm", label: s.key }))}
                    value={previewSize}
                    onChange={setPreviewSize}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Icon</ScaffoldLabel>
                  <SegmentedControl
                    options={(Object.keys(icons) as IconKey[]).map((k) => ({ key: k, label: k }))}
                    value={previewIcon}
                    onChange={setPreviewIcon}
                  />
                </div>

                <ScaffoldTextInput label="Tooltip" value={previewTooltip} onChange={setPreviewTooltip} />

                <ScaffoldCheckbox label="Disabled" checked={previewDisabled} onChange={setPreviewDisabled} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Colours ── */}
      {colors.length > 0 && (
        <>
          <h2 className="text-balance">Colours</h2>
          <p className="text-balance"><code>secondary</code> (default) has a white fill and a ring; <code>tertiary</code> has neither until hovered.</p>
          <Section label={colors.map((c) => c.label).join(" / ")}>
            {colors.map((c) => (
              <div key={c.key} className="flex flex-col items-start gap-2">
                <ButtonUtility color={c.key as "secondary" | "tertiary"} icon={Edit05} tooltip={`${c.label} edit`} />
                <code className="text-xs">{c.key}</code>
              </div>
            ))}
          </Section>
        </>
      )}

      {/* ── Sizes ── */}
      {sizes.length > 0 && (
        <>
          <h2 className="text-balance">Sizes</h2>
          <p className="text-balance">Two sizes - <code>xs</code> (16px icon) and <code>sm</code> (20px icon, default).</p>
          <Section label={sizes.map((s) => s.label).join(" / ")}>
            {sizes.map((s) => (
              <div key={s.key} className="flex flex-col items-start gap-2">
                <ButtonUtility size={s.key as "xs" | "sm"} icon={Copy01} tooltip={`Copy (${s.key})`} />
                <code className="text-xs">{s.key}</code>
              </div>
            ))}
          </Section>
        </>
      )}

      {/* ── With tooltip ── */}
      {isFeatureEnabled(config, "withTooltip") && (
        <>
          <h2 className="text-balance">With tooltip</h2>
          <p className="text-balance">
            <code>tooltip</code> shows on hover and focus and is also the <code>aria-label</code>. An icon-only button without one needs an <code>aria-label</code> of its own.
          </p>
          <Section label="Tooltip placements">
            {(["top", "bottom", "left", "right"] as const).map((p) => (
              <div key={p} className="flex flex-col items-start gap-2">
                <ButtonUtility icon={Download01} tooltip="Download" tooltipPlacement={p} />
                <code className="text-xs">{p}</code>
              </div>
            ))}
          </Section>
        </>
      )}

      {/* ── As link ── */}
      {isFeatureEnabled(config, "asLink") && (
        <>
          <h2 className="text-balance">As link</h2>
          <p className="text-balance">Pass an <code>href</code> to render an anchor with the same look.</p>
          <Section label="Link">
            <ButtonUtility icon={Download01} tooltip="Open the components overview" href="/components" />
          </Section>
        </>
      )}

      {/* ── Disabled ── */}
      {isFeatureEnabled(config, "disabled") && (
        <>
          <h2 className="text-balance">Disabled</h2>
          <p className="text-balance">Dims the button and removes the tooltip.</p>
          <Section label="Disabled">
            {colors.map((c) => (
              <ButtonUtility key={c.key} color={c.key as "secondary" | "tertiary"} icon={Trash01} tooltip="Delete" isDisabled />
            ))}
          </Section>
        </>
      )}

      {/* ── API ── */}
      <h2 className="text-balance">API</h2>
      <p className="text-balance">
        <code>ButtonUtility</code> renders a React Aria <code>Button</code>, or a <code>Link</code> when <code>href</code> is set, so the props of either apply.
      </p>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {apiProps.map((p) => (
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
{`import { Edit05 } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

<ButtonUtility icon={Edit05} tooltip="Edit" color="tertiary" size="xs" onPress={onEdit} />`}
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
