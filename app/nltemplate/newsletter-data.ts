// The content of the DEW newsletter, from the lo-fi (Figma FrIpc8ZgLH9S8ddHdI8AD7, node 14:2, "NEWSLETTER TEMPLATE"). The lo-fi
// fixes content and flow only (CONTRACTS 2.5); the page re-fits the blocks into the design system's own components (page.tsx).
//
// What the lo-fi says, block by block, and what is a slot (a template fills it in each issue):
//   - a tracker of four stages with a status over each (Complete, We're here, Scheduled, Scheduled). The stage names are blank
//     lines in the lo-fi; "Plan" and "Design" are the two the Transition callout names, so they are used, and the last two are
//     slots ("Stage 3", "Stage 4").
//   - Vision, Problems and Opportunity areas: three headings with no copy; the designer then supplied the content (below).
//   - "How we're tracking?" with a Transition callout (Mamtha to Prabhakar, Plan to Design) and a Callout of three highlights.
//     The lo-fi's arrows are drawn as icons here (2.3). "Transition", "Callout" and "Link" in the lo-fi name the component, as
//     "Link" does on every row, so they are not printed as words.
//   - one more callout inviting feedback on the hi-fidelity designs (now the "Invite for testing" notes, below).
//   - "The team": three squares with no names. Olivia Wyatt, Phoenix Baker and Lana Steiner are the placeholder people (0.3).
//   - "Helpful links": three rows, the last two the same ("Knowledge Management Framework"), so the repeat is dropped. Only the
//     BioData homepage has a page to go to; the other row has no destination and is not drawn as a link (0.3, 2.10).
// The lo-fi also draws a tall empty panel under "How we're tracking?" with no content; it is not reproduced.
// Not in the lo-fi, added so a newsletter has a name on it: the masthead (the Government of South Australia lockup, "BioData SA"
// and "Project update").

export type StageStatus = "complete" | "current" | "incomplete";

export const STAGES: { title: string; status: StageStatus; label: string }[] = [
  { title: "Plan", status: "complete", label: "Complete" },
  { title: "Design", status: "current", label: "We're here" },
  { title: "Stage 3", status: "incomplete", label: "Scheduled" },
  { title: "Stage 4", status: "incomplete", label: "Scheduled" },
];

// ── How we're tracking (the designer's stage diagram, 14 Oct 2026, 3:13pm), copied as written. The six phases run Concept,
// Feasibility, Planning, Executing (Delivery & Completion), Closure, Benefits review; Executing is made of four iterative sprint
// stages, and each stage names what happens in it. Where the project is comes from the transition text ("completing the Planning
// Phase and entering the Design Phase"); the phases before Planning are marked complete because Planning follows them. ──
export const TRACKING_INTRO = "We are following the below stages to track ourselves.";

export const PHASES: { title: string; status: StageStatus; label: string }[] = [
  { title: "Concept", status: "complete", label: "Complete" },
  { title: "Feasibility", status: "complete", label: "Complete" },
  { title: "Planning", status: "complete", label: "Complete" },
  { title: "Executing", status: "current", label: "We're here" },
  { title: "Closure", status: "incomplete", label: "Scheduled" },
  { title: "Benefits review", status: "incomplete", label: "Scheduled" },
];

export const PHASE_ACTIVITIES: { stage: string; text: string; group?: boolean }[] = [
  { stage: "Concept and Feasibility", text: "Business justification & value definition" },
  { stage: "Planning", text: "Requirements analysis & program plan" },
  { stage: "Executing (Delivery & Completion)", text: "Iterative sprint cycles", group: true },
  { stage: "Design", text: "Front-end design, Back-end design" },
  { stage: "Development", text: "Development & Testing" },
  { stage: "Delivery readiness", text: "Release assurance & readiness (system, data, process & people)" },
  { stage: "Release", text: "Production deployment & Go-live" },
  { stage: "Closure", text: "Review & closure" },
];

export const HIGHLIGHTS = ["Herbarium Discussions", "Collaboration with ICT", "SaaS platform identified"];

// ── More of the project's own words (the designer's notes, 14 Oct 2026, 3:12pm), copied as written; "–" is written "-" (no dashes
// in copy, 2.3). They fill the Transition, Highlights and Invite blocks and the first helpful link. The lo-fi's three highlights are kept alongside them until the designer says they are replaced; the handover rows
// (Mamtha to Prabhakar, Plan to Design) were removed at the designer's request. ──
export const TRANSITION_TEXT = {
  lead: "The BioData Program has achieved a major milestone by successfully completing the Planning Phase and entering the Design Phase.",
  rest: "This critical stage-gate validates the business case, confirms program scope, establishes an evolved set of requirements, delivers a conceptual information model, and aligns stakeholders through an integrated delivery plan. The achievement provides a strong foundation for designing a future-ready biodiversity data management platform and demonstrates the team's commitment to strategic planning, collaboration, and delivery excellence.",
};

