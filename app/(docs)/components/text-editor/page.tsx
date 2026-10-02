"use client";

import { useState } from "react";
import type React from "react";
import { PageHeader } from "@/components/PageHeader";
import { TextEditor } from "@/components/base/text-editor/text-editor";
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
  { key: "bubbleMenu", label: "Bubble menu" },
  { key: "characterLimit", label: "Character limit" },
  { key: "disabled", label: "Disabled" },
  { key: "invalid", label: "Invalid" },
  { key: "usage", label: "Usage" },
  { key: "figma", label: "Figma" },
];

type ToolbarType = "simple" | "advanced";

// Pulled directly from TextEditorRootProps in components/base/text-editor/text-editor.tsx
// (plus the Partial<EditorOptions> from @tiptap/react it extends, which is passed to useEditor)
const rootProps = [
  { name: "placeholder",    type: "string",                  default: '"Write something…"' },
  { name: "limit",          type: "number",                  default: "-" },
  { name: "isDisabled",     type: "boolean",                 default: "false" },
  { name: "isInvalid",      type: "boolean",                 default: "false" },
  { name: "content",        type: "string | JSONContent",    default: "-" },
  { name: "onUpdate",       type: "(props) => void",         default: "-" },
  { name: "className",      type: "string",                  default: "-" },
  { name: "inputClassName", type: "string",                  default: "-" },
  { name: "children",       type: "ReactNode",               default: "-" },
];

// TextEditorToolbarProps
const toolbarProps = [
  { name: "type",         type: '"simple" | "advanced"', default: '"simple"' },
  { name: "floating",     type: "boolean",              default: "false" },
  { name: "hideFontSize", type: "boolean",              default: "false" },
  { name: "onGenerate",   type: "() => void",           default: "- (button hidden)" },
  { name: "className",    type: "string",               default: "-" },
];

// TextEditorTooltipProps
const tooltipProps = [{ name: "className", type: "string", default: "-" }];

const parts = [
  { name: "TextEditor.Root", note: "Creates the editor and shares it with every part below. Takes the options above." },
  { name: "TextEditor.Label", note: "The shared Label. Clicking it focuses the editor." },
  { name: "TextEditor.Toolbar", note: "Simple or advanced toolbar. Compose your own from the individual controls listed below." },
  { name: "TextEditor.Tooltip", note: "A bubble menu that follows the text selection." },
  { name: "TextEditor.Content", note: "The editable area. Takes the props of Tiptap's EditorContent, without editor." },
  { name: "TextEditor.HintText", note: "The shared HintText. With a limit and no children it counts the characters left." },
];

const controls = [
  "TextEditorBold",
  "TextEditorItalic",
  "TextEditorUnderline",
  "TextEditorBulletList",
  "TextEditorAlignLeft",
  "TextEditorAlignCenter",
  "TextEditorAlignRight",
  "TextEditorAlignJustify",
  "TextEditorLink",
  "TextEditorImage",
  "TextEditorFontSize",
  "TextEditorGenerate",
];

const sampleContent = "<p>Select any of this text to bring up the bubble menu, then change how it looks.</p>";

