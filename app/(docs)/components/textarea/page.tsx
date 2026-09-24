"use client";

import { useState } from "react";
import type React from "react";
import { PageHeader } from "@/components/PageHeader";
import { TextArea } from "@/components/base/textarea/textarea";
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
  { key: "withHint", label: "With hint text" },
  { key: "tooltip", label: "With tooltip" },
  { key: "disabled", label: "Disabled" },
  { key: "invalid", label: "Invalid" },
  { key: "usage", label: "Usage" },
  { key: "figma", label: "Figma" },
];

// Pulled directly from TextFieldProps/TextAreaBaseProps in components/base/textarea/textarea.tsx
// (plus the react-aria-components AriaTextFieldProps it extends)
const fieldProps = [
  { name: "label",                type: "string",                default: "-" },
  { name: "hint",                 type: "ReactNode",             default: "-" },
  { name: "tooltip",              type: "string",                default: "-" },
  { name: "size",                 type: '"sm" | "md"',           default: '"md"' },
  { name: "placeholder",          type: "string",                default: "-" },
  { name: "rows",                 type: "number",                default: "-" },
  { name: "cols",                 type: "number",                default: "-" },
  { name: "value",                type: "string",                default: "-" },
  { name: "defaultValue",         type: "string",                default: "-" },
  { name: "onChange",             type: "(value: string) => void", default: "-" },
  { name: "isDisabled",           type: "boolean",               default: "false" },
  { name: "isRequired",           type: "boolean",               default: "false" },
  { name: "isInvalid",            type: "boolean",               default: "false" },
  { name: "hideRequiredIndicator", type: "boolean",              default: "false" },
  { name: "textAreaClassName",    type: "string",                default: "-" },
  { name: "className",            type: "string",                default: "-" },
];

