"use client";

import { type FC, type FormEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Fredoka } from "next/font/google";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {
  SearchMd,
  ArrowNarrowUpRight,
  Menu01,
  File06,
  Folder,
  Users01,
  Camera01,
  MarkerPin01,
  Compass03,
  Feather,
  LockUnlocked01,
  GraduationHat01,
  Map01,
  EyeOff,
  ClockRefresh,
  FileDownload02,
  Globe01,
  Target01,
  Database01,
  BookOpen01,
  FileSearch01,
  ShieldTick,
  CheckVerified01,
  HelpCircle,
  PlayCircle,
  Download02,
  LinkExternal01,
  Scale01,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { cx } from "@/utils/cx";
import type { UserRole } from "@/lib/user-role";

// ─────────────────────────────────────────────────────────────────────────
// BioData SA public marketing home page - rebuilt directly against the real
// Figma frame the user supplied (node 155:168, "Version 3"):
// https://www.figma.com/design/u4FTv88XXfy58MiLN5T5Wu/Home---Landing-Page?node-id=155-168
// Per CONTEXT.md's "Figma is the source of truth" contract, every section
// below was re-audited against that frame's actual `get_design_context`
// output (not the first pass's guess from pasted copy alone) - colours,
// copy groupings, section boundaries, and real exported photography/icon
// choices all come from the frame itself, not from re-guessing the earlier
// plain-text dump. Corrections this pass made against the first build:
// - The "Where to next" featured card is "Learn what is BioData SA"
//   (compass-03 icon), not "Explore" - the 2x2 grid beside it holds
//   Explore/Dashboard and Reporting/Contribute Data/Knowledge Centre.
// - The Flora/Fauna/Fungi & Other breakdown is 3 horizontal progress bars
//   next to the growth chart, not a pie/donut - there is no pie in this
//   frame at all.
// - "Researchers/Citizen Scientists/Field Surveys" are 3 static icon+label
//   badges (no switching), not a `Tabs` control - paired with a real
//   photo and the Contribute copy in one dark, gradient-backed section.
// - Explore's right column is 2 real overlapping product-screenshot mockups
//   (downloaded assets), not an icon illustration.
// - The Growth+Dashboard section is solid black, and its 4 stat tiles have
//   no card border/background - they float directly on black, unlike every
//   other stat tile on this page.
// - Every real photo/illustration (hero background, About's background,
//   the Contribute/personas photo, the Knowledge Centre photo, the Explore
//   mockups, the Acknowledgement of Country artwork, the floating cube/
//   treehouse decorations) is a real asset exported from the frame and
//   committed under `public/pages/biodata-home/`, per the design-to-code
//   skill's "never fabricate an image, download the real one" rule - none
//   of it is stock photography chosen after the fact.
// - The hero's stacked "Discover / South Australia's / Biodiversity /
//   Knowledge" wordmark uses Fredoka (Google Font), same as the frame -
//   loaded locally to this page only, since every other DEW/Scaffold
//   surface stays Geist/Barlow (see CONTEXT.md's "Geist stays Geist,
//   Barlow stays Barlow" rule - this is a third, page-scoped exception for
//   one decorative marketing headline, not a sitewide font change). The
//   frame hand-positions each word at its own size/offset for a fixed
//   1728px canvas; that's adapted here into a responsive stacked heading
//   with the same relative size hierarchy rather than pixel-cloned offsets,
//   since absolute per-word positioning doesn't survive a real viewport.
// - Obvious source typos are corrected, not transcribed: "Kinddoms" ->
//   "Kingdoms", "Dat Contributors" -> "Data Contributors". Every em/en-dash
//   in the copy is a plain hyphen per the no-em-dash rule.
// - The primary nav/header does have a real equivalent in the frame (a
//   header row above the hero, logo/wordmark + the same 6 nav links +
//   Login/Contribute Data) - confirmed visually via a full-frame render,
//   which the first pass's node-tree search missed. It already matches
//   closely enough (same links, same white bar) that no further pixel
//   audit was needed this pass.
// - Small decorative-only elements with no content meaning (the scroll-cue
//   chevrons, background blob/wave vectors, a partner-logo strip image
//   whose real logos aren't known) are left out rather than approximated -
//   same "a plain decorative layer doesn't need reproducing" allowance as
//   a Figma designer's note layer.
//
// Corrective pass (20-point user annotation review against the live page):
// - The "treehouse" decoration (node 155:178, a pale circle with a
//   branching leaf/coral silhouette) was wrongly scaled down and pinned to
//   the hero's own bottom-right corner, where it visually collided with the
//   4th stat card. Figma's real coordinates (x=1080-1967, y=969-1856 of the
//   1728px canvas) place it bleeding from the hero into the persona
//   statement section below - moved there as that section's missing
//   background line art, and removed from the hero.
// - Hero stat row switched `flex-wrap` -> `flex-nowrap` (+ `overflow-x-auto`
//   fallback) - node 155:198 is a fixed, non-wrapping 1336px/4-card row in
//   Figma, never a 2-line wrap.
// - Persona-statement paragraph (node 155:310) hard-wrapped to the real
//   4 lines Figma renders, instead of one reflowing paragraph.
// - "Where to next" 2x2 grid: row gap is 64px (`--spacing-7xl`), column gap
//   is 40px (`--spacing-5xl`) - two different tokens, not one uniform
//   `gap-10`. Featured card's gradient stops corrected to the frame's real
//   34% / 81.3% / 133.7%. Compass icon's stroke thinned (`strokeWidth={0.8}`)
//   to match the real exported asset's ~4px weight at this size, instead of
//   `@untitledui/icons`' default (which scales to ~10px here).
// - About section's darkening overlay opacities bumped up slightly per
//   direct feedback that it read too light against the frame.
// - Explore mockups enlarged and shifted to bleed down to the section's own
//   bottom edge, matching how far they extend in the frame.
// - Contribute column spacing corrected against node 155:264/155:280/
//   155:284: persona icons 48px apart (was 32px), the divider 20px below
//   the personas and 20px above the heading (was 48px both sides), and the
//   heading block 32px above the body paragraph (was flattened to the same
//   16px as the eyebrow-to-heading gap).
// - Acknowledgement of Country heading bumped to `text-3xl` to match every
//   other section H2 on this page.
// - Verified as already correct and left unchanged: the hero search bar
//   (node 155:193 matches the real `Input`/`Button` usage here almost
//   exactly), the sticky header's white background and 38px logo height,
//   the Contribute section's photo (already the real, flush-left asset),
//   and the two Contribute CTA buttons (node 155:303 confirms Figma's real
//   design does have "Learn how to Contribute" + "Contribute Data" here,
//   contradicting one piece of feedback asking to remove them - kept as
//   both a source-of-truth match and a user-facing note, not silently
//   overridden either way).
//
// Further corrective pass, per direct feedback:
// - The "treehouse" decoration (node 155:178) is removed outright - tried in the hero, then moved
//   to the persona-statement section, neither placement was wanted. Not re-added a third time.
// - The "Where to next" featured card and the Personas+Contribute section both switch their
//   background from the frame's own gradient (#4a8c8c -> #0d576e) to a flat `bg-brand-solid`
//   (brand-600, DEW's real "marine teal" token) - an explicit, deliberate divergence from the
//   literal Figma export in favour of design-system consistency, not a fidelity regression.
// - Acknowledgement of Country re-checked directly against node 15:3227 (the same section, also
//   present unchanged in "Version 2" of the frame): the gap between the photo and text column is
//   80px (`gap-[80px]`), not the 32px this had, and the gap between the heading and paragraph
//   inside the text column is 32px, not 16px.
// - Acknowledgement of Country's photo/text split was badly broken, not just mis-spaced: putting
//   `aspect-[1536/864]` directly on a `flex-1` <img> broke the browser's flex-basis:0% resolution
//   for that replaced element, so the image rendered at ~90% of the row width and pushed the text
//   column almost entirely outside the visible container. Fixed with the wrapper-div pattern
//   already used for every other aspect-ratio image on this page (`aspect-[...] flex-1` on a plain
//   div, the real `<img>` absolutely filling it) - verified via `getBoundingClientRect` that the
//   photo and text now split the row exactly 50/50, matching the frame's two `flex-[1_0_0]` halves.
//
// Content/IA round, per direct feedback (not a Figma-fidelity pass - several of these are
// deliberate departures from the frame):
// - "Knowledge Centre" renamed to "Resources & User Guides" - only the header nav label and the
//   section's own eyebrow (its H2 "Learn, apply and share.", its "Where to next" grid tile name,
//   and the footer's "Knowledge Centre" link were left alone since feedback didn't flag them).
// - The "References"/"Training resource" utility buttons next to "Browse knowledge base" are
//   removed (the "References" *tile* in the 8-tile grid is unrelated and stays).
// - Every checklist item on the page (About/Explore/Contribute, and the Knowledge Centre grid)
//   gets its own topic-relevant icon instead of the frame's repeated check-circle/layers-three-02 -
//   `CheckBadge`/`FeatureRow` now take an `icon` prop per item instead of a single hardcoded one.
// - A 9th Knowledge Centre tile, "Biodiversity Act" (not in the frame), added per direct feedback -
//   its description stays deliberately general rather than asserting specific legislative
//   provisions this build has no way to verify.
// - About section's height increased ~10% (`py-16 md:py-24` -> `py-[70px] md:py-[106px]`).
// - Explore, Contribute, and Knowledge Centre's internal vertical spacing re-audited directly
//   against `get_design_context` (not metadata, not assumption) and corrected to the frame's real
//   nested gap values - each section had at least one flattened gap where Figma nests two
//   different spacing tokens (e.g. Explore's eyebrow-to-heading is 16px but heading-block-to-
//   feature-list is 32px; both had been collapsed into one uniform gap). Explore's own section
//   padding also went from 96px to the frame's real 160px, matching the Acknowledgement/Knowledge
//   Centre sections' own 160px already fixed in an earlier round.
// - Contribute's two CTAs ("Learn how to Contribute", "Contribute Data") switched from filled
//   `Button`s to plain text links (matching the "Learn More" link already used on the featured
//   "Where to next" card) per direct feedback - "Contribute Data" also renamed to "Contribute Now"
//   and lost its leading upload icon to match the other link's trailing-arrow-only style. This
//   directly contradicts this file's own earlier note that node 155:303 confirms Figma's real
//   button styling here - a deliberate, explicit divergence from the frame, same category of
//   override as the flat `bg-brand-solid` backgrounds above, not a fidelity regression.
// - The black Growth+Dashboard section was a meaningfully different structure from node 155:566,
//   not just mis-spaced - re-audited per direct feedback ("match exactly like the figma layout").
//   The frame is a single vertical stack: the chart+percentage-bars block spans the full width on
//   top, and *below* it (not beside it) a second row holds the 4 stat tiles on the left and the
//   "Insights..." text block on the right. The first build put the stat tiles in their own
//   full-width row below everything and the text block beside the chart in a two-column layout -
//   both wrong relative to the frame's actual two-row structure.
// - Knowledge Centre's left column/tile grid switched from bottom-aligned to top-aligned
//   (`lg:items-start`, not `lg:items-end`) and the left column widened (`1.3fr` vs the tile grid's
//   `1fr` - the frame's own tile grid is a fixed ~656px, the left column takes the rest, wider than
//   the roughly-even split this had) so the photo renders larger, both per direct feedback.
// - Partial reversal, per direct feedback: "Contribute Now" switches back from a plain text link
//   to a real `secondary` Button (its immediate neighbour, "Learn how to Contribute", stays a text
//   link - only "Contribute Now" was asked to change back). Header nav's "Contribute Data" label
//   shortened to "Contribute" (the section eyebrow, the "Where to next" grid tile title, and the
//   header's own primary "Contribute Data" button were not flagged and stay as they are).
// - Two of this round's four items ("Contribute Now" as a secondary Button, header nav's
//   "Contribute" label) were exact re-reports of the previous round's fixes - verified both were
//   still correctly applied rather than assuming stale feedback, same as earlier re-reports on this
//   page. The other two were real: Knowledge Centre's "Browse knowledge base" button is removed
//   (the left column now ends with the photo), and its two columns are equal width
//   (`lg:grid-cols-2`, replacing the previous round's wider-left-column `1.3fr/1fr` split) per
//   direct feedback.
// - A new bottom section added per direct request: node 15:3517 (also 155:487 in "Version 3"), a
//   real SA Government legal/compliance footer strip (Disclaimer/Privacy/Accessibility links, the
//   Creative Commons licence line, the copyright notice, and the SA.GOV.AU/White Ribbon Workplace/
//   Green Building Council Australia/Reconciliation SA partner marks). Downloaded and committed as
//   a real exported asset rather than redrawn - these are real organisation marks, not decoration.
//   Sits below the site's own footer, on the frame's own `#0d576e` background (brand-700), distinct
//   from the footer's gray-900.
// - The site's own 4-column footer (`Biodata SA`/Explore/Contribute/Resources, `footerColumns`/
//   `footerLinkHrefs`) is removed outright per direct feedback - the government legal/compliance
//   strip above is now the last thing on the page. `id="site-footer"` moved onto that strip so the
//   header nav's "Contact Us" anchor still lands somewhere real.
// - The Explore section's two separate mockup screenshots (with their own hand-added border/
//   shadow treatment) are replaced with a single user-supplied composite image
//   (`explore-mockup-combined.png`, already includes its own shadow/frame styling) per direct
//   request - rendered plainly (`w-full`, no added border/shadow/positioning) since the image is
//   self-contained. The two old assets are deleted, not just unreferenced.
// - Header's primary CTA button renamed "Contribute Data" -> "Explore", and its target updated to
//   match (`#explore`, not `#contribute`) - the header nav's separate "Contribute"/"Explore" text
//   links are untouched, only this one button.
// - The "remove this [footer] section" feedback in this round was an exact re-report of a fix
//   already applied and verified live in the previous round - re-confirmed rather than re-applied.
// - The "Where to next" grid tile that duplicated "Knowledge Centre"/"Visit Knowledge Centre"
//   (title + CTA, `whereToNextGrid`) is renamed to "Resources & User Guides" per direct feedback -
//   this extends the earlier nav-label-only rename (see the "Knowledge Centre" comment above
//   `NAV_LINKS`) to this second, previously-missed spot. The main Knowledge Centre section's own
//   H2 and the footer's "Knowledge Centre" link are still untouched, unflagged so far. The same
//   round's "remove this [footer] section" item was, again, an exact re-report of an already-
//   applied removal - re-confirmed, not re-applied, same as the previous round.
// ─────────────────────────────────────────────────────────────────────────

const fredoka = Fredoka({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-fredoka" });

// "Knowledge Centre" renamed to "Resources & User Guides" per direct feedback - initially only
// this nav label and the section's own eyebrow (below); a later round (see the changelog above)
// extended the rename to the "Where to next" grid tile's title/CTA too. The section's own H2 and
// the footer's own "Knowledge Centre" link are still left as-is since feedback hasn't flagged them.
// This page is the signed-out front door, so every hand-off into `/pages/**` carries the
// `public-user` role explicitly. That is also `DEFAULT_USER_ROLE` now, but the link stays explicit so
// the URL always says who is looking and never changes meaning if the default does. See
// `lib/use-role-href.ts` for the same problem in-app.
const LANDING_ROLE: UserRole = "public-user";
const publicUserHref = (path: string) => `${path}?userRole=${LANDING_ROLE}`;

const EXPLORE_ROUTE = publicUserHref("/pages/project-list");
const DASHBOARD_ROUTE = publicUserHref("/pages/dashboard");

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "What is Biodata", href: "#about" },
  { label: "Explore", href: "#explore" },
  { label: "Contribute", href: "#contribute" },
  { label: "Dashboard", href: DASHBOARD_ROUTE },
  { label: "Resources & User Guides", href: "#knowledge-centre" },
  { label: "Contact Us", href: "#site-footer" },
];

function Container({ className, children }: { className?: string; children: ReactNode }) {
  // Figma's own sections aren't built on this site's default 1280px docs
  // container - most (Explore, Knowledge Centre, Acknowledgement) use an
  // 80px side-padding column on a 1728px canvas, i.e. ~1569px of content;
  // this default matches that instead. Sections with a different real
  // width (the footer's own 1280px column, the hero's 1446px content
  // frame, "Where to next"'s 1440px row, the black growth section's
  // ~1200px column) override it per call site.
  return <div className={cx("mx-auto max-w-[1569px] px-4 sm:px-8 lg:px-20", className)}>{children}</div>;
}

// The frame's own text-secondary-700/eyebrow colour (#414651) is an
// unrebranded Untitled UI default that doesn't exist anywhere in this
// codebase's real gray scale (DEW's own gray-700 is #585451) - normalized
// to the semantic `text-quaternary` token this repo already uses for every
// other small-caps eyebrow label (see dashboard/page.tsx), rather than
// introducing a second, foreign gray.
function Eyebrow({ tone = "default", children }: { tone?: "default" | "light"; children: ReactNode }) {
  return (
    <p className={cx("text-sm font-medium tracking-wide uppercase", tone === "light" ? "text-[#b3dbdb]" : "text-quaternary")}>
      {children}
    </p>
  );
}

// The one repeated "icon in a translucent circle" badge every checklist on
// this page uses (About, Explore, Contribute) - only the circle's own
// background differs per section (matched exactly to the frame's own value
// for that section), so it takes the colour as a prop rather than being
// re-implemented per section. The frame itself repeats a plain check-circle
// in every one of these badges; per direct feedback each checklist item now
// gets its own topic-relevant icon instead (see the feature arrays below).
function CheckBadge({ bgClassName, icon: Icon }: { bgClassName: string; icon: FC<{ className?: string }> }) {
  return (
    <span className={cx("flex size-8 shrink-0 items-center justify-center rounded-full", bgClassName)}>
      <Icon className="size-4 text-[#0d576e]" />
    </span>
  );
}

interface Feature {
  label: string;
  icon: FC<{ className?: string }>;
}

function FeatureRow({ bgClassName, textClassName, feature }: { bgClassName: string; textClassName: string; feature: Feature }) {
  return (
    <li className="flex flex-1 items-center gap-3">
      <CheckBadge bgClassName={bgClassName} icon={feature.icon} />
      <span className={cx("text-base", textClassName)}>{feature.label}</span>
    </li>
  );
}

interface WhereToNextItem {
  title: string;
  description: string;
  cta: string;
  href: string;
}

const whereToNextGrid: WhereToNextItem[] = [
  { title: "Explore BioData SA", description: "Search biodiversity records with rich scientific filters - species, projects, locations and more.", cta: "Start Exploring", href: EXPLORE_ROUTE },
  { title: "Dashboard and Reporting", description: "Explore live indicators, species trends and project statistics at a glance.", cta: "View Dashboard", href: DASHBOARD_ROUTE },
  { title: "Contribute Data", description: "Share your projects and observations so they can inform conservation and planning across the state.", cta: "Contribute Now", href: "#contribute" },
  { title: "Resources & User Guides", description: "Guides, standards, taxonomy, training and documentation for recording and using biodiversity data.", cta: "Resources & User Guides", href: "#knowledge-centre" },
];

interface KnowledgeCentreTileData {
  title: string;
  description: string;
  icon: FC<{ className?: string }>;
}

// The frame repeats one shared icon (layers-three-02) across every tile - per direct feedback,
// each tile now gets its own topic-relevant icon instead. "Biodiversity Act" is a new 9th tile
// (not in the frame), added per direct feedback, with a description that stays deliberately
// general rather than asserting specific legislative provisions this build can't verify.
const knowledgeCentreTiles: KnowledgeCentreTileData[] = [
  { title: "Getting Started", description: "Orientation guides for new users of Biodata and NatureMaps.", icon: BookOpen01 },
  { title: "References", description: "Technical references for data schemas, APIs and integrations.", icon: FileSearch01 },
  { title: "Policies", description: "Access, privacy and sensitive records policies.", icon: ShieldTick },
  { title: "Standards", description: "Data quality, taxonomy and spatial standards.", icon: CheckVerified01 },
  { title: "FAQs", description: "Courses on species recording and metadata practice.", icon: HelpCircle },
  { title: "Video tutorials", description: "Short walkthroughs of key workflows and tools.", icon: PlayCircle },
  { title: "Downloads", description: "Templates, field forms and reference datasets.", icon: Download02 },
  { title: "Other Useful Links", description: "Find links to partner data contributors and enablers.", icon: LinkExternal01 },
  { title: "Biodiversity Act", description: "Understand the legislation that protects and guides the management of South Australia's biodiversity.", icon: Scale01 },
];

const dashboardStats = [
  { label: "Total Records", value: "6,812,430", sub: "+128k in 2025", icon: File06 },
  { label: "Species", value: "640,000+", sub: "Across 8 Kingdoms", icon: Users01 },
  { label: "Projects", value: "1,487", sub: "1,120 active", icon: Folder },
  { label: "Data Contributors", value: "240+", sub: "212 Active", icon: Users01 },
];

const kingdomBreakdown = [
  { label: "Flora", percent: 42 },
  { label: "Fauna", percent: 38 },
  { label: "Fungi & Other", percent: 20 },
];

// Per direct feedback, each checklist item gets its own topic-relevant icon instead of the frame's
// repeated check-circle (see `FeatureRow`/`CheckBadge` above).
const exploreFeatures: Feature[] = [
  { label: "Map-first results", icon: MarkerPin01 },
  { label: "Sensitive record controls", icon: EyeOff },
  { label: "Time-based filtering", icon: ClockRefresh },
  { label: "Export for research", icon: FileDownload02 },
];
const aboutFeatures: Feature[] = [
  { label: "Standards-based species records", icon: Feather },
  { label: "Open access for approved use", icon: LockUnlocked01 },
  { label: "Curated by DEW scientists", icon: GraduationHat01 },
  { label: "Feeds NatureMaps & national atlases", icon: Map01 },
];
const contributeFeatures: Feature[] = [
  { label: "Support conservation outcomes", icon: Globe01 },
  { label: "Improve environmental planning", icon: Target01 },
  { label: "Preserve biodiversity knowledge", icon: Database01 },
  { label: "Help future generations", icon: Users01 },
];
const personas = [
  { label: "Researchers", icon: Users01 },
  { label: "Citizen Scientists", icon: Camera01 },
  { label: "Field Surveys", icon: MarkerPin01 },
];

// ─────────────────────────────────────────────────────────────────────────
// "Biodiversity Records Growth" - the frame gives the aggregate stat
// (+297% over 2019-2026) and the year range, not a real per-year dataset,
// so this plots a derived compound-growth index (2019 = 100) rather than
// inventing plausible-looking absolute record counts that don't exist.
// ─────────────────────────────────────────────────────────────────────────
const GROWTH_START_YEAR = 2019;
const GROWTH_END_YEAR = 2026;
const GROWTH_MULTIPLIER = 3.97; // 1 + 297%

function GrowthChart() {
  const years = Array.from({ length: GROWTH_END_YEAR - GROWTH_START_YEAR + 1 }, (_, i) => GROWTH_START_YEAR + i);
  const values = years.map((year) => Math.round(100 * Math.pow(GROWTH_MULTIPLIER, (year - GROWTH_START_YEAR) / (GROWTH_END_YEAR - GROWTH_START_YEAR))));

  const options: Highcharts.Options = {
    chart: { type: "area", height: 208, backgroundColor: "transparent", style: { fontFamily: "inherit" }, spacing: [8, 8, 0, 0] },
    title: { text: undefined },
    credits: { enabled: false },
    accessibility: { enabled: false },
    xAxis: {
      categories: years.map(String),
      lineColor: "rgba(255,255,255,0.2)",
      tickColor: "rgba(255,255,255,0.2)",
      labels: { style: { color: "rgba(255,255,255,0.7)", fontSize: "11px" } },
    },
    yAxis: { title: { text: undefined }, gridLineWidth: 0, labels: { enabled: false } },
    legend: { enabled: false },
    tooltip: {
      formatter: function () {
        return `<b>${this.x}</b><br/>Growth index: ${this.y} (2019 = 100)`;
      },
    },
    plotOptions: {
      area: {
        color: "#b3dbdb",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(179,219,219,0.5)"],
            [1, "rgba(179,219,219,0)"],
          ],
        },
        marker: { fillColor: "#b3dbdb", lineWidth: 0 },
        lineWidth: 2,
      },
    },
    series: [{ type: "area", name: "Records growth index", data: values }],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

function KingdomBars() {
  return (
    <div className="grid grid-cols-1 gap-6 border-t border-white/20 pt-6 sm:grid-cols-3">
      {kingdomBreakdown.map((slice) => (
        <div key={slice.label} className="flex flex-col gap-1.5">
          <p className="text-xs text-white">{slice.label}</p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#414651]">
            <div className="h-1 rounded-full bg-[#b3dbdb]" style={{ width: `${slice.percent}%` }} />
          </div>
          <p className="text-xs text-white">{slice.percent}%</p>
        </div>
      ))}
    </div>
  );
}

function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button color="secondary" iconLeading={Menu01} aria-label="Open navigation" className="lg:hidden" />
      <ModalOverlay isDismissable>
        <Modal className="w-full max-w-xs">
          <Dialog aria-label="Navigation">
            <nav aria-label="Primary" className="font-barlow flex flex-col gap-0.5 p-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-primary outline-brand hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

export default function BiodataHomePage() {
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");

  const runSearch = (e: FormEvent) => {
    e.preventDefault();
    router.push(EXPLORE_ROUTE);
  };

  return (
    <div className={cx("font-barlow min-h-screen bg-primary", fredoka.variable)}>
      {/* ── Header (no equivalent node in the frame - simplified nav chrome, see file header note) ── */}
      <header className="sticky top-0 z-30 border-b border-secondary bg-white">
        <Container className="flex h-18 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MobileNav />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pages/dashboard/gov-sa-dew-lockup.png"
              alt="Government of South Australia, Department for Environment and Water"
              className="h-[38px] w-auto"
            />
            <div className="hidden h-6 w-px bg-secondary sm:block" />
            <p className="hidden text-[17px] font-semibold tracking-tight text-primary sm:block">Biodata SA</p>
          </div>

          <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="text-sm font-medium text-secondary hover:text-primary">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button color="secondary" size="sm" href="/pages/auth/login">
              Login
            </Button>
            <Button color="secondary" size="sm" href="/pages/auth/signup">
              Sign up
            </Button>
            <Button color="primary" size="sm" href={DASHBOARD_ROUTE}>
              Explore
            </Button>
          </div>
        </Container>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pages/biodata-home/hero-bg.png" alt="" className="size-full object-cover" />
          <div
            className="absolute inset-0 opacity-50"
            style={{ backgroundImage: "linear-gradient(174deg, rgb(74, 140, 140) 7%, rgb(13, 87, 110) 73%)" }}
          />
        </div>
        {/* Figma's hero frame (155:185) is exactly 1446px wide with no further inner padding - its
            own children's margins (e.g. the 55px each side around the 1336px-wide stat row) are
            already baked into their own widths. `lg:px-0` avoids double-applying the shared
            `Container`'s own 80px side padding on top of this cap, which was otherwise shrinking
            the available width below what 4 fixed-310px stat cards need to fit on one line. */}
        <Container className="relative flex max-w-[1446px] flex-col items-center gap-10 px-4 py-16 text-center sm:px-8 md:py-24 lg:px-0">
          {/* Exact pixel-for-pixel reproduction of node 155:187's overlapping word-stack (a fixed
              1446px-wide collage, not a normal stacked heading) - shown from `lg` up, where the
              hero content column is wide enough to hold it without clipping. A plain centred stack
              covers narrower viewports instead of scaling the fixed offsets down, since the collage
              only reads correctly at its authored size. */}
          <div
            style={{ fontFamily: "var(--font-fredoka)" }}
            className="relative hidden h-[316px] w-[566px] shrink-0 text-white lg:grid lg:grid-cols-[max-content] lg:grid-rows-[max-content] lg:place-items-start"
          >
            <p className="relative col-1 row-1 mt-0 ml-10 text-[40px] leading-none font-medium whitespace-nowrap">Discover</p>
            <p className="relative col-1 row-1 mt-11 ml-4 text-[72px] leading-none font-semibold whitespace-nowrap">South Australia&apos;s</p>
            <p className="relative col-1 row-1 mt-[124px] ml-0 text-[102px] leading-none font-semibold whitespace-nowrap">Biodiversity</p>
            <p className="relative col-1 row-1 mt-[239px] ml-[146px] text-[64px] leading-none font-normal whitespace-nowrap">Knowledge</p>
          </div>
          <h1 style={{ fontFamily: "var(--font-fredoka)" }} className="flex flex-col items-center text-white lg:hidden">
            <span className="text-3xl font-medium">Discover</span>
            <span className="text-5xl font-semibold">South Australia&apos;s</span>
            <span className="text-6xl font-semibold">Biodiversity</span>
            <span className="text-4xl font-normal">Knowledge</span>
          </h1>

          <div className="flex w-full flex-col items-center gap-[38px]">
            <form onSubmit={runSearch} className="flex w-full max-w-[1024px] flex-col items-stretch gap-2 sm:flex-row">
              <div className="flex-1 text-left">
                <Input
                  size="lg"
                  icon={SearchMd}
                  placeholder='Try: "Red Kangaroo in Deep Creek National Park" or "Study on Rare Rodents"'
                  value={heroQuery}
                  onChange={setHeroQuery}
                />
              </div>
              <Button type="submit" color="primary" size="lg" iconTrailing={ArrowNarrowUpRight}>
                Search in BioData SA
              </Button>
            </form>

            <p className="max-w-full text-xl text-white">
              <span className="font-bold">Biodata SA</span> is South Australia&apos;s primary biodiversity information platform -
              <br className="hidden sm:block" /> supporting conservation, research, environmental planning and evidence-based
              decision making with millions of trusted species records.
            </p>

            {/* Node 155:198 is a fixed, non-wrapping 1336px row (4 x 310px cards, 32px gaps) -
                `flex-nowrap` matches that; a horizontal scroll is the fallback below the width
                this needs, rather than letting the row wrap onto 2 lines the way Figma never does. */}
            <div className="flex flex-nowrap items-start justify-center gap-8 overflow-x-auto">
              {[
                { icon: File06, value: "6.8M+", label: "Biodiversity Records" },
                { icon: Users01, value: "640,000+", label: "Species Documented" },
                { icon: Folder, value: "1,500+", label: "Active Projects" },
                { icon: Users01, value: "240+", label: "Data Contributors" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex w-[310px] shrink-0 flex-col items-start gap-3 rounded-xl border border-[#b3dbdb] p-4 text-left"
                  style={{ backgroundImage: "linear-gradient(125deg, rgba(0,0,0,0.125) 34%, rgba(255,255,255,0) 114%)" }}
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-white/70">
                    <stat.icon className="size-6 text-[#0d576e]" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xl font-medium text-white">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Persona statement ──
          Node 155:310 positions this as a large (48px), left-weighted paragraph absolutely placed
          on the page (left: 135px, width: 791px in the 1728px canvas) - not a centred, independently
          padded section. Approximated here as a left-aligned block roughly matching that width and
          horizontal position, rather than a symmetric centred statement.
          The "treehouse" decoration (node 155:178) was tried here (and, before that, in the hero) -
          removed per direct feedback rather than kept in either place. */}
      <section className="relative py-16 md:py-20">
        <Container className="relative">
          <p className="max-w-[791px] text-2xl text-primary md:text-3xl">
            Whether you&apos;re a <span className="font-semibold text-[#0d576e]">researcher</span>,
            <br />
            <span className="font-semibold text-[#0d576e]">ecologist</span>,{" "}
            <span className="font-semibold text-[#0d576e]">planner</span> or{" "}
            <span className="font-semibold text-[#0d576e]">citizen scientist</span>,
            <br />
            Biodata SA gives you a clear starting
            <br />
            point for the task at hand.
          </p>
        </Container>
      </section>

      {/* ── Where to next ── */}
      <section className="pb-16 md:pb-24">
        <Container className="flex max-w-[1440px] flex-col gap-4 px-4 sm:px-8 lg:px-0">
          <Eyebrow>Where to next</Eyebrow>

          <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
            {/* Featured card - fixed 320x384, matching node 155:228's size exactly. Background
                switched from the frame's own gradient (#4a8c8c -> #0d576e) to a flat fill of the
                real design-system token, `bg-brand-solid` (brand-600, DEW's "marine teal"), per
                direct feedback - a deliberate divergence from the literal Figma export in favour of
                design-system consistency, not an oversight. */}
            <div className="relative flex h-[384px] w-[320px] shrink-0 flex-col gap-3 rounded-xl border border-[#b3dbdb] bg-brand-solid p-4">
              {/* Figma's real exported icon (node 155:229) renders at stroke-width 4 on a 120px
                  frame; @untitledui/icons' Compass03 defaults to stroke-width 2 on a 24-unit
                  viewBox, which scales to an effective 10px at this size - `strokeWidth={0.8}`
                  brings it down to the real ~4px weight instead of the too-bold default. */}
              <Compass03 className="size-[120px] shrink-0 text-white" strokeWidth={0.8} />
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-2xl font-bold text-white">Learn what is BioData SA</h3>
                  <p className="text-base text-white">Understand South Australia&apos;s biodiversity information platform and how it supports evidence-based conservation.</p>
                </div>
                <a href="#about" className="inline-flex items-center gap-1.5 text-base font-semibold text-white hover:underline">
                  Learn More
                  <ArrowNarrowUpRight className="size-5" />
                </a>
              </div>
              {/* Two small decorative circles overlapping the card's bottom-left corner, bleeding
                  onto the white background outside it - plain CSS circles, not a real icon, so no
                  asset download is needed to reproduce them faithfully. */}
              <span aria-hidden className="pointer-events-none absolute -bottom-8 -left-8 size-16 rounded-full bg-white/10" />
              <span aria-hidden className="pointer-events-none absolute bottom-3 left-16 size-3 rounded-full bg-white/40" />
            </div>

            {/* 2x2 grid - fixed 160px card height, matching node 155:235. Row gap is 64px
                (--spacing-7xl) between the two rows, column gap is 40px (--spacing-5xl) between
                the two cards in a row - these are two different tokens in the frame, not one
                uniform gap. */}
            <div className="grid flex-1 grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2">
              {whereToNextGrid.map((item) => (
                <div key={item.title} className="flex h-[160px] flex-col justify-between rounded-xl border border-[#b3dbdb] bg-white p-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-2xl font-bold text-[#0d576e]">{item.title}</h3>
                    <p className="text-base text-secondary">{item.description}</p>
                  </div>
                  <Button color="link-gray" size="sm" href={item.href} iconTrailing={ArrowNarrowUpRight} className="self-start">
                    {item.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── About ── */}
      <section id="about" className="relative">
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pages/biodata-home/about-bg.png" alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,42,51,0.72)] to-transparent" />
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "linear-gradient(90deg, rgba(13,87,110,0.95) 0%, rgba(13,87,110,0.65) 50%, rgba(0,0,0,0.08) 100%)" }}
          />
        </div>
        {/* Section height increased ~10% over the previous `py-16 md:py-24` per direct feedback
            (64px/96px -> 70px/106px). */}
        <Container className="relative flex flex-col gap-16 py-[70px] md:py-[106px]">
          <div className="flex max-w-2xl flex-col gap-8">
            <div className="flex flex-col gap-4">
              <Eyebrow tone="light">About Biodata SA</Eyebrow>
              <h2 className="text-3xl font-bold text-white">A living record of South Australia&apos;s species and ecosystems.</h2>
              <p className="text-base text-white">
                Biodata SA brings together decades of biodiversity observations from government surveys, universities,
                conservation organisations and citizen scientists into a single, trusted source.
              </p>
              <p className="text-base text-white">
                It&apos;s used by researchers, ecologists, planners and communities to understand where species occur, monitor
                change over time, and make informed decisions that protect South Australia&apos;s natural heritage - from arid
                rangelands to coastal wetlands.
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {aboutFeatures.map((feature) => (
                <FeatureRow key={feature.label} bgClassName="bg-white/50" textClassName="text-white" feature={feature} />
              ))}
            </ul>
            <Button color="secondary" href="#knowledge-centre" className="self-start" iconTrailing={ArrowNarrowUpRight}>
              Learn More About Biodata SA
            </Button>
          </div>

          {/* Node 155:563 sits at 61% from the left and overflows 50px past the section's own
              bottom edge onto the section below - a deliberate floating overlap, not a mistake to
              clip away. `overflow-hidden` moved onto the background image layer above so this can
              hang below the section boundary the way the frame does. */}
          <div className="w-[320px] rounded-xl bg-white p-4 shadow-lg lg:absolute lg:top-[91%] lg:left-[61%]">
            <p className="text-base font-bold text-[#0d576e]">Trusted since 1974</p>
            <p className="text-base text-secondary">Five decades of curated biodiversity records for South Australia.</p>
          </div>
        </Container>
      </section>

      {/* ── Explore ──
          Node 155:400's outer padding is 160px top/bottom (`py-[var(--spacing-11xl,160px)]`), not
          the 96px this had - a real, substantial mismatch, not a rounding difference. */}
      <section id="explore" className="py-16 md:py-24 lg:py-40">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          {/* Node 155:402's own gap is 24px between [eyebrow+h2], [detail block], [button] - three
              siblings at this level, not one flat list. Nested below to match: 403 (eyebrow->h2,
              16px), 407 (408-block -> feature list, 32px), 408 (subheading -> paragraphs, 12px). */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <Eyebrow>Explore Biodata SA</Eyebrow>
              <h2 className="text-3xl font-bold text-primary">Explore South Australia&apos;s biodiversity records.</h2>
            </div>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <p className="text-lg font-bold text-primary">A discovery experience</p>
                <div className="flex flex-col gap-6">
                  <p className="text-base text-secondary">
                    Search millions of observations using rich scientific filters. Refine by species, place, project, method or
                    evidence - and drill down into the records that matter for your work.
                  </p>
                  <p className="text-base text-secondary">
                    The catalogue is designed like a research workspace, not a database - filters stack visually, results
                    respond instantly, and every record links back to its source and evidence.
                  </p>
                </div>
              </div>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {exploreFeatures.map((feature) => (
                  <FeatureRow key={feature.label} bgClassName="bg-[rgba(179,219,219,0.3)]" textClassName="text-secondary" feature={feature} />
                ))}
              </ul>
            </div>
            <Button color="primary" href={EXPLORE_ROUTE} className="self-start" iconTrailing={ArrowNarrowUpRight}>
              Search in BioData SA
            </Button>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pages/biodata-home/explore-mockup-combined.png"
            alt="BioData SA map-based search and records table mockups"
            className="hidden w-full lg:block"
          />
        </Container>
      </section>

      {/* ── Personas + Contribute ── */}
      {/* Background switched from the frame's own gradient (#4a8c8c -> #0d576e) to a flat fill of
          `bg-brand-solid` (brand-600, DEW's "marine teal"), same direct feedback and same reasoning
          as the "Where to next" featured card above. */}
      <section id="contribute" className="relative overflow-hidden bg-brand-solid">
        <div className="relative mx-auto grid max-w-[1728px] grid-cols-1 lg:grid-cols-2">
          <div className="relative hidden min-h-[600px] lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pages/biodata-home/contribute-photo.png" alt="A field researcher recording an observation near the water" className="absolute inset-0 size-full object-cover" />
          </div>

          <div className="flex flex-col gap-5 px-4 py-16 sm:px-8 lg:px-20 lg:py-24">
            {/* Node 155:264's 3 persona items sit 48px apart (item widths 88/123/93 with 48px
                gaps between them), not the 32px `gap-8` this had - and the divider (155:280) sits
                only 20px below the persona row and 20px above the heading block, not the 48px
                `gap-12`/`pt-12` this had on both sides of it. */}
            <div className="flex items-center justify-center gap-12">
              {personas.map((persona) => (
                <div key={persona.label} className="flex flex-col items-center gap-2">
                  <span className="flex size-14 items-center justify-center rounded-full bg-white/30">
                    <persona.icon className="size-6 text-white" />
                  </span>
                  <p className="text-base font-medium whitespace-nowrap text-white">{persona.label}</p>
                </div>
              ))}
            </div>

            {/* Node 155:281's own gap is 64px between [the eyebrow/heading/paragraph/checklist
                block] and [the buttons row] - not the 20px this had. Node 155:282's own gap (32px)
                between [283: eyebrow+heading+paragraph] and [the checklist] was also missing - the
                checklist previously sat as a flat sibling at the outer 20px level instead of nested
                with 32px above it. */}
            <div className="flex flex-col gap-16 border-t border-white/30 pt-5">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <Eyebrow tone="light">Contribute</Eyebrow>
                    <h2 className="text-3xl font-bold text-white">Help grow South Australia&apos;s biodiversity knowledge.</h2>
                  </div>
                  <p className="text-base text-white">
                    Every observation helps scientists understand biodiversity, monitor change and protect species. Whether
                    it&apos;s a single sighting or a full survey, your data strengthens conservation across the state.
                  </p>
                </div>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {contributeFeatures.map((feature) => (
                    <FeatureRow key={feature.label} bgClassName="bg-[#b3dbdb]" textClassName="text-white" feature={feature} />
                  ))}
                </ul>
              </div>
              {/* "Learn how to Contribute" stays a plain text link (matching the "Learn More" link
                  on the featured "Where to next" card) - "Contribute Now" switched back to a real
                  `secondary` Button per direct feedback. */}
              <div className="flex flex-wrap items-center gap-6">
                <a href="#contribute" className="inline-flex items-center gap-1.5 text-base font-semibold text-white hover:underline">
                  Learn how to Contribute
                  <ArrowNarrowUpRight className="size-5" />
                </a>
                <Button color="secondary" href="#contribute" iconTrailing={ArrowNarrowUpRight}>
                  Contribute Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Biodiversity Records Growth + Dashboard ──
          Re-audited directly against node 155:566 per direct feedback ("match exactly like the
          figma layout") - this was a meaningfully different structure from the two-column build it
          replaces, not just a spacing tweak. The frame is a single 1200px-wide vertical stack
          (`155:572`, 56px gap): the chart+percentage-bars block spans the full width on top, and
          *below* it - not beside it - a second row holds the 4 stat tiles (`155:650`, ~611px) on
          the left and the "Insights that drive conservation outcomes" text block (`155:642`,
          ~532px, right-aligned in the frame) on the right. The stat tiles were previously their own
          full-width row underneath everything, and the text block sat in a same-height column next
          to the chart - both wrong relative to the frame's actual two-row layout. */}
      <section className="bg-black py-16 md:py-24">
        <Container className="max-w-[1200px]">
          <div className="flex flex-col gap-14">
            <div className="flex flex-col gap-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-medium text-white">Biodiversity Records Growth</p>
                  <p className="text-sm text-white">{GROWTH_START_YEAR} - {GROWTH_END_YEAR}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">+297%</p>
                  <p className="text-xs text-white">7-year growth</p>
                </div>
              </div>
              <GrowthChart />
              <KingdomBars />
            </div>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.15fr_1fr]">
              <div className="grid grid-cols-2 gap-8">
                {dashboardStats.map((stat) => (
                  <div key={stat.label} className="flex flex-col items-start gap-2">
                    <span className="flex size-10 items-center justify-center rounded-full bg-white/70">
                      <stat.icon className="size-6 text-[#0d576e]" />
                    </span>
                    <p className="text-base font-semibold text-white">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-base text-white">{stat.sub}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold tracking-[1.8px] text-white uppercase">Dashboard</p>
                  <h2 className="text-3xl font-bold text-white">Insights that drive conservation outcomes</h2>
                </div>
                <p className="text-lg text-white">
                  The Biodata dashboard delivers real-time analytics on biodiversity trends, species distribution, survey
                  coverage and ecological change across South Australia. Track observations over time, identify data gaps and
                  monitor the health of native ecosystems.
                </p>
                <Button color="secondary" href={DASHBOARD_ROUTE} className="self-start" iconTrailing={ArrowNarrowUpRight}>
                  Open Dashboard
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Knowledge Centre ──
          Eyebrow renamed to "Resources & User Guides" per direct feedback (see `NAV_LINKS` note).
          "References"/"Training resource" buttons removed in an earlier round; "Browse knowledge
          base" removed per this round's direct feedback too - the left column now ends with the
          photo, no button row. Node 155:434's own gap is 80px between the left column and the tile
          grid (not the 48px this had); node 155:435's own gap is 64px between [eyebrow+heading+
          description] and [the photo] (not the flat 32px this had). Top-aligned per direct feedback
          (`lg:items-start`, not `lg:items-end`); the two columns are equal width per direct
          feedback (a later round asked for this over the previous round's wider-left-column fix -
          the frame's own ~833px/~656px split was never matched exactly by either version). */}
      <section id="knowledge-centre" className="py-16 md:py-24">
        <Container className="grid grid-cols-1 gap-20 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-16">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <Eyebrow>Resources &amp; User Guides</Eyebrow>
                <h2 className="text-3xl font-bold text-primary">Learn, apply and share.</h2>
              </div>
              <p className="text-base text-secondary">
                A single hub for the guides, standards and training that help you record, manage and use biodiversity data with
                confidence.
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pages/biodata-home/knowledge-centre-photo.png" alt="Field survey work in South Australia" className="aspect-[1960/784] w-full rounded-2xl object-cover" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {knowledgeCentreTiles.map((tile) => (
              <div key={tile.title} className="flex gap-5 rounded-xl border border-secondary bg-primary p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#b3dbdb]">
                  <tile.icon className="size-4 text-[#0d576e]" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-semibold text-[#0d576e]">{tile.title}</h3>
                  <p className="text-base text-secondary">{tile.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Acknowledgement of Country ──
          Node 15:3227 (also present, identically, as 155:169): a 64px-gap flex-col at the section
          level (not used here since this is a single row), an 80px gap between the photo and text
          column (`gap-[80px]`, not the 32px this had), and a 32px gap between the heading and
          paragraph inside the text column (`gap-[32px]`, not the 16px this had).
          The photo and text are meant to be equal 50/50 flex halves (both `flex-[1_0_0]` in the
          frame) - putting `aspect-[...]` directly on a `flex-1` <img> breaks the browser's
          flex-basis:0% resolution for a replaced element (the image's intrinsic aspect ratio ends
          up driving its own width instead of the flex distribution), which was rendering the image
          at ~90% of the row and pushing the text column almost entirely outside the container.
          Fixed with the standard pattern used everywhere else on this page: `aspect-[...]` on a
          plain flex-1 wrapper div, the real `<img>` absolutely filling it. */}
      <section className="bg-[#f5f5f5] py-8">
        <Container className="flex flex-col gap-8 md:flex-row md:items-center md:gap-20">
          <div className="relative aspect-[1536/864] flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pages/biodata-home/acknowledgement-art.png" alt="Aboriginal artwork" className="absolute inset-0 size-full object-cover" />
          </div>
          <div className="flex flex-1 flex-col gap-8">
            <h2 className="text-3xl font-bold text-secondary">Acknowledgement of Country</h2>
            <p className="text-base text-secondary">
              The state government acknowledges Aboriginal people as the First Peoples and Nations of the lands and waters we
              live and work upon and we pay our respects to their Elders past, present and emerging. We acknowledge and respect
              the deep spiritual connection and the relationship that Aboriginal and Torres Strait Islander people have to
              Country.
              <br />
              <br />
              We work in partnership with the First Peoples of South Australia and support their Nations to take a leading role
              in caring for their Country.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Government legal/compliance strip (node 15:3517, also present as 155:487 in
          "Version 3") - a real SA Government footer banner (Disclaimer/Privacy/Accessibility
          links, the Creative Commons licence line, copyright notice, and the SA.GOV.AU/White
          Ribbon Workplace/Green Building Council/Reconciliation SA partner marks), exported and
          committed as a real asset rather than reproduced by hand - these are real organisation
          marks, not decoration to redraw. Background is `#0d576e` (brand-700) per the frame.
          Now the last section on the page - the site's own 4-column footer (`Biodata SA`/Explore/
          Contribute/Resources) was removed per direct feedback, and `id="site-footer"` moved here
          so the header nav's "Contact Us" anchor still lands somewhere real at the page's end. */}
      <div id="site-footer" className="flex justify-center bg-[#0d576e] px-2.5 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pages/biodata-home/footer-legal-strip.png"
          alt="Disclaimer, Privacy, Accessibility. This site is licensed under a Creative Commons Attribution 3.0 Australia Licence. Copyright Department for Environment and Water 2026. SA.GOV.AU, White Ribbon Workplace, Green Building Council Australia member, Reconciliation South Australia Inc."
          className="h-[74px] w-full max-w-[1282px] object-contain"
        />
      </div>
    </div>
  );
}
