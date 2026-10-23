"use client";

import { useState, type ReactNode } from "react";
import { Tabs } from "react-aria-components";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/base/badges/badges";
import { Tab, TabList } from "@/components/application/tabs/tabs";
import { MapLegend } from "@/app/pages/_shared/map-search/map-legend";
import { MAP_SURFACE_EDGE } from "@/app/pages/_shared/map-search/map-surface";
import { ResultCard } from "@/app/pages/_shared/map-search/result-card";
import { LIST_STEP, MapResultList } from "@/app/pages/_shared/map-search/result-list";
import { ScrollFade } from "@/app/pages/_shared/map-search/scroll-fade";
import { searchOccurrences } from "@/app/pages/_shared/map-search/search-data";
import { SPECIES_GROUP_COLOR, SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { SummaryCloseButton, SummaryFacts } from "@/app/pages/_shared/map-search/summary-card-parts";
import { cx } from "@/utils/cx";

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="not-prose my-6 flex flex-col gap-3">
    <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
    <div className="font-barlow rounded-xl border border-secondary bg-secondary p-6">{children}</div>
  </div>
);

// The card's own surface: the card edge, white, the large shadow (`floatCard` in Explore and Map visualise).
const floatCard = cx("flex flex-col overflow-hidden rounded-xl", MAP_SURFACE_EDGE, "bg-primary shadow-lg");

// The sample species the Explore screens search, repeated to make a list longer than a page; the keys are told apart, the records are not new.
const species = searchOccurrences.filter((o) => o.family && o.group);
const rows = Array.from({ length: 56 }, (_, i) => ({ ...species[i % species.length], key: `${species[i % species.length].id}-${i}` }));

function ListDemo() {
  const [shown, setShown] = useState(LIST_STEP);
  return (
    <div className="relative flex h-[560px] w-full max-w-[460px] flex-col overflow-hidden rounded-xl bg-tertiary p-4">
      <section aria-label="Sample results" className={cx(floatCard, "min-h-0 flex-1")}>
        <div className="shrink-0 px-4 pt-4 pb-1">
          <h3 className="m-0! text-base! font-semibold! tracking-normal! text-primary! normal-case!">Search the map</h3>
          <p className="m-0 text-sm text-tertiary">
            <span className="font-semibold text-primary">{rows.length} records</span> across 1 area
          </p>
        </div>
        <ScrollFade className="px-4">
          <Tabs className="min-w-max">
            <TabList aria-label="Result type" type="underline" size="sm">
              <Tab id="species" label="Species" badge={rows.length} />
              <Tab id="projects" label="Projects" badge={5} />
              <Tab id="events" label="Events" badge={19} />
              <Tab id="occurrences" label="Occurrences" badge={15} />
            </TabList>
          </Tabs>
        </ScrollFade>
        <MapResultList total={rows.length} shown={shown} onShowMore={() => setShown((n) => n + LIST_STEP)}>
          {rows.slice(0, shown).map((o) => (
            <ResultCard key={o.key} icon={SPECIES_GROUP_ICON[o.group!]} title={o.commonName} subtitle={o.species} subtitleItalic meta={`${o.type} · ${o.date}`} onSelect={() => {}} />
          ))}
        </MapResultList>
      </section>
    </div>
  );
}