export default function TextEditorPage() {
  const { config: liveConfig } = useConfig();
  const config = liveConfig["text-editor"];
  const types = enabledVariants(config.types);

  const defaults = {
    type: "simple" as ToolbarType,
    disabled: false,
    invalid: false,
    limit: false,
    hint: "Visible to everyone on the project.",
  };

  const [previewType, setPreviewType] = useState(defaults.type);
  const [previewDisabled, setPreviewDisabled] = useState(defaults.disabled);
  const [previewInvalid, setPreviewInvalid] = useState(defaults.invalid);
  const [previewLimit, setPreviewLimit] = useState(defaults.limit);
  const [previewHint, setPreviewHint] = useState(defaults.hint);

  const isDefault =
    previewType === defaults.type &&
    previewDisabled === defaults.disabled &&
    previewInvalid === defaults.invalid &&
    previewLimit === defaults.limit &&
    previewHint === defaults.hint;

  const resetPreview = () => {
    setPreviewType(defaults.type);
    setPreviewDisabled(defaults.disabled);
    setPreviewInvalid(defaults.invalid);
    setPreviewLimit(defaults.limit);
    setPreviewHint(defaults.hint);
  };

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Text editor"
        description="Rich text field built on Tiptap, sharing Input's own Label and HintText. A simple or advanced toolbar, a bubble menu on selection, an optional character limit, and invalid and disabled states - driven from config/design-system.config.ts."
        actions={<ContextualConfigPanel slug="text-editor" title="Text editor" sections={sectionToggles} />}
      />

      {/* ── Component Playground ── */}
      {isFeatureEnabled(config, "playground") && (
        <>
          <h2 className="text-balance">Component Playground</h2>
          <p className="text-balance">Live instance - the controls read their options from the same config that drives the Variants section below.</p>
          <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
            <div className="grid md:grid-cols-[minmax(0,1fr)_300px]">
              <div
                className="relative flex min-h-[420px] flex-col items-center justify-center gap-3 bg-primary_alt p-12"
                style={{
                  backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <div className="w-full max-w-2xl rounded-xl bg-primary p-6 shadow-md">
                  <TextEditor.Root
                    placeholder="Describe the survey method."
                    isDisabled={previewDisabled}
                    isInvalid={previewInvalid}
                    limit={previewLimit ? 280 : undefined}
                  >
                    <TextEditor.Label>Survey method</TextEditor.Label>
                    <TextEditor.Toolbar type={previewType} />
                    <TextEditor.Content />
                    <TextEditor.HintText>{previewLimit ? undefined : previewHint || undefined}</TextEditor.HintText>
                  </TextEditor.Root>
                </div>
                <code className="text-xs text-quaternary">
                  {previewType} toolbar · {previewInvalid ? "invalid" : "valid"} · {previewDisabled ? "disabled" : "enabled"}
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
                  <ScaffoldLabel>Toolbar</ScaffoldLabel>
                  <SegmentedControl
                    options={types.map((t) => ({ key: t.key as ToolbarType, label: t.key }))}
                    value={previewType}
                    onChange={setPreviewType}
                  />
                </div>

                <ScaffoldTextInput label="Hint" value={previewHint} onChange={setPreviewHint} />

                <ScaffoldCheckbox label="Character limit (280)" checked={previewLimit} onChange={setPreviewLimit} />
                <ScaffoldCheckbox label="Disabled" checked={previewDisabled} onChange={setPreviewDisabled} />
                <ScaffoldCheckbox label="Invalid" checked={previewInvalid} onChange={setPreviewInvalid} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Toolbar types ── */}
      {types.length > 0 && (
        <>
          <h2 className="text-balance">Toolbar types</h2>
          <p className="text-balance">
            <code>simple</code> carries bold, italic, underline, alignment and a bullet list. <code>advanced</code> adds the font size
            select, a link and an image.
          </p>
          <Section label={types.map((t) => t.label).join(" / ")}>
            {types.map((t) => (
              <div key={t.key} className="w-full max-w-2xl">
                <TextEditor.Root placeholder="Type here…">
                  <TextEditor.Label>{t.label} toolbar</TextEditor.Label>
                  <TextEditor.Toolbar type={t.key as ToolbarType} />
                  <TextEditor.Content />
                </TextEditor.Root>
              </div>
            ))}
          </Section>
        </>
      )}

      {/* ── Bubble menu ── */}
      {isFeatureEnabled(config, "bubbleMenu") && (
        <>
          <h2 className="text-balance">Bubble menu</h2>
          <p className="text-balance">
            Add <code>TextEditor.Tooltip</code> inside the root and a small menu follows the selection, with the formatting controls closest to hand.
          </p>
          <Section label="Select some text">
            <div className="w-full max-w-2xl">
              <TextEditor.Root content={sampleContent}>
                <TextEditor.Label>Summary</TextEditor.Label>
                <TextEditor.Tooltip />
                <TextEditor.Content />
              </TextEditor.Root>
            </div>
          </Section>
        </>
      )}

      {/* ── Character limit ── */}
      {isFeatureEnabled(config, "characterLimit") && (
        <>
          <h2 className="text-balance">Character limit</h2>
          <p className="text-balance">
            Pass <code>limit</code> and give <code>TextEditor.HintText</code> no children: it counts the characters left and turns to the error colour once the
            limit is passed. The editor does not stop the typing.
          </p>
          <Section label="Limit of 120">
            <div className="w-full max-w-2xl">
              <TextEditor.Root limit={120} placeholder="Write a short summary.">
                <TextEditor.Label>Short summary</TextEditor.Label>
                <TextEditor.Toolbar />
                <TextEditor.Content />
                <TextEditor.HintText />
              </TextEditor.Root>
            </div>
          </Section>
        </>
      )}

      {/* ── Disabled ── */}
      {isFeatureEnabled(config, "disabled") && (
        <>
          <h2 className="text-balance">Disabled</h2>
          <p className="text-balance">Dims the field, locks the content and disables every toolbar control.</p>
          <Section label="Disabled">
            <div className="w-full max-w-2xl">
              <TextEditor.Root isDisabled content="<p>This field can't be edited.</p>">
                <TextEditor.Label>Notes</TextEditor.Label>
                <TextEditor.Toolbar />
                <TextEditor.Content />
              </TextEditor.Root>
            </div>
          </Section>
        </>
      )}

      {/* ── Invalid ── */}
      {isFeatureEnabled(config, "invalid") && (
        <>
          <h2 className="text-balance">Invalid</h2>
          <p className="text-balance">
            Pass <code>isInvalid</code> to switch the ring to the error token - typically paired with a validation-error hint.
          </p>
          <Section label="Invalid">
            <div className="w-full max-w-2xl">
              <TextEditor.Root isInvalid placeholder="Describe the survey method.">
                <TextEditor.Label>Survey method</TextEditor.Label>
                <TextEditor.Toolbar />
                <TextEditor.Content />
                <TextEditor.HintText>A description is required.</TextEditor.HintText>
              </TextEditor.Root>
            </div>
          </Section>
        </>
      )}

      {/* ── API ── */}
      <h2 className="text-balance">API</h2>
      <p className="text-balance">
        <code>TextEditor</code> is a set of parts that share one editor through context. Every part must sit inside <code>TextEditor.Root</code>.
      </p>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Part</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td>{p.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="text-balance">TextEditor.Root</h3>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {rootProps.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="text-balance">TextEditor.Toolbar</h3>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {toolbarProps.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="text-balance">TextEditor.Tooltip</h3>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {tooltipProps.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="text-balance">Individual controls</h3>
      <p className="text-balance">
        Exported from <code>text-editor-extensions</code> for building a toolbar of your own:{" "}
        {controls.map((name, i) => (
          <span key={name}>
            <code>{name}</code>
            {i < controls.length - 1 ? ", " : "."}
          </span>
        ))}{" "}
        <code>TextEditorGenerate</code> takes a required <code>onPress</code>.
      </p>

      {/* ── Usage ── */}
      {isFeatureEnabled(config, "usage") && (
        <>
          <h2 className="text-balance">Usage</h2>
          <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
            <code className="font-mono text-[13px] text-secondary">
{`import { TextEditor } from "@/components/base/text-editor/text-editor";

<TextEditor.Root placeholder="Describe the survey method." limit={280}>
  <TextEditor.Label>Survey method</TextEditor.Label>
  <TextEditor.Toolbar type="simple" />
  <TextEditor.Content />
  <TextEditor.HintText />
</TextEditor.Root>`}
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
