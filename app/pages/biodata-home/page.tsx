"use client";

import { type FormEvent, type ReactNode, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {
  SearchLg,
  ChevronRight,
  Menu01,
  File06,
  Folder,
  Users01,
  Camera01,
  MarkerPin01,
  Map01,
  LogIn01,
  UserPlus01,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { cx } from "@/utils/cx";
import type { UserRole } from "@/lib/user-role";
import { assetPath } from "@/lib/base-path";
import { HomeLayoutTools } from "@/app/pages/biodata-home/layout-switcher";

// ─────────────────────────────────────────────────────────────────────────
// BioData SA public home page: our content (the original home page, now `version-2/page.tsx`) placed in the DEW
// homepage template the marketing team approved, "Home page design-desktop-final":
// https://www.figma.com/design/bJ3db2lwkLbYdKQ02knXyf/DEW-design-mock-up-for-studio-Veld?node-id=4625-5923
//
// What comes from the template: the 140px teal header (reversed DEW lockup, bold 18px nav, utility links
// top right), the photo hero with a dark gradient headline panel and the floating white search card, the
// quick links (label, chevron, rule beneath), the white and grey
// bands alternating down the page, the 1200px split article card, teal pill buttons with a chevron, the
// big-number stats row, the white tile cards, the grey footer, the grey Acknowledgment of Country band and the
// teal deep footer with the four partner marks. Colours are the template's: brand-700 (#0d576e, the template's
// `--primary`) for the header, buttons and deep footer, and the nearest gray tokens for its neutrals
// (#f5f5f5 -> gray-100, #d9d9d9 -> gray-300).
//
// What stays ours: every piece of copy, every link, every photo, the search, the growth chart and the
// numbers. Nothing from the template's own content (news, events, newsletter, DEW contact details, the
// lighthouse photo) is carried over. Where it sits: the hero panel holds the headline; "Where to next" is the quick links; the dashboard takes the "Latest news" band and carries the
// key numbers in the template's stats row (one set of figures, not two); About, Explore and Contribute are
// split article cards with their features as bullet points; Resources is one section in the Insights
// treatment, its photo beside the heading and its guides in the quick-link rows.
//
// Designer feedback, 14 Oct 2026: the "Where to next" heading and persona sentence removed and the quick links
// put under the template's "You might be looking for . . ." header, each row the same height so the rules line
// up; every eyebrow chip removed (not in the approved design); feature chips shown as bullet points; Resources
// combined into one section; the separate stats section folded into Insights; the four hero shortcut pills
// replaced by the header's Explore button beside the search, "search or Explore".
// Second round: the quick links titled "Get started with BioData SA" and set flush with it; the Resources guides
// in the quick-link rows; the bullets in one column; the key numbers scaled down to sit with the section heading;
// the Explore image rebuilt from the live Explore screens (`v2/explore-mockup.png`).
// Third round: the hero keeps only the headline; a short search placeholder that fits the field; the Resources
// guides are clickable rows like the quick links, with a "coming soon" toast until their pages exist.
//
// Type: Barlow only. The template mixes in Open Sans (section titles, dates, stat numbers) and the original
// used Fredoka for the hero wordmark; both are set in Barlow here at the template's sizes and weights
// (H2 36 bold, quick-link heading 32 bold, H3 24/32 bold, body 16/24, quick link 18/24,
// button 16 bold, nav 18 bold, stat 48 bold).
//
// Left out on purpose: the hero carousel controls and photo caption (one photo, location not known), the
// nav chevrons (our links have no menus, so a dropdown chevron would promise one), the template's
// newsletter, social and contact blocks (no content of ours to put in them).
// ─────────────────────────────────────────────────────────────────────────

const LANDING_ROLE: UserRole = "public-user";
const publicUserHref = (path: string) => `${path}?userRole=${LANDING_ROLE}`;

const EXPLORE_ROUTE = publicUserHref("/pages/observations");
const DASHBOARD_ROUTE = publicUserHref("/pages/dashboard");
const LOGIN_ROUTE = "/pages/auth/login";
const SIGNUP_ROUTE = "/pages/auth/signup";

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "What is Biodata", href: "#about" },
  { label: "Explore", href: "#explore" },
  { label: "Contribute", href: "#contribute" },
  { label: "Dashboard", href: DASHBOARD_ROUTE },
  { label: "Resources & User Guides", href: "#knowledge-centre" },
  { label: "Contact Us", href: "#site-footer" },
];

