"use client";

// The notifications popover. Taken from Vercel's (designer, 13 Oct 2026: "much cleaner ... why don't we steal Vercel's pattern?"): a tinted icon at the left of each notification, at
// the right an unread dot and when it happened, rows divided by a hairline, a row offering Done (it moves to Archive) where the time was when pointed at, a full-width "Mark all done"
// ending the Inbox; a row opens the page it is about (in this tab, or the real page for one the lab does not hold) and counts as read. Left out, on purpose: Vercel's Comments tab,
// settings gear and push prompt (we have none of them, so they would promise what is not there, 2.10). Read, Done and Archive are kept for the session only; there is no backend.
//
// Refined 19 Oct 2026 (the designer: "the notifications bit looks really confusing ... look at /mobbin for patterns", then "split into three tabs"). Seventeen rows of one long file name,
// sixteen of them successes, buried the one failure and made the Inbox count read as seventeen things to do. From Mobbin: Slite's split between "where you're needed" and "nice to
// see"; Fireflies' day headings; Jira's and Qatalog's two lines (what happened, then a muted line); Air's several uploads folded into one event; Proton's and fal's quick tabs for the
// kind of row. So:
//   - Three tabs. Inbox is what asks something of the person (a failed or partly added upload, a request, a nomination, flagged concepts): the only rows with an unread dot, and the
//     only ones the bell's count badge and the tab's count are made of. Activity is the log of what only tells them (an upload that was added): read only, never unread, nothing to mark.
//     Archive is what has been marked done.
//   - Rows with a file are two lines: what happened (bold), then the file and the project (muted, cut with an ellipsis); the time stays at the right. A row without one is the sentence.
//   - Under day headings (Today, Yesterday, Earlier), newest first; a row with no date (the flagged concepts) comes first, under none.
//   - Uploads that ended the same way, in the same project, on the same day fold into one row ("3 uploads added") that opens to list them.
//   - A row of kind tabs (All, Uploads, Requests ...) replaces the Filter button and its "Show all activity": one control where there were three. It is drawn only on a tab whose rows
//     are of more than one kind (2.12), applies as it is chosen (1.9 item 2), and is kept with the inbox state, so it is still there when the bell is opened again.
// The bell shows it is open (the same fill as pointing at it) while its popover is. The kind tabs stay on one line and scroll sideways with no scrollbar, a fade on the right showing there is
// more (KindTabs); wrapping them onto a second line, tried first, was rejected.
// Spacing: 16px in from the left and right everywhere (the tabs, the kind tabs, the day headings, the rows), the tabs 12px from the top, a row's text 4px down so its first line sits on
// the icon's centre as a sentence row's does. The popover is `rounded-xl` (12px), not the shared Popover's 8px: the "Mark all done" button is a design system button of 8px with 4px
// around it, and 12px - 4px is 8px, so its corners are concentric with the popover's (CONTRACTS 2.13).
// What the rows are, per role: attention.tsx. Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useCallback, useState } from "react";
import { Button as AriaButton, Dialog, DialogTrigger } from "react-aria-components";
import { Archive, Bell01, Check, ChevronDown, ClockRewind, FlipBackward, Inbox01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Popover } from "@/components/base/select/popover";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { ACTIVITY_KINDS, type ActivityKind, type AttentionTask } from "./attention";

type TabId = "inbox" | "activity" | "archive";

/** Newest first; a row with no date (it has none to give) comes before the dated ones. */
const newestFirst = (list: AttentionTask[]) => [...list].sort((a, b) => (b.at ?? "9").localeCompare(a.at ?? "9"));

