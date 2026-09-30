---
paths:
  - "/components/**"
  - "app/*docs*/**"
  - "config/design-system.config.ts"
  - "lib/nav.ts"
  - "/README.md"
---

<!-- Hand-maintained: edit in place, current practice only. Rewritten 2026-09-29; the full earlier text, with the incident behind each QA item, is in context/archive/ref-ingest-history.md. -->

# Reference: ingesting components, doc pages and generated screens

How a component is brought in and QA'd, the doc-page template, generated `/test-*` screens, custom components.
Rules live in CONTRACTS.md (components §1.1-§1.9, tokens §2.1, docs §3.9, §4.5, §5.3); this is the how-to.
Where this file and a clause disagree, the clause wins.

## Figma is the source of truth

Where a Figma frame documents a component, it wins on styling (§2.5), and the audit is applied in the same
pass, not raised as a question:

- **Demonstrate only what Figma defines.** A size or type the TypeScript type allows but Figma never drew is
  not shown in Variants; it stays in the API table, which always documents the real interface.
- **Figma's colours, spacing and states override the code, at the token.** Fix the semantic token in
  `app/globals.css` so every consumer changes at once (the focus ring moved to `border-brand` this way for
  every field component), never one component at a time.
- **A state Figma draws as a static swatch needs no static section:** a live doc page already shows hover,
  focus and open by interaction.
- **Un-drawable is not unwanted:** `NativeSelect` has no Figma swatch because the browser renders it; it is
  still a real component.

## DEW vs. Scaffold

In `.claude/rules/ref-scaffold.md`, which also loads for labs and the Prototype tools bar. In one line: what is
being demonstrated is DEW (Barlow); what operates or wraps the demonstration is Scaffold (Geist,
`components/scaffold/controls.tsx`), even where a DEW component of the same shape exists.

## New component workflow

1. **Authorise it first.** A new component is a designer override (§1.4): an entry in
   `contracts/overrides.json` (`npm run contracts:override`), and it starts in `components/custom/**`. It
   must not duplicate an existing component (§1.7).
2. **Bring in the source** from Untitled UI into `components/base/<name>/`. Per the designer's standing
   instruction, the Untitled UI CLI is not run in this repo without their go-ahead; after any CLI run,
   `git status` and `git diff` come first (§1.8): it has silently reverted audited files before.
3. **Attach primitives:** every class resolves through `--ui-*` in `app/globals.css`; no hex or rgba (§2.1). A
   missing utility is added to `globals.css`, not inlined.
4. **Simple or complex:** a simple component is one primitive (`Avatar`); a complex one composes simple ones
   (`AvatarLabelGroup`), and its Usage snippet composes them rather than copying their internals.
5. **Doc page** in the template order below, then **slot it in A-Z** in `config/design-system.config.ts` and
   `lib/nav.ts`, never appended (§3.9).
6. **QA check** below. The component is done when it passes, not before.

## QA check (non-negotiable, post-ingestion)

Every ingest, and every real change to a component, ends with all of these (§0.6 has the general list). Each
item has caught a real shipped bug; the incidents are in the archive.

1. `npx tsc --noEmit` clean. It is not the same as done.
2. `npx eslint` clean on every touched file (it catches what `tsc` doesn't: empty interfaces, unescaped quotes).
3. Every utility class exists in `app/globals.css` (grep it). Plausible names compile to nothing; the known-dead
   ones fail `AUTO §2.1`. `styles/globals.css` is orphaned: nothing imports it.
4. Portaled content (Modal, Popover, a Dropdown menu, a Select list) carries `font-barlow` itself (§2.2).
5. The component renders the same inside and outside `.prose-doc` (§2.7): its headings and paragraphs carry `!`
   overrides where the doc globals would leak in.
6. Copy that can wrap (title, description, label, hint) carries `text-balance` (§2.3).
7. A live browser pass (Playwright): every documented state exercised, keyboard included (§1.9), zero console
   errors, computed styles checked with `getComputedStyle`.
8. If a Figma frame exists, the styling is audited against it on this pass.
9. A bug found here is grepped for in every sibling and dependent file before it is called fixed.
10. A larger issue this pass surfaces is logged in a `context/decisions/` entry, not fixed on the spot and not
    dropped.

## Doc page template

Reference page: `app/(docs)/components/avatar/page.tsx`. Order:

1. `PageHeader` (title, description, a `Config` action that opens the per-page panel).
2. **Component Playground:** one bordered card, a dot-grid canvas (the live DEW component) and a ~300px
   controls panel built only from `components/scaffold/controls.tsx`. Preview state is local with a Reset;
   the options the controls offer come from the config, so the playground and Variants can't drift. The
   canvas chrome is currently repeated inline in each doc page, not a shared component.
3. **Variants:** one `<h2>` and `Section` per demonstrable prop or state, each gated by
   `isFeatureEnabled(config, "<key>")`. Add the `features` key in `config/design-system.config.ts` first; it
   doubles as a toggle in the page's `ContextualConfigPanel` (name it after the section heading).
4. **API:** from the real TypeScript interface; never invent or drop a prop.
5. **Usage:** a real import and minimal JSX.
6. **Figma:** the link if one exists, otherwise an honest "not linked yet". Never a made-up link (§0.3).

`Sizes` and `API` are always shown; every other section has a `features` key. Doc config is live-editable
(`useConfig()`, `lib/config-context.tsx`) and persisted to `localStorage`.

## Generated screens (`/test-*`)

A reconstruction of one Figma product frame, proving it maps onto the library (§4.5). Not a doc page, not a
`/pages/**` screen.

- **No match, no substitute, and no silent drop.** Map every layer to `components/base/**`,
  `components/application/**` or `components/foundations/**` and use the exact API. A control with no DEW
  match gets a visible `<Gap>` (`components/scaffold/gap.tsx`) at its position and a row in the page's gap
  table (§1.2). Plain non-interactive text is just text.
- **A missing structural shell** (an accordion wrapping every section) is composed from real tokens instead,
  with real components inside it, and logged as "composed, not a real component".
- **A gap is closed when it is replaced,** in the same task the component lands: swap the marker, update the
  gap and mapping tables, and log it (§1.3). Any change to a component flows through to every `/test-*` page
  that uses it.
- **All of the screen's own content is Barlow,** plain text included. Only the doc chrome around it is Geist.
- **Every `/test-*` screen ships the token inspector** (`InspectorProvider` around the page, `Inspectable`
  around each element, with a trace taken from the real component source), togglable, and toggling it never
  shifts layout. Reference: `app/(docs)/test-site-details/page.tsx`.

## Custom components (`components/custom/**`)

The tier for a real, working component that has no decided home yet (§1.4): today `date-range`,
`date-picker` and `textarea`.

- **Built from real primitives** (react-aria, existing DEW components), to the same bar as `base/`.
- **Documented under "Custom Components"** (`/custom-components/<name>`, e.g.
  `app/(docs)/custom-components/date-range/page.tsx`): header, API table and usage, but no config entry or
  variant playground until its API settles.
- **Promotion is a move, not a rebuild:** the file moves to `base/` or `application/`, the doc page moves to
  "Components" (with a config entry if it has variants), and every caller is repointed. A custom component
  that duplicates a `base/` one (`custom/textarea` beside `base/textarea`) is a §1.7 defect to resolve by
  migrating callers, not a second option.
