"use client";

import { PageHeader } from "@/components/PageHeader";
import { FAQAccordion01 } from "@/components/marketing/faq/faq-accordion-01";
import Link from "next/link";

export default function FAQAccordionPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Marketing"
        title="FAQ accordion"
        description="A landing-page section: an animated question and answer accordion (motion/react) with a &quot;Still have questions?&quot; avatar call to action. Built from DEW components."
      />

      <div className="mb-2 flex gap-3 rounded-xl border border-secondary bg-secondary p-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-tertiary text-balance" style={{ lineHeight: "1.7" }}>
            Pre-built landing-page sections such as hero, FAQ and pricing, as opposed to the atomic controls in{" "}
            <code>components/base/**</code> and <code>components/application/**</code>. A marketing section takes no
            props and its copy is fixed, so there is no Playground here, only the rendered section and how it is
            composed.
          </p>
        </div>
      </div>

      <h2 className="text-balance">Live example</h2>
      <p className="text-balance">
        Click a question to expand it. The height and opacity transition is a spring
        (<code>motion/react</code>), not a CSS transition.
      </p>
      <div className="overflow-hidden rounded-xl border border-secondary">
        <FAQAccordion01 />
      </div>

      <h2 className="text-balance">Composition</h2>
      <p className="text-balance">The interactive parts are DEW components, not lookalikes:</p>
      <ul className="w-full list-disc pl-5 text-sm text-secondary" style={{ lineHeight: "1.9" }}>
        <li>
          <Link href="/components/accordion">Accordion</Link> (<code>components/base/accordion/accordion.tsx</code>): the question and
          answer list. This section maps its FAQ data into <code>AccordionItemType[]</code> and renders{" "}
          <code>{"<Accordion items={...} />"}</code>.
        </li>
        <li>
          <code>Avatar</code> (<code>components/base/avatar/avatar.tsx</code>): the three support-contact photos in
          the &quot;Still have questions?&quot; card.
        </li>
        <li>
          <code>Avatar</code>&apos;s <code>count</code> prop, which draws{" "}
          <code>AvatarCount</code> (<code>components/base/avatar/base-components/avatar-count.tsx</code>), the small red
          corner badge on the last avatar. It is a notification badge, not a &quot;+N&quot; overflow indicator, so it
          reads as &quot;3 new replies&quot;, not a headcount.
        </li>
        <li>
          <code>Button</code> (<code>components/base/buttons/button.tsx</code>): the &quot;Get in touch&quot; button.
        </li>
      </ul>
      <p className="text-balance">
        Only the FAQ copy, the heading and intro, and the &quot;Still have questions?&quot; card are local to this
        section. Everything interactive is documented on its own page.
      </p>

      <h2 className="text-balance">Usage</h2>
      <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
        <code className="font-mono text-[13px] text-secondary">
{`import { FAQAccordion01 } from "@/components/marketing/faq/faq-accordion-01";

<FAQAccordion01 />`}
        </code>
      </pre>
      <p className="text-balance">No props. The questions, answers and call-to-action copy are fixed in the component.</p>

      <h2 className="text-balance">Figma</h2>
      <p className="text-balance">No linked Figma file yet. This component came from the Untitled UI CLI, not from a Figma design.</p>
    </div>
  );
}
