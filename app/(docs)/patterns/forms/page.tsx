"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { TextArea } from "@/components/base/textarea/textarea";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="not-prose my-6 flex flex-col gap-3">
    <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">{children}</div>
  </div>
);

// A live FormPage in a fixed-height frame, wired the way a real form is: two sections, Back a step /
// Continue, the final action on the last section, and inline errors only after Continue was pressed.
function FormDemo() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [tried, setTried] = useState(false);
  const [kind, setKind] = useState("no");

  return (
    <div className="font-barlow flex h-[560px] flex-col">
      <FormPage
        eyebrow={`Step ${step} of 2 - Example record`}
        title={step === 1 ? "Basics" : "Options"}
        subtitle="Fields marked * are required to continue."
        onCancel={() => setStep(1)}
        onSaveDraft={() => setTried(false)}
        onBack={step === 2 ? () => setStep(1) : undefined}
        problems={tried && !name.trim() ? { items: ["Name"] } : undefined}
        primaryLabel={step === 1 ? "Continue" : "Create record"}
        primaryIsContinue={step === 1}
        onPrimary={() => {
          if (step === 1) {
            if (!name.trim()) return setTried(true);
            setTried(false);
            setStep(2);
          }
        }}
      >
        {step === 1 ? (
          <>
            <FormRow title="Name" required description="What people will see first.">
              <Input aria-label="Name" isRequired placeholder="E.g., Coorong Wetlands Bird Count" value={name} onChange={setName} isInvalid={tried && !name.trim()} hint={tried && !name.trim() ? "Enter a name" : undefined} />
            </FormRow>
            <FormRow title="Description" description="Optional. Add background if it helps.">
              <TextArea aria-label="Description" rows={3} placeholder="Background, aims and objectives" />
            </FormRow>
          </>
        ) : (
          <FormRow title="Visibility" required description="Who can see this record.">
            <RadioGroup aria-label="Visibility" value={kind} onChange={setKind}>
              <RadioButton value="no" label="Open" hint="Everyone can see it." />
              <RadioButton value="yes" label="Restricted" hint="Only people you choose." />
            </RadioGroup>
          </FormRow>
        )}
      </FormPage>
    </div>
  );
}

export default function FormsPatternPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Patterns"
        title="Forms"
        description="One pattern for every create and edit form: Add Project, Data Sharing Agreement and Data Licence request all render the same page."
      />

      <h2 className="text-balance">Anatomy</h2>
      <p className="text-balance">
        A form is a <code>FormPage</code> (<code>app/pages/_shared/form-page.tsx</code>) with its fields laid out in{" "}
        <code>FormRow</code>s. The page owns the header, the scrolling body and the footer, and the section list fills column 2, so
        none of them can differ between forms. Try it: press Continue with the name empty.
      </p>
      <Section label="Live example">
        <FormDemo />
      </Section>

      <h2 className="text-balance">The rules</h2>
      <p className="text-balance">
        This is contract <strong>section 4.1</strong> in <code>CONTRACTS.md</code>, enforced by{" "}
        <code>npm run check:contracts</code>: a screen that uses <code>FormRow</code> without <code>FormPage</code> fails.
      </p>
      <ol>
        <li>
          <strong>Header.</strong> An optional eyebrow, the title (with a status badge for an existing record), a one-line
          subtitle, and two actions: <strong>Cancel</strong> and <strong>Save draft</strong>. Save draft is left out when a draft
          makes no sense, such as editing a live record.
        </li>
        <li>
          <strong>Sections live in column 2.</strong> A form with more than two or three field groups is split into sections, listed
          in the contextual sidebar as a <code>FormSectionList</code>, built from the vertical <a href="/components/progress-steps">Progress steps</a>: a progress bar, the sections grouped by step, and a state
          for each (current, complete, needs attention, not started). Any section can be opened at any time. Never tabs, never a
          forward-only stepper. Related fields share a screen; do not ask one question per screen.
        </li>
        <li>
          <strong>Rows.</strong> Label and help on the left, fields on the right. Required fields are marked with an asterisk.
        </li>
        <li>
          <strong>Mandatory details block progress.</strong> Continue does not move on, and jumping forward through column 2 is
          refused, while the current section has mandatory fields missing. The form shows a <strong>Details missing</strong> error
          alert above the fields naming exactly what is missing, and each empty field turns red with its own message. Nothing
          alerts while a person is still on their first answer, and going back is always allowed. Column 2 marks the sections
          that still need attention, with a count.
        </li>
        <li>
          <strong>Footer.</strong> <strong>Back a step</strong> (secondary button, left arrow icon) on the left, hidden on the
          first section. On the right the primary action: <strong>Continue</strong> (right arrow icon) to move on, or the final
          action - <strong>Submit</strong>, <strong>Create project</strong>, <strong>Save changes</strong> - on the last
          section. 
        </li>
        <li>
          <strong>Leaving.</strong> Cancel asks before discarding unsaved changes, and says what will be lost.
        </li>
        <li>
          <strong>Controls.</strong> Real DEW components only: <code>Input</code>, <code>TextArea</code>, <code>Select</code>,{" "}
          <code>MultiSelect</code>, <code>RadioGroup</code>, <code>Checkbox</code>, <code>Accordion</code>. No bespoke tiles. If
          a control does not exist, mark it with <code>Gap</code> (the <code>?</code> marker).
        </li>
        <li>
          <strong>Draft.</strong> A draft needs only what identifies the record; submit validates the rest.
        </li>
      </ol>

      <h2 className="text-balance">Usage</h2>
      <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
        <code className="font-mono text-[13px] text-secondary">
{`import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";

<FormPage
  eyebrow="Data sharing agreement"
  title="New agreement"
  subtitle="Fields marked * are required to submit."
  onCancel={goBack}            // ask before discarding
  onSaveDraft={saveDraft}      // omit when editing a live record
  onBack={index > 0 ? previous : undefined}
  problems={missing.length ? { items: missing } : undefined}   // "Details missing" alert
  primaryLabel={isLast ? "Submit" : "Continue"}
  primaryIsContinue={!isLast}
  onPrimary={isLast ? submit : next}
>
  <FormRow title="Partner" required description="Who the agreement is with.">
    <Input label="Organisation" isRequired />
  </FormRow>
</FormPage>`}
        </code>
      </pre>

      <h2 className="text-balance">Where it is used</h2>
      <ul>
        <li>
          <strong>Add Project, option 2:</strong> <code>/pages/project-registration/option-2</code>, sections listed in column 2.
        </li>
        <li>
          <strong>Data Sharing Agreement:</strong> <code>/pages/dsa/new</code> and <code>/pages/dsa/&lt;id&gt;/edit</code>, sections listed in column 2.
        </li>
        <li>
          <strong>Data Licence request:</strong> <code>/pages/dla/new</code> and <code>/pages/dla/&lt;id&gt;/edit</code>, sections listed in column 2.
        </li>
        <li>
          <strong>Exempt:</strong> Add Project option 1 (<code>/pages/project-registration</code>), a one-question-per-card option
          kept for comparison.
        </li>
      </ul>
    </div>
  );
}
