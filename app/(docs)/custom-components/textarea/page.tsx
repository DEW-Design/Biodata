"use client";

import type React from "react";
import { PageHeader } from "@/components/PageHeader";
import { Textarea } from "@/components/custom/textarea/textarea";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-6 rounded-xl border border-secondary bg-secondary p-6">
    <p className="mb-1 w-full text-xs font-semibold text-quaternary uppercase tracking-widest text-balance">
      {label}
    </p>
    {children}
  </div>
);

const props = [
  { name: "label", type: "string", default: "-" },
  { name: "hint", type: "ReactNode", default: "-" },
  { name: "placeholder", type: "string", default: "-" },
  { name: "rows", type: "number", default: "4" },
  { name: "value / defaultValue", type: "string", default: "-" },
  { name: "onChange", type: "(value: string) => void", default: "-" },
  { name: "isRequired / isInvalid / isDisabled", type: "boolean", default: "-" },
  { name: "hideRequiredIndicator", type: "boolean", default: "-" },
  { name: "className / textareaClassName", type: "string", default: "-" },
];

export default function CustomTextareaPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Custom Components"
        title="Textarea"
        description="A multi-line text field, styled exactly like Input. Not yet part of the design system - documented here until a stakeholder decides where (or whether) it belongs."
      />

      <div className="mb-2 flex gap-3 rounded-xl border border-secondary bg-secondary p-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-secondary text-balance">What lives in this section</p>
          <p className="text-sm text-tertiary text-balance" style={{ lineHeight: "1.7" }}>
            Components built for a specific screen because nothing in <code>components/base/**</code> or{" "}
            <code>components/application/**</code> covers the pattern - real and working, not a{" "}
            <code>?</code> placeholder, but not yet reviewed or adopted as part of the design system either.
            Once a stakeholder picks a direction, it moves into <code>components/base</code> (with a real
            entry in the Components section) - or gets replaced if the direction changes.
          </p>
        </div>
      </div>

      <h2 className="text-balance">Live example</h2>
      <Section label="Default">
        <Textarea label="Abstract" placeholder="Please include background, aims and objectives." className="w-full max-w-md" />
      </Section>
      <Section label="Required, with hint">
        <Textarea
          label="Justification"
          placeholder="Enter a justification..."
          hint="Enter the reason for this restriction request."
          isRequired
          className="w-full max-w-md"
        />
      </Section>
      <Section label="Invalid">
        <Textarea label="Reason" placeholder="Provide justification for embargo" isRequired isInvalid className="w-full max-w-md" />
      </Section>
      <Section label="Disabled">
        <Textarea label="Reasons for restrictions" placeholder="Provide reasons why this restriction is needed..." isDisabled className="w-full max-w-md" />
      </Section>

      <h2 className="text-balance">Why this is custom, not real DEW</h2>
      <p className="text-balance">
        No file under <code>components/base/input/**</code> (or anywhere else in this repo) exports a
        multi-line field - confirmed by grep before writing this, not assumed. Built by reusing{" "}
        <code>Input</code>&apos;s own <code>TextField</code>/<code>Label</code>/<code>HintText</code>{" "}
        primitives and copying its exact wrapper tokens (<code>rounded-lg bg-primary shadow-xs ring-1
        ring-primary</code>, a 2px brand ring on focus, an error ring when invalid) so a textarea and a
        text input sitting side by side in the same form read as one consistent field language.
      </p>

      <h2 className="text-balance">API</h2>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-balance">Usage</h2>
      <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
        <code className="font-mono text-[13px] text-secondary">
{`import { Textarea } from "@/components/custom/textarea/textarea";

<Textarea label="Abstract" placeholder="Please include background, aims and objectives." isRequired />`}
        </code>
      </pre>

      <h2 className="text-balance">Where it&apos;s used</h2>
      <p className="text-balance">
        <code>app/pages/project-registration/**</code> - the 3-step Add Project wizard (Abstract, embargo
        reason, and every restriction type&apos;s justification field).
      </p>
    </div>
  );
}
