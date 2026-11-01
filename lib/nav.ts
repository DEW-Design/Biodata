import { isComponentEnabled as isComponentEnabledStatic } from "@/config/design-system.config";

export type NavItem = {
  title: string;
  href: string;
  /** One-line summary - shown to AI agents via /llms.txt. Keep it accurate; mark unbuilt pages as such. */
  description: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const rawNav: NavSection[] = [
  {
    title: "Principles",
    items: [
      { title: "Design principles", href: "/principles", description: "The nine design principles, read from the decision log and the designer's own words, with the question to ask of a screen and the clauses that hold each; and how an exploration starts from them. A draft for the designer to confirm." },
      { title: "Craft details", href: "/principles/craft", description: "The details that make the interface feel finished, with their values and where each lives: edges, concentric corners, the type ladder, space, scroll and fade, quiet motion, hit areas and the source's words." },
    ],
  },
  {
    title: "Primitives",
    items: [
      { title: "Colours", href: "/primitives/colours", description: "12-step colour scales for Gray, Brand, Error, Warning and Success, plus semantic bg, text and ring tokens." },
      { title: "Typography", href: "/primitives/typography", description: "Type scale, font weights, and the Barlow display/text system." },
      { title: "Spacing", href: "/primitives/spacing", description: "4px base grid from 0 to 128px." },
      { title: "Border radius", href: "/primitives/border-radius", description: "10-step radius scale from sharp to fully rounded." },
      { title: "Shadows", href: "/primitives/shadows", description: "Seven elevation levels for cards, dropdowns, and modals." },
      { title: "Icons", href: "/primitives/icons", description: "All 1,179 Untitled UI icons, searchable, with size and stroke-weight guidance." },
      { title: "Motion", href: "/primitives/motion", description: "Duration and easing tokens for animation." },
    ],
  },
  {
    title: "Components",
    items: [
      { title: "Accordion", href: "/components/accordion", description: "Expand and collapse list of titles and content, animated with a spring (motion/react). Optional single-open behaviour." },
      { title: "Alert", href: "/components/alert", description: "Dismissible banner in floating and full-width layouts, 6 colours, composed from Button, CloseButton and FeaturedIcon." },
      { title: "Avatar", href: "/components/avatar", description: "A user's picture, with sizes, colour variants and avatar groups." },
      { title: "Badge", href: "/components/badge", description: "Status labels in pill and badge-colour styles, 5 documented colours, with dot, icon and dismiss variants." },
      { title: "Button", href: "/components/button", description: "The action button: 8 colour variants, 5 sizes, icon and loading states." },
      { title: "Button utility", href: "/components/button-utility", description: "Icon-only button for toolbars and row actions. Secondary and tertiary colours, two sizes, a tooltip that doubles as the accessible name, optional link." },
      { title: "Carousel", href: "/components/carousel", description: "Pages through slides of one kind. Built on Embla and headless: arrows, dot indicators, swipe and arrow keys, horizontal or vertical, no autoplay. Replaces the hand-built species photo carousel." },
      { title: "Checkbox", href: "/components/checkbox", description: "Binary selection control with an indeterminate state and two sizes." },
      { title: "Date picker", href: "/components/date-picker", description: "A date or a range of dates chosen from a calendar that opens under a button. The pick is a draft until Apply, and a range has presets. Built on React Aria." },
      { title: "Dropdown", href: "/components/dropdown", description: "Menu built on React Aria, with icon items, sections, and checkmark, checkbox, radio or toggle selection indicators." },
      { title: "Input", href: "/components/input", description: "Text field and its variants: password, date, number, payment, tags, file upload, PIN." },
      { title: "Modal", href: "/components/modal", description: "Overlay dialog built on React Aria, in Confirmation, Destructive and free-form Form variants, plus the base ModalOverlay, Modal and Dialog parts." },
      { title: "Progress", href: "/components/progress", description: "Linear progress bar (4 label layouts) plus circular and half-circle indicators, 5 sizes." },
      { title: "Progress steps", href: "/components/progress-steps", description: "Multi-step progress: icon, number or featured-icon steps with text (horizontal or vertical), minimal dot rows, and a text-with-line bar." },
      { title: "Radio buttons", href: "/components/radio-buttons", description: "Single-choice selection within a group, with optional hint text, horizontal or vertical layout and two sizes." },
      { title: "Radio groups", href: "/components/radio-groups", description: "Card-style single-choice selection in icon, avatar, payment, radio and checkbox layouts, two sizes." },
      { title: "Section headers", href: "/components/section-headers", description: "Title, subheading and actions row with a bottom border, for page and card sections. Replaces the hand-rolled version used across /pages/*." },
      { title: "Select", href: "/components/select", description: "Dropdown selection: single select, searchable combobox, multi-select, tag select and native select, in three sizes." },
      { title: "Table", href: "/components/table", description: "React Aria Table: a plain Table, plus TableCard, the full data table with row selection, sorting and a row-actions dropdown." },
      { title: "Tabs", href: "/components/tabs", description: "React Aria Tabs: 5 horizontal types, 5 vertical types, two sizes, optional icon and badge, full-width layout." },
      { title: "Text editor", href: "/components/text-editor", description: "Rich text field built on Tiptap, with a simple or advanced toolbar, a bubble menu on selection, an optional character limit, and invalid and disabled states." },
      { title: "Textarea", href: "/components/textarea", description: "Multi-line text input with label, hint, tooltip, two sizes, and invalid and disabled states." },
      { title: "Toast", href: "/components/toast", description: "Corner notification that dismisses itself, built on sonner: 6 colours, optional action, composed from Button, CloseButton and FeaturedIcon." },
      { title: "Toggle", href: "/components/toggle", description: "Binary switch with an optional label and hint, a slim track variant, and two sizes." },
      { title: "Tooltip", href: "/components/tooltip", description: "Hover and focus overlay for supplementary context: 4 placements, description, arrow, delay." },
    ],
  },
  {
    title: "Custom Components",
    items: [
      { title: "Date picker", href: "/custom-components/date-picker", description: "Segmented DD/MM/YYYY field with a calendar-icon trigger that opens a Calendar popover. input-date.tsx is segmented entry only, with no clickable picker. Pending a stakeholder decision on promotion into Components." },
    ],
  },
  {
    title: "Patterns",
    items: [
      { title: "Forms", href: "/patterns/forms", description: "The create and edit form pattern: FormPage header, sections, FormRow fields, Back a step and Continue footer, inline errors after a failed attempt. Add Project, DSA and DLA use it." },
      { title: "Navigation", href: "/patterns/navigation", description: "The sidebar shell's two nav parts: the primary icon rail with its contextual sidebar (side nav), and the persistent header bar (top nav)." },
      { title: "Tree selection", href: "/patterns/tree-view", description: "Multi-select file and folder tree built from Tree view and the base Checkbox, with cascading selection and indeterminate parents." },
      { title: "Banners", href: "/patterns/banners", description: "The full-width notice under the header, with one fact about the screen, one next step and one close control, and the explainer card for how something works. Explore's data-access notice and the Nominations explainer use them." },
      { title: "Filters", href: "/patterns/filters", description: "The one filter for every table that can be filtered: a Filter button that opens a contextual menu of the attributes, each opening its values beside it (searchable when the list grows with the data), with the filters that are on shown as chips under the toolbar." },
      { title: "Report toolbar", href: "/patterns/report-toolbar", description: "One row above a report's table: the search, a Parameters button (a popover of what the report is run on, with what is set shown beside it), the Filter and the Columns chooser, so the table gets the screen. Every report uses it." },
      { title: "Audit log", href: "/patterns/audit-log", description: "The Audit Log tab of a record page: one sentence per status move, newest first, with the person, the status badge and the date, a Current chip on the newest move, and same-person runs under one header." },
      { title: "Map list card", href: "/patterns/map-list-card", description: "A card that floats over the map and lists what is on it (Explore's results, Map visualise's errors): tabs, a list of result cards that fades out at its foot with one pinned Show N more, no scrollbar, a summary card whose facts are rows, and the key." },
      { title: "Empty states", href: "/patterns/empty-states", description: "Documentation coming soon." },
      { title: "Loading states", href: "/patterns/loading-states", description: "Documentation coming soon." },
      { title: "Feedback", href: "/patterns/feedback", description: "Documentation coming soon." },
    ],
  },
];

/** Slug used to look up a nav item's entry in `designSystemConfig`, e.g. "/components/button" → "button". */
export function slugFor(href: string): string {
  return href.split("/").pop() ?? "";
}

export function filterNav(sections: NavSection[], isEnabled: (slug: string) => boolean): NavSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => isEnabled(slugFor(item.href))),
  }));
}

/**
 * Nav filtered through the checked-in static config. Safe to call from
 * server contexts (Route Handlers, RSC) that have no React render tree -
 * used by /llms.txt. Doc pages/Sidebar should use `useNav()` from
 * `lib/use-nav.ts` instead, which reflects live /config overrides too.
 */
export function staticNav(): NavSection[] {
  return filterNav(rawNav, isComponentEnabledStatic);
}
