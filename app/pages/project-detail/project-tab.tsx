"use client";

// The Overview tab (it was called Project until 26 Oct 2026). Same sections, cards, titles and rows as the previous (inline edit) version, less "Project at a glance" (the
// designer removed it: its counts and rows repeated what the tabs, the header and the records already say):
// Overview (Project details, Published by, Project managers); Data collection and
// storage (Geographic extent; Focus, species and method; Permits and identifiers); Privacy and
// restrictions (one card per restriction). The only difference is where editing happens: each
// card's Edit opens that card's form in the edit drawer (project-edit.tsx), built from the Add
// Project registration's own pieces.
//
// "On this page" lists every section and, under it, every card, and follows the scroll at card level.
// Public users see the same cards without Edit.
//
// CONTRACTS 4.6: each data owner contact carries its own role, shown with that contact. There is no
// "Project team" card, and no separate role field for whoever registered the project.

import { createContext, createElement, useContext, useEffect, useRef, useState, type Key, type ReactNode } from "react";
import { getLocalTimeZone } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { ArrowLeft, Edit05, LockUnlocked01, Mail01, MarkerPin04, Phone01, Plus, Trash01, User01, Users01 } from "@untitledui/icons";
import { Accordion } from "@/components/base/accordion/accordion";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { DestructiveModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { LocationDetailsTable } from "@/app/pages/_shared/location-details-table";
import { ExpandableMap } from "@/app/pages/_shared/map-search/expandable-map";
import { COLLECTION_METHOD_OPTIONS, EMBARGO_TYPE_OPTIONS, FOCUS_AREA_OPTIONS, PERMIT_TYPE_OPTIONS, PROJECT_METADATA_CONCEPTS, REGISTRATION_SPECIES, SPECIES_CONCEPTS } from "@/app/pages/project-registration/data";
import { conceptLabel, conceptValueLabel } from "@/app/pages/project-registration/concept-rows";
import { drawnShapeLine, geoExtentSummary } from "@/app/pages/project-registration/geo-extent-picker";
import { OFFERED_RESTRICTION_TYPES, RESTRICTION_TYPE_META } from "@/app/pages/project-registration/step-3-privacy-restrictions";
import { allRecordsOf, culturalOf, isGeoExtentComplete, type RestrictionTypeKey } from "@/app/pages/project-registration/types";
import { expectationLabel } from "@/app/pages/project-registration/restriction-fields";
import { cx } from "@/utils/cx";
import { useEditStore } from "./edit-store";
import { boundaryCentre } from "./field-schema";
import { CARD_TITLES, InlineCardEditor, ProjectCardDrawer, cardMissing, contactRole, roleLabel, type ProjectCardId } from "./project-edit";

export function formatDay(d: DateValue | null): string {
  return d ? d.toDate(getLocalTimeZone()).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "";
}

export const RESTRICTION_DESCRIPTIONS: Record<RestrictionTypeKey, string> = {
  embargo: "The whole dataset is withheld from public release until the end date.",
  species: "Records of these species are released with less detail than the rest.",
  cultural: "Culturally sensitive data, released only as its Indigenous Information Authority agrees.",
  all: "Every record in this project is restricted.",
  locations: "Records from these locations are protected.",
  metadata: "These project details are withheld from public view.",
  other: "Any other rule on how this project's data is shared.",
};

// ── Building blocks (same look as the previous version) ──

/**
 * In version 3 a field row can be edited on its own: on hover it shows an edit icon that opens its
 * card in edit mode, focused on that field (the same as a record's fields). Not for restrictions.
 */
function useFieldEdit(): ((label: string) => void) | null {
  const layout = useContext(LayoutContext);
  const inline = useContext(InlineEditContext);
  const card = useContext(CardIdContext);
  const { canEdit } = useEditStore();
  if (layout !== "v3" || !canEdit || !card || inline.editing !== null || RESTRICTION_TYPE_META.some((m) => m.key === card)) return null;
  return (label) => inline.open(card, label);
}

function FieldEditIcon({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Tooltip title={`Edit ${label.toLowerCase()}`}>
      <TooltipTrigger
        aria-label={`Edit ${label}`}
        onPress={onPress}
        className="-my-1 flex size-7 cursor-pointer items-center justify-center rounded-md text-fg-quaternary opacity-0 outline-focus-ring transition-opacity group-hover/field:opacity-100 hover:bg-secondary hover:text-fg-quaternary_hover focus-visible:opacity-100 focus-visible:outline-2"
      >
        <Edit05 className="size-3.5" />
      </TooltipTrigger>
    </Tooltip>
  );
}

function Rows({ rows }: { rows: { label: string; value?: ReactNode; empty?: boolean }[] }) {
  const edit = useFieldEdit();
  return (
    <dl className="flex flex-col">
      {rows.map((r) => {
        const empty = r.empty || r.value === "" || r.value == null;
        return (
          <div
            key={r.label}
            className={cx(
              "grid gap-x-4 border-b border-secondary py-2.5 last:border-b-0",
              edit ? "group/field grid-cols-[minmax(0,11rem)_minmax(0,1fr)_1.75rem] px-3 transition-colors hover:bg-primary_hover" : "grid-cols-[minmax(0,11rem)_minmax(0,1fr)]",
            )}
          >
            <dt className="text-sm text-tertiary">{r.label}</dt>
            <dd className={cx("min-w-0 max-w-prose text-sm text-balance whitespace-pre-line", empty ? "text-quaternary" : "text-primary")}>{empty ? "Not provided" : r.value}</dd>
            {edit && <FieldEditIcon label={r.label} onPress={() => edit(r.label)} />}
          </div>
        );
      })}
    </dl>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.filter(Boolean).map((i) => (
        <span key={i} className="inline-flex items-center rounded-full border border-secondary bg-secondary px-2.5 py-1 text-xs font-medium text-secondary">
          {i}
        </span>
      ))}
    </div>
  );
}

