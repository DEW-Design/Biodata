"use client";

import { Progress } from "@/components/application/progress-steps/progress-steps";
import { assetPath } from "@/lib/base-path";
import { FeedbackCallout, Heading, HighlightsCallout, LinkList, PhaseTrack, TeamRow, TransitionCallout } from "./blocks";
import { TopInfographic } from "./infographic";
import { NewsletterFrame } from "./newsletter-frame";
import { STAGES } from "./newsletter-data";

// /nltemplate - the DEW newsletter, on a five-column grid, 960px wide. This is option 10 of the ten layouts explored, chosen on
// 14 Oct 2026; the other nine were removed (CONTRACTS 4.4). The tracker is a label column and the four stages (4 of the 5); the
// problems are five columns, one each; under the opportunity areas the tracking callouts are 2 columns and 3, the team 3 and the
// links 2. The opportunity areas are three across, two rows: the designer found that nicer than five across, where the sixth was
// left alone on a row, so that band is the one that does not use the five lines. The infographic runs flush to the paper's edges
// so its bands have the same 40px side padding as the header, the tracker and the rows, and every grid uses the same 16px gap.
export default function NewsletterPage() {
  return (
    <NewsletterFrame>
      <div className="flex items-center justify-between gap-4 bg-brand-800 bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 px-10 py-6">
        <div className="flex flex-col gap-1">
          <p className="m-0 text-xs font-semibold tracking-wide text-white/80 uppercase">BioData SA</p>
          <h1 className="m-0 text-3xl font-semibold text-white">Program update</h1>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath("/pages/dashboard/gov-sa-dew-lockup-white.png")} alt="Government of South Australia, Department for Environment and Water" className="h-12 w-auto shrink-0" />
      </div>
      <section aria-labelledby="stages" className="bg-brand-50 px-10 py-6">
        <div className="grid items-start gap-4 md:grid-cols-5">
          <h2 id="stages" className="m-0 pt-3 text-base font-semibold text-brand-secondary">
            Where we are
          </h2>
          <Progress.TextWithLine className="md:col-span-4" size="md" items={STAGES.map((s) => ({ title: s.title, description: s.label, status: s.status }))} />
        </div>
      </section>
      <TopInfographic five flush opportunityColumns={3} />
      <div className="flex flex-col gap-8 p-10">
        <section aria-labelledby="tracking" className="flex flex-col gap-3">
          <Heading id="tracking">How we&apos;re tracking?</Heading>
          <PhaseTrack />
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <TransitionCallout />
            </div>
            <div className="md:col-span-3">
              <HighlightsCallout />
            </div>
          </div>
        </section>
        <FeedbackCallout />
        <div className="grid gap-x-4 gap-y-8 md:grid-cols-5">
          <section className="flex flex-col gap-3 md:col-span-3" aria-labelledby="team">
            <Heading id="team">The team</Heading>
            <TeamRow />
          </section>
          <section className="flex flex-col gap-3 md:col-span-2" aria-labelledby="links">
            <Heading id="links">Helpful links</Heading>
            <LinkList />
          </section>
        </div>
      </div>
    </NewsletterFrame>
  );
}
