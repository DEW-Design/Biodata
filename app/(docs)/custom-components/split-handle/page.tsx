"use client";

import type React from "react";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SplitHandle } from "@/components/custom/split-handle/split-handle";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-6 rounded-xl border border-secondary bg-secondary p-6">
    <p className="mb-1 w-full text-xs font-semibold text-quaternary uppercase tracking-widest text-balance">{label}</p>
    {children}
  </div>
);

const props = [
  { name: "orientation", type: '"vertical" | "horizontal"', default: "-" },
  { name: "label", type: "string", default: "-" },
  { name: "value", type: "number", default: "-" },
  { name: "onMove", type: "(pointer: { x: number; y: number }) => void", default: "-" },
  { name: "onStep", type: "(direction: -1 | 1) => void", default: "-" },
  { name: "onReset", type: "() => void", default: "-" },
  { name: "className", type: "string", default: "-" },
];

const pane = "flex min-h-0 min-w-0 items-center justify-center rounded-xl border border-secondary bg-primary text-sm text-tertiary";

function SideBySide() {
  const ref = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(40);
  const clamp = (p: number) => Math.min(Math.max(p, 20), 80);
  return (
    <div ref={ref} className="flex h-48 w-full">
      <div className={pane} style={{ width: `${pct}%` }}>
        List
      </div>
      <SplitHandle
        orientation="vertical"
        label="Resize the list and the details"
        value={pct}
        onMove={({ x }) => {
          const box = ref.current?.getBoundingClientRect();
          if (box) setPct(clamp(((x - box.left - 8) / box.width) * 100));
        }}
        onStep={(step) => setPct((p) => clamp(p + step * 2))}
        onReset={() => setPct(40)}
      />
      <div className={`${pane} flex-1`}>Details</div>
    </div>
  );
}

function Stacked() {
  const ref = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(50);
  const clamp = (p: number) => Math.min(Math.max(p, 20), 80);
  return (
    <div ref={ref} className="flex h-72 w-full flex-col">
      <div className={pane} style={{ height: `${pct}%` }}>
        Map
      </div>
      <SplitHandle
        orientation="horizontal"
        label="Resize the map and the table"
        value={pct}
        onMove={({ y }) => {
          const box = ref.current?.getBoundingClientRect();
          if (box) setPct(clamp(((y - box.top - 8) / box.height) * 100));
        }}
        onStep={(step) => setPct((p) => clamp(p + step * 4))}
        onReset={() => setPct(50)}
        className="w-full"
      />
      <div className={`${pane} flex-1`}>Table</div>
    </div>
  );
}

export default function SplitHandlePage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Custom Components"
        title="Split handle"
        description="The handle between two panes: drag it, or focus it and use the arrow keys, to give one pane more room; a double click puts the split back. Not yet part of the design system."
      />

      <h2 className="text-balance">Live example</h2>
      <Section label="Vertical: panes side by side (the project page's records and details)">
        <SideBySide />
      </Section>
      <Section label="Horizontal: panes stacked (Explore's map and table)">
        <Stacked />
      </Section>

      <h2 className="text-balance">Behaviour</h2>
      <p className="text-balance">
        The handle owns the gesture and the screen owns the sizes, so each screen keeps its own limits and unit (a percentage, a width in
        pixels). A vertical handle moves with Left and Right, a horizontal one with Up and Down. It is a <code>separator</code> with its
        orientation, a label and its value, focusable, with the focus ring.
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
{`import { SplitHandle } from "@/components/custom/split-handle/split-handle";

<SplitHandle
  orientation="horizontal"
  label="Resize the map and the table"
  value={mapPct}
  onMove={({ y }) => setMapPct(pctFrom(y))}
  onStep={(step) => setMapPct((p) => clamp(p + step * 4))}
  onReset={() => setMapPct(50)}
/>`}
        </code>
      </pre>

      <h2 className="text-balance">Figma</h2>
      <p className="text-balance">Not linked yet.</p>

      <h2 className="text-balance">Where it&apos;s used</h2>
      <p className="text-balance">
        The project page&apos;s Survey records (the tree or table beside the details panel), and Explore option 2&apos;s Map and table.
      </p>
    </div>
  );
}