/** How a person is drawn on the Published by and Project managers cards (the designer, 30 Oct 2026: "where do I start reading? What if we could maybe look into contact cards?"). "rows" is the page as it was;
 *  the others are the options of `/proto/project-people`. Opt-in on `ProjectTab`, so the product page is unchanged until one is chosen. */
export type PeopleStyle = "rows" | "ladder" | "avatar" | "card";
const PeopleStyleContext = createContext<PeopleStyle>("rows");

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function Person({ name, role, team, email, phone, primary }: { name: string; role?: string; team?: string; email?: string; phone?: string; primary?: boolean }) {
  const edit = useFieldEdit();
  const style = useContext(PeopleStyleContext);
  const badge = primary && (
    <Badge size="sm" color="brand">
      Primary
    </Badge>
  );
  const contacts = (email || phone) && (
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tertiary">
      {email && (
        <span className="flex max-w-full min-w-0 items-center gap-1.5" title={email}>
          <Mail01 className="size-3.5 shrink-0 text-quaternary" />
          <span className="truncate">{email}</span>
        </span>
      )}
      {phone && (
        <span className="flex items-center gap-1.5">
          <Phone01 className="size-3.5 text-quaternary" />
          {phone}
        </span>
      )}
    </div>
  );
  // Role and team are one line of what the person is, the first thing under the name, not a second and a third treatment.
  const supporting = [role, team].filter(Boolean).join(", ");
  const nameText = name || <span className="text-quaternary">Name not provided</span>;

  let body: ReactNode;
  if (style === "ladder") {
    // The name is the one semibold line; everything under it is one step down.
    body = (
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-primary">
          {nameText}
          {badge}
        </p>
        {supporting && <p className="text-sm text-tertiary">{supporting}</p>}
        {contacts}
      </div>
    );
  } else if (style === "avatar" || style === "card") {
    // The design system's own person (an avatar, a semibold name, one supporting line); the contact lines sit under the text, not under the avatar.
    body = (
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <AvatarLabelGroup
          size="md"
          initials={initialsOf(name)}
          title={
            <span className="flex flex-wrap items-center gap-x-2">
              {nameText}
              {badge}
            </span>
          }
          subtitle={supporting || "No role given"}
        />
        {contacts && <div className="pl-12">{contacts}</div>}
      </div>
    );
  } else {
    body = (
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium text-primary">
          {nameText}
          {badge}
          {role && <span className="font-normal text-tertiary">{role}</span>}
        </p>
        {team && <p className="text-sm text-tertiary">{team}</p>}
        {contacts}
      </div>
    );
  }

  return (
    <div
      className={cx(
        "flex min-w-0 items-start gap-2",
        style === "card" ? "rounded-xl border border-secondary bg-primary p-5" : "py-2",
        edit && "group/field transition-colors hover:bg-primary_hover",
        edit && style !== "card" && "-mx-3 rounded-md px-3",
      )}
    >
      {body}
      {edit && <FieldEditIcon label={name || "contact"} onPress={() => edit(name)} />}
    </div>
  );
}

// "v3" (version 3 only): icon-only card actions that appear on hover or focus, and a content column
// that fills the width. "default" is the current version, unchanged.
const LayoutContext = createContext<"default" | "v3">("default");
/** True when the sections are drawn as one sheet (`sheet` prop): each is divided from the one above by a line and padded, not spaced apart. */
const SheetContext = createContext(false);
// Version 3 edits a card inline: which card is open, and how to open or close one.
const InlineEditContext = createContext<{
  editing: ProjectCardId | null;
  setEditing: (next: ProjectCardId | null) => void;
  /** Opens a card in edit mode, focused on one field (by its label). */
  open: (card: ProjectCardId, focusLabel?: string) => void;
  focusLabel?: string;
}>({ editing: null, setEditing: () => {}, open: () => {} });
const CardIdContext = createContext<ProjectCardId | null>(null);
/** With the `disclosure` prop: the sections after the first are collapsed under their headings (progressive disclosure). `mounted` holds the ones opened at least once: a section's cards are not drawn until then. */
const DisclosureContext = createContext<{ openKeys: Set<Key>; mounted: Set<Key>; onOpenKeysChange: (keys: Set<Key>) => void } | null>(null);

