"use client";

import { useState } from "react";
import type React from "react";
import { Plus, Upload01 } from "@untitledui/icons";
import { PageHeader } from "@/components/PageHeader";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Button } from "@/components/base/buttons/button";
import { ContextualConfigPanel } from "@/components/ContextualConfigPanel";
import { ScaffoldCheckbox } from "@/components/scaffold/controls";
import { isFeatureEnabled } from "@/config/design-system.config";
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
  { key: "actions", label: "Actions" },
  { key: "usage", label: "Usage" },
  { key: "figma", label: "Figma" },
];

const sectionHeaderProps = [
  { name: "SectionHeader.Root", notes: "A div - the bordered-bottom wrapper (border-secondary, pb-5)." },
  { name: "SectionHeader.Group", notes: "A div - flex row (md+) that holds Heading/Subheading on one side, Actions on the other." },
  { name: "SectionHeader.Heading", notes: "An h2 - the title." },
  { name: "SectionHeader.Subheading", notes: "A p - the description below the title." },
  { name: "SectionHeader.Actions", notes: "A div - a gap-3 row for trailing buttons or other content." },
];

export default function SectionHeadersPage() {
  const { config: liveConfig } = useConfig();
  const config = liveConfig["section-headers"];

  const defaults = { subheading: true, actions: true };
  const [subheading, setSubheading] = useState(defaults.subheading);
  const [actions, setActions] = useState(defaults.actions);
  const isDefault = subheading === defaults.subheading && actions === defaults.actions;
  const resetPreview = () => {
    setSubheading(defaults.subheading);
    setActions(defaults.actions);
  };

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Section headers"
        description="A title/subheading/actions row with a bottom border, for the top of a page or a card - replaces the hand-rolled title+border-b pattern repeated across several /pages/* screens."
        actions={<ContextualConfigPanel slug="section-headers" title="Section headers" sections={sectionToggles} />}
      />

      {/* ── Component Playground ── */}
      {isFeatureEnabled(config, "playground") && (
        <>
          <h2 className="text-balance">Component Playground</h2>
          <p className="text-balance">Live instance.</p>
          <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
            <div
              className="relative flex min-h-[220px] items-center justify-center bg-primary_alt p-12"
              style={{
                backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <div className="w-full max-w-2xl rounded-xl bg-primary p-6 shadow-md">
                <SectionHeader.Root>
                  <SectionHeader.Group>
                    <div className="flex flex-1 flex-col gap-1">
                      <SectionHeader.Heading>Projects</SectionHeader.Heading>
                      {subheading && <SectionHeader.Subheading>Everything you&apos;re contributing to, in one place</SectionHeader.Subheading>}
                    </div>
                    {actions && (
                      <SectionHeader.Actions>
                        <Button color="secondary" iconLeading={Upload01}>Upload dataset</Button>
                        <Button color="secondary" iconLeading={Plus}>Add project</Button>
                      </SectionHeader.Actions>
                    )}
                  </SectionHeader.Group>
                </SectionHeader.Root>
              </div>
            </div>

            <div className="flex flex-col gap-5 border-t border-secondary bg-primary p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-row flex-wrap gap-x-6 gap-y-2">
                <ScaffoldCheckbox label="Subheading" checked={subheading} onChange={setSubheading} />
                <ScaffoldCheckbox label="Actions" checked={actions} onChange={setActions} />
              </div>
              <button
                type="button"
                onClick={resetPreview}
                disabled={isDefault}
                className="text-xs font-medium text-brand-secondary transition-opacity hover:text-brand-secondary_hover disabled:opacity-40"
              >
                Reset
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Actions ── */}
      {isFeatureEnabled(config, "actions") && (
        <>
          <h2 className="text-balance">With trailing info instead of buttons</h2>
          <p className="text-balance">
            <code>Actions</code> is a plain slot - it doesn&apos;t have to hold buttons. A timestamp, a badge, or
            anything else trailing the title works the same way.
          </p>
          <Section label="Trailing info">
            <SectionHeader.Root className="w-full">
              <SectionHeader.Group>
                <div className="flex flex-1 flex-col gap-1">
                  <SectionHeader.Heading>Flora and Fauna Dashboard</SectionHeader.Heading>
                </div>
                <SectionHeader.Actions>
                  <span className="text-sm text-tertiary">Last synced 2 hours ago</span>
                </SectionHeader.Actions>
              </SectionHeader.Group>
            </SectionHeader.Root>
          </Section>
        </>
      )}

      {/* ── API ── */}
      <h2 className="text-balance">API</h2>
      <p className="text-balance">A compound component - each part is a plain HTML element with a fixed className, so any native prop (id, onClick, etc.) passes through.</p>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Part</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {sectionHeaderProps.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td style={{ fontSize: "13px" }}>{p.notes}</td>
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
{`import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Button } from "@/components/base/buttons/button";

<SectionHeader.Root>
  <SectionHeader.Group>
    <div className="flex flex-1 flex-col gap-1">
      <SectionHeader.Heading>Projects</SectionHeader.Heading>
      <SectionHeader.Subheading>Everything you're contributing to, in one place</SectionHeader.Subheading>
    </div>
    <SectionHeader.Actions>
      <Button color="secondary">Upload dataset</Button>
      <Button color="secondary">Add project</Button>
    </SectionHeader.Actions>
  </SectionHeader.Group>
</SectionHeader.Root>`}
            </code>
          </pre>
        </>
      )}

      {/* ── Where it's used ── */}
      <h2 className="text-balance">Where it&apos;s used</h2>
      <p className="text-balance">
        Replaced hand-rolled title+border-b markup in <code>app/pages/_shared/project-list-content.tsx</code>,{" "}
        <code>app/pages/_shared/data-overview.tsx</code>, <code>app/pages/dashboard/option-2/data-overview.tsx</code>,
        and <code>app/pages/project-list/option-2/page.tsx</code>.
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
