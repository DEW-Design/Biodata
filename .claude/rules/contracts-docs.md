---
paths:
  - "app/*docs*/**"
  - "lib/nav.ts"
  - "config/design-system.config.ts"
  - "/README.md"
---

<!-- GENERATED from CONTRACTS.md by scripts/build-contract-rules.mjs (CONTRACTS.md 5.5). Do not edit: change CONTRACTS.md, then run `npm run contracts:rules`. -->

# DEW contracts: docs

Doc pages, generated /test-* screens, navigation order. Full text and numbering: CONTRACTS.md.

### §3.9 Navigation order

`lib/nav.ts` `Components` and `config/design-system.config.ts` keys are strictly A-Z. A new entry is
slotted, never appended. If either list is found out of order, the whole list is fixed. (`Primitives` and
`Patterns` follow a foundations-first order and are exempt.)

### §4.5 Generated screens

`/test-*` screens prove a Figma frame maps onto the library: every contained widget is real or `<Gap>`,
they ship the token inspector, and their own content is Barlow. `/pages/*` screens have none of that
apparatus.

### §5.3 Documentation

A component has a doc page in the template order (Playground, Variants, API from the real interface,
Usage, Figma). A pattern has a doc page under `/patterns`. Docs and the README table stay 1:1 with
`lib/nav.ts`.
