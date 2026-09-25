"use client";

import { useState } from "react";
import type React from "react";
import { PageHeader } from "@/components/PageHeader";
import { Accordion, type AccordionItemType } from "@/components/base/accordion/accordion";
import { ContextualConfigPanel } from "@/components/ContextualConfigPanel";
import { ScaffoldCheckbox, ScaffoldLabel } from "@/components/scaffold/controls";
import { isFeatureEnabled } from "@/config/design-system.config";
import { useConfig } from "@/lib/config-context";
import Link from "next/link";

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
  { key: "variants", label: "Variants" },
  { key: "singleOpen", label: "Single open" },
  { key: "usage", label: "Usage" },
  { key: "figma", label: "Figma" },
];

const accordionProps = [
  { name: "items", type: "AccordionItemType[]", default: "-" },
  { name: "defaultOpenKeys", type: "Key[]", default: "[]" },
  { name: "openKeys", type: "Set<Key>", default: "-" },
  { name: "onOpenKeysChange", type: "(keys: Set<Key>) => void", default: "-" },
  { name: "singleOpen", type: "boolean", default: "false" },
  { name: "variant", type: '"divided" | "boxed"', default: '"divided"' },
  { name: "className", type: "string", default: "-" },
];

const itemTypeProps = [
  { name: "id", type: "Key", default: "-" },
  { name: "title", type: "ReactNode", default: "-" },
  { name: "content", type: "ReactNode", default: "-" },
];

const playgroundItems: AccordionItemType[] = [
  { id: "trial", title: "Is there a free trial available?", content: <p className="text-base text-tertiary">Yes - 30 days, no card required.</p> },
  { id: "plan", title: "Can I change my plan later?", content: <p className="text-base text-tertiary">Any time, from account settings.</p> },
  { id: "cancel", title: "What is your cancellation policy?", content: <p className="text-base text-tertiary">Cancel any time - we refund the unused balance.</p> },
];

export default function AccordionPage() {
  const { config: liveConfig } = useConfig();
  const config = liveConfig.accordion;

  const defaults = { singleOpen: false };
  const [singleOpen, setSingleOpen] = useState(defaults.singleOpen);
  const isDefault = singleOpen === defaults.singleOpen;
  const resetPreview = () => setSingleOpen(defaults.singleOpen);

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Accordion"
        description="An expand/collapse title/content list, animated with a real spring (motion/react) rather than a CSS transition. Extracted from the FAQ marketing section into its own reusable component."
        actions={<ContextualConfigPanel slug="accordion" title="Accordion" sections={sectionToggles} />}
      />

      {/* ── Component Playground ── */}
      {isFeatureEnabled(config, "playground") && (
        <>
          <h2 className="text-balance">Component Playground</h2>
          <p className="text-balance">Live instance - click a title to expand it.</p>
          <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
            <div className="grid md:grid-cols-[1fr_300px]">
              <div
                className="relative flex min-h-[320px] items-center justify-center bg-primary_alt p-12"
                style={{
                  backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <div className="w-full max-w-md rounded-xl bg-primary p-6 shadow-md">
                  <Accordion items={playgroundItems} defaultOpenKeys={["trial"]} singleOpen={singleOpen} />
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

                <div className="flex flex-col gap-2.5">
                  <ScaffoldLabel>Behaviour</ScaffoldLabel>
                  <ScaffoldCheckbox label="Single open" checked={singleOpen} onChange={setSingleOpen} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Variants ── */}
      {isFeatureEnabled(config, "variants") && (
        <>
          <h2 className="text-balance">Variants</h2>
          <p className="text-balance">
            <code>divided</code> is the default - a borderless stacked list with a thin rule between items and large
            semibold titles, as used by the FAQ section. <code>boxed</code> gives each item its own bordered, rounded
            card with a smaller brand-coloured title and a divider between header and body, for dense detail panels
            such as the record-detail sidebar on Observations. Interaction and state logic are identical.
          </p>
          <Section label="divided">
            <div className="w-full max-w-md">
              <Accordion items={playgroundItems} defaultOpenKeys={["trial"]} variant="divided" />
            </div>
          </Section>
          <Section label="boxed">
            <div className="w-full max-w-md">
              <Accordion items={playgroundItems} defaultOpenKeys={["trial"]} variant="boxed" />
            </div>
          </Section>
        </>
      )}

      {/* ── Single open ── */}
      {isFeatureEnabled(config, "singleOpen") && (
        <>
          <h2 className="text-balance">Single open</h2>
          <p className="text-balance">
            By default any number of items can be open at once. Pass <code>singleOpen</code> to close the
            previously-open item whenever a new one opens - useful when items are long enough that having several
            open at once gets hard to scan.
          </p>
          <Section label="singleOpen">
            <div className="w-full max-w-md">
              <Accordion items={playgroundItems} defaultOpenKeys={["trial"]} singleOpen />
            </div>
          </Section>
        </>
      )}

      {/* ── API ── */}
      <h2 className="text-balance">API</h2>
      <h3 className="text-balance">Accordion</h3>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {accordionProps.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="mt-8 text-balance">AccordionItemType</h3>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {itemTypeProps.map((p) => (
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
{`import { Accordion } from "@/components/base/accordion/accordion";

<Accordion
  items={[
    { id: "trial", title: "Is there a free trial?", content: "Yes - 30 days." },
    { id: "plan", title: "Can I change my plan?", content: "Any time." },
  ]}
  defaultOpenKeys={["trial"]}
/>`}
            </code>
          </pre>
        </>
      )}

      {/* ── Where it's used ── */}
      <h2 className="text-balance">Where it&apos;s used</h2>
      <p className="text-balance">
        <Link href="/marketing/faq-accordion">Marketing / FAQ accordion</Link> composes this component for its
        question/answer list, rather than hand-rolling its own expand/collapse state. The <code>boxed</code> variant
        is used for the per-section cards in the record-detail sidebar on{" "}
        <Link href="/pages/observations">Observations</Link>.
      </p>

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
