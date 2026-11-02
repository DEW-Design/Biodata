"use client";

import { useState } from "react";
import type React from "react";
import { getLocalTimeZone, today } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { PageHeader } from "@/components/PageHeader";
import { ContextualConfigPanel } from "@/components/ContextualConfigPanel";
import { Calendar } from "@/components/application/date-picker/calendar";
import { DatePicker } from "@/components/application/date-picker/date-picker";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { RangeCalendar } from "@/components/application/date-picker/range-calendar";
import { ScaffoldCheckbox, ScaffoldLabel, SegmentedControl } from "@/components/scaffold/controls";
import { isFeatureEnabled } from "@/config/design-system.config";
import { useConfig } from "@/lib/config-context";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-6 rounded-xl border border-secondary bg-secondary p-6">
    <p className="mb-1 w-full text-xs font-semibold tracking-widest text-quaternary uppercase text-balance">{label}</p>
    {children}
  </div>
);

const sectionToggles = [
  { key: "playground", label: "Component Playground" },
  { key: "single", label: "Single date" },
  { key: "range", label: "Date range" },
  { key: "calendars", label: "Calendars on their own" },
  { key: "states", label: "States" },
  { key: "usage", label: "Usage" },
  { key: "figma", label: "Figma" },
];

type Size = "sm" | "md" | "lg";
type Range = { start: DateValue; end: DateValue } | null;

// The real interfaces of components/application/date-picker/*.tsx. Each picker also takes every React Aria DatePicker or DateRangePicker prop (value,
// defaultValue, onChange, minValue, maxValue, isDateUnavailable, isDisabled, isReadOnly, name, ...); the ones that matter are named here.
const pickerProps = [
  { name: "value, defaultValue", type: "DateValue | null (a range: { start, end } | null)", default: "null" },
  { name: "onChange", type: "(value) => void", default: "-" },
  { name: "onApply", type: "() => void", default: "-" },
  { name: "onCancel", type: "() => void", default: "-" },
  { name: "size", type: '"sm" | "md" | "lg" | "xl" (the trigger button)', default: '"sm"' },
  { name: "minValue, maxValue", type: "DateValue", default: "-" },
  { name: "isDateUnavailable", type: "(date: DateValue) => boolean", default: "-" },
  { name: "isDisabled", type: "boolean", default: "false" },
  { name: "onOpenChange", type: "(isOpen: boolean) => void", default: "-" },
];
const calendarProps = [
  { part: "Calendar", name: "highlightedDates", type: "DateValue[]", default: "-" },
  { part: "Calendar", name: "children", type: "ReactNode (replaces the date field and Today button above the grid)", default: "date field + Today" },
  { part: "RangeCalendar", name: "highlightedDates", type: "DateValue[]", default: "-" },
  { part: "RangeCalendar", name: "presets", type: "Record<string, { label, value: { start, end } }>", default: "-" },
  { part: "RangeCalendar", name: "showPresetsOnDesktop", type: "boolean", default: "false" },
  { part: "RangeCalendar", name: "showOutOfRangeDates", type: "boolean", default: "false" },
  { part: "RangeCalendar", name: "visibleDuration", type: "{ months: number }", default: "2 from md up, otherwise 1" },
  { part: "CalendarCell", name: "isHighlighted, showOutOfRangeDates", type: "boolean", default: "false" },
  { part: "RangePresetButton", name: "value", type: "{ start: DateValue; end: DateValue }", default: "required" },
];

/** What the demos print under a picker: the date the picker holds, and what happened last, so Apply and Cancel can be told apart. */
function Readout({ text, event }: { text: string; event: string }) {
  return (
    <p className="text-xs text-tertiary text-balance">
      {text}. Last: {event}.
    </p>
  );
}

function SingleDemo({ size = "sm", isDisabled = false, minToday = false }: { size?: Size; isDisabled?: boolean; minToday?: boolean }) {
  const [value, setValue] = useState<DateValue | null>(null);
  const [event, setEvent] = useState("nothing yet");
  return (
    <div className="flex flex-col items-start gap-3">
      <DatePicker
        value={value}
        onChange={setValue}
        onApply={() => setEvent("applied")}
        onCancel={() => setEvent("cancelled")}
        size={size}
        isDisabled={isDisabled}
        minValue={minToday ? today(getLocalTimeZone()) : undefined}
      />
      <Readout text={value ? `Date: ${value.toString()}` : "No date chosen"} event={event} />
    </div>
  );
}

