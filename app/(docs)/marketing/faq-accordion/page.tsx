"use client";

import { PageHeader } from "@/components/PageHeader";
import { FAQAccordion01 } from "@/components/marketing/faq/faq-accordion-01";

export default function FAQAccordionPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Marketing"
        title="FAQ accordion"
        description="A full marketing page section, not an atomic control - an animated question/answer accordion (motion/react) plus a 'still have questions?' avatar CTA. Composed entirely from real DEW components."
      />

      {/* ── What "Marketing" means ── */}
      <div className="mb-2 flex gap-3 rounded-xl border border-secondary bg-secondary p-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-secondary text-balance">What lives in this section</p>
          <p className="text-sm text-tertiary text-balance" style={{ lineHeight: "1.7" }}>
            Pre-built landing-page sections - hero, FAQ, pricing, and similar - as opposed to{" "}
            <code>components/base/**</code>/<code>components/application/**</code>&apos;s atomic controls. A
            marketing section takes no configuration props (its copy and layout are fixed), so unlike a
            component page there&apos;s no live Playground here - just the real section, rendered, plus how
            it&apos;s composed.
          </p>
        </div>
      </div>

      {/* ── Live example ── */}
      <h2 className="text-balance">Live example</h2>
      <p className="text-balance">
        Click a question to expand it - the height/opacity transition is a real spring animation
        (<code>motion/react</code>), not a CSS transition.
      </p>
      <div className="overflow-hidden rounded-xl border border-secondary">
        <FAQAccordion01 />
      </div>

      {/* ── Composition ── */}
      <h2 className="text-balance">Composition</h2>
      <p className="text-balance">Every real control inside this section is a real DEW component, not a lookalike:</p>
      <ul className="w-full list-disc pl-5 text-sm text-secondary" style={{ lineHeight: "1.9" }}>
        <li>
          <a href="/components/accordion">Accordion</a> (<code>components/base/accordion/accordion.tsx</code>) - the
          question/answer list itself. Extracted out of this section into its own component rather than
          hand-rolling expand/collapse state locally - this section just maps its FAQ data into{" "}
          <code>AccordionItemType[]</code> and renders <code>{"<Accordion items={...} />"}</code>.
        </li>
        <li>
          <code>Avatar</code> (<code>components/base/avatar/avatar.tsx</code>) - the three support-contact photos in
          the &quot;Still have questions?&quot; card.
        </li>
        <li>
          <code>Avatar</code>&apos;s own <code>count</code> prop, which wires in{" "}
          <code>AvatarCount</code> (<code>components/base/avatar/base-components/avatar-count.tsx</code>) - the
          small red corner badge on the last avatar. It&apos;s a notification-style badge, not a &quot;+N&quot;
          overflow indicator, so it reads as &quot;3 new replies&quot; rather than a headcount - the honest use
          for what that component actually renders.
        </li>
        <li>
          <code>Button</code> (<code>components/base/buttons/button.tsx</code>) - the &quot;Get in touch&quot; CTA.
        </li>
      </ul>
      <p className="text-balance">
        Only the FAQ copy, the heading/intro, and the &quot;Still have questions?&quot; CTA card are local to this
        section - everything interactive is a real, independently-documented component.
      </p>

      {/* ── Usage ── */}
      <h2 className="text-balance">Usage</h2>
      <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
        <code className="font-mono text-[13px] text-secondary">
{`import { FAQAccordion01 } from "@/components/marketing/faq/faq-accordion-01";

<FAQAccordion01 />`}
        </code>
      </pre>
      <p className="text-balance">No props - questions/answers and the CTA copy are fixed content in the component itself.</p>

      {/* ── Figma ── */}
      <h2 className="text-balance">Figma</h2>
      <p className="text-balance">No linked Figma file yet - this component was pulled in via the Untitled UI CLI, not designed in Figma first.</p>
    </div>
  );
}
