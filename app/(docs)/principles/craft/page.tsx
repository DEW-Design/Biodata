"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Badge } from "@/components/base/badges/badges";
import { Tab, TabList } from "@/components/application/tabs/tabs";
import { MAP_SURFACE_EDGE } from "@/app/pages/_shared/map-search/map-surface";
import { ResultCard } from "@/app/pages/_shared/map-search/result-card";
import { Tabs } from "react-aria-components";
import { Edit05, Star01, Feather } from "@untitledui/icons";
import { cx } from "@/utils/cx";

// The details that make the interface feel finished, with their values and where each lives. The principle behind each is on /principles; the rule, where there is one, is in CONTRACTS.md. Every value here
// was read from the code or measured in a browser (the decision named beside it has the numbers); none is a target.

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="not-prose my-6 flex flex-col gap-3">
    <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
    <div className="font-barlow rounded-xl border border-secondary bg-secondary p-6">{children}</div>
  </div>
);

function Detail({ title, children, values, held }: { title: string; children: ReactNode; values?: string; held: string }) {
  return (
    <div className="not-prose font-barlow flex flex-col gap-2 border-t border-secondary py-5 [font-variant-ligatures:none] first:border-t-0">
      <h3 className="m-0 text-base font-semibold text-primary text-balance">{title}</h3>
      <div className="m-0 max-w-[70ch] text-sm text-secondary text-balance">{children}</div>
      {values && <p className="m-0 text-sm text-primary tabular-nums">{values}</p>}
      <p className="m-0 text-xs text-tertiary">{held}</p>
    </div>
  );
}

