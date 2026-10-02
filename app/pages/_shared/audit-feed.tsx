"use client";

import { Zap } from "@untitledui/icons";
import type { BadgeColors } from "@/components/base/badges/badge-types";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { localIsoDate } from "@/app/pages/_shared/agreement-status";

// The full list of changes behind "Show all changes" in a record page's Audit Log (`AuditLog`, audit-log.tsx, which
// opens the tab with the created, activated and last-modified milestones): who moved the record to which status, and when, newest
// first. One sentence per move, taken from the activity feed Vercel uses in its team settings (Mobbin research, 2 Oct
// 2026): the person is the subject, the status is the badge, the date sits at the right. A run of moves by the same
// person shares one header and the lines under it drop the name. The newest move carries a "Current" chip. A note (a
// rejection reason, an on-hold note) sits under its move. "System" is the clock moving a record (Approved to Active).

export interface FeedEvent {
  status: string;
  /** `YYYY-MM-DD`. */
  at: string;
  by: string;
  note?: string;
}

type StatusMeta = Record<string, { label: string; badgeColor: BadgeColors }>;

const SYSTEM = "System";
// The same three-letter months formatShortDate writes everywhere else (toLocaleDateString gives "Sept").
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Today and Yesterday for the last two days, the date otherwise (only dates are stored, not times). */
function whenLabel(iso: string): string {
  const today = localIsoDate();
  if (iso === today) return "Today";
  if (iso === localIsoDate(new Date(parse(today).getTime() - 24 * 60 * 60 * 1000))) return "Yesterday";
  const date = parse(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function Actor({ name }: { name: string }) {
  return name === SYSTEM ? <Avatar size="xs" alt={SYSTEM} placeholderIcon={Zap} /> : <Avatar size="xs" initials={initialsOf(name)} alt={name} />;
}

function Move({ event, meta, current, withName }: { event: FeedEvent; meta: StatusMeta; current: boolean; withName: boolean }) {
  const status = meta[event.status];
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <p className="m-0 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-secondary">
          {withName && <span className="font-medium text-primary">{event.by}</span>}
          {event.status === "draft" ? "created this as" : "moved this to"}
          <Badge size="sm" color={status.badgeColor}>
            {status.label}
          </Badge>
          {current && (
            <Badge size="sm" type="modern" color="gray">
              Current
            </Badge>
          )}
        </p>
        <time dateTime={event.at} className="shrink-0 text-sm text-tertiary tabular-nums">
          {whenLabel(event.at)}
        </time>
      </div>
      {event.note && <p className="m-0 max-w-prose text-sm text-balance text-secondary">{event.note}</p>}
    </div>
  );
}

/** `events` are in the order they happened (oldest first), as the stores keep them. */
export function AuditFeed({ events, statusMeta, noun }: { events: FeedEvent[]; statusMeta: StatusMeta; noun: string }) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-secondary">
        <p className="m-0 p-6 text-sm text-tertiary">No status changes have been recorded for this {noun}.</p>
      </div>
    );
  }

  const newestFirst = [...events].reverse();
  // Consecutive moves by the same person share a header.
  const groups: { by: string; items: { event: FeedEvent; index: number }[] }[] = [];
  newestFirst.forEach((event, index) => {
    const last = groups[groups.length - 1];
    if (last && last.by === event.by) last.items.push({ event, index });
    else groups.push({ by: event.by, items: [{ event, index }] });
  });

  return (
    <ol aria-label="Audit log" className="m-0 flex list-none flex-col rounded-lg border border-secondary p-0">
      {groups.map((group) => {
        const first = group.items[0];
        const single = group.items.length === 1;
        return (
          <li key={`${group.by}-${first.index}`} className="flex gap-3 border-b border-secondary px-4 py-3 last:border-b-0">
            <div className="shrink-0 pt-px">
              <Actor name={group.by} />
            </div>
            {single ? (
              <Move event={first.event} meta={statusMeta} current={first.index === 0} withName />
            ) : (
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="m-0 pt-0.5 text-sm font-medium text-primary">{group.by}</p>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {group.items.map(({ event, index }) => (
                    <li key={`${event.status}-${event.at}-${index}`} className="flex">
                      <Move event={event} meta={statusMeta} current={index === 0} withName={false} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