function CardIcon({ label, icon, onPress, always }: { label: string; icon: typeof Edit05; onPress: () => void; always?: boolean }) {
  return (
    <Tooltip title={label}>
      <TooltipTrigger
        aria-label={label}
        onPress={onPress}
        className={cx(
          "flex size-8 cursor-pointer items-center justify-center rounded-md text-fg-quaternary outline-focus-ring transition-opacity hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:opacity-100 focus-visible:outline-2",
          !always && "opacity-0 group-hover/card:opacity-100",
        )}
      >
        {createElement(icon, { className: "size-4" })}
      </TooltipTrigger>
    </Tooltip>
  );
}

function Card({ card, description, onEdit, onRemove, className, bare = false, children }: { card: ProjectCardId; description?: string; onEdit: (id: ProjectCardId) => void; onRemove?: () => void; /** Where the card sits in a grid it is placed in (a row span). */ className?: string; /** No border, fill or padding of its own, while it is not being edited: what is inside it (a person, as a card) carries them. Its title and its actions stay. */ bare?: boolean; children: ReactNode }) {
  const { canEdit, project } = useEditStore();
  const layout = useContext(LayoutContext);
  const inline = useContext(InlineEditContext);
  const title = CARD_TITLES[card];
  const needs = cardMissing(card, project).length > 0;
  const isEditing = layout === "v3" && inline.editing === card;
  const anyEditing = layout === "v3" && inline.editing !== null;
  const stripped = bare && !isEditing;
  // Where the editing card puts its Cancel and Save changes: the foot of the card itself, pinned to the bottom of the window while the card runs past it.
  const [footerSlot, setFooterSlot] = useState<HTMLElement | null>(null);
  return (
    <section
      id={`card-${card}`}
      aria-label={title}
      className={cx(
        "group/card flex scroll-mt-4 flex-col gap-4",
        stripped ? "gap-3" : "rounded-xl border bg-primary p-5",
        // A card in a two-up row takes the whole row while it is edited, so its form has room.
        isEditing ? "col-span-full border-[var(--color-brand-500)] ring-4 ring-[var(--color-brand-50)]" : stripped ? "border-transparent" : needs ? "border-warning-300" : "border-secondary",
        anyEditing && !isEditing && "opacity-70",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
            {title}
            {needs && (
              <Badge size="sm" color="warning">
                Details needed
              </Badge>
            )}
          </h3>
          {description && <p className="text-sm text-balance text-tertiary">{description}</p>}
        </div>
        {canEdit && layout === "v3" && !anyEditing && (
          <div className="flex shrink-0 items-center gap-0.5">
            {onRemove && <CardIcon label={`Remove ${title.toLowerCase()}`} icon={Trash01} onPress={onRemove} />}
            <CardIcon label={needs ? `Add details to ${title.toLowerCase()}` : `Edit ${title.toLowerCase()}`} icon={Edit05} onPress={() => onEdit(card)} always={needs} />
          </div>
        )}
        {canEdit && layout === "default" && (
          <div className="flex shrink-0 items-center gap-2">
            {onRemove && <Button color="tertiary" size="sm" iconLeading={Trash01} aria-label={`Remove ${title}`} onClick={onRemove} />}
            <Button color="secondary" size="sm" iconLeading={Edit05} onClick={() => onEdit(card)} aria-label={`Edit ${title}`}>
              Edit
            </Button>
          </div>
        )}
      </div>
      {isEditing ? (
        <InlineCardEditor id={card} focusLabel={inline.focusLabel} footer={footerSlot} onClose={() => inline.setEditing(null)} onOpenNext={(next) => inline.setEditing(next)} />
      ) : (
        <CardIdContext.Provider value={card}>{children}</CardIdContext.Provider>
      )}
      {isEditing && <div ref={setFooterSlot} className="sticky bottom-0 z-10 -mx-5 -mb-5" />}
    </section>
  );
}

function Section({ id, title, description, action, bare = false, alwaysOpen = false, count, collapsedNote, children }: { id: string; title: string; description?: string; action?: ReactNode; /** No heading: the section is already named by where it sits (the Overview tab's first section). The `id` stays, for "On this page". */ bare?: boolean; /** With `disclosure`: the section keeps its plain heading and is never closed (the Overview, the first thing read). */ alwaysOpen?: boolean; /** With `disclosure`: a count beside the title, shown open or closed. */ count?: number; /** With `disclosure`: a note beside the title while the section is closed, for what its cards would otherwise show (a card that needs details). */ collapsedNote?: ReactNode; children: ReactNode }) {
  const sheet = useContext(SheetContext);
  const disclosure = useContext(DisclosureContext);
  if (disclosure && !bare && !alwaysOpen) {
    const isOpen = disclosure.openKeys.has(id);
    // The heading is the real Accordion's toggle (the compact variant, as the user record's permissions use it). The section's cards are drawn the first time it opens and kept after, with `inert` while it is
    // closed so Tab and a screen reader skip them; the map in a closed section is not built until it is wanted (lazy loading).
    return (
      <section id={id} className={cx("scroll-mt-4", sheet && "border-t border-secondary px-6 py-3 first:border-t-0")}>
        <Accordion
          variant="compact"
          actionPlacement="beforeChevron"
          visibleWhenOpen
          openKeys={disclosure.openKeys}
          onOpenKeysChange={disclosure.onOpenKeysChange}
          items={[
            {
              id,
              title: (
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                    {title}
                    {count !== undefined && count > 0 && <CountBadge count={count} color="gray" />}
                    {!isOpen && collapsedNote}
                  </span>
                  {description && <span className="text-sm font-normal text-balance text-tertiary">{description}</span>}
                </span>
              ),
              action,
              content: disclosure.mounted.has(id) ? (
                <div inert={!isOpen} className="flex flex-col gap-4 pt-2 pb-3">
                  {children}
                </div>
              ) : null,
            },
          ]}
        />
      </section>
    );
  }
  return (
    <section id={id} aria-label={bare ? title : undefined} className={cx("flex scroll-mt-4 flex-col gap-4", sheet && "border-t border-secondary p-6 first:border-t-0")}>
      {(!bare || action) && (
        <div className="flex items-end justify-between gap-3">
          {!bare && (
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-primary">{title}</h2>
              {description && <p className="text-sm text-balance text-tertiary">{description}</p>}
            </div>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export interface TocItem {
  id: string;
  label: string;
  children?: TocItem[];
}

// The item (section or card) whose top was last scrolled past the top of the shell's <main>.
// react-aria keeps a hidden copy of tab content, so only the visible copy of each element counts.
// A clicked item stays active while the page scrolls to it (the bottom of the page can't bring a
// late card to the top, which would otherwise hand "active" to the last item).
function useActiveItem(ids: string[]) {
  const [active, setActive] = useState<string>(ids[0]);
  const pinnedUntil = useRef(0);
  const key = ids.join("|");
  useEffect(() => {
    const list = key.split("|");
    const find = (id: string) => Array.from(document.querySelectorAll<HTMLElement>(`#${id}`)).find((el) => el.getBoundingClientRect().height > 0 && !el.closest("[inert]"));
    const update = () => {
      if (Date.now() < pinnedUntil.current) return;
      const scroller = find(list[0])?.closest("main");
      if (!scroller) return;
      const top = scroller.getBoundingClientRect().top + 96;
      let current = list[0];
      for (const id of list) {
        const el = find(id);
        if (el && el.getBoundingClientRect().top <= top) current = id;
      }
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) current = list[list.length - 1];
      setActive(current);
    };
    document.addEventListener("scroll", update, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", update, { capture: true });
  }, [key]);
  const pin = (id: string) => {
    pinnedUntil.current = Date.now() + 1000;
    setActive(id);
  };
  return { active, pin };
}

export function OnThisPage({ items, onBeforeGo }: { items: TocItem[]; /** Called before a link scrolls; returns true when it opened something (a closed section), so the scroll waits for it to finish opening. */ onBeforeGo?: (id: string) => boolean }) {
  const flat = items.flatMap((i) => [i.id, ...(i.children ?? []).map((c) => c.id)]);
  const { active, pin } = useActiveItem(flat);
  const go = (id: string) => {
    const opened = onBeforeGo?.(id) ?? false;
    pin(id);
    const scroll = () =>
      Array.from(document.querySelectorAll<HTMLElement>(`#${id}`))
        .find((el) => el.getBoundingClientRect().height > 0 && !el.closest("[inert]"))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (opened) window.setTimeout(scroll, 350);
    else scroll();
  };
  const link = (item: TocItem, child: boolean) => {
    const isActive = active === item.id;
    const inSection = !child && item.children?.some((c) => c.id === active);
    return (
      <a
        href={`#${item.id}`}
        onClick={(e) => {
          e.preventDefault();
          go(item.id);
        }}
        aria-current={isActive ? "location" : undefined}
        // The weight never changes with the state (a heavier face is wider, so the label would reflow as the active link moved down the page): the state is the colour and the 2px bar. The focus ring is
        // drawn inside the link, because the column scrolls (`overflow-y-auto`) and clips an outline that sits outside it, and the links run flush to its edges.
        className={cx(
          "-ml-px flex min-h-10 items-center border-l-2 outline-focus-ring transition-colors focus-visible:-outline-offset-2 focus-visible:outline-2",
          child ? "pl-6 text-xs" : "pl-3 text-sm",
          isActive ? "border-[var(--color-brand-500)] text-brand-secondary" : inSection ? "border-transparent text-primary" : "border-transparent text-tertiary hover:text-primary",
        )}
      >
        {item.label}
      </a>
    );
  };
  return (
    <nav aria-label="On this page" className="sticky top-4 hidden max-h-[calc(100dvh-8rem)] w-56 shrink-0 self-start overflow-y-auto xl:block">
      <p className="mb-2 text-xs font-semibold tracking-wide text-quaternary uppercase">On this page</p>
      <ul className="flex flex-col border-l border-secondary">
        {items.map((item) => (
          <li key={item.id}>
            {link(item, false)}
            {item.children && item.children.length > 0 && (
              <ul className="flex flex-col">
                {item.children.map((c) => (
                  <li key={c.id}>{link(c, true)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ── The tab ──

export function ProjectTab({
  layout = "default",
  lead,
  sheet = false,
  repeatHeaderFacts = true,
  overviewHeading = true,
  sheetTop,
  disclosure = false,
  peopleStyle = "rows",
}: {
  /** "v3": icon-only card actions on hover and a full-width content column. */
  layout?: "default" | "v3";
  /** Content above the first section, inside the content column, so "On this page" starts level with it. */
  lead?: ReactNode;
  /** Draw the four sections as one white sheet, divided by lines, instead of stacked with gaps. Nothing in them changes. */
  sheet?: boolean;
  /** Repeat the status and the start and end dates in the Project details card. A layout whose header already shows them turns this off (CONTRACTS 4.3: never restate a
   *  fact in two treatments on one screen). @default true */
  repeatHeaderFacts?: boolean;
  /** Give the Overview section its own heading. The tab that holds it may already be called Overview, so a layout can turn it off. @default true */
  overviewHeading?: boolean;
  /** With `sheet`: rows across the top of the sheet, above its first section, flush with its edges (the designer's frame, Figma 484:4583: a banner is the sheet's first row). */
  sheetTop?: ReactNode;
  /** Progressive disclosure (the post-6-oct lab, 22 Oct 2026): the first section stays open and the sections after it start closed under their headings, each opening in place; "On this page" and editing a
   *  card open the section that holds it. Needs `sheet`. The product page (30 Oct 2026) and the post-6-oct lab turn it on. @default false */
  disclosure?: boolean;
  /** How a person on the Published by and Project managers cards is drawn (`/proto/project-people`): "rows" is as it was; "ladder" makes the name the one semibold line; "avatar" is the design system's person
   *  (an avatar, a name, one supporting line); "card" is that, each person in a card of their own with the section's cards dissolved. @default "rows" */
  peopleStyle?: PeopleStyle;
}) {
  const { project, saveProject, canEdit } = useEditStore();
  const [editing, setEditingState] = useState<ProjectCardId | null>(null);
  const [focusLabel, setFocusLabel] = useState<string | undefined>(undefined);
  const setEditing = (next: ProjectCardId | null) => {
    setFocusLabel(undefined);
    setEditingState(next);
    if (next) revealSection(`card-${next}`);
  };
  const openCard = (card: ProjectCardId, label?: string) => {
    setEditingState(card);
    setFocusLabel(label);
    revealSection(`card-${card}`);
  };
  const [removing, setRemoving] = useState<RestrictionTypeKey | null>(null);
  const { details: d, collection: c, restrictions: r } = project;
  const [openSections, setOpenSections] = useState<Set<Key>>(new Set());
  const [mountedSections, setMountedSections] = useState<Set<Key>>(new Set());
  const changeOpenSections = (keys: Set<Key>) => {
    setOpenSections(keys);
    setMountedSections((prev) => new Set([...prev, ...keys]));
  };

  const boundary = c.geographicExtent.boundary;
  const extentCentre = boundary ? boundaryCentre(boundary) : null;
  const hasExtent = !!boundary || isGeoExtentComplete(c.geographicExtent);
  const method = COLLECTION_METHOD_OPTIONS.find((o) => o.id === c.collectionMethod);
  const focus = c.focusAreas.map((id) => (id === "other" ? c.focusAreaOther || "Other" : (FOCUS_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id)));
  const species = c.targetedSpeciesIds.map((id) => REGISTRATION_SPECIES.find((s) => s.id === id)?.commonName ?? id);
  const enabled = r.hasRestrictions ? RESTRICTION_TYPE_META.filter((m) => r.enabledTypes.has(m.key)) : [];
  const card = (id: ProjectCardId): TocItem => ({ id: `card-${id}`, label: CARD_TITLES[id] });

  // Progressive disclosure: which closed section holds an element ("On this page" id), and opening it. A card that is being edited, or that "On this page" points at, is never left inside a closed section.
  const sectionOf = (id: string): "data-collection" | "privacy" | null => {
    if (id === "data-collection" || id === "card-extent" || id === "card-collection" || id === "card-permits") return "data-collection";
    if (id === "privacy" || id === "card-add-restriction" || enabled.some((m) => id === `card-${m.key}`)) return "privacy";
    return null;
  };
  const revealSection = (id: string): boolean => {
    const key = disclosure ? sectionOf(id) : null;
    if (!key || openSections.has(key)) return false;
    changeOpenSections(new Set([...openSections, key]));
    return true;
  };
  // A person is there when something of them is written: a contact or manager the form left blank is not one.
  const written = (p: { firstName: string; lastName: string; email: string }) => `${p.firstName}${p.lastName}${p.email}`.trim() !== "";
  const hasContact = d.dataOwnerContacts.some(written);
  const hasManager = d.projectManagers.some(written);
  const overviewStacked = editing === "details" || editing === "owner" || editing === "managers";
  const needsDetails = (ids: ProjectCardId[]) => ids.some((x) => cardMissing(x, project).length > 0);
  const detailsNeeded = (
    <Badge size="sm" color="warning">
      Details needed
    </Badge>
  );

  const toc: TocItem[] = [
    { id: "overview", label: "Overview", children: [card("details"), card("owner"), card("managers")] },
    { id: "data-collection", label: "Data collection and methodology", children: [card("extent"), card("collection"), card("permits")] },
    { id: "privacy", label: "Privacy and restrictions", children: enabled.map((m) => card(m.key)) },
  ];

  const removeType = (key: RestrictionTypeKey) => {
    const enabledTypes = new Set(r.enabledTypes);
    enabledTypes.delete(key);
    saveProject({ ...project, restrictions: { ...r, enabledTypes, hasRestrictions: enabledTypes.size > 0 } });
    toast.success(`${CARD_TITLES[key]} removed`, { description: "Changes are kept for this session only. This preview has no backend." });
  };

  return (
    <>
    <div className="flex gap-10">
      <LayoutContext.Provider value={layout}>
      <PeopleStyleContext.Provider value={peopleStyle}>
      <InlineEditContext.Provider value={{ editing, setEditing, open: openCard, focusLabel }}>
      <div className={cx("flex min-w-0 flex-1 flex-col", sheet ? "gap-8" : "gap-10", layout === "default" && "max-w-4xl")}>
        {lead}
        <SheetContext.Provider value={sheet}>
        <DisclosureContext.Provider value={disclosure ? { openKeys: openSections, mounted: mountedSections, onOpenKeysChange: changeOpenSections } : null}>
        {/* `overflow-clip` rounds the sheet's corners without making it a scroll container, so a card's Cancel and Save changes still pin to the bottom of the window (`overflow-hidden` would stop them). */}
        <div className={sheet ? "flex flex-col overflow-clip rounded-xl border border-secondary bg-primary" : "contents"}>
        {sheet && sheetTop}
        <Section id="overview" title="Overview" description="What the project is and who runs it." bare={!overviewHeading} alwaysOpen>
          {/* Two columns from a wide window (the designer, 30 Oct 2026): the project's own details on the left, who published it and who manages it
              stacked on the right, the left card as tall as the two beside it. Narrower, the three stack in that order. While one of the three is
              being edited they stack whatever the width, so its editor has the whole row, as a card in a two-up row always has. */}
          <div className={cx("gap-4", overviewStacked ? "flex flex-col" : "grid lg:grid-cols-2")}>
            <Card card="details" onEdit={setEditing} className="lg:row-span-2">
              <Rows
                rows={[
                  ...(repeatHeaderFacts ? [{ label: "Status", value: project.status }] : []),
                  { label: "Short title", value: d.shortTitle },
                  { label: "Full title", value: d.sameAsShortTitle ? d.shortTitle : d.fullTitle },
                  { label: "Abstract", value: d.abstract },
                  ...(repeatHeaderFacts
                    ? [
                        { label: "Start date", value: formatDay(d.startDate) },
                        { label: "End date", value: d.endDate ? formatDay(d.endDate) : "Ongoing" },
                      ]
                    : []),
                ]}
              />
            </Card>
            <Card card="owner" onEdit={setEditing} bare={peopleStyle === "card" && hasContact}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {d.dataOwnerType === "organisation" && d.dataOwnerOrgLogo && (
                    // eslint-disable-next-line @next/next/no-img-element -- a local object URL picked in this session
                    <img src={d.dataOwnerOrgLogo.previewUrl} alt={`${d.dataOwnerOrgName} logo`} className="size-10 rounded-md border border-secondary object-contain" />
                  )}
                  <p className="text-sm font-medium text-primary">{d.dataOwnerType === "organisation" ? d.dataOwnerOrgName : "Individual / Person"}</p>
                </div>
                {hasContact ? (
                  d.dataOwnerContacts.map((contact, i) => {
                    const role = contactRole(d, i);
                    return (
                      <div key={contact.id} className={cx(peopleStyle !== "card" && "border-t border-secondary pt-3")}>
                        <Person
                          name={`${contact.firstName} ${contact.lastName}`.trim()}
                          role={roleLabel(role.role, role.roleOther)}
                          team={contact.organisation}
                          email={contact.email}
                          phone={contact.phone}
                          primary={i === 0}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="border-t border-secondary">
                    <ListEmptyState
                      compact
                      icon={User01}
                      title="No contact named"
                      description={canEdit ? "Add the person to contact about this project's data." : "No one has been named to contact about this project's data."}
                      action={canEdit ? { label: "Add contact", icon: Plus, onPress: () => setEditing("owner") } : undefined}
                    />
                  </div>
                )}
              </div>
            </Card>
            <Card card="managers" onEdit={setEditing} bare={peopleStyle === "card" && hasManager}>
              {hasManager ? (
                <div className="flex flex-col gap-3">
                  {d.projectManagers.map((m, i) => (
                    <div key={m.id} className={cx(i > 0 && peopleStyle !== "card" && "border-t border-secondary pt-3")}>
                      <Person name={`${m.firstName} ${m.lastName}`.trim()} role={roleLabel(m.role, m.roleOther)} team={m.organisation} email={m.email} phone={m.phone} primary={m.isPrimary} />
                    </div>
                  ))}
                </div>
              ) : (
                <ListEmptyState
                  compact
                  icon={Users01}
                  title="No project managers yet"
                  description={canEdit ? "Name who manages this project. Project managers can change its access and restrictions." : "No project manager has been named yet."}
                  action={canEdit ? { label: "Add project manager", icon: Plus, onPress: () => setEditing("managers") } : undefined}
                />
              )}
            </Card>
          </div>
        </Section>

        <Section id="data-collection" title="Data collection and methodology" description="Where, how and under what permits the data was collected." collapsedNote={needsDetails(["extent", "collection", "permits"]) ? detailsNeeded : undefined}>
          <Card card="extent" onEdit={setEditing}>
            {!hasExtent ? (
              <ListEmptyState
                compact
                icon={MarkerPin04}
                title="No geographic extent yet"
                description={canEdit ? "Draw or choose the area this project's data collection covers." : "The area this project's data collection covers has not been defined yet."}
                action={canEdit ? { label: "Add geographic extent", icon: Plus, onPress: () => setEditing("extent") } : undefined}
              />
            ) : (
              // One shell for every project and every kind of extent (the designer, 30 Oct 2026: "The shell for project details has to be consistent. no exceptions."):
              // the location details on the left and the map on the right, half the card each, the map as tall as the table beside it, and what the extent is in a row under
              // the pair; stacked (details first) below the lg breakpoint. A shape that has no point of its own (a polygon) is located by its centre, as a record's location
              // is; an extent that is only a name (a shapefile) has no point, so the table says so.
              <div className="flex flex-col gap-4">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
                  <LocationDetailsTable lat={extentCentre?.[0]} lon={extentCentre?.[1]} />
                  <ExpandableMap
                    title={`${d.shortTitle}, geographic extent`}
                    boundaries={boundary ? [{ ...boundary, id: "project-extent" }] : []}
                    onBoundaryAdd={() => {}}
                    activeDrawTool={null}
                    onDrawToolChange={() => {}}
                    className="h-64 w-full lg:h-full lg:min-h-64"
                  />
                </div>
                <Rows rows={[{ label: "Extent", value: boundary ? drawnShapeLine(boundary) : geoExtentSummary(c.geographicExtent) }]} />
              </div>
            )}
          </Card>
          <Card card="collection" onEdit={setEditing}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Focus areas</p>
                <Chips items={focus} />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Targeted species</p>
                {species.length > 0 ? <Chips items={species} /> : <p className="text-sm text-quaternary">Not provided</p>}
              </div>
              <Rows
                rows={[
                  { label: "Collection method", value: method?.label },
                  { label: "Methodology", value: c.methodDetails },
                  { label: "Limitations and biases", value: c.limitationsAndBiases },
                ]}
              />
            </div>
          </Card>
          <Card card="permits" onEdit={setEditing}>
            <Rows
              rows={[
                ...(c.permits.length === 0 ? [{ label: "Permit", value: "" }] : []),
                ...c.permits.flatMap((p, i) => [
                  { label: c.permits.length > 1 ? `Permit ${i + 1} type` : "Permit type", value: PERMIT_TYPE_OPTIONS.find((o) => o.id === p.type)?.label ?? "" },
                  { label: c.permits.length > 1 ? `Permit ${i + 1} number` : "Permit number", value: p.number },
                ]),
                { label: "URI / DOI", value: c.uriDoi },
              ]}
            />
          </Card>
        </Section>

        <Section
          id="privacy"
          title="Privacy and restrictions"
          description="What is held back from public release, and why."
          count={enabled.length}
          collapsedNote={needsDetails(enabled.map((m) => m.key)) ? detailsNeeded : undefined}
          action={
            canEdit && OFFERED_RESTRICTION_TYPES.some((m) => !enabled.some((e) => e.key === m.key)) && !(layout === "v3" && editing !== null) ? (
              <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => setEditing("add-restriction")}>
                Add restriction
              </Button>
            ) : undefined
          }
        >
          {layout === "v3" && editing === "add-restriction" && <Card card="add-restriction" onEdit={setEditing}>{null}</Card>}
          {/* Nothing is held back: said as a state, in the card every other part of this page uses, not as a dashed placeholder. Adding one is the
              section's own button above, so it is not offered a second time here, and the line goes while the add form is open. */}
          {enabled.length === 0 && editing !== "add-restriction" && (
            <div className="flex flex-col rounded-xl border border-secondary bg-primary">
              <ListEmptyState compact headingLevel={3} icon={LockUnlocked01} title="No restrictions" description="Everything in this project is openly available." />
            </div>
          )}
          {enabled.map((m) => (
            <Card key={m.key} card={m.key} description={RESTRICTION_DESCRIPTIONS[m.key]} onEdit={setEditing} onRemove={() => setRemoving(m.key)}>
              {m.key === "embargo" && (
                <Rows
                  rows={[
                    { label: "Embargo type", value: r.embargo.types.map((t) => (t === "other" ? r.embargo.typeOther || "Other" : EMBARGO_TYPE_OPTIONS.find((o) => o.id === t)?.label)).join(", ") },
                    { label: "Justification", value: r.embargo.reason },
                    { label: "Ends", value: formatDay(r.embargo.endDate) },
                    { label: "After the embargo ends", value: r.embargo.afterEmbargo ?? "" },
                  ]}
                />
              )}
              {m.key === "species" &&
                (r.species.length === 0 ? (
                  <p className="text-sm text-quaternary">No species nominated yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {r.species.map((s) => (
                      <Rows
                        key={s.id}
                        rows={[
                          { label: "Species", value: REGISTRATION_SPECIES.find((x) => x.id === s.speciesId)?.commonName ?? s.speciesId },
                          {
                            label: "Restricted concept",
                            value: s.scope === "all" ? "All concepts" : s.concepts.filter((cr) => cr.concept).map((cr) => conceptLabel(cr, SPECIES_CONCEPTS)).join(", "),
                          },
                          ...(s.scope === "selected" ? [{ label: "Rule", value: s.concepts.filter((cr) => cr.concept).map((cr) => conceptValueLabel(cr, SPECIES_CONCEPTS) || "Withheld").join(", ") }] : []),
                          { label: "Expectations data restrictions", value: expectationLabel(s.expectation) },
                          ...(s.scope === "all"
                            ? [{ label: "Justification", value: s.justification }]
                            : s.concepts.filter((cr) => cr.concept).map((cr) => ({ label: `Justification: ${conceptLabel(cr, SPECIES_CONCEPTS)}`, value: cr.justification }))),
                        ]}
                      />
                    ))}
                  </div>
                ))}
              {m.key === "locations" &&
                (r.locations.length === 0 ? (
                  <p className="text-sm text-quaternary">No locations nominated yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {r.locations.map((l) => (
                      <Rows
                        key={l.id}
                        rows={[
                          { label: "Location", value: l.name },
                          { label: "Extent", value: isGeoExtentComplete(l.extent) ? geoExtentSummary(l.extent) : "" },
                          { label: "Expectations data restrictions", value: expectationLabel(l.expectation) },
                          { label: "Justification", value: l.justification },
                        ]}
                      />
                    ))}
                  </div>
                ))}
              {m.key === "metadata" && (
                <Rows
                  rows={[
                    ...r.metadata.concepts
                      .filter((cr) => cr.concept)
                      .flatMap((cr) => [
                        { label: conceptLabel(cr, PROJECT_METADATA_CONCEPTS), value: conceptValueLabel(cr, PROJECT_METADATA_CONCEPTS) },
                        { label: "Justification", value: cr.justification },
                      ]),
                  ]}
                />
              )}
              {m.key === "cultural" && (
                <Rows
                  rows={[
                    { label: "Indigenous Information Authority", value: culturalOf(r).authority },
                    { label: "IIA contact details", value: culturalOf(r).contact },
                    { label: "Expectations data restrictions", value: expectationLabel(culturalOf(r).expectation) },
                    { label: "Justification", value: culturalOf(r).justification },
                  ]}
                />
              )}
              {m.key === "all" && (
                <Rows
                  rows={[
                    { label: "Expectations data restrictions", value: expectationLabel(allRecordsOf(r).expectation) },
                    { label: "Justification", value: allRecordsOf(r).justification },
                  ]}
                />
              )}
              {m.key === "other" && <Rows rows={[{ label: "Restriction", value: r.otherRestrictions }]} />}
            </Card>
          ))}
        </Section>
        </div>
        </DisclosureContext.Provider>
        </SheetContext.Provider>
      </div>
      </InlineEditContext.Provider>
      </PeopleStyleContext.Provider>
      </LayoutContext.Provider>

      <OnThisPage items={toc} onBeforeGo={revealSection} />

      {layout === "default" && <ProjectCardDrawer card={editing} onChange={setEditing} />}
      <DestructiveModal confirmIcon={Trash01} cancelIcon={ArrowLeft}
        isOpen={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing ? CARD_TITLES[removing] : "restriction"}?`}
        description="This project's data will no longer be protected by this restriction. You can add it again with Add restriction."
        confirmLabel="Remove restriction"
        cancelLabel="Keep restriction"
        onConfirm={() => {
          if (removing) removeType(removing);
          setRemoving(null);
        }}
      />
    </div>
    </>
  );
}