export default function TextareaPage() {
  const { config: liveConfig } = useConfig();
  const config = liveConfig.textarea;
  const sizes = enabledVariants(config.sizes);

  const defaults = {
    size: "md" as "sm" | "md",
    disabled: false,
    invalid: false,
    hint: "Explain how you plan to use this data.",
    value: "",
  };

  const [previewSize, setPreviewSize] = useState(defaults.size);
  const [previewDisabled, setPreviewDisabled] = useState(defaults.disabled);
  const [previewInvalid, setPreviewInvalid] = useState(defaults.invalid);
  const [previewHint, setPreviewHint] = useState(defaults.hint);
  const [previewValue, setPreviewValue] = useState(defaults.value);

  const isDefault =
    previewSize === defaults.size &&
    previewDisabled === defaults.disabled &&
    previewInvalid === defaults.invalid &&
    previewHint === defaults.hint &&
    previewValue === defaults.value;

  const resetPreview = () => {
    setPreviewSize(defaults.size);
    setPreviewDisabled(defaults.disabled);
    setPreviewInvalid(defaults.invalid);
    setPreviewHint(defaults.hint);
    setPreviewValue(defaults.value);
  };

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Textarea"
        description="Multi-line text input built on React Aria's TextField/TextArea, sharing Input's own Label and HintText. Two sizes, an optional tooltip, and invalid/disabled states - driven from config/design-system.config.ts."
        actions={<ContextualConfigPanel slug="textarea" title="Textarea" sections={sectionToggles} />}
      />

      {/* ── Component Playground ── */}
      {isFeatureEnabled(config, "playground") && (
        <>
          <h2 className="text-balance">Component Playground</h2>
          <p className="text-balance">Live instance - the controls read their options from the same config that drives the Variants section below.</p>
          <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
            <div className="grid md:grid-cols-[1fr_300px]">
              <div
                className="relative flex min-h-[320px] flex-col items-center justify-center gap-3 bg-primary_alt p-12"
                style={{
                  backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <div className="w-full max-w-sm rounded-xl bg-primary p-6 shadow-md">
                  <TextArea
                    label="Purpose of data use"
                    hint={previewHint || undefined}
                    size={previewSize}
                    isDisabled={previewDisabled}
                    isInvalid={previewInvalid}
                    rows={4}
                    placeholder="Describe how this data supports your research or decision-making."
                    value={previewValue}
                    onChange={setPreviewValue}
                  />
                </div>
                <code className="text-xs text-quaternary">
                  {previewSize} · {previewInvalid ? "invalid" : "valid"} · {previewDisabled ? "disabled" : "enabled"}
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
                  <ScaffoldLabel>Size</ScaffoldLabel>
                  <SegmentedControl
                    options={sizes.map((s) => ({ key: s.key as "sm" | "md", label: s.key }))}
                    value={previewSize}
                    onChange={setPreviewSize}
                  />
                </div>

                <ScaffoldTextInput label="Hint" value={previewHint} onChange={setPreviewHint} />

                <ScaffoldCheckbox label="Disabled" checked={previewDisabled} onChange={setPreviewDisabled} />
                <ScaffoldCheckbox label="Invalid" checked={previewInvalid} onChange={setPreviewInvalid} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Sizes ── */}
      {sizes.length > 0 && (
        <>
          <h2 className="text-balance">Sizes</h2>
          <p className="text-balance">Two sizes - <code>sm</code> and <code>md</code> (default).</p>
          <Section label={sizes.map((s) => s.label).join(" / ")}>
            {sizes.map((s) => (
              <div key={s.key} className="flex w-64 flex-col items-start gap-2">
                <TextArea size={s.key as "sm" | "md"} placeholder="Type here…" rows={3} aria-label={s.label} />
                <code className="text-xs">{s.key}</code>
              </div>
            ))}
          </Section>
        </>
      )}

      {/* ── With hint text ── */}
      {isFeatureEnabled(config, "withHint") && (
        <>
          <h2 className="text-balance">With hint text</h2>
          <p className="text-balance">Pass a <code>hint</code> for supporting detail beneath the field.</p>
          <Section label="Labelled with hint">
            <div className="w-full max-w-sm">
              <TextArea
                label="Describe your intended use"
                hint="Explain how you plan to use this data."
                placeholder="E.g. monitoring biodiversity health, assessing threatened species distribution, etc"
                rows={3}
              />
            </div>
          </Section>
        </>
      )}

      {/* ── With tooltip ── */}
      {isFeatureEnabled(config, "tooltip") && (
        <>
          <h2 className="text-balance">With tooltip</h2>
          <p className="text-balance">Use the <code>tooltip</code> prop to show a help tooltip next to the label - the same <code>Label</code>/<code>Tooltip</code> pairing <code>Input</code> uses.</p>
          <Section label="Tooltip">
            <div className="w-full max-w-sm">
              <TextArea
                label="Purpose of data use"
                tooltip="Briefly describe how the data will be used and what outcomes are expected."
                placeholder="E.g. monitoring biodiversity health..."
                rows={3}
              />
            </div>
          </Section>
        </>
      )}

      {/* ── Disabled ── */}
      {isFeatureEnabled(config, "disabled") && (
        <>
          <h2 className="text-balance">Disabled</h2>
          <p className="text-balance">Dims the field and prevents interaction.</p>
          <Section label="Disabled">
            <div className="w-full max-w-sm">
              <TextArea label="Notes" defaultValue="This field can't be edited." isDisabled rows={3} />
            </div>
          </Section>
        </>
      )}

      {/* ── Invalid ── */}
      {isFeatureEnabled(config, "invalid") && (
        <>
          <h2 className="text-balance">Invalid</h2>
          <p className="text-balance">Pass <code>isInvalid</code> to switch the ring to the error token - typically paired with a validation-error <code>hint</code>.</p>
          <Section label="Invalid">
            <div className="w-full max-w-sm">
              <TextArea label="Rejection reason" hint="A reason is required." isInvalid rows={3} />
            </div>
          </Section>
        </>
      )}

      {/* ── API ── */}
      <h2 className="text-balance">API</h2>
      <p className="text-balance"><code>TextArea</code> pairs a <code>Label</code>/<code>HintText</code> (shared with <code>Input</code>) around the underlying <code>TextAreaBase</code> field.</p>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {fieldProps.map((p) => (
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
{`import { TextArea } from "@/components/base/textarea/textarea";

<TextArea
  label="Purpose of data use"
  hint="Explain how you plan to use this data."
  rows={4}
/>`}
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
