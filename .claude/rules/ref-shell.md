---
paths:
  - "app/pages/**"
  - "lib/create-menu.ts"
  - "lib/registered-user-nav.ts"
  - "config/role-access.config.ts"
---

<!-- Hand-maintained: edit in place, current practice only. Trimmed 2026-09-29; the full earlier text, with its history and worked examples, is in context/archive/ref-shell-history.md. -->

# Reference: building screens in the shell

How a `/pages/**` screen is built today: the cognitive-load principles, what a screen is, the build order,
the collection pattern, the backlog. Rules live in CONTRACTS.md (the shell §3, the patterns §4); this is the
reasoning and the how-to behind them. Where this file and a clause disagree, the clause wins.

## Design principles (cognitive load)

BDBSA's domain is dense (a project carries ~15 metadata sections). These keep density from becoming overload,
on every screen and persona (the rule is §4.3):

- **Tier, don't dump.** More than ~5-6 field groups needs Tabs (parallel concerns) or an Accordion (rarely
  touched ones), not one scroll.
- **A conditional field is conditional in the UI.** Don't render a section's scaffold until the field it
  depends on makes it apply ("No restrictions", not five empty tables).
- **Group by use, not by schema.** Often-checked facts (status, dates, who) first and untiered; the rest behind
  a tab or accordion, even out of schema order.
- **Repeated table shapes get distinct containers,** not just a label between them.
- **Same word, different meaning, needs distance:** rename one of two "Location" sections.
- **An empty value is omitted or "Not provided",** never a stray `-` (§2.3).
- **Anything findable within 3 clicks** from the primary nav; if not, add a shortcut (search, a direct link).
- **Never show everything on one page;** when load and one extra click are in tension, take the click.
- **One focal point per view,** and **never restate a fact in two treatments** on one screen.
- **Check your own output against these before presenting it:** count the primary-looking elements, ask where
  the eye goes first.

## Exploratory page layouts (what a `/pages/**` screen is)

A preview of a real product screen, not a doc page and not a `/test-*` proof.

- **Every contained widget is real DEW or a visible `<Gap>`** (`components/scaffold/gap.tsx`, §1.2), never a
  lookalike.
- **None of `/test-*`'s review apparatus:** no inspector, no mapping or gap tables (§4.5).
- **Full screen, no doc chrome.** `app/pages/**` sits outside the `app/(docs)/` route group, so only the root
  layout wraps it; a screen owns its own full-height root (`h-screen`).
- **Not in `lib/nav.ts`.** Screens are reached by URL and listed by hand in the `/pages` index
  (`app/pages/page.tsx`): a new screen needs one line there.
- **A Figma annotation layer (a sticky note, a comment card) is not product UI** and isn't reproduced.
- **A wireframe fixes content and flow only** (§2.5): it is re-fitted into the shell and the patterns below,
  and each departure is named in the page's header comment.
- **Rail sections with a real page navigate to it** (`router.push(roleHref(keyHref(key)))`); a section with
  no page yet shows a `SectionPlaceholder` in place. Every internal link goes through `useRoleHref`
  (`lib/use-role-href.ts`), which appends `?userRole=` or `&userRole=`, or the destination silently falls back
  to the default role.
- **Role-gated whole pages** read `useFeatureAccess` (keys in `config/role-access.config.ts`), keep all three
  columns with the restriction in main (§3.7), and are listed in `wholePageGates`
  (`app/_prototype-tools/prototype-tools.tsx`) so previewing a blocked role goes Home.
- **Option routes** (`/pages/<name>/option-n`) exist only while a screen is being explored (§4.4).

## Build hierarchy: components, shell, screen, flow

1. **Components** (`components/base/**`, `components/application/**`), the DEW layer, never patched for one
   screen.
2. **Shell:** `AppHeader`, `PrimaryRail`, column 2 ending in `SidebarFooterLinks`, `MobileNavTrigger`, and
   `<PrototypeTools />` (§3.1-§3.8; anatomy at `/patterns/navigation`). Borrow it; never draw a new one.
3. **Screen:** the shell plus the page's own content, built from components and the patterns below.
4. **Flow:** the unit that gets user-tested (dashboard, project list, project, record). A screen can pass
   every check alone and still fail in a flow: a lost filter on return, a dead end, a broken back link.

## List -> deep dive (the collection pattern)

How any collection (projects, agreements, nominations, users, templates) is built. Current templates:
`app/pages/_shared/nominations/` (shell, list, record, form, store) and `app/pages/template-finder/` (a
single list with no record page).

1. **One shell component per collection** (`NominationShell`, `DsaShell`, `DlaShell`,
   `TemplateFinderShell`): header, rail, column 2 and the restricted state. Each route supplies only main.
2. **Column 2 is navigation and actions only** (§3.10). A role that sees more than its own records gets a
   My / All scope switch (`AgreementScopeNav`, `?scope=`); a role with one view gets just the section label (a
   one-option switcher is dishonest UI). An `ActionsGroup` (Export CSV) sits below when there is something to
   export. Status is a filter in main, not a place in column 2.
3. **The list is a table page** (§4.2): `SectionHeader` (title, `CountBadge`, subheading, the primary create
   action), an `Input` search and `ListFilterButton` (filters apply as they are chosen, and can be seeded
   from the URL, e.g. `?status=`), then `TableCard` with `Table bodyScrollable`, a sticky header and
   `TableCard.PaginationNumbered`. Information about the list (review steps, a task that needs attention)
   sits above the search, never in column 2. Don't add a column that repeats a filter the view already
   applies.
4. **A row is a link** (`href` through `useRoleHref`) when the record has its own page; no per-row View
   button. A row with nowhere to go (a template) is not a link.
5. **The record page is its own route** (`/pages/<name>/<id>`) and follows the project page (§4.6):
   `RecordBackLink`, `RecordHero` with `RecordActionBar onDark`, at most one notice, then underline `Tabs`
   of `RecordRow` cards. A record that no longer exists shows an honest "not found" state.
6. **Create and edit are routes** (`/pages/<name>/new`, `/pages/<name>/<id>/edit`) using the form pattern
   (§4.1). Saving lands on the record; destructive actions are confirmed in a `DestructiveModal` and stay on
   the page so the new state is visible.
7. **Shared state is a zustand `persist` store** per collection (`*-store.ts`, plumbing in
   `app/pages/_shared/zustand-persist.ts`): list, record and form read the same records, and edits survive a
   reload on that browser. There is no backend.

## Adopting UX patterns from external references

Mobbin, another product or a screenshot supplies interaction and IA ideas, never styles or component
replacements (§2.6): ingest, name the pattern, propose and stop, map to our components, build, QA. The
Supabase pattern catalog gathered earlier is in the archive.

## Backlog: explorations held off for now

- **An expand-on-hover column 1** (Supabase's sidebar control). Column 2 holds stateful controls that
  shouldn't vanish when the pointer drifts, hover has no keyboard or touch equivalent, and `MobileNavTrigger`
  already reclaims space below `lg`. **Revisit if** main needs more width often; then make column 2
  collapsible by click, not hover.
- **Bulk sensitive species nomination.** The MVP is one species per nomination, the unit the panel decides.
  **Revisit if** nominators ask to submit a related group together.

## Registered User dashboard scope

Per the designer, Home for a `registered-user` is a personal tracker, not a BI surface: their DLA requests,
their sensitive species nominations, the datasets they uploaded, and the projects they created, with adding
data to an existing project as the core recurring action. DLA requests and nominations already surface in
"Needs your attention" (`app/pages/_shared/home-dashboard.tsx`); check that file for what else is built
before extending it.