/** Done and read state for the session, kept by the shell so it survives the bell moving between the account row and the icon-only column. */
export function useInboxState(items: AttentionTask[]) {
  const [done, setDone] = useState<string[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [chosen, setChosen] = useState<ActivityKind | "all">("all");
  const needsYou = items.filter((i) => i.attention);
  const lists: Record<TabId, AttentionTask[]> = {
    inbox: newestFirst(needsYou.filter((i) => !done.includes(i.id))),
    activity: newestFirst(items.filter((i) => !i.attention)),
    archive: newestFirst(needsYou.filter((i) => done.includes(i.id))),
  };
  /** One tab's rows, the kinds among them (in the kind tabs' order), the kind chosen (All when this tab has none of it) and the rows that kind leaves. */
  const view = (tab: TabId) => {
    const all = lists[tab];
    const kinds = ACTIVITY_KINDS.filter((k) => all.some((i) => i.kind === k.id));
    const kind = kinds.some((k) => k.id === chosen) ? chosen : "all";
    return { all, kinds, kind, shown: kind === "all" ? all : all.filter((i) => i.kind === kind) };
  };
  return {
    view,
    inboxCount: lists.inbox.length,
    // Only what asks something of the person is ever unread: the bell's count badge and the tab's count are made of nothing else.
    unread: lists.inbox.filter((i) => !read.includes(i.id)).length,
    isRead: (id: string) => read.includes(id),
    setKind: setChosen,
    markRead: (id: string) => setRead((r) => (r.includes(id) ? r : [...r, id])),
    markDone: (id: string) => setDone((d) => (d.includes(id) ? d : [...d, id])),
    restore: (id: string) => setDone((d) => d.filter((x) => x !== id)),
    // Done applies to what is listed: with a kind chosen, only those rows.
    markAllDone: () => setDone((d) => [...d, ...view("inbox").shown.map((i) => i.id).filter((id) => !d.includes(id))]),
  };
}
export type InboxState = ReturnType<typeof useInboxState>;

/** "5h", "3d", then a date: how long ago, as Vercel's rows say it. */
function when(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const hours = (Date.now() - d.getTime()) / 36e5;
  if (hours >= 0 && hours < 24) return `${Math.max(1, Math.round(hours))}h`;
  if (hours >= 24 && hours < 24 * 7) return `${Math.round(hours / 24)}d`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

/** The heading a row sits under: today, yesterday, or earlier; "" for a row with no date. */
function dayHeading(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const midnight = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((midnight(new Date()) - midnight(d)) / 864e5);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : "Earlier";
}

type Entry = { type: "row"; item: AttentionTask } | { type: "group"; key: string; items: AttentionTask[] };

/** Rows of one `group` (two or more) become one entry, placed where the first of them was. */
function fold(items: AttentionTask[]): Entry[] {
  const counts = new Map<string, number>();
  for (const i of items) if (i.group) counts.set(i.group, (counts.get(i.group) ?? 0) + 1);
  const out: Entry[] = [];
  const placed = new Set<string>();
  for (const i of items) {
    if (!i.group || (counts.get(i.group) ?? 0) < 2) out.push({ type: "row", item: i });
    else if (!placed.has(i.group)) {
      placed.add(i.group);
      out.push({ type: "group", key: i.group, items: items.filter((x) => x.group === i.group) });
    }
  }
  return out;
}

/** A row's words: two lines (what happened, then the muted file and project) or, with none, its sentence. */
function RowText({ item }: { item: AttentionTask }) {
  if (item.title) {
    return (
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
        <span className="text-sm font-semibold text-pretty text-primary">{item.title}</span>
        {/* The file name is cut with an ellipsis; the project after it is never cut, because it is the part that tells two uploads of one file apart. */}
        {item.file && item.project ? (
          <span className="flex min-w-0 text-sm text-tertiary">
            <span className="truncate">{item.file}</span>
            <span className="shrink-0 whitespace-pre">{` \u00b7 ${item.project}`}</span>
          </span>
        ) : (
          item.detail && <span className="truncate text-sm text-tertiary">{item.detail}</span>
        )}
      </span>
    );
  }
  return (
    <p className="m-0 min-w-0 flex-1 pt-1 text-sm text-pretty text-secondary">
      {item.segments.map((s, i) =>
        s.bold ? (
          <strong key={i} className="font-semibold text-primary">
            {s.text}
          </strong>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </p>
  );
}

const rowButton = "flex w-full items-start gap-3 px-4 py-3 text-left outline-focus-ring hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2";

function Row({
  item,
  unread,
  action,
  onOpen,
  nested,
}: {
  item: AttentionTask;
  unread: boolean;
  action?: { label: string; icon: typeof Check; onPress: () => void };
  onOpen: () => void;
  /** A row inside a folded group: no icon of its own, set in under the group's. */
  nested?: boolean;
}) {
  const time = when(item.at);
  const ActionIcon = action?.icon;
  return (
    <li className="group relative border-t border-secondary first:border-t-0">
      <button type="button" onClick={onOpen} className={cx(rowButton, nested && "pl-15")}>
        {!nested && <FeaturedIcon icon={item.icon} color={item.tone} theme="light" size="sm" />}
        <RowText item={item} />
        {/* The unread dot and the time; pointed at, Done takes the time's place. */}
        <span className="flex shrink-0 items-center gap-2 pt-1.5 transition-opacity duration-100 ease-linear group-focus-within:opacity-0 group-hover:opacity-0">
          {unread && <span aria-label="Unread" className="size-2 rounded-full bg-brand-solid" />}
          {time && <span className="text-sm text-quaternary tabular-nums">{time}</span>}
        </span>
      </button>
      {action && ActionIcon && (
        <button
          type="button"
          aria-label={action.label}
          title={action.label}
          onClick={action.onPress}
          className="absolute top-2.5 right-3 grid size-7 place-items-center rounded-md text-quaternary opacity-0 outline-focus-ring transition-opacity duration-100 ease-linear hover:bg-primary_hover hover:text-primary focus-visible:opacity-100 focus-visible:outline-2 group-focus-within:opacity-100 group-hover:opacity-100"
        >
          <ActionIcon className="size-4" />
        </button>
      )}
    </li>
  );
}

/** Several rows folded into one: its own icon and words, the newest one's time, and a chevron that opens the rows it holds. */
function GroupRow({ items, unread, open, onToggle, children }: { items: AttentionTask[]; unread: boolean; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  const first = items[0];
  const rest = items.length - 1;
  const time = when(first.at);
  return (
    <li className="border-t border-secondary first:border-t-0">
      <button type="button" aria-expanded={open} onClick={onToggle} className={rowButton}>
        <FeaturedIcon icon={first.icon} color={first.tone} theme="light" size="sm" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
          <span className="text-sm font-semibold text-pretty text-primary">{first.groupTitle?.(items.length) ?? `${items.length} notifications`}</span>
          <span className="flex min-w-0 text-sm text-tertiary">
            <span className="truncate">{first.file}</span>
            <span className="shrink-0 whitespace-pre">{` and ${rest} more${first.project ? ` \u00b7 ${first.project}` : ""}`}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 pt-1.5">
          {unread && <span aria-label="Unread" className="size-2 rounded-full bg-brand-solid" />}
          {time && <span className="text-sm text-quaternary tabular-nums">{time}</span>}
          <ChevronDown aria-hidden className={cx("size-4 text-fg-quaternary transition-transform duration-150 ease-out motion-reduce:transition-none", open && "rotate-180")} />
        </span>
      </button>
      {open && <ul className="m-0 list-none border-t border-secondary bg-secondary p-0">{children}</ul>}
    </li>
  );
}

/** The wash over the right end of the kind tabs: the popover's own white (`--ui-bg-primary`) falling away in steps, not one straight ramp, so it has no visible edge and does not band. */
const WASH = [
  "var(--ui-bg-primary) 0%",
  "color-mix(in srgb, var(--ui-bg-primary) 92%, transparent) 20%",
  "color-mix(in srgb, var(--ui-bg-primary) 65%, transparent) 45%",
  "color-mix(in srgb, var(--ui-bg-primary) 30%, transparent) 70%",
  "color-mix(in srgb, var(--ui-bg-primary) 8%, transparent) 90%",
  "transparent 100%",
].join(", ");

/**
 * The kind tabs: one line, however many there are. Past the popover's width they scroll sideways with no scrollbar, and a white wash over the right end says there is more; it is
 * there only while there is more to reach, fading away as the last tab comes into view (the designer, 19 Oct 2026: "horizontal scroll without the scroll bar ... a gradient on the
 * right. All filters should be on one line", then "white gradient wash on the right of the filters to make this look more premium"). Whether there is more is read again whenever the
 * row or its tabs change size and whenever it scrolls: it is first read while the popover is still being laid out, when everything measures zero, so a reading taken once on render
 * left the wash off. The row scrolls on the horizontal axis only: `overflow-x: auto` alone makes the vertical axis `auto` too, so a sub-pixel of overflow let it scroll up and down; it is
 * `overflow-y-hidden`, a touch drag on it pans sideways only (`touch-pan-x`) and what is left of a scroll does not carry on to the popover or the page (`overscroll-x-contain`).
 */
function KindTabs({ kinds, kind, onChange }: { kinds: { id: ActivityKind; label: string }[]; kind: ActivityKind | "all"; onChange: (next: ActivityKind | "all") => void }) {
  const [more, setMore] = useState(false);
  const watch = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const check = () => setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    el.addEventListener("scroll", check, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", check);
    };
  }, []);
  return (
    <div className="relative border-b border-secondary">
      <div ref={watch} className="overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tabs selectedKey={kind} onSelectionChange={(k) => onChange(k as ActivityKind | "all")} className="w-max">
          <TabList aria-label="Show" type="button-gray" size="sm" className="flex-nowrap">
            <Tab id="all" label="All" />
            {kinds.map((k) => (
              <Tab key={k.id} id={k.id} label={k.label} />
            ))}
          </TabList>
        </Tabs>
      </div>
      <span
        aria-hidden
        style={{ backgroundImage: `linear-gradient(to left, ${WASH})` }}
        className={cx("pointer-events-none absolute inset-y-0 right-0 w-16 transition-opacity duration-150 ease-out motion-reduce:transition-none", more ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}

const EMPTY: Record<TabId, string> = { inbox: "You’re all caught up.", activity: "No activity yet.", archive: "Nothing in the archive." };

/** One tab's body: the kind tabs (when its rows are of more than one kind), the rows under day headings, and, for the Inbox, Mark all done. */
function Feed({ tab, state, onRun, close }: { tab: TabId; state: InboxState; onRun: (task: AttentionTask) => void; close: () => void }) {
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const v = state.view(tab);
  const toggle = (key: string) => setOpenGroups((g) => (g.includes(key) ? g.filter((k) => k !== key) : [...g, key]));
  const sections: { heading: string; items: AttentionTask[] }[] = [];
  for (const item of v.shown) {
    const heading = dayHeading(item.at);
    const last = sections[sections.length - 1];
    if (last && last.heading === heading) last.items.push(item);
    else sections.push({ heading, items: [item] });
  }
  const rowFor = (i: AttentionTask, nested = false) => (
    <Row
      key={i.id}
      item={i}
      nested={nested}
      unread={tab === "inbox" && !state.isRead(i.id)}
      action={tab === "inbox" ? { label: "Mark done", icon: Check, onPress: () => state.markDone(i.id) } : tab === "archive" ? { label: "Move back to Inbox", icon: FlipBackward, onPress: () => state.restore(i.id) } : undefined}
      onOpen={() => {
        if (tab === "inbox") state.markRead(i.id);
        close();
        onRun(i);
      }}
    />
  );
  return (
    <div className="flex flex-col">
      {v.kinds.length > 1 && <KindTabs kinds={v.kinds} kind={v.kind} onChange={state.setKind} />}
      {v.shown.length === 0 ? (
        <p className="m-0 px-4 py-10 text-center text-sm text-tertiary">{EMPTY[tab]}</p>
      ) : (
        <div className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain">
          {sections.map((s) => (
            <section key={s.heading || "undated"} aria-label={s.heading || undefined}>
              {s.heading && <p className="m-0 px-4 pt-3 pb-1 text-xs font-semibold text-quaternary">{s.heading}</p>}
              <ul className="m-0 list-none p-0">
                {fold(s.items).map((e) =>
                  e.type === "row" ? (
                    rowFor(e.item)
                  ) : (
                    <GroupRow key={e.key} items={e.items} unread={tab === "inbox" && e.items.some((i) => !state.isRead(i.id))} open={openGroups.includes(e.key)} onToggle={() => toggle(e.key)}>
                      {e.items.map((i) => rowFor(i, true))}
                    </GroupRow>
                  ),
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
      {tab === "inbox" && v.shown.length > 0 && (
        <div className="border-t border-secondary p-1">
          <Button color="tertiary" size="sm" iconLeading={Check} className="w-full" onPress={state.markAllDone}>
            Mark all done
          </Button>
        </div>
      )}
    </div>
  );
}

export function NotificationsBell({
  state,
  onRun,
  rail,
  buttonClass,
}: {
  state: InboxState;
  onRun: (task: AttentionTask) => void;
  rail?: boolean;
  buttonClass: string;
}) {
  const [tab, setTab] = useState<TabId>("inbox");
  const bell = (
    <AriaButton aria-label={state.unread ? `Notifications, ${state.unread} unread` : "Notifications"} className={cx(buttonClass, "relative aria-expanded:bg-tertiary aria-expanded:text-primary")}>
      <Bell01 className="size-4" />
      {/* The count badge production draws on an icon (Home's task count in `PrimaryRail`), class for class: a 16px error-red circle, 10px semibold white figures, no ring. This was an 8px
          dot with `ring-2 ring-bg-primary`, a class that does not exist, so the ring took the bell's own grey and the dot read as outlined (the designer: "inconsistent with production"). */}
      {state.unread > 0 && (
        <span aria-hidden className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-error-solid text-[10px] font-semibold tabular-nums text-white">
          {state.unread > 9 ? "9+" : state.unread}
        </span>
      )}
    </AriaButton>
  );
  return (
    <DialogTrigger>
      {rail ? (
        <Tooltip title="Notifications" placement="right">
          {bell}
        </Tooltip>
      ) : (
        bell
      )}
      {/* Under the bell, its left edge on the bell's (`bottom start`); from the icon-only column it opens beside it. It was `bottom right`, which lines the popover's right edge up with the
          bell, and at 380px wide that is left of the window: it was pushed against the edge and covered the account row's own controls. */}
      <Popover size="auto" placement={rail ? "right top" : "bottom start"} className="w-[380px] overflow-hidden rounded-xl p-0">
        <Dialog aria-label="Notifications" className="flex flex-col outline-hidden">
          {({ close }) => (
            <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(k as TabId)} className="flex flex-col">
              <TabList aria-label="Notification views" type="underline" size="sm" className="gap-5 px-4 pt-3">
                <Tab id="inbox" label="Inbox" icon={Inbox01} badge={state.inboxCount} />
                <Tab id="activity" label="Activity" icon={ClockRewind} />
                <Tab id="archive" label="Archive" icon={Archive} />
              </TabList>
              {(["inbox", "activity", "archive"] as const).map((id) => (
                <TabPanel key={id} id={id} className="flex flex-col border-t border-secondary">
                  <Feed tab={id} state={state} onRun={onRun} close={close} />
                </TabPanel>
              ))}
            </Tabs>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
