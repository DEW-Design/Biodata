"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Mail01, MessageSmileCircle } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import { assetPath } from "@/lib/base-path";
import { useRoleHref } from "@/lib/use-role-href";
import { HIGHLIGHT_NOTE, HIGHLIGHTS, INVITE, LINKS, PHASE_ACTIVITIES, PHASES, SAMPLES, TEAM, TRACKING_INTRO, TRANSITION_TEXT } from "./newsletter-data";

// The newsletter's blocks (page.tsx arranges them). Every piece is a design system component or a pattern already in the app: the
// section headings of Home, the step line of the request cards, the tinted strip of "Continue where you left off", the Badge, the
// Avatar. Type is the app's: section headings 18 / 600, body 14, a label above a section 12 / 600 in capitals.

export function Heading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="m-0 scroll-mt-6 text-lg font-semibold text-primary">
      {children}
    </h2>
  );
}

/**
 * How we're tracking: the six phases as a step line (one row from 512px, two rows of three below), then what happens in each stage. Executing
 * is four iterative stages, so they sit under a label of their own; the stage the project is in carries a Badge.
 */
export function PhaseTrack() {
  const items = PHASES.map((p) => ({ title: p.title, description: p.label, status: p.status }));
  return (
    <div className="@container flex flex-col gap-4">
      <p className="m-0 text-sm text-pretty text-tertiary">{TRACKING_INTRO}</p>
      <Progress.TextWithLine className="hidden @lg:grid" items={items} />
      <div className="flex flex-col gap-4 @lg:hidden">
        <Progress.TextWithLine items={items.slice(0, 3)} />
        <Progress.TextWithLine items={items.slice(3)} />
      </div>
      <dl className="m-0 flex flex-col rounded-lg border border-secondary [&>*+*]:border-t [&>*+*]:border-secondary">
        {PHASE_ACTIVITIES.map((a) =>
          a.group ? (
            <div key={a.stage} className="flex flex-col gap-0.5 bg-secondary px-4 py-2 @lg:flex-row @lg:items-baseline @lg:justify-between @lg:gap-3">
              <dt className="text-xs font-semibold tracking-wide text-tertiary uppercase">{a.stage}</dt>
              <dd className="m-0 text-xs text-tertiary">{a.text}</dd>
            </div>
          ) : (
            <div key={a.stage} className="flex flex-col gap-0.5 px-4 py-2.5 @lg:grid @lg:grid-cols-[10rem_1fr] @lg:gap-3">
              <dt className="flex items-center gap-2 text-sm font-semibold text-primary">
                {a.stage}
                {a.stage === "Design" ? (
                  <Badge size="sm" color="brand">
                    We&apos;re here
                  </Badge>
                ) : null}
              </dt>
              <dd className="m-0 text-sm text-pretty text-tertiary">{a.text}</dd>
            </div>
          ),
        )}
      </dl>
    </div>
  );
}

// A tinted callout, the strip "Continue where you left off" uses (bg-brand-50), with a Badge naming what it is.
function Callout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-brand-50 px-4 py-3">
      <Badge size="sm" color="brand">
        {label}
      </Badge>
      {children}
    </div>
  );
}

/** The transition paragraph: its first sentence says what happened, so it leads as a card heading (16 / 600, as the invitation's) and the rest is body (14). */
function TransitionText() {
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-base font-semibold text-balance text-primary">{TRANSITION_TEXT.lead}</p>
      <p className="m-0 text-sm text-pretty text-secondary">{TRANSITION_TEXT.rest}</p>
    </div>
  );
}

/** The two product pages the highlights point at, as screenshots with a caption each. */
function Samples() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SAMPLES.map((sample) => (
        <figure key={sample.title} className="m-0 flex flex-col gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(sample.src)} alt={sample.alt} className="w-full rounded-lg border border-secondary" />
          <figcaption className="text-xs font-medium text-tertiary">{sample.title}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function TransitionCallout() {
  return (
    <Callout label="Transition">
      <TransitionText />
    </Callout>
  );
}

export function HighlightsCallout() {
  return (
    <Callout label="Highlights">
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {HIGHLIGHTS.map((h) => (
          <li key={h} className="text-sm text-primary">
            {h}
          </li>
        ))}
      </ul>
      <p className="m-0 text-sm text-pretty text-primary">{HIGHLIGHT_NOTE}</p>
      <Samples />
    </Callout>
  );
}

/** The ask, in words and a button: it opens a message to the BioData SA address. */
function InviteMail({ className }: { className?: string }) {
  return (
    <Button color="link-color" size="md" iconLeading={Mail01} href={`mailto:${INVITE.email}`} className={className}>
      {INVITE.email}
    </Button>
  );
}

export function FeedbackCallout() {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-brand-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <MessageSmileCircle className="size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
        <h3 className="m-0 text-base font-semibold text-primary">{INVITE.title}</h3>
      </div>
      <p className="m-0 text-sm text-pretty text-primary">{INVITE.text}</p>
      <InviteMail className="self-start" />
    </div>
  );
}

function TeamMember({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Avatar size="2xl" initials={name.split(" ").map((p) => p[0]).join("")} alt={name} />
      <p className="m-0 text-sm font-medium text-primary">{name}</p>
    </div>
  );
}

export function TeamRow() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {TEAM.map((name) => (
        <TeamMember key={name} name={name} />
      ))}
    </div>
  );
}

/** Helpful links: a row each. A link with no destination yet is plain text, not drawn as a link. */
export function LinkList() {
  const roleHref = useRoleHref();
  return (
    <ul className="m-0 flex list-none flex-col rounded-lg border border-secondary p-0 [&>*+*]:border-t [&>*+*]:border-secondary">
      {LINKS.map((link) => (
        <li key={link.title} className="flex flex-col gap-1 px-4 py-3">
          {link.lead ? <span className="text-sm text-tertiary">{link.lead}</span> : null}
          {link.href ? (
            <Link href={roleHref(link.href)} className="flex items-center justify-between gap-3 rounded-md text-sm font-semibold text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover hover:underline focus-visible:outline-2">
              {link.title}
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            </Link>
          ) : (
            <span className="text-sm font-medium text-primary">{link.title}</span>
          )}
        </li>
      ))}
    </ul>
  );
}


// ── Option 8 pieces ──
