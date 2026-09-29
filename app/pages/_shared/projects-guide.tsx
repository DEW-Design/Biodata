"use client";

// Column 2's lower block on project detail Option 3: what a project is, and the guides that relate
// to projects. Same shape and styling as the guest "What is BioData SA?" block (guest-home.tsx), but
// written for projects and shown to every persona.
//
// The copy is drafted for this design, grounded in the BDBSA fact sheets logged in CONTEXT.md
// (every record belongs to a project; Project > Site > Visit > Occurrence > Observation; sensitive
// data is flagged at project level). It is not sourced product copy and needs a content review.
// No project guide pages exist yet, so the rows are not links; the one link goes to the real
// Knowledge Centre section of the landing page, as the guest block does.

import type { FC } from "react";
import { ArrowNarrowUpRight, BookOpen01, Download02, PlayCircle, ShieldTick } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

const GUIDES_HREF = "/pages/biodata-home#knowledge-centre";

const guides: { icon: FC<{ className?: string }>; title: string; description: string }[] = [
  { icon: BookOpen01, title: "Getting started", description: "How to register a project and add its first sites and visits." },
  { icon: PlayCircle, title: "Video tutorials", description: "Walkthroughs of creating a project, uploading a dataset and editing records." },
  { icon: ShieldTick, title: "Policies", description: "Embargoes, sensitive species and who can see a project's data." },
  { icon: Download02, title: "Downloads", description: "Project templates, field forms and dataset templates." },
];

export function ProjectsGuide() {
  return (
    <div className="flex flex-col gap-6 border-t border-secondary pt-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-primary">What is a project?</h2>
        <p className="text-sm text-pretty text-tertiary">
          Every record in BioData SA belongs to a project. A project describes one survey program: who runs it, where and how data is collected, and what is held back
          from public release.
        </p>
        <p className="text-sm text-pretty text-tertiary">
          Inside a project, sites are visited, sampling events are run at each visit, and the species found are recorded as occurrences, with measurements kept as
          observations.
        </p>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-primary">Project guides</h2>
        <ul className="flex flex-col gap-4">
          {guides.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-fg-brand-primary" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-primary">{title}</p>
                <p className="text-sm text-pretty text-tertiary">{description}</p>
              </div>
            </li>
          ))}
        </ul>
        <Button color="link-color" size="sm" href={GUIDES_HREF} iconTrailing={ArrowNarrowUpRight} className="self-start">
          Open resources and user guides
        </Button>
      </section>
    </div>
  );
}