// An item with no `href` has no page yet: its row says so in a toast when chosen (QuickRowComingSoon).
const whereToNext: { title: string; description: string; href?: string }[] = [
  { title: "Learn what is BioData SA", description: "Understand South Australia's biodiversity information platform and how it supports evidence-based conservation." },
  { title: "Explore BioData SA", description: "Search biodiversity records with rich scientific filters - species, projects, locations and more.", href: EXPLORE_ROUTE },
  { title: "Dashboard and Reporting", description: "Explore live indicators, species trends and project statistics at a glance.", href: DASHBOARD_ROUTE },
  { title: "Contribute Data", description: "Share your projects and observations so they can inform conservation and planning across the state.", href: LOGIN_ROUTE },
  { title: "Resources & User Guides", description: "Guides, standards, taxonomy, training and documentation for recording and using biodiversity data." },
];

const resources = [
  { title: "Getting Started", description: "Orientation guides for new users of Biodata and NatureMaps." },
  { title: "References", description: "Technical references for data schemas, APIs and integrations." },
  { title: "Policies", description: "Access, privacy and sensitive records policies." },
  { title: "Standards", description: "Data quality, taxonomy and spatial standards." },
  { title: "FAQs", description: "Courses on species recording and metadata practice." },
  { title: "Video tutorials", description: "Short walkthroughs of key workflows and tools." },
  { title: "Downloads", description: "Templates, field forms and reference datasets." },
  { title: "Other Useful Links", description: "Find links to partner data contributors and enablers." },
  { title: "Biodiversity Act", description: "Understand the legislation that protects and guides the management of South Australia's biodiversity." },
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

const aboutFeatures = ["Standards-based species records", "Open access for approved use", "Curated by DEW scientists", "Feeds NatureMaps & national atlases"];
const exploreFeatures = ["Map-first results", "Sensitive record controls", "Time-based filtering", "Export for research"];
const contributeFeatures = ["Support conservation outcomes", "Improve environmental planning", "Preserve biodiversity knowledge", "Help future generations"];
const personas = [
  { label: "Researchers", icon: Users01 },
  { label: "Citizen Scientists", icon: Camera01 },
  { label: "Field Surveys", icon: MarkerPin01 },
];

const footerPartners = [
  { src: "footer-sa-gov-au.png", alt: "SA.GOV.AU", width: 122 },
  { src: "footer-white-ribbon.png", alt: "White Ribbon Workplace", width: 148 },
  { src: "footer-gbca.png", alt: "Green Building Council Australia member", width: 138 },
  { src: "footer-reconciliation-sa.png", alt: "Reconciliation South Australia Inc.", width: 144 },
];

const v2Asset = (file: string) => assetPath(`/pages/biodata-home/v2/${file}`);
const v1Asset = (file: string) => assetPath(`/pages/biodata-home/${file}`);

// The template's 1200px content column (its sections sit at x=120 on a 1440 canvas).
function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-[1200px] px-4 sm:px-6 xl:px-0", className)}>{children}</div>;
}

// The template's teal pill button ("Read more news", "Read full article"): Barlow Bold 16, a chevron
// after the label, fully rounded. Built on the DEW Button, recoloured to the template's brand-700.
function PillButton({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Button
      color="primary"
      href={href}
      iconTrailing={ChevronRight}
      className={cx(
        "h-10 rounded-full bg-brand-700 px-6 text-base font-bold shadow-none before:rounded-full hover:bg-brand-800 *:data-icon:text-white hover:*:data-icon:text-white",
        className,
      )}
    >
      {children}
    </Button>
  );
}

function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cx("text-[36px] leading-[44px] font-bold tracking-[-0.36px] text-balance text-primary", className)}>{children}</h2>;
}

