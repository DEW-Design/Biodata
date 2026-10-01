"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ArrowNarrowRight } from "@untitledui/icons";
import { PageHeader } from "@/components/PageHeader";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { ScaffoldButton } from "@/components/scaffold/controls";
import { PageBanner } from "@/app/pages/_shared/page-banner";
import { ExplainerCard } from "@/app/pages/_shared/explainer-card";
import { recordIcon } from "@/app/pages/_shared/record-icons";

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="not-prose my-6 flex flex-col gap-3">
    <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">{children}</div>
  </div>
);

// A screen in miniature: a header strip, the banner directly under it, then the content. The header and the content
// are stand-ins (doc chrome); the banner is the real `PageBanner`.
function BannerDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="font-barlow flex h-[300px] flex-col bg-primary">
      <div className="flex h-12 shrink-0 items-center border-b border-secondary px-6 text-sm text-tertiary">Header</div>
      {open ? (
        <PageBanner
          title="Some locations are approximate"
          description="Sensitive species are shown only to an approximate area. Request a Data Licencing Agreement (DLA) for full access."
          actionLabel="Go to DLA"
          actionIcon={ArrowNarrowRight}
          actionIconPosition="trailing"
          onAction={() => undefined}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col items-start justify-center gap-3 bg-secondary px-6">
        <p className="m-0 text-sm text-tertiary">{open ? "The screen's content starts here, and does not move when the banner is closed." : "Dismissed. It stays closed for the rest of the visit and comes back on reload."}</p>
        {!open && <ScaffoldButton onClick={() => setOpen(true)}>Show the banner again</ScaffoldButton>}
      </div>
    </div>
  );
}