function RangeDemo({ size = "sm", isDisabled = false, minToday = false }: { size?: Size; isDisabled?: boolean; minToday?: boolean }) {
  const [value, setValue] = useState<Range>(null);
  const [event, setEvent] = useState("nothing yet");
  return (
    <div className="flex flex-col items-start gap-3">
      <DateRangePicker
        value={value}
        onChange={setValue}
        onApply={() => setEvent("applied")}
        onCancel={() => setEvent("cancelled")}
        size={size}
        isDisabled={isDisabled}
        minValue={minToday ? today(getLocalTimeZone()) : undefined}
      />
      <Readout text={value ? `Range: ${value.start.toString()} to ${value.end.toString()}` : "No range chosen"} event={event} />
    </div>
  );
}

export default function DatePickerPage() {
  const { config: liveConfig } = useConfig();
  const config = liveConfig["date-picker"];

  const defaults = { mode: "single" as "single" | "range", size: "sm" as Size, isDisabled: false, minToday: false };
  const [mode, setMode] = useState(defaults.mode);
  const [size, setSize] = useState(defaults.size);
  const [isDisabled, setIsDisabled] = useState(defaults.isDisabled);
  const [minToday, setMinToday] = useState(defaults.minToday);

  const isDefault = mode === defaults.mode && size === defaults.size && isDisabled === defaults.isDisabled && minToday === defaults.minToday;
  const resetPreview = () => {
    setMode(defaults.mode);
    setSize(defaults.size);
    setIsDisabled(defaults.isDisabled);
    setMinToday(defaults.minToday);
  };

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Date picker"
        description="A date, or a range of dates, chosen from a calendar that opens under a button. The button reads the date; the calendar holds the pick as a draft until Apply, so Cancel, Escape and a press outside keep the date as it was. A range adds presets, Today to All time. Built on React Aria."
        actions={<ContextualConfigPanel slug="date-picker" title="Date picker" sections={sectionToggles} />}
      />

      {isFeatureEnabled(config, "playground") && (
        <>
          <h2 className="text-balance">Component Playground</h2>
          <p className="text-balance">Live instance. Choose a date, then press Apply, Cancel or Escape and read what the line under it says.</p>
          <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
            <div className="grid md:grid-cols-[1fr_300px]">
              <div
                className="relative flex min-h-[320px] flex-col items-center justify-center bg-primary_alt p-12"
                style={{ backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
              >
                <div className="rounded-xl bg-primary p-6 shadow-md">
                  {mode === "single" ? (
                    <SingleDemo key={`single-${size}-${isDisabled}-${minToday}`} size={size} isDisabled={isDisabled} minToday={minToday} />
                  ) : (
                    <RangeDemo key={`range-${size}-${isDisabled}-${minToday}`} size={size} isDisabled={isDisabled} minToday={minToday} />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-5 border-l border-secondary bg-primary p-6">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold tracking-widest text-quaternary uppercase text-balance">Controls</p>
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
                  <ScaffoldLabel>Picker</ScaffoldLabel>
                  <SegmentedControl
                    options={[
                      { key: "single", label: "Single date" },
                      { key: "range", label: "Date range" },
                    ]}
                    value={mode}
                    onChange={setMode}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Size</ScaffoldLabel>
                  <SegmentedControl
                    options={[
                      { key: "sm", label: "SM" },
                      { key: "md", label: "MD" },
                      { key: "lg", label: "LG" },
                    ]}
                    value={size}
                    onChange={setSize}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <ScaffoldCheckbox label="Earliest date is today" checked={minToday} onChange={setMinToday} />
                  <ScaffoldCheckbox label="Disabled" checked={isDisabled} onChange={setIsDisabled} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isFeatureEnabled(config, "single") && (
        <>
          <h2 className="text-balance">Single date</h2>
          <p className="text-balance">
            <code>DatePicker</code> is a button that reads the date (&quot;Select date&quot; until there is one). The calendar below it has a date field to type into and a Today button. The date is
            the one the picker held when it opened until <strong>Apply</strong>; <code>onChange</code> fires then, once. <strong>Cancel</strong>, <strong>Escape</strong> and a press outside close it and call <code>onCancel</code>.
          </p>
          <Section label="DatePicker">
            <SingleDemo />
          </Section>
        </>
      )}

      {isFeatureEnabled(config, "range") && (
        <>
          <h2 className="text-balance">Date range</h2>
          <p className="text-balance">
            <code>DateRangePicker</code> shows two months from <code>md</code> up and one below it, with two date fields under the calendar. From <code>lg</code> up the presets (Today, Yesterday,
            This week, Last week, This month, Last month, This year, Last year, All time) are a column beside it; below <code>lg</code>, Last week, Last month and Last year sit above the grid. A preset fills the draft; Apply keeps it.
          </p>
          <Section label="DateRangePicker">
            <RangeDemo />
          </Section>
        </>
      )}

      {isFeatureEnabled(config, "calendars") && (
        <>
          <h2 className="text-balance">Calendars on their own</h2>
          <p className="text-balance">
            <code>Calendar</code> and <code>RangeCalendar</code> are what the pickers open. They also stand alone, inline on a page, with their own state. The month heading is the same size inside this doc page as in a product screen.
          </p>
          <Section label="Calendar and RangeCalendar">
            <div className="rounded-2xl border border-secondary bg-primary px-6 py-5">
              <Calendar aria-label="Calendar" highlightedDates={[today(getLocalTimeZone())]} />
            </div>
            <div className="max-w-full overflow-x-auto rounded-2xl border border-secondary bg-primary">
              <RangeCalendar aria-label="Range calendar" visibleDuration={{ months: 1 }} />
            </div>
          </Section>
        </>
      )}

      {isFeatureEnabled(config, "states") && (
        <>
          <h2 className="text-balance">States</h2>
          <p className="text-balance">
            A date before <code>minValue</code>, or one <code>isDateUnavailable</code> names, is dimmed and cannot be chosen. A disabled picker is the disabled button.
          </p>
          <Section label="minValue is today, and disabled">
            <SingleDemo minToday />
            <SingleDemo isDisabled />
          </Section>
        </>
      )}

      <h2 className="text-balance">API</h2>
      <p className="text-balance">
        <code>DatePicker</code> and <code>DateRangePicker</code> take the props below besides every React Aria <code>DatePicker</code> or <code>DateRangePicker</code> prop. A range&apos;s value and
        <code>onChange</code> carry <code>{`{ start, end }`}</code>. The values are <code>@internationalized/date</code> values (<code>CalendarDate</code> and the like), not JavaScript <code>Date</code>s.
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
          {pickerProps.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Part</th>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {calendarProps.map((p) => (
            <tr key={`${p.part}-${p.name}`}>
              <td style={{ color: "var(--ui-text-secondary)" }}>{p.part}</td>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-balance">Behaviour</h2>
      <ul className="text-balance">
        <li>
          <strong>Keyboard.</strong> Enter or Space on the button opens the calendar and focus goes into it; the arrow keys move a day or a week, Page Up and Page Down a month, Escape closes it and puts focus back on the button.
        </li>
        <li>
          <strong>The draft.</strong> Nothing is chosen until Apply: <code>onChange</code> fires once, with the date or range, and the button reads it. Cancel, Escape and a press outside close the calendar and leave the date as it was.
        </li>
        <li>
          <strong>Overlap with the custom date field (open, 1.7).</strong> <code>InputDatePicker</code> (<code>components/custom/date-picker</code>, the form field of CONTRACTS 2.11) also picks a date from a calendar.
          These pickers are button-triggered, with Apply and, for a range, presets, and nothing has been migrated to them; whether they replace the form field is the designer&apos;s decision. (The custom date range component was removed on 2 Nov 2026.)
        </li>
        <li>
          <strong>Changes from the ingested source</strong> (OVR-013 to OVR-017), listed at the top of each file: icons on Cancel, Apply and Today (3.12); a dead size class on the dash between the two date fields; the typeface on the popovers (2.2); the doc-site heading overrides on the month heading (2.7); 40px preset rows (2.16); the draft above, so Cancel does cancel (1.9); the trigger&apos;s accessible name, which React Aria sets to &quot;Calendar&quot; and which now leads with the date or range the button shows (WCAG 2.5.3); today read once when the picker mounts instead of when the file loads; and the three short range presets shown from <code>md</code> to <code>lg</code> too (as ingested there were none between them).
        </li>
      </ul>

      {isFeatureEnabled(config, "usage") && (
        <>
          <h2 className="text-balance">Usage</h2>
          <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
            <code className="font-mono text-[13px] text-secondary">
{`import { DatePicker } from "@/components/application/date-picker/date-picker";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";

const [date, setDate] = useState<DateValue | null>(null);

<DatePicker aria-label="Start date" value={date} onChange={setDate} />

const [range, setRange] = useState<{ start: DateValue; end: DateValue } | null>(null);

<DateRangePicker aria-label="Reporting period" value={range} onChange={setRange} />`}
            </code>
          </pre>
        </>
      )}

      {isFeatureEnabled(config, "figma") && (
        <>
          <h2 className="text-balance">Figma</h2>
          <p className="text-balance">No linked Figma file yet. This component came from the Untitled UI CLI, not from a Figma design.</p>
        </>
      )}
    </div>
  );
}