export default function CraftDetailsPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Principles"
        title="Craft details"
        description="The small things that make the interface feel finished: what each is, the values, where it lives, and the decision that has the measurements. The principle behind them is Craft shows."
      />

      <p className="text-balance">
        A detail is made once, in a component or a token, and every screen gets it (<Link href="/principles">One system</Link>). Where it is a rule it is a clause in CONTRACTS.md, and where it can be checked by a
        machine it is. The rest is judged with a live measurement, not by eye. The sections below are in the order a person meets them: the edge of a surface, the type on it, the space between, what moves, what
        is under a finger, and the words.
      </p>

      <h2 className="text-balance">Surfaces</h2>

      <Detail
        title="An edge that reads on any background"
        values="1px, gray-950 at 12 per cent, bg-clip-padding (MAP_SURFACE_EDGE); inner lines the same alpha (MAP_SURFACE_RULE)"
        held="Floating cards, the key and the zoom buttons on the map: 2026-10-23-18. A solid grey line is one colour, so it is pale on the sea and dark on a road; 12 per cent of the same dark is always a little darker than what is behind."
      >
        A floating surface has an alpha edge, and its dividers use the same alpha, so on white they are the line they always were and at the card&apos;s outer edge they follow the map.
      </Detail>
      <Section label="The same box on three backgrounds: the alpha edge above, a solid grey below">
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: "Light", bg: "bg-brand-100" },
            { name: "Mid", bg: "bg-gray-300" },
            { name: "Warm", bg: "bg-warning-100" },
          ].map((b) => (
            <div key={b.name} className={cx("flex flex-col gap-3 rounded-lg p-4", b.bg)}>
              <div className={cx("flex h-14 items-center justify-center rounded-lg bg-primary text-sm text-secondary", MAP_SURFACE_EDGE)}>Alpha edge</div>
              <div className="flex h-14 items-center justify-center rounded-lg border border-secondary bg-primary text-sm text-secondary">Solid grey</div>
              <p className="m-0 text-xs text-secondary">{b.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Detail
        title="Corners are concentric"
        values="inner radius = outer radius - padding, never below 0; radius scale lg 8, xl 12, 2xl 16, 3xl 20, 4xl 24"
        held="CONTRACTS 2.13; 2026-10-19-16. Pairs that land on the scale: 2xl with 4px gives xl; 2xl with 8px gives lg; xl with 4px gives lg."
      >
        Where a rounded box sits inside another and their corners meet, the two curves share a centre. A component keeps its radius; the outer box changes.
      </Detail>
      <Section label="Concentric (left three) and pinched (right): the same radius on the inside as the outside">
        <div className="flex flex-wrap items-center gap-6">
          {[
            { outer: "rounded-2xl", pad: "p-1", inner: "rounded-xl", note: "16, 4, 12" },
            { outer: "rounded-2xl", pad: "p-2", inner: "rounded-lg", note: "16, 8, 8" },
            { outer: "rounded-xl", pad: "p-1", inner: "rounded-lg", note: "12, 4, 8" },
            { outer: "rounded-2xl", pad: "p-2", inner: "rounded-2xl", note: "16, 8, 16 (wrong)" },
          ].map((c) => (
            <div key={c.note} className="flex flex-col items-center gap-2">
              <div className={cx("bg-brand-solid", c.outer, c.pad)}>
                <div className={cx("h-14 w-24 bg-primary", c.inner)} />
              </div>
              <p className="m-0 text-xs text-secondary tabular-nums">{c.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Detail
        title="Lift is a shadow; separation is a line"
        values="the floating card shadow-lg; a control lifted off a list shadow-2xl; dividers hairline"
        held="The shadow scale is in Primitives. A border says where one thing ends; a shadow says one thing is above another (2026-10-23-36, -37)."
      >
        Show N more is lifted on the largest shadow so it reads over the rows; a row divider is a line, never a shadow.
      </Detail>

      <h2 className="text-balance">Type</h2>

      <Detail
        title="One ladder, and each role has one treatment everywhere"
        values="row title 14/500 primary; supporting lines 12/400 tertiary; eyebrow 12/600 uppercase wide tracking, quaternary; card title 16/600; counts tabular-nums"
        held="CONTRACTS 2.9; 2026-09-29-01, 2026-10-23-26. Italic is for scientific names and nothing else; sentence case; text-balance on copy that can wrap; no em dashes."
      >
        A level is one step from the next, and hierarchy comes from what recedes. The same role is never medium in one place and semibold in another.
      </Detail>
      <Section label="A result row, with the treatment of each line">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="max-w-[360px] rounded-xl bg-primary p-2 ring-1 ring-secondary">
            <ResultCard
              icon={Feather}
              title="Southern Hairy-nosed Wombat"
              subtitle="Lasiorhinus latifrons"
              subtitleItalic
              meta="Individual · 2026-05-14"
              badge={<Badge size="sm" color="warning">Restricted</Badge>}
              onSelect={() => {}}
            />
          </div>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-tertiary">Title</dt>
            <dd className="m-0 text-primary">14px / 500, text-primary</dd>
            <dt className="text-tertiary">Scientific name</dt>
            <dd className="m-0 text-primary">12px / 400, text-tertiary, italic</dd>
            <dt className="text-tertiary">Detail</dt>
            <dd className="m-0 text-primary">12px / 400, text-tertiary</dd>
            <dt className="text-tertiary">Badge</dt>
            <dd className="m-0 text-primary">the design system Badge, size sm</dd>
          </dl>
        </div>
      </Section>

      <h2 className="text-balance">Space</h2>

      <Detail
        title="Space is a token, on a 4px grid"
        values="card padding 16; header gaps 16 / 6 / 2 / 16; tabs to first row 8; row 76 (three lines); the foot 16 and the pinned button 16 up"
        held="Primitives: Spacing. 2026-09-28-50 (apply a spacing token), 2026-10-23-25, -37. A gap that is 5px or 13px was eyeballed."
      >
        Space inside a surface is read off the card&apos;s own padding (16), so a thing at the edge of a card is 16 from it, and the list&apos;s last row is 16 above the button that is 16 above the foot.
      </Detail>

      <h2 className="text-balance">Scroll and fade</h2>

      <Detail
        title="One scrollbar for every scroller: a drawn thumb and no track, and a fade that says there is more"
        values="thumb 6px wide, 2px in from the edge, 8px short of each end, gray-400 (gray-500 held); shown while it scrolls and 0.9s after, while pointed at, and while dragged; no thumb in a box under 64px; tabs fade over 64px at the right edge, a list over 120px at its foot"
        held="app/_scrollbars (DrawnScrollbars, mounted once in the layout), ScrollFade, MAP_SURFACE_SCROLL; CONTRACTS 2.17; 2026-10-23-31, -36, -37, -38, -50, -53, -68. A classic scrollbar took 15px from the right of the rows and left them lopsided on Windows."
      >
        The browser&apos;s scrollbar is off everywhere and every element that scrolls (a page, a table, a menu, a modal, a list in a card) has the same thin thumb drawn over its edge: it takes no width, so nothing moves when it
        appears, shows while the scroller scrolls and while it is pointed at, and drags. A new scroller needs nothing. A scroll that reaches the end of a list in a floating card does not carry on into the map. The fade is a{" "}
        <code>mask-image</code>, so it works on any background, and it goes at the end of the list: the fade says there is more, the thumb says where and how much. A page&apos;s <code>main</code> still reserves the gutter
        (<code>scrollbar-gutter: stable</code>, CONTRACTS 4.2f), which now costs nothing. <Link href="/patterns/map-list-card">Map list card</Link> has the live list.
      </Detail>

      <h2 className="text-balance">Feedback and motion</h2>

      <Detail
        title="Quiet, specific, and never on layout"
        values="hover 100ms ease-linear on named properties; press scale(0.96); focus ring 2px, offset 2px; enter 150 to 200ms, motion-safe"
        held="Primitives: Motion. 2026-10-23-17 (no animated width, height, top or left), 2026-09-29-08 (reduce the amount of animation). Never transition: all."
      >
        State is shown by colour and fill, not by weight or size (a hovered tab does not get bolder, so nothing reflows). The ghost button (Link grey) has nothing around it until it is pointed at, then a gray-50
        fill. The fill is 32px high with 6px of padding all round, and an equal negative margin takes the room back so the text does not move (<code>ghost-fill</code>, <code>2026-10-23-44</code>, <code>-47</code>, <code>-59</code>);
        the target is still 40px, by the hit area, invisibly. Its corners are 6px, so at a card&apos;s corner they are concentric with the card&apos;s 12px (2.13).
      </Detail>
      <Section label="Ghost controls: point at each">
        <div className="flex flex-wrap items-center gap-6">
          <Button color="link-gray" iconLeading={Edit05}>Edit search</Button>
          <Button color="ghost-color" iconLeading={Edit05}>Ghost colour</Button>
          <Button color="tertiary" iconLeading={Edit05}>Tertiary</Button>
          <ButtonUtility color="tertiary" icon={Star01} tooltip="Utility" />
        </div>
      </Section>

      <h2 className="text-balance">Touch and keyboard</h2>

      <Detail
        title="A target as big as a finger, built into the component"
        values="40px with a mouse, 44px with touch (--hit-min); capped with [--hit-min:32px] or removed with after:content-none where controls touch; room in a scrolling strip, pb-1.5 -mb-1.5"
        held="CONTRACTS 2.16; 2026-10-23-41, -42. Every control is also reachable and operable from the keyboard, and Escape closes and changes nothing (1.9)."
      >
        A control that draws smaller than the target gets an invisible box of the target&apos;s size, centred on it. It changes nothing about how the control looks or where it sits. The dashed boxes show it.
      </Detail>
      <Section label="The hit areas, drawn (a docs-only view)">
        <div data-show-hit-area className="flex flex-wrap items-center gap-x-10 gap-y-8 py-3">
          <Button color="secondary" size="sm">Small button</Button>
          <ButtonUtility color="tertiary" icon={Edit05} tooltip="Icon button" />
          <CloseButton size="xs" />
          <Checkbox aria-label="A bare checkbox" />
          <Tabs>
            <TabList aria-label="Underline tabs" type="underline" size="sm">
              <Tab id="a" label="Species" />
              <Tab id="b" label="Projects" />
            </TabList>
          </Tabs>
        </div>
      </Section>

      <h2 className="text-balance">Words and data</h2>

      <Detail
        title="The source's words, in the source's order"
        values="scientific name first, in italics, then the common name; a field is called what the table calls it; Not provided, never a dash; placeholder people are Olivia Wyatt, Phoenix Baker, Lana Steiner, Maya Dewitt"
        held="CONTRACTS 2.15, 0.3, 2.3; 2026-10-23-33, -35, -40. One icon per concept (2.4); every action button carries an icon (3.12)."
      >
        A view that comes from a table is the table&apos;s own fields: it does not rename one, reorder it or compute one the table does not have. A data item of a record is a concept, not a field
        (<code>2026-10-23-40</code>).
      </Detail>

      <Detail
        title="A cut has a strategy, by what the text is"
        values="a code or id is never cut; a title is cut at a word (Flinders Ranges ...); a file name is cut in the middle and keeps its version and extension (flinders_bush...01.xlsx); the full text is the tooltip, and the open list is as wide as its longest row"
        held="CONTRACTS 4.6 (the report's dropdowns), Select truncateAtWords and labelEnd; 2026-10-23-66. Cutting at the character the line runs out on is a strategy for nothing: it hides the version that tells two files apart, and cuts a word in half."
      >
        Where text is too long for its line, what to keep depends on what it is. A name that is told from its neighbours by its end (a file) keeps its end; a title that is told by its start is cut at a word; an identifier is
        not cut. Anything cut says its full text on hover.
      </Detail>

      <h2 className="text-balance">How a detail is checked</h2>
      <ul className="text-balance">
        <li>
          <strong>Measure it.</strong> Read the computed style and the box (<code>getComputedStyle</code>, <code>getBoundingClientRect</code>) and say the numbers: the radius and the gap of every nested pair, the
          hit area just inside and just outside, the gap above and below a pinned button, the scroller&apos;s <code>scrollHeight</code>.
        </li>
        <li>
          <strong>Look at it,</strong> at the size the designer works at, with a mouse and with touch emulated, on every role it changes for.
        </li>
        <li>
          <strong>Ask the principle&apos;s question,</strong> then write down what was measured and what was not (CONTRACTS 0.5, 0.6).
        </li>
      </ul>
    </div>
  );
}