export default function BannersPatternPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Patterns"
        title="Banners"
        description="One full-width notice across the top of a screen, for the one thing a person should know about the whole screen, with the one step they can take. And the explainer card, for how something works."
      />

      <h2 className="text-balance">Anatomy</h2>
      <p className="text-balance">
        A banner is a <code>PageBanner</code> (<code>app/pages/_shared/page-banner.tsx</code>): the{" "}
        <a href="/components/alert">full-width alert</a> with the settings the pattern fixes, so no screen picks them. It sits
        directly under the header, above the content and outside anything that scrolls, so it is read first and does not move.
        The icon, the title and the one-line description read across, the action sits on the right, and one close control sits in
        the corner. Try closing this one.
      </p>
      <Section label="Live example">
        <BannerDemo />
      </Section>

      <h2 className="text-balance">The rules</h2>
      <ol>
        <li>
          <strong>Placement.</strong> Full width, directly under the header, above the content and never inside what scrolls. Never
          in column 2 (contract section 3.10: column 2 holds navigation and actions, not information), and never floating over a map
          or the content.
        </li>
        <li>
          <strong>One fact, one step.</strong> The title says what is true, in a few words and sentence case. The description is
          one line on what it means for this person. The action is named by where it goes (<strong>Go to DLA</strong>,{" "}
          <strong>Sign up for access</strong>), never &quot;OK&quot; or &quot;Learn more&quot;.
        </li>
        <li>
          <strong>Only for whom it is true.</strong> Who sees it is decided inside the screen from the role and the
          role-access matrix, never at the call site. A role that is not affected gets nothing, and one screen has one banner: if
          there are two things to say, the more important one gets it.
        </li>
        <li>
          <strong>Colour means the kind of notice.</strong> Warning for a limit on what someone can see or do, brand for
          information, error for something blocking, success sparingly, gray for a neutral status. It is tinted, never a solid
          fill.
        </li>
        <li>
          <strong>Closing.</strong> The corner icon is the only close control: there is no second Dismiss button beside the action.
          Closing lasts for the visit and the banner returns on reload. A notice that must stay leaves out <code>onDismiss</code>.
        </li>
        <li>
          <strong>Not for.</strong> A notice about one record or one section is the <em>contained</em> alert inside the content
          (the nomination status, an invitation pending). A confirmation that something just happened is a toast. A missing field
          is the form&apos;s inline error and its &quot;Details missing&quot; alert.
        </li>
      </ol>

      <h2 className="text-balance">Banner or contained alert</h2>
      <p className="text-balance">
        Both are the same alert component. The page banner is about the screen and runs edge to edge under the header; the
        contained alert is about one thing on the screen and sits in the content with the same 24px margins as the rest of it.
      </p>
      <Section label="Contained, for one record or section">
        <div className="font-barlow bg-secondary p-6">
          <AlertFullWidth
            contained
            wrap
            color="brand"
            title="Waiting for review"
            description="The sensitive species panel will pick it up. It can still be edited until the review starts."
            confirmLabel=""
          />
        </div>
      </Section>

      <h2 className="text-balance">Explainer card</h2>
      <p className="text-balance">
        A banner is a notice about the screen. To explain <em>how something works</em> (what a project is, how a nomination is
        reviewed), use the <code>ExplainerCard</code> (<code>app/pages/_shared/explainer-card.tsx</code>) above the list it
        belongs to, never in column 2 (contract section 3.10). It is a bordered card with a small heading, an optional one-line
        lead, and the subject as a row of steps: numbered when it is a sequence, an icon each when it is a structure. One link
        to more sits beside the close control.
      </p>
      <Section label="Live example: a structure, with icons">
        <div className="font-barlow bg-primary p-6">
          <ExplainerCard
            id="docs-explainer-example"
            title="What is a project?"
            lead="Every record in BioData SA belongs to a project. A project describes one survey program: who runs it, where and how data is collected, and what is held back from public release."
            stepType="featured-icon"
            action={{ label: "Open resources and user guides", href: "/pages/biodata-home#knowledge-centre" }}
            steps={[
              { title: "Project", description: "The survey program, and who runs it.", icon: recordIcon({ kind: "event", type: "Project" }) },
              { title: "Site", description: "Where the project's data is collected.", icon: recordIcon({ kind: "event", type: "Site" }) },
              { title: "Visit", description: "Each time a site is visited, sampling events are run.", icon: recordIcon({ kind: "event", type: "Visit" }) },
              { title: "Occurrence", description: "A species found at a visit.", icon: recordIcon({ kind: "occurrence", type: "Individual" }) },
              { title: "Observation", description: "The measurements kept for what was found.", icon: recordIcon({ kind: "observation", type: "Individual" }) },
            ]}
          />
        </div>
      </Section>
      <ul>
        <li>
          <strong>Above the list, inside main.</strong> It sits between the section header and the search, with the same 24px
          margins as the list.
        </li>
        <li>
          <strong>Closable, and back on every refresh.</strong> The close control hides it for the visit, so moving between All
          projects and My projects does not bring it back; a reload does. For the demo it is not remembered beyond that.
        </li>
        <li>
          <strong>Who sees it.</strong> Whoever is new to the subject: the nomination card is for someone who nominates but
          does not review.
        </li>
        <li>
          <strong>Steps stay readable.</strong> The stepper fades an unfinished step, which drops its description to 2.4:1; these
          are not progress, so the text is at full strength (5.3:1) and the title and description keep their hierarchy by weight
          and colour.
        </li>
      </ul>

      <h2 className="text-balance">Usage</h2>
      <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
        <code className="font-mono text-[13px] text-secondary">
{`import { PageBanner } from "@/app/pages/_shared/page-banner";

// Between the header and the content, outside the scrolling area.
{!dismissed && !seesAllData && (
  <PageBanner
    title="Some locations are approximate"
    description="Sensitive species are shown only to an approximate area. Request a Data Licencing Agreement (DLA) for full access."
    actionLabel="Go to DLA"
    actionIcon={ArrowNarrowRight}
    actionIconPosition="trailing"
    onAction={requestDlaAccess}
    onDismiss={() => setDismissed(true)}
  />
)}`}
        </code>
      </pre>

      <h2 className="text-balance">Where it is used</h2>
      <ul>
        <li>
          <strong>Explore:</strong> <code>/pages/observations</code>, and the results page of{" "}
          <code>/pages/observations/option-2</code>, carry the data-access notice for every role that does not see all data
          (&quot;You&apos;re viewing public data&quot; for a signed-out visitor, &quot;Some locations are approximate&quot; for
          a signed-in role).
        </li>
        <li>
          <strong>Contained alerts, for comparison:</strong> a nomination&apos;s status, a pending invitation, a flagged-concepts
          review on the project page.
        </li>
      </ul>
    </div>
  );
}