export const HIGHLIGHT_NOTE = "Business team have also approved low fidelity design and reviewing the high fidelity. Some samples below";

// The notes ask for "Project, or find species sample": both are shown, captured from the app's own Project page and Explore (searching
// a species).
export const SAMPLES = [
  { title: "Project", src: "/nltemplate/sample-project.png", alt: "The project page for Adelaide Hills Bushland Survey: its details, datasets and record counts" },
  { title: "Find species", src: "/nltemplate/sample-find-species.png", alt: "Explore, searching the map for a species (Malleefowl) and finding it in one record" },
];

export const INVITE = {
  title: "Invite for testing",
  text: "Now we request some of the volunteers to have a peek into how the Web application is looking and are keen to seek feedback. If interested - pls write to us at",
  email: "biodatasa@sa.gov.au",
};

export const TEAM = ["Olivia Wyatt", "Phoenix Baker", "Lana Steiner"];

export const LINKS: { title: string; lead?: string; href?: string }[] = [
  { lead: "Find more about BioData SA at", title: "BioData SA - Home", href: "/pages/biodata-home" },
  { title: "Knowledge Management Framework" },
];

// ── The top of the newsletter: the project's own words (the designer's slides, 14 Oct 2026), copied as written. The slides call the
// two sections "Problem definition" and "Opportunities"; the picked template names them "Problems" and "Opportunity areas", which
// are used. The figures are the numbers in the sentences themselves (nothing is added). The slides' own icons (a leaf, a house, a
// battery, a sun, a tree, a globe) are not all in the icon library, so each card takes the nearest library icon for what it says. ──
export const VISION = {
  line1: "Accessible data.",
  line2: "Information-driven future.",
  objective:
    "To transform biodiversity data management in South Australia by providing accessible, reliable and integrated data for timely, evidence-based decisions, supporting sustainable planning, development, emergency response, and biodiversity protection",
  emphasis: "accessible, reliable and integrated data",
};

// `figure` is the number in the sentence, split so its words can be set small and its digits large: "Over" and "1,000",
// "30" and "-year-old", "30-50%" whole.
export const PROBLEMS: { lead: string; text: string; figure?: { pre?: string; main: string; post?: string } }[] = [
  { lead: "Biodiversity crisis", figure: { pre: "Over", main: "1,000" }, text: "Over 1,000 species in South Australia are threatened with extinction, impacting agricultural, tourism, and state identity." },
  { lead: "Outdated technology", figure: { main: "30", post: "-year-old" }, text: "The 30-year-old Biological Databases of South Australia (BDBSA) are obsolete, lacking modern integration and data management capabilities." },
  { lead: "Fragmented data", figure: { main: "30-50%" }, text: "Only 30-50% of biodiversity data is centrally managed; the rest is scattered across isolated systems in government, research institutions, and industry." },
  { lead: "Limited accessibility", text: "The fragmented and outdated system hampers timely, evidence-based decisions for development assessments, mining approvals, emergency responses, and biodiversity management." },
  { lead: "Growing data volume", text: "The volume of data outside the central system is increasing, further complicating access and integration." },
];

export const OPPORTUNITIES = [
  { id: "development", title: "Accelerated sustainable development", text: "Modernise approvals to support timely development, effective biodiversity protection, and South Australia's economic prosperity." },
  { id: "planning", title: "Enhanced e-Planning", text: "Improve planning tools to integrate biodiversity data, reducing bureaucratic hurdles and streamlining regulatory processes." },
  { id: "extinction", title: "Biodiversity extinction crisis", text: "Address data deficiencies to prevent declines in biodiversity and ensure ecosystem functionality and services." },
  { id: "climate", title: "Climate change actions", text: "Build climate-resilient landscapes and natural resources with high-quality, accessible science and information." },
  { id: "epbc", title: "EPBC Act reform", text: "Align with national standards and enhance data analysis, monitoring, and reporting on threatened species." },
  { id: "data", title: "Improved environmental data", text: "Respond to recommendations from the Royal Commission and the SA SoE for better data coordination, sharing, and environmental reporting." },
] as const;