export default function MapListCardPatternPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Patterns"
        title="Map list card"
        description="A card that floats over the map and lists what is on it: Explore's results, Map visualise's errors. A few rows at a time, fading out at the foot, with one button to show the next rows."
      />

      <h2 className="text-balance">Anatomy</h2>
      <p className="text-balance">
        The card is one bordered surface on the map&apos;s left (<code>MAP_SURFACE_EDGE</code>, white, the large shadow). Every screen that has one builds it from the same parts, so they read the same:
      </p>
      <ul className="text-balance">
        <li>
          <strong>A header</strong> that says what the card is about (a title, or a way back and the thing being looked at), with its actions at the right.
        </li>
        <li>
          <strong>A row of tabs</strong> (<code>ScrollFade</code>, underline <code>Tabs</code>): one tab per kind, each with its count (Map visualise&apos;s carry icons, 3.13; Explore&apos;s, two of them, are drawn without). A strip wider than the card scrolls sideways and fades out at its right
          edge, and its tabs keep their own hit area inside it.
        </li>
        <li>
          <strong>Hide list / Show list</strong> (<code>ListToggleButton</code>, <code>useListToggle</code>): a labelled ghost button on the card&apos;s header (Map visualise) or on its Search results heading (Explore). The card folds to what is above the list so the map
          can be seen whole, stays the same object in the same place, and the list comes back scrolled where it was left.
        </li>
        <li>
          <strong>The list</strong> (<code>MapResultList</code> of <code>ResultCard</code>s): 25 rows, then <strong>Show N more</strong>, and <strong>Show N more</strong> whenever the list fades. It scrolls inside the card with no scrollbar drawn and fades out at its foot while
          there is more below.
        </li>
        <li>
          <strong>The key</strong> (<code>MapLegend</code>) in its own box under the card, never inside it.
        </li>
        <li>
          <strong>A summary card</strong> on the map&apos;s right when a row or a dot is chosen (<code>SummaryCloseButton</code>, <code>SummaryFacts</code>), with the zoom buttons above it.
        </li>
      </ul>

      <h2 className="text-balance">The list</h2>
      <p className="text-balance">
        Scroll it, then press <strong>Show 25 more</strong>. The new rows scroll into view; for a keyboard press, focus goes to the first of them.
      </p>
      <Section label="A list longer than a page (the sample species, repeated)">
        <ListDemo />
      </Section>

      <h3 className="text-balance">What the list does</h3>
      <ul className="text-balance">
        <li>
          <strong>It fades out at its foot while there is more below,</strong> as the tabs fade at their right edge, over about a row and a half (120px; a row is 76px), so the last record on view is half gone: a row
          going, not a whole row with its last line faint. The fade is a <code>mask-image</code>, so it works on any background, and it goes at the end of the list and when everything fits. On a short list the
          fade is never more than 45 per cent of it.
        </li>
        <li>
          <strong>Show N more is a secondary Button pinned over the foot,</strong> 16px up from the card&apos;s edge, lifted on the largest shadow. It is outside the scroller (a mask fades its children too), the
          list is faded clear under it so no row shows behind it, and the list is padded below its last row so that row can scroll clear of it: 16px above the button, as it is 16px above the foot. It is not a link at
          the end of the rows, and it is not primary (the screen has one).
        </li>
        <li>
          <strong>Wherever the list fades there is a Show N more, and N is true.</strong> While rows have not been drawn yet it says how many the press draws (up to 25); once every row is drawn it says how many are not yet
          fully in view (a row cut by the fade, under the button or below it), and the press scrolls to the first of them. It goes when the end of the list is in view, so a fade is never left without a way on and a number
          to say how far, and a list that fits has neither. A keyboard press moves focus to the first row it brought into view.
        </li>
        <li>
          <strong>The scrollbar is the product&apos;s one: a thin thumb, drawn</strong> (<code>DrawnScrollbars</code>, <code>app/_scrollbars</code>, chosen from four options on this list and then made the scrollbar of every scroller
          in the product, 23 Oct 2026, CONTRACTS 2.17): 6px, no track, over the list&apos;s right edge, so it takes no width from the rows whatever the system&apos;s setting for scroll bars is (a classic bar took 15px and left
          the rows lopsided on Windows and with a mouse). It shows while the list scrolls and for a moment after, and while the pointer is over the list; it can be dragged; on a touch screen it is only an indicator. The list asks for nothing:
          <code>ScrollFade</code> draws only the fade. <strong>A scroll that reaches the end does not carry on into the map</strong> (<code>MAP_SURFACE_SCROLL</code>).
        </li>
        <li>
          <strong>A row</strong> is a <code>ResultCard</code>: an icon, a photo or a dot, a title, up to two grey lines, and a badge. The badge sits beside the title, or at the right edge in a column when every
          row has one (a severity). The whole row is the button. Hovering it highlights its dot on the map.
        </li>
        <li>
          <strong>A different list starts at its top,</strong> not where the last one was left, and starts again at 25 rows.
        </li>
      </ul>

      <h2 className="text-balance">The summary card</h2>
      <Section label="Facts as rows">
        <div className="relative flex w-[320px] max-w-full flex-col overflow-hidden rounded-xl bg-primary shadow-lg">
          <SummaryCloseButton onClick={() => {}} />
          <div className="flex flex-col gap-3 p-4">
            <div className="pr-8">
              <p className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">Occurrence · Individual</p>
              <h3 className="m-0! mt-0.5! text-base! font-semibold! tracking-normal! text-primary! normal-case!">Emu</h3>
              <p className="m-0 text-sm text-tertiary italic">Dromaius novaehollandiae</p>
            </div>
            <SummaryFacts
              facts={[
                { label: "Date", value: "2026-05-15" },
                { label: "Region", value: "Kangaroo Island" },
                { label: "Status", value: <Badge size="sm" color="success">Active</Badge> },
              ]}
            />
          </div>
        </div>
      </Section>
      <ul className="text-balance">
        <li>
          <strong>The facts are rows:</strong> the label at the left, the value at the right edge (where a list&apos;s status column is), a hairline between the rows in the card&apos;s own alpha rule, and one above
          the first. This was chosen from three ways of showing them (rows with lines, rows with space only, and the label and value side by side).
        </li>
        <li>
          <strong>Close is always the top-right corner,</strong> on a solid chip over a photo and bare over the plain header, and Escape closes the card and changes nothing else.
        </li>
      </ul>

      <h2 className="text-balance">The key</h2>
      <Section label="Species group">
        <div className="@container">
          <MapLegend
            title="Species group"
            items={[
              { id: "mammal", label: "Mammal", color: SPECIES_GROUP_COLOR.Mammal },
              { id: "bird", label: "Bird", color: SPECIES_GROUP_COLOR.Bird },
              { id: "plant", label: "Plant", color: SPECIES_GROUP_COLOR.Plant },
            ]}
          />
        </div>
      </Section>

      <h2 className="text-balance">Rules</h2>
      <ul className="text-balance">
        <li>
          <strong>A card that lists what is on the map is built from these parts</strong> (<code>MapResultList</code>, <code>ResultCard</code>, <code>ListToggleButton</code>, <code>SummaryFacts</code>,{" "}
          <code>SummaryCloseButton</code>, <code>MapLegend</code>); it does not draw its own list, its own &quot;show more&quot; or its own scroll area.
        </li>
        <li>
          Floating panels on one map never overlap, and a panel that can grow is height-bounded and scrolls inside itself (CONTRACTS 2.8). The key is in its own box (2.14).
        </li>
        <li>
          A list opened from a table writes each field as the table does: the species with its scientific name first, in italics, then the common name (2.15).
        </li>
        <li>
          The list can be hidden, with the same control and the same words on every such card (<code>ListToggleButton</code>); a card does not draw its own fold. A search that changes the list while it is hidden unfolds at
          the top.
        </li>
        <li>
          Every control on the card has its hit area from its component (2.16): the tabs, the close button and Show N more are 40px to hit with a mouse and 44px on touch.
        </li>
        <li>The card, the key and the zoom buttons share one edge, <code>MAP_SURFACE_EDGE</code>: the neutral dark at 12 per cent, so it reads on the sea, the land and a road alike.</li>
      </ul>

      <h2 className="text-balance">Figma</h2>
      <p className="text-balance">No linked Figma file yet - the pattern was designed in the browser, from the Explore and Map visualise screens, not in Figma first.</p>
    </div>
  );
}