// The template's "Article section": a 1200 x 450 card, photo on one half, text on the other.
function ArticleCard({
  id,
  image,
  imageAlt,
  imageSide = "left",
  imageFit = "cover",
  children,
}: {
  id?: string;
  image: string;
  imageAlt: string;
  imageSide?: "left" | "right";
  imageFit?: "cover" | "contain";
  children: ReactNode;
}) {
  return (
    <article id={id} className="grid scroll-mt-6 overflow-hidden rounded-lg bg-white shadow-lg lg:min-h-[450px] lg:grid-cols-2">
      <div className={cx("relative min-h-[260px]", imageSide === "right" && "lg:order-2")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={imageAlt}
          className={cx("absolute inset-0 size-full", imageFit === "cover" ? "object-cover" : "object-contain p-2 lg:p-4")}
        />
      </div>
      <div className="flex flex-col gap-[25px] px-6 py-8 sm:px-[65px] sm:py-[46px]">{children}</div>
    </article>
  );
}

function ArticleTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-2xl leading-8 font-bold text-balance text-primary">{children}</h2>;
}

function Body({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-base leading-6 text-pretty text-primary", className)}>{children}</p>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5 text-base leading-6 text-primary marker:text-brand-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// The template's quick link: an 18/24 label, a chevron at the right, a rule beneath, the label flush with the
// section heading. Ours carries a one-line description under the label so none of the original's copy is lost.
// A row whose page is not built yet (the Resources guides, two of the Get started items) looks and behaves like the others, and says so in a
// toast when chosen instead of going nowhere silently.
const quickRowClass = "flex w-full items-start justify-between gap-4 border-b border-primary pt-[11px] pb-3";

function QuickRowText({ title, description, link }: { title: string; description: string; link?: boolean }) {
  return (
    <span className="flex flex-col gap-1">
      <span className={cx("text-lg leading-6 text-primary", link && "group-hover:underline")}>{title}</span>
      <span className="text-sm leading-5 text-pretty text-tertiary">{description}</span>
    </span>
  );
}

function QuickLink({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className={cx(quickRowClass, "group outline-brand focus-visible:outline-2 focus-visible:outline-offset-2")}>
      <QuickRowText title={title} description={description} link />
      <ChevronRight aria-hidden className="mt-0.5 size-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function QuickRowComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <button
      type="button"
      onClick={() => toast.brand(`${title} is coming soon`, { description: "This page hasn't been built yet." })}
      className={cx(quickRowClass, "group cursor-pointer text-left outline-brand focus-visible:outline-2 focus-visible:outline-offset-2")}
    >
      <QuickRowText title={title} description={description} link />
      <ChevronRight aria-hidden className="mt-0.5 size-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

// Highcharts draws to SVG attributes, which cannot read a CSS variable, so the brand colour is read from
// the token once mounted instead of being written here as a literal.
const noSubscribe = () => () => {};
function useBrandColour() {
  return useSyncExternalStore(
    noSubscribe,
    () => getComputedStyle(document.documentElement).getPropertyValue("--color-brand-700").trim(),
    () => undefined,
  );
}

const GROWTH_START_YEAR = 2019;
const GROWTH_END_YEAR = 2026;
const GROWTH_MULTIPLIER = 3.97; // 1 + 297%, a derived index (2019 = 100), as in the original home page

function GrowthChart() {
  const brand = useBrandColour();
  if (!brand) return <div className="h-[208px]" />;

  const years = Array.from({ length: GROWTH_END_YEAR - GROWTH_START_YEAR + 1 }, (_, i) => GROWTH_START_YEAR + i);
  const values = years.map((year) => Math.round(100 * Math.pow(GROWTH_MULTIPLIER, (year - GROWTH_START_YEAR) / (GROWTH_END_YEAR - GROWTH_START_YEAR))));
  const fill = new Highcharts.Color(brand);

  const options: Highcharts.Options = {
    chart: { type: "area", height: 208, backgroundColor: "transparent", style: { fontFamily: "inherit" }, spacing: [8, 8, 0, 0] },
    title: { text: undefined },
    credits: { enabled: false },
    accessibility: { enabled: false },
    xAxis: { categories: years.map(String), labels: { style: { fontSize: "12px" } } },
    yAxis: { title: { text: undefined }, gridLineWidth: 0, labels: { enabled: false } },
    legend: { enabled: false },
    tooltip: {
      formatter: function () {
        return `<b>${this.x}</b><br/>Growth index: ${this.y} (2019 = 100)`;
      },
    },
    plotOptions: {
      area: {
        color: brand,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, fill.setOpacity(0.35).get("rgba") as string],
            [1, fill.setOpacity(0).get("rgba") as string],
          ],
        },
        marker: { fillColor: brand, lineWidth: 0 },
        lineWidth: 2,
      },
    },
    series: [{ type: "area", name: "Records growth index", data: values }],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button color="secondary" iconLeading={Menu01} aria-label="Open navigation" className="min-[1440px]:hidden" />
      <ModalOverlay isDismissable>
        <Modal className="w-full max-w-xs">
          <Dialog aria-label="Navigation">
            <nav aria-label="Primary" className="font-barlow flex flex-col gap-0.5 p-2">
              {[...NAV_LINKS, { label: "Log in", href: LOGIN_ROUTE }, { label: "Sign up", href: SIGNUP_ROUTE }].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-3 py-2 text-left text-base font-bold text-primary outline-brand hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
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

export default function BiodataHomeVersion2Page() {
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");

  const runSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = heroQuery.trim();
    router.push(term ? `/pages/observations?q=${encodeURIComponent(term)}&userRole=${LANDING_ROLE}` : EXPLORE_ROUTE);
  };

  return (
    <div className="font-barlow min-h-screen bg-primary text-primary">
      <HomeLayoutTools current="option-1" />
      {/* ── Header (template node 4347:2441) ── */}
      <header className="bg-brand-700 text-white">
        <div className="mx-auto flex max-w-[1440px] items-stretch justify-between gap-4 pr-4 sm:pr-[30px]">
          {/* The DEW lockup, then the product's name after a divider, as the original home page's header has it. */}
          <div className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v2Asset("dew-logo-reversed.png")}
              alt="Government of South Australia, Department for Environment and Water"
              className="h-[64px] w-auto shrink-0 sm:h-[140px]"
            />
            <div aria-hidden className="mr-3 h-7 w-px bg-white/40 sm:mr-5 sm:h-10" />
            <p className="text-base font-semibold whitespace-nowrap text-white sm:text-xl">BioData SA</p>
          </div>

          <div className="flex flex-col items-end justify-center py-3 sm:justify-between sm:pt-[23px] sm:pb-3">
            <div className="hidden items-center gap-6 pr-[14px] sm:flex">
              <Link href={LOGIN_ROUTE} className="hit-area inline-flex items-center gap-2 text-base text-white hover:underline">
                Log in
                <LogIn01 aria-hidden className="size-6" />
              </Link>
              <Link href={SIGNUP_ROUTE} className="hit-area inline-flex items-center gap-2 text-base text-white hover:underline">
                Sign up
                <UserPlus01 aria-hidden className="size-6" />
              </Link>
            </div>

            <div className="flex items-center gap-6">
              <nav aria-label="Primary" className="hidden items-center gap-7 min-[1440px]:flex">
                {NAV_LINKS.map((link) => (
                  <Link key={link.label} href={link.href} className="hit-area text-lg leading-none font-bold whitespace-nowrap text-white hover:underline">
                    {link.label}
                  </Link>
                ))}
              </nav>
              <MobileNav />
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero banner + search (template nodes 4625:5945, 4625:5946, 4625:5949) ── */}
        <section aria-labelledby="hero-heading" className="relative">
          <div className="relative h-[420px] overflow-hidden sm:h-[500px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v1Asset("hero-bg.png")} alt="" className="absolute inset-0 size-full object-cover" />
            <Container className="relative pt-10 sm:pt-[57px]">
              <div className="max-w-[552px] rounded-lg bg-linear-to-r from-black/45 to-black/25 px-6 py-6 sm:px-[41px] sm:py-7">
                <h1 id="hero-heading" className="font-bold tracking-[-0.48px] text-balance text-white text-shadow-lg text-shadow-black/50">
                  <span className="block text-2xl leading-[52px] sm:text-[32px]">Discover South Australia&apos;s</span>
                  <span className="block text-[40px] leading-[48px] sm:text-[52px] sm:leading-[52px]">Biodiversity Knowledge</span>
                </h1>
              </div>
            </Container>
          </div>

          <Container className="relative z-10 -mt-[86px]">
            <div className="mx-auto flex max-w-[776px] flex-col items-stretch gap-4 rounded-lg bg-white/80 px-4 py-6 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:gap-5 sm:px-[47px] sm:py-[33px]">
              <form onSubmit={runSearch} className="flex flex-1 items-stretch" role="search">
                <div className="flex-1">
                  <Input
                    aria-label="Search BioData SA"
                    placeholder='Try "Red Kangaroo" or "Rare Rodents"'
                    value={heroQuery}
                    onChange={setHeroQuery}
                    onClear={() => setHeroQuery("")}
                    clearLabel="Clear search"
                    wrapperClassName="rounded-r-none"
                    inputClassName="text-base"
                  />
                </div>
                <Button
                  type="submit"
                  color="primary"
                  iconLeading={SearchLg}
                  aria-label="Search in BioData SA"
                  className="w-[63px] shrink-0 rounded-l-none rounded-r-lg bg-brand-700 shadow-none before:rounded-l-none hover:bg-brand-800 *:data-icon:size-6 *:data-icon:text-white hover:*:data-icon:text-white"
                />
              </form>
              <span className="text-center text-base font-bold text-primary">or</span>
              <Link
                href={EXPLORE_ROUTE}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2.5 rounded-full bg-brand-700 px-[25px] text-base font-bold whitespace-nowrap text-white outline-brand hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Explore
                <Map01 aria-hidden className="size-4" />
              </Link>
            </div>
          </Container>
        </section>

        {/* ── Where to next, in the template's quick links (4625:5950) ── */}
        <section className="pt-12 pb-16">
          <Container className="flex flex-col gap-8">
            <h2 className="text-[32px] leading-8 font-bold text-primary">Get started with BioData SA</h2>
            <ul className="grid grid-cols-1 gap-x-[52px] gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              {whereToNext.map((item) => (
                <li key={item.title} className="flex">
                  {item.href ? <QuickLink {...item} href={item.href} /> : <QuickRowComingSoon {...item} />}
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* ── Dashboard, in the template's grey "Latest news" band (4625:5932), with the template's big-number stats row (4222:1327) ── */}
        <section className="bg-gray-100 py-[57px]">
          <Container className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <SectionTitle>Insights that drive conservation outcomes</SectionTitle>
              <Body className="max-w-[791px]">
                The Biodata dashboard delivers real-time analytics on biodiversity trends, species distribution, survey coverage and
                ecological change across South Australia. Track observations over time, identify data gaps and monitor the health of
                native ecosystems.
              </Body>
            </div>

            <ul className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
              {dashboardStats.map((stat) => (
                <li key={stat.label} className="flex flex-col gap-3">
                  <stat.icon aria-hidden className="size-8 text-brand-700" />
                  <div className="flex flex-col gap-1">
                    <p className="text-[32px] leading-10 font-bold tracking-[-0.32px] text-primary tabular-nums">{stat.value}</p>
                    <p className="text-lg leading-6 font-semibold text-primary">{stat.label}</p>
                    <p className="text-sm leading-5 text-tertiary">{stat.sub}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-6 rounded-lg border border-secondary bg-white px-5 py-[15px] shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl leading-8 font-bold text-primary">Biodiversity Records Growth</h3>
                  <p className="text-sm leading-5 font-semibold text-primary">
                    {GROWTH_START_YEAR} - {GROWTH_END_YEAR}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl leading-8 font-bold text-brand-700 tabular-nums">+297%</p>
                  <p className="text-sm leading-5 text-primary">7-year growth</p>
                </div>
              </div>
              <GrowthChart />
              <div className="grid grid-cols-1 gap-6 border-t border-secondary pt-5 sm:grid-cols-3">
                {kingdomBreakdown.map((slice) => (
                  <div key={slice.label} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm leading-4 text-primary">{slice.label}</p>
                      <p className="text-sm leading-4 font-semibold text-primary tabular-nums">{slice.percent}%</p>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-300">
                      <div className="h-1.5 rounded-full bg-brand-700" style={{ width: `${slice.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>


            <PillButton href={DASHBOARD_ROUTE} className="self-center">
              Open Dashboard
            </PillButton>
          </Container>
        </section>

        {/* ── About, as the template's article section, photo left (4625:5940) ── */}
        <section className="py-[90px]">
          <Container>
            <ArticleCard id="about" image={v1Asset("about-bg.png")} imageAlt="A short-beaked echidna among leaf litter">
              <ArticleTitle>A living record of South Australia&apos;s species and ecosystems.</ArticleTitle>
              <Body>
                BioData SA brings together decades of biodiversity observations from government surveys, universities, conservation
                organisations and citizen scientists into a single, trusted source.
              </Body>
              <Body>
                It&apos;s used by researchers, ecologists, planners and communities to understand where species occur, monitor change over
                time, and make informed decisions that protect South Australia&apos;s natural heritage - from arid rangelands to coastal
                wetlands.
              </Body>
              <BulletList items={aboutFeatures} />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-base leading-5 text-primary">
                  <span className="font-bold">Trusted since 1974.</span> Five decades of curated biodiversity records for South Australia.
                </p>
                <PillButton href="#knowledge-centre">Learn More About BioData SA</PillButton>
              </div>
            </ArticleCard>
          </Container>
        </section>

        {/* ── Explore, the template's second article section on grey, photo right (4625:5954) ── */}
        <section className="bg-gray-100 py-[90px]">
          <Container>
            <ArticleCard
              id="explore"
              image={v2Asset("explore-mockup.png")}
              imageAlt="BioData SA Explore: a species search on the map, and the occurrence records it found"
              imageSide="right"
              imageFit="contain"
            >
              <ArticleTitle>Explore South Australia&apos;s biodiversity records.</ArticleTitle>
              <div className="flex flex-col gap-3">
                <h3 className="text-lg leading-6 font-bold text-primary">A discovery experience</h3>
                <Body>
                  Search millions of observations using rich scientific filters. Refine by species, place, project, method or evidence -
                  and drill down into the records that matter for your work.
                </Body>
                <Body>
                  The catalogue is designed like a research workspace, not a database - filters stack visually, results respond
                  instantly, and every record links back to its source and evidence.
                </Body>
              </div>
              <BulletList items={exploreFeatures} />
              <PillButton href={EXPLORE_ROUTE} className="self-start">
                Search in BioData SA
              </PillButton>
            </ArticleCard>
          </Container>
        </section>

        {/* ── Contribute, article section, photo left ── */}
        <section className="py-[90px]">
          <Container>
            <ArticleCard id="contribute" image={v1Asset("contribute-photo.png")} imageAlt="A field researcher recording an observation near the water">
              <ArticleTitle>Help grow South Australia&apos;s biodiversity knowledge.</ArticleTitle>
              <Body>
                Every observation helps scientists understand biodiversity, monitor change and protect species. Whether it&apos;s a single
                sighting or a full survey, your data strengthens conservation across the state.
              </Body>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {personas.map((persona) => (
                  <li key={persona.label} className="inline-flex items-center gap-2.5 text-sm leading-5 font-semibold text-primary">
                    <persona.icon aria-hidden className="size-5" />
                    {persona.label}
                  </li>
                ))}
              </ul>
              <BulletList items={contributeFeatures} />
              <div className="flex flex-wrap items-center gap-6">
                <Link href="#contribute" className="inline-flex items-center gap-1.5 text-base font-bold text-brand-700 hover:underline">
                  Learn how to Contribute
                  <ChevronRight aria-hidden className="size-5" />
                </Link>
                <PillButton href={LOGIN_ROUTE}>Contribute Now</PillButton>
              </div>
            </ArticleCard>
          </Container>
        </section>

        {/* ── Resources & User Guides, one section in the Insights treatment ── */}
        <section id="knowledge-centre" className="scroll-mt-6 bg-gray-100 py-[57px]">
          <Container className="flex flex-col gap-8">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <SectionTitle>Learn, apply and share.</SectionTitle>
                <Body>
                  A single hub for the guides, standards and training that help you record, manage and use biodiversity data with
                  confidence.
                </Body>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v1Asset("knowledge-centre-photo.png")}
                alt="Field survey work in South Australia"
                className="aspect-[5/2] w-full rounded-lg object-cover shadow-lg"
              />
            </div>

            <ul className="grid grid-cols-1 gap-x-[52px] gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              {resources.map((item) => (
                <li key={item.title} className="flex">
                  <QuickRowComingSoon {...item} />
                </li>
              ))}
            </ul>
          </Container>
        </section>

      </main>

      {/* ── Footer (6081:3376): the links row, then DEW's "Contact us" block as the template has it. The newsletter,
          social and feedback blocks are left out (no content of ours). `id="site-footer"` keeps the header's
          "Contact Us" landing here. ── */}
      <footer id="site-footer">
        <div className="flex flex-col gap-8 border-t border-gray-300 bg-gray-100 py-8">
          <Container>
            {/* Every link has a separator before it and the list is pulled left by one separator's width, clipped:
                the separator that starts a line is hidden, so a wrapped line never begins with "|". */}
            <nav aria-label="Footer" className="overflow-hidden">
              <ul className="-ml-5 flex flex-wrap items-center gap-y-2 text-base font-bold text-primary">
                {NAV_LINKS.filter((link) => link.label !== "Contact Us").map((link) => (
                  <li key={link.label} className="flex items-center">
                    <span aria-hidden className="w-5 text-center text-gray-400">
                      |
                    </span>
                    <Link href={link.href} className="hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Container>
          <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <address className="flex flex-col text-base leading-8 text-primary not-italic">
              <h2 className="font-bold">Contact us</h2>
              <span>Department for Environment and Water</span>
              <span>81-95 Waymouth Street</span>
              <span>Adelaide SA 5000</span>
              <span className="mt-4">
                Phone:{" "}
                <a href="tel:+61882041910" className="hover:underline">
                  8204 1910
                </a>
              </span>
            </address>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v2Asset("south-australia-brand.png")} alt="South Australia" className="h-[76px] w-auto" />
          </Container>
        </div>

        {/* Acknowledgment of Country (4625:5953), with the original's artwork kept beside it. */}
        <div className="bg-gray-300 py-7">
          <Container className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v1Asset("acknowledgement-art.png")}
              alt="Aboriginal artwork"
              className="aspect-[1536/864] w-full shrink-0 rounded-lg object-cover md:w-[240px]"
            />
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl leading-8 font-bold text-primary">Acknowledgement of Country</h2>
              <Body>
                The state government acknowledges Aboriginal people as the First Peoples and Nations of the lands and waters we live and work
                upon and we pay our respects to their Elders past, present and emerging. We acknowledge and respect the deep spiritual
                connection and the relationship that Aboriginal and Torres Strait Islander people have to Country.
              </Body>
              <Body>
                We work in partnership with the First Peoples of South Australia and support their Nations to take a leading role in caring
                for their Country.
              </Body>
            </div>
          </Container>
        </div>

        {/* Deep footer (4341:2459): the same legal line and partner marks the original carried as one flattened image, as live text. */}
        <div className="bg-brand-700 text-white">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-[30px] sm:px-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <p className="text-base font-bold">Disclaimer&nbsp;&nbsp;|&nbsp;&nbsp;Privacy&nbsp;&nbsp;|&nbsp;&nbsp;Accessibility</p>
              <p className="text-sm leading-4">
                This site is licensed under a{" "}
                <a href="https://creativecommons.org/licenses/by/3.0/au/" target="_blank" rel="noreferrer" className="underline">
                  Creative Commons Attribution 3.0 Australia Licence
                </a>
                .
                <br />© Copyright Department for Environment and Water 2026
              </p>
            </div>
            <ul className="flex flex-wrap items-center gap-x-[52px] gap-y-4">
              {footerPartners.map((partner) => (
                <li key={partner.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v2Asset(partner.src)} alt={partner.alt} style={{ width: partner.width }} className="h-[50px] object-contain" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

