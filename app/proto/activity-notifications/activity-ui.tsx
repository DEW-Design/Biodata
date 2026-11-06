"use client";

import { Dialog, DialogTrigger } from "react-aria-components";
import { ArrowNarrowRight, Bell01, Check, CheckCircle, UploadCloud02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CountBadge } from "@/components/base/badges/badges";
import { Popover } from "@/components/base/select/popover";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { whenLabel } from "@/app/pages/_shared/audit-feed";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { isBiodataAdmin, type UserRole } from "@/lib/user-role";
import { useActivity, type ActivityEntry } from "./activity-store";

// The three ways Activity is drawn in the lab, from one row. The row is built from the design system and the treatments the product
// already has: a FeaturedIcon leading, as Home's task rows; a 14/500 primary title with a 14/400 tertiary line under it (the row
// treatment of Craft details); the date at the right as the audit feed writes it (`whenLabel`); the one next step as a link-style
// button with the forward arrow (3.12, "go to another screen"). Unread is a dot, as the rail marks Home: state by colour, not by
// weight (nothing reflows when a row is read). Every line is Proposed wording, for the designer to keep, change or drop.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

function ActivityRow({ entry, onOpen }: { entry: ActivityEntry; onOpen: (entry: ActivityEntry) => void }) {
  const roleHref = useRoleHref();
  const done = entry.kind === "approved";
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <FeaturedIcon icon={done ? CheckCircle : UploadCloud02} color={done ? "success" : "brand"} theme="light" size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-primary text-balance">{entry.title}</p>
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-tertiary tabular-nums">{whenLabel(entry.at)}</span>
            {entry.unread && (
              <span className="size-2 rounded-full bg-brand-solid">
                <span className="sr-only">Unread</span>
              </span>
            )}
          </span>
        </div>
        <p className="text-sm text-tertiary text-balance">{entry.detail}</p>
        <Button className="self-start" color="link-color" size="sm" iconTrailing={ArrowNarrowRight} href={roleHref(entry.action.href)} onPress={() => onOpen(entry)}>
          {entry.action.label}
        </Button>
      </div>
    </li>
  );
}

/** What this role will see here once it has something, said as what to expect (not "No notifications"). */
function emptyLine(role: UserRole): string {
  return isBiodataAdmin(role) ? "A dataset waiting for your approval will appear here." : "Updates on your datasets and requests will appear here.";
}

function ActivityEmpty({ role, allRead }: { role: UserRole; allRead?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-secondary p-8 text-center">
      <p className="text-sm font-medium text-primary">{allRead ? "Nothing unread" : "Nothing new"}</p>
      <p className="max-w-xs text-sm text-balance text-tertiary">{allRead ? "Everything has been opened. It is all under All activity." : emptyLine(role)}</p>
    </div>
  );
}

const LIST = "m-0 flex list-none flex-col p-0 [&>li]:border-t [&>li]:border-secondary [&>li:first-child]:border-t-0";

function ActivityList({ entries, onOpen, bordered }: { entries: ActivityEntry[]; onOpen: (entry: ActivityEntry) => void; bordered?: boolean }) {
  return (
    <ul className={bordered ? `${LIST} overflow-hidden rounded-xl border border-secondary bg-primary` : LIST}>
      {entries.map((entry) => (
        <ActivityRow key={`${entry.audience}:${entry.key}`} entry={entry} onOpen={onOpen} />
      ))}
    </ul>
  );
}

const markAllButton = (onPress: () => void) => (
  <Button color="link-gray" size="sm" iconLeading={Check} onPress={onPress}>
    Mark all as read
  </Button>
);

/** Option A: a section on Home, above the rest of it. The heading is Home's own section heading ("Your requests"). */
export function ActivityPanel() {
  const role = useUserRole();
  const { entries, unread, markRead, markAllRead } = useActivity(role);
  return (
    <section className="flex flex-col gap-3 px-6 pt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-primary">Activity</h2>
          {unread > 0 && <CountBadge count={unread} color="brand" />}
        </div>
        {unread > 0 && markAllButton(markAllRead)}
      </div>
      {entries.length ? <ActivityList entries={entries} onOpen={markRead} bordered /> : <ActivityEmpty role={role} />}
    </section>
  );
}

/** Option B: its own screen, the collection pattern's section header over the list. `scope` is column 2's All and Unread. */
export function ActivityPageBody({ scope }: { scope: "all" | "unread" }) {
  const role = useUserRole();
  const { entries, unread, markRead, markAllRead } = useActivity(role);
  const shown = scope === "unread" ? entries.filter((e) => e.unread) : entries;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 items-center gap-2">
            <SectionHeader.Heading>Activity</SectionHeader.Heading>
            {unread > 0 && <CountBadge count={unread} color="brand" />}
          </div>
          {unread > 0 && (
            <Button color="secondary" iconLeading={Check} onPress={markAllRead}>
              Mark all as read
            </Button>
          )}
        </SectionHeader.Group>
      </SectionHeader.Root>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 [scrollbar-gutter:stable]">
        {shown.length ? <ActivityList entries={shown} onOpen={markRead} bordered /> : <ActivityEmpty role={role} allRead={entries.length > 0} />}
      </div>
    </div>
  );
}

/** Option C: a bell after the Add menu, in the header's `activity` slot, with the list in a popover. The count is the rail's badge. */
export function ActivityBell() {
  const role = useUserRole();
  const { entries, unread, markRead, markAllRead } = useActivity(role);
  if (role === "public-user") return null;
  return (
    <DialogTrigger>
      <span className="relative flex">
        <ButtonUtility icon={Bell01} size="sm" color="tertiary" tooltip="Activity" aria-label={unread ? `Activity, ${unread} unread` : "Activity"} />
        {unread > 0 && (
          <span aria-hidden="true" className="pointer-events-none absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-error-solid text-[10px] font-semibold tabular-nums text-white">
            {unread}
          </span>
        )}
      </span>
      <Popover size="auto" placement="bottom end" offset={8} className="w-[min(92vw,420px)] rounded-xl py-0">
        <Dialog aria-label="Activity" className="flex max-h-[min(70vh,520px)] flex-col outline-hidden">
          {({ close }) => (
            <>
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-secondary px-4 py-3">
                <h2 className="text-base font-semibold text-primary">Activity</h2>
                {unread > 0 && markAllButton(markAllRead)}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {entries.length ? (
                  <ActivityList
                    entries={entries}
                    onOpen={(entry) => {
                      markRead(entry);
                      close();
                    }}
                  />
                ) : (
                  <div className="p-4">
                    <ActivityEmpty role={role} />
                  </div>
                )}
              </div>
            </>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
