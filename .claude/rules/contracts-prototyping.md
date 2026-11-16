---
paths:
  - "app/pages/**"
  - "app/proto/**"
  - "app/_prototype-tools/**"
  - "lib/layers.ts"
---

<!-- GENERATED from CONTRACTS.md by scripts/build-contract-rules.mjs (CONTRACTS.md 5.5). Do not edit: change CONTRACTS.md, then run `npm run contracts:rules`. -->

# DEW contracts: prototyping

Prototype tools bar and competing layout options: what previews on a screen, and how options are presented and retired. Full text and numbering: CONTRACTS.md.

### §3.8 Floating dev tools

The preview controls (the role, a screen's layout options, a simulated run's outcome) live on one bar,
the Prototype tools (`app/_prototype-tools/`), mounted once per screen as `<PrototypeTools />`:
draggable, above every map overlay (`z-[10000]`), and MUST NOT be compensated for with padding or margin
in product layout. Modals and slide-over panels sit above it (`z-[20000]`, `lib/layers.ts`): a modal covers
everything, the dev tools included.

- A tool shows only where it applies: the role is always there, and any other tool is added by the code
  that owns it (`useRegisterTool`), only while it is on screen and has something to do. MUST NOT add a
  separate floating button for a preview control, or show a tool on a screen where it does nothing.
- The bar is Scaffold (§1.5): Geist, react-aria primitives, never DEW components, and coloured in Flinders
  Violet so it never reads as part of the product.

### §3.14 Every form has the Pre-fill sample content switch

A form MUST call `useSampleContent` (`app/_prototype-tools/sample-content.ts`), so the Prototype tools bar's "Pre-fill sample content" switch fills it and a walk-through never starts with typing. A form is a `FormPage` screen,
and a modal that takes more than one answer or a file. The switch is Scaffold (1.5, 3.8): it previews the form and is not product.

- **The sample answers the whole form, down its fullest branch.** A question that branches is answered with the choice that opens the conditional field, and the field is filled too: a "Yes" with its "where", a type with the fields
  it reveals, an "Other" with its text, repeatable rows with more than one entry. Where two branches exclude each other, the sample takes the one that shows more questions. The filled form is submittable: no missing details, and every
  answer valid against the build's own data (a species, a project or a taxon that exists).
- **File uploads are filled** (`files` in the hook; `sampleFile` and `sampleWorkbook`, `app/_prototype-tools/sample-files.ts`). A file is named "sample-...", and a spreadsheet is a real workbook where the form reads it. Switching off
  takes out the files the sample added and leaves the person's own.
- **Honest (0.3).** Placeholder people (Olivia Wyatt, Phoenix Baker, Lana Steiner, Maya Dewitt) with example.com addresses; organisations, species, parks and projects from the build's own lists; never an invented permit number, DOI,
  identifier or phone number that looks real (a field with no honest sample stays empty and the report says so).
- **Where it is offered.** A new record, not one being edited (`enabled`); and not to a role that is shown a restriction. The sample builder is its own `*-sample.ts` next to the form, and the form only wires the hook.
- **A tool id is the switch's alone.** A shell that registers its own preview tool MUST NOT use the id `sample` (a tool of the same id replaces the other: the notification and vocabulary shells did, and the switch never showed).
- **A modal covers the bar (3.8).** The switch cannot be pressed while a modal is open, so the person sets it on the page first and the modal fills when it opens. The page, not the modal, carries the switch where the page has no form of its own.
- **Not covered:** a dialog with one answer (a reason, a confirmation); a screen that reviews and decides (the flagged concepts and custom concepts review) rather than collects; a form that no route reaches.
- **Origin:** only Add Project had the switch (16 Oct 2026, kept across a refresh on 30 Oct). The designer, 10 Nov 2026: "If there's a form, let's have a fill sample content toggle. Also, for file uploads, etc, let's add that to the
  scope of fill sample content. Let it cover branching questions as well. Good UX."
- **Enforcement:** `AUTO §3.14` (a file under `app/pages` that renders `<FormPage` and does not call `useSampleContent`, except the two review screens and the unused record drawer named in the check); `REVIEW` for covering every
  question, branch and file, and for a modal form.

### §4.4 Options

`option-1 ... option-n` routes are what designers present to stakeholders while a screen is being
explored. When a direction is chosen the others are deleted. A comparison is presented through
`LayoutOptionSwitcher`.

A lab (`/proto/<name>`) that has been folded into a page, or that is built for one, is registered in
`app/_prototype-tools/production-routes.ts`. The Prototype tools bar on that lab then shows "In production" with the
page's name, which opens the live page with the role being viewed kept, so a folded decision can be seen where it
shipped. Where the role being viewed cannot use that page at all (a public user and the Template Finder), the link opens
it as the lowest role that can, and says so ("as Registered User"): it never lands on a restriction message. A lab about
one persona's version of a page (Home looks different to an admin, a registered user and a public user) names that persona
in its line, and the link opens the page as that persona. Folding a lab
into a page is not finished until its line is there.

- **Enforcement:** `REVIEW`. First occurrence, so no `AUTO` check yet (§0.8).
