"use client";

import type React from "react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { PageHeader } from "@/components/PageHeader";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";

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
  { name: "value / defaultValue", type: "DateValue | null", default: "-" },
  { name: "onChange", type: "(value: DateValue | null) => void", default: "-" },
  { name: "minValue / maxValue", type: "DateValue", default: "-" },
  { name: "isRequired / isInvalid / isDisabled", type: "boolean", default: "-" },
  { name: "hideRequiredIndicator", type: "boolean", default: "-" },
  { name: "className", type: "string", default: "-" },
];

export default function CustomDatePickerPage() {
  const todayDate = today(getLocalTimeZone());

  return (
    <div className="prose-doc">
      <PageHeader
        section="Custom Components"
        title="Date picker"
        description="A segmented DD/MM/YYYY field with a calendar button that opens a Calendar popover. Today is marked in the calendar (bold brand text and a brand ring), and a Today button under it picks it. Not yet part of the design system: documented here until a stakeholder decides where, or whether, it belongs."
      />

      <div className="mb-2 flex gap-3 rounded-xl border border-secondary bg-secondary p-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-tertiary text-balance" style={{ lineHeight: "1.7" }}>
            Components built for one screen because nothing in <code>components/base/**</code> or{" "}
            <code>components/application/**</code> covers the pattern. They work, but the design system has not
            reviewed or adopted them. Once a stakeholder picks a direction, a component moves into{" "}
            <code>components/base</code> with an entry under Components, or is replaced.
          </p>
        </div>
      </div>

      <h2 className="text-balance">Live example</h2>
      <Section label="Default">
        <InputDatePicker label="Start date" className="w-full max-w-xs" />
      </Section>
      <Section label="Required, with hint">
        <InputDatePicker label="Embargo End Date" hint="Maximum embargo period for the selected type: 2 years" isRequired className="w-full max-w-xs" />
      </Section>
      <Section label="Min / max value (only today through +90 days selectable)">
        <InputDatePicker label="Embargo End Date" minValue={todayDate} maxValue={todayDate.add({ days: 90 })} className="w-full max-w-xs" />
      </Section>
      <Section label="Invalid">
        <InputDatePicker label="End date" isRequired isInvalid className="w-full max-w-xs" />
      </Section>
      <Section label="Disabled">
        <InputDatePicker label="Start date" isDisabled className="w-full max-w-xs" />
      </Section>

      <h2 className="text-balance">Why this is custom</h2>
      <p className="text-balance">
        <code>components/base/input/input-date.tsx</code> is the segmented DD/MM/YYYY <code>DateField</code>
        documented at <code>/components/input</code>: typed entry only, no calendar. That matches its Figma reference,
        so it was left alone. This control is additive, for places that need a clickable calendar. It uses
        react-aria-components&apos; <code>DatePicker</code> composition (a <code>DateField</code>, a trigger{" "}
        <code>Button</code> and a <code>Calendar</code> popover) and the DEW <code>Popover</code>{" "}
        (<code>components/base/select/popover.tsx</code>). The segmented field uses the same tokens as{" "}
        <code>input-date.tsx</code>, so the two read as one field language side by side.
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
{`import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";

<InputDatePicker label="Start date" isRequired />`}
        </code>
      </pre>

      <h2 className="text-balance">Where it&apos;s used</h2>
      <p className="text-balance">
        The product&apos;s date field (CONTRACTS 2.11). Add Project&apos;s Start date, End date and Embargo end date
        use it, among others.
      </p>
    </div>
  );
}
