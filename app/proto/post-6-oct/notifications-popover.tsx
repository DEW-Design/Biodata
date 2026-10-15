"use client";

// The notifications popover, taken from Vercel's (designer, 13 Oct 2026: "much cleaner ... why don't we steal Vercel's pattern?"):
// Inbox and Archive tabs with a count on Inbox; each notification one sentence with its key words in bold, a tinted icon at the left
// and, at the right, an unread dot and when it happened; rows divided by a hairline; pointed at, a row offers Done (it moves to
// Archive) where the time was; a full-width "Mark all done" ends the Inbox. What is left out, on purpose: Vercel's Comments tab and
// settings gear (we have neither a comments feed nor a notification settings page, so they would promise what is not there, 2.10)
// and its push-notification prompt. A row opens the page it is about (in this tab, or the real page for one the lab does not hold)
// and counts as read. Read, Done and Archive are kept for the session only; there is no backend.
// What the rows are, per role: attention.tsx. Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useState } from "react";
import { Button as AriaButton, Dialog, DialogTrigger } from "react-aria-components";
import { Archive, Bell01, Check, FlipBackward, Inbox01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Popover } from "@/components/base/select/popover";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import type { AttentionTask } from "./attention";

/** Done and read state for the session, kept by the shell so it survives the bell moving between the tab strip and the account row. */
export function useInboxState(items: AttentionTask[]) {
  const [done, setDone] = useState<string[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const inbox = items.filter((i) => !done.includes(i.id));
  const archive = items.filter((i) => done.includes(i.id));
  return {
    inbox,
    archive,
    unread: inbox.filter((i) => !read.includes(i.id)).length,
    isRead: (id: string) => read.includes(id),
    markRead: (id: string) => setRead((r) => (r.includes(id) ? r : [...r, id])),
    markDone: (id: string) => setDone((d) => (d.includes(id) ? d : [...d, id])),
    restore: (id: string) => setDone((d) => d.filter((x) => x !== id)),
    markAllDone: () => setDone((d) => [...d, ...inbox.map((i) => i.id).filter((id) => !d.includes(id))]),
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

function Row({ item, unread, actionLabel, onOpen, onAction, ActionIcon }: { item: AttentionTask; unread: boolean; actionLabel: string; onOpen: () => void; onAction: () => void; ActionIcon: typeof Check }) {
  const time = when(item.at);
  return (
    <li className="group relative border-t border-secondary first:border-t-0">
      <button type="button" onClick={onOpen} className="flex w-full items-start gap-3 px-4 py-3 text-left outline-focus-ring hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2">
        <FeaturedIcon icon={item.icon} color={item.tone} theme="light" size="sm" />
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
        {/* The unread dot and the time; pointed at, Done takes the time's place. */}
        <span className="flex shrink-0 items-center gap-2 pt-1.5 transition-opacity duration-100 ease-linear group-focus-within:opacity-0 group-hover:opacity-0">
          {unread && <span aria-label="Unread" className="size-2 rounded-full bg-brand-solid" />}
          {time && <span className="text-sm text-quaternary tabular-nums">{time}</span>}
        </span>
      </button>
      <button
        type="button"
        aria-label={actionLabel}
        title={actionLabel}
        onClick={onAction}
        className="absolute top-2.5 right-3 grid size-7 place-items-center rounded-md text-quaternary opacity-0 outline-focus-ring transition-opacity duration-100 ease-linear hover:bg-primary_hover hover:text-primary focus-visible:opacity-100 focus-visible:outline-2 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <ActionIcon className="size-4" />
      </button>
    </li>
  );
}

export function NotificationsBell({ state, onRun, compact, buttonClass }: { state: InboxState; onRun: (task: AttentionTask) => void; compact?: boolean; buttonClass: string }) {
  const [tab, setTab] = useState<"inbox" | "archive">("inbox");
  return (
    <DialogTrigger>
      <AriaButton aria-label={state.unread ? `Notifications, ${state.unread} unread` : "Notifications"} className={cx(buttonClass, "relative", compact && "size-7")}>
        <Bell01 className="size-4" />
        {state.unread > 0 && <span aria-hidden className="absolute top-1.5 right-1.5 size-2 rounded-full bg-error-solid ring-2 ring-bg-primary" />}
      </AriaButton>
      {/* From the account row (the rail) it opens to the right, from the tab strip it opens to the left. */}
      <Popover size="auto" placement={compact ? "bottom start" : "bottom right"} className="w-[380px] overflow-hidden p-0">
        <Dialog aria-label="Notifications" className="flex flex-col outline-hidden">
          {({ close }) => (
            <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(k as "inbox" | "archive")} className="flex flex-col">
              <TabList aria-label="Notification views" type="underline" size="sm" className="gap-5 px-4 pt-1">
                <Tab id="inbox" label="Inbox" icon={Inbox01} badge={state.inbox.length} />
                <Tab id="archive" label="Archive" icon={Archive} />
              </TabList>
              <TabPanel id="inbox" className="flex flex-col border-t border-secondary">
                {state.inbox.length === 0 ? (
                  <p className="m-0 px-4 py-10 text-center text-sm text-tertiary">You&rsquo;re all caught up.</p>
                ) : (
                  <>
                    <ul className="m-0 max-h-[min(60vh,26rem)] list-none overflow-y-auto p-0">
                      {state.inbox.map((i) => (
                        <Row
                          key={i.id}
                          item={i}
                          unread={!state.isRead(i.id)}
                          actionLabel="Mark done"
                          ActionIcon={Check}
                          onOpen={() => {
                            state.markRead(i.id);
                            close();
                            onRun(i);
                          }}
                          onAction={() => state.markDone(i.id)}
                        />
                      ))}
                    </ul>
                    <div className="border-t border-secondary p-1">
                      <Button color="tertiary" size="sm" iconLeading={Check} className="w-full" onPress={state.markAllDone}>
                        Mark all done
                      </Button>
                    </div>
                  </>
                )}
              </TabPanel>
              <TabPanel id="archive" className="flex flex-col border-t border-secondary">
                {state.archive.length === 0 ? (
                  <p className="m-0 px-4 py-10 text-center text-sm text-tertiary">Nothing in the archive.</p>
                ) : (
                  <ul className="m-0 max-h-[min(60vh,26rem)] list-none overflow-y-auto p-0">
                    {state.archive.map((i) => (
                      <Row
                        key={i.id}
                        item={i}
                        unread={false}
                        actionLabel="Move back to Inbox"
                        ActionIcon={FlipBackward}
                        onOpen={() => {
                          close();
                          onRun(i);
                        }}
                        onAction={() => state.restore(i.id)}
                      />
                    ))}
                  </ul>
                )}
              </TabPanel>
            </Tabs>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
