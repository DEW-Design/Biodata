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

### §4.4 Options

`option-1 ... option-n` routes are what designers present to stakeholders while a screen is being
explored. When a direction is chosen the others are deleted. A comparison is presented through
`LayoutOptionSwitcher`.
