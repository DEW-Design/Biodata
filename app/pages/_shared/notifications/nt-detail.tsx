"use client";

import { useState, type FC, type ReactNode } from "react";
import type { Key } from "react-aria-components";
import { useRouter } from "next/navigation";
import { Archive, ArrowNarrowLeft, Clock, Copy01, Download01, Edit05, Mail01, PauseCircle, PlayCircle, Send01, Trash01, Users01, Zap, Grid01, Monitor01, Settings01, ClockRewind } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { ConfirmationModal, DestructiveModal } from "@/components/application/modals/modal";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { toast } from "@/components/application/toast/toast";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { RecordActionBar, type RecordAction } from "@/app/pages/_shared/record-action-bar";
import { HeroMeta, RecordBackLink, RecordHero, RecordRow } from "@/app/pages/_shared/record-hero";
import {
  DELAYS,
  SENSITIVITY,
  effectiveTo,
  formatBytes,
  formatDateTime,
  formatShortDate,
  logSummary,
  ntEvent,
  ntStateMeta,
  ntTemplate,
  recipientsSummary,
  triggerShort,
  triggerSummary,
  type Notification,
} from "@/app/pages/_shared/notifications/nt-data";
import { AuditLog, milestones } from "@/app/pages/_shared/audit-log";
import { useRecipientLabels } from "@/app/pages/_shared/notifications/nt-directory";
import { EmailPreview } from "@/app/pages/_shared/notifications/nt-email";
import { useRoleHref } from "@/lib/use-role-href";
import { useNtRoot } from "@/app/pages/_shared/notifications/nt-root";

// A notification's own page, laid out like the project page (CONTRACTS 4.6): Back link, the gradient
// identity card with the actions at its top right, at most one notice, then underline tabs.
//
//   Preview   the email as it lands, with sample values or the variables themselves.
//   Settings  when it is sent, who receives it, how it is sent and kept, as label/value cards.
//   History   every change, who and when, with before and after (the Figma's "View Logs").
//
// Actions: Edit is the next step. In "...": Duplicate (a new draft from this one, the fastest way to
// make a similar notification), Send a test, Enable or Disable, Export history; Delete draft only for
// a draft, which never sent anything. An active notification is disabled, never deleted, so its
// history stays.

const NotProvided = () => <span className="text-quaternary">Not provided</span>;

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-secondary">{children}</div>;
}

/**
 * Option 2's "How it works": the notification read top to bottom as the steps it goes through, each a
 * featured icon on a line joining it to the next. Composed, not a real component (CONTRACTS 1.2): the
 * Progress steps component marks steps done or to do, which a notification's settings are not.
 */
function HowItWorks({ steps }: { steps: { icon: FC<{ className?: string }>; title: string; lines: ReactNode[] }[] }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0" aria-label="How it works">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <div className="flex flex-col items-center">
            <FeaturedIcon icon={step.icon} color="gray" theme="modern" size="sm" />
            {i < steps.length - 1 && <span aria-hidden className="my-1 w-px flex-1 bg-[var(--ui-border-secondary)]" />}
          </div>
          <div className="flex min-w-0 flex-col gap-1 pb-6">
            <p className="m-0 text-sm font-semibold text-primary">{step.title}</p>
            {step.lines.map((line, j) => (
              <p key={j} className="m-0 text-sm text-balance text-tertiary">
                {line}
              </p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function NtDetail({
  n,
  layout = "tabs",
  onEnable,
  onDisable,
  onDeleteDraft,
}: {
  n: Notification;
  /** "overview" (Option 2): an Overview tab, How it works beside the email, then History. */
  layout?: "tabs" | "overview";
  onEnable: () => void;
  onDisable: () => void;
  onDeleteDraft: () => void;
}) {
  const roleHref = useRoleHref();
  const router = useRouter();
  const root = useNtRoot();
  const labelOf = useRecipientLabels()(n.trigger);
  // "To the requester", inside a sentence; a person's or role's own name keeps its capitals.
  const lower = (text: string) => (text.startsWith("The ") ? `the ${text.slice(4)}` : text);
  const people = (keys: string[]) => (keys.length ? recipientsSummary(keys, labelOf) : "No one");
  const [tab, setTab] = useState<Key>(layout === "overview" ? "overview" : "preview");
  const [showVariables, setShowVariables] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const meta = ntStateMeta[n.state];
  const event = n.trigger.kind === "event" ? ntEvent(n.trigger.event) : undefined;
  const lastDisabled = [...n.history].reverse().find((e) => e.action === "Disabled");

  const exportHistory = () =>
    downloadCsv(
      `${n.id}-history.csv`,
      ["Date and time", "By", "Action", "Field", "Previous value", "Updated value"],
      n.history.flatMap((e) => (e.changes?.length ? e.changes.map((c) => [formatDateTime(e.at), e.by, e.action, c.field, c.from, c.to]) : [[formatDateTime(e.at), e.by, e.action, "", "", ""]])),
    );

  const edit: RecordAction = { id: "edit", label: n.state === "draft" ? "Edit draft" : "Edit notification", icon: Edit05, onPress: () => router.push(roleHref(`${root}/${n.id}/edit`)) };
  const menu: RecordAction[] = [
    { id: "duplicate", label: "Duplicate", icon: Copy01, onPress: () => router.push(roleHref(`${root}/new?from=${n.id}`)) },
    // No mail is sent from this preview build: the toast says so rather than pretending.
    { id: "test", label: "Send me a test", icon: Send01, onPress: () => toast.brand("Test emails aren't wired up yet", { description: "In the live service this sends the email, with sample values, to your own address." }) },
    ...(n.state === "disabled" ? [{ id: "enable", label: "Enable", icon: PlayCircle, onPress: onEnable }] : []),
    { id: "export", label: "Export history", icon: Download01, onPress: exportHistory },
    ...(n.state === "active" ? [{ id: "disable", label: "Disable", icon: PauseCircle, destructive: true, onPress: () => setConfirmDisable(true) }] : []),
    ...(n.state === "draft" ? [{ id: "delete", label: "Delete draft", icon: Trash01, destructive: true, onPress: () => setConfirmDelete(true) }] : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <RecordBackLink href={roleHref(root)}>Back to notifications</RecordBackLink>

      <RecordHero eyebrow={`Notification · ${n.category || "No category"}`} title={n.name || n.id} description={n.description || undefined} actions={<RecordActionBar onDark primary={edit} menu={menu} />}>
        <HeroMeta label="ID">
          <span className="tabular-nums">{n.id}</span>
        </HeroMeta>
        <HeroMeta label="Status">
          <Badge size="sm" color={meta.badgeColor}>
            {meta.label}
          </Badge>
        </HeroMeta>
        <HeroMeta label="Trigger">{triggerShort(n.trigger)}</HeroMeta>
        <HeroMeta label="Updated">{formatShortDate(n.updatedAt)}</HeroMeta>
      </RecordHero>

      <div className="shrink-0 px-6 pt-4 empty:hidden">
        {n.state === "disabled" && (
          <AlertFullWidth
            color="gray"
            title={lastDisabled ? `Disabled on ${formatShortDate(lastDisabled.at.slice(0, 10))} by ${lastDisabled.by}` : "Disabled"}
            description="Nothing is sent while it is disabled. Enable it from More actions to start sending again."
            confirmLabel="Noted"
            contained
            wrap
          />
        )}
        {n.state === "draft" && <AlertFullWidth color="brand" title="Draft: not sending yet" description="Finish it from Edit draft and add it to start sending." confirmLabel="Noted" contained wrap />}
      </div>

      <Tabs selectedKey={tab} onSelectionChange={setTab}>
        <div className="px-6 pt-4">
          <TabList aria-label="Notification sections" type="underline" size="md">
            {layout === "overview" ? (
              <Tab id="overview" label="Overview" icon={Grid01} />
            ) : (
              <>
                <Tab id="preview" label="Preview" icon={Monitor01} />
                <Tab id="settings" label="Settings" icon={Settings01} />
              </>
            )}
            <Tab id="history" label="History" icon={ClockRewind} />
          </TabList>
        </div>

        {layout === "overview" && (
          <TabPanel id="overview" className="p-6">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <div className="flex flex-col gap-4">
                <p className="m-0 text-sm font-semibold text-primary">How it works</p>
                <HowItWorks
                  steps={[
                    { icon: n.trigger.kind === "event" ? Zap : Clock, title: "When", lines: [triggerSummary(n.trigger)] },
                    {
                      icon: Users01,
                      title: "Who",
                      lines: [`To ${lower(people(effectiveTo(n)))}`, ...(n.cc.length ? [`CC ${lower(people(n.cc))}`] : []), ...(n.bcc.length ? [`BCC ${lower(people(n.bcc))}`] : [])],
                    },
                    {
                      icon: Mail01,
                      title: "What",
                      lines: [
                        `${ntTemplate(n.template).name} template, ${SENSITIVITY[n.sensitivity].label}`,
                        ...(n.attachments.length ? [`${n.attachments.length} ${n.attachments.length === 1 ? "attachment" : "attachments"}: ${n.attachments.map((a) => a.name).join(", ")}`] : []),
                      ],
                    },
                    { icon: Archive, title: "Then", lines: [`Sent from ${n.fromName || "BioData SA"}${n.replyTo ? `, replies to ${n.replyTo}` : ""}`, `Sent emails ${logSummary(n).charAt(0).toLowerCase()}${logSummary(n).slice(1)}`] },
                  ]}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-4 rounded-xl bg-secondary p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 text-sm font-semibold text-primary">The email</p>
                  <Toggle size="sm" label="Show variables" isSelected={showVariables} onChange={setShowVariables} />
                </div>
                <EmailPreview draft={n} labelOf={labelOf} showVariables={showVariables} />
              </div>
            </div>
          </TabPanel>
        )}

        {layout === "tabs" && (
          <>
          <TabPanel id="preview" className="p-6">
            <div className="flex flex-col gap-4 rounded-xl bg-secondary p-6">
              <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4">
                <div className="flex justify-end">
                  <Toggle size="sm" label="Show variables" isSelected={showVariables} onChange={setShowVariables} />
                </div>
                <EmailPreview draft={n} labelOf={labelOf} showVariables={showVariables} />
              </div>
            </div>
          </TabPanel>

          <TabPanel id="settings" className="flex flex-col gap-4 p-6">
            <Card>
              <RecordRow label="When">{triggerSummary(n.trigger)}</RecordRow>
              {n.trigger.kind === "event" && (
                <>
                  <RecordRow label="Event">{event?.label ?? <NotProvided />}</RecordRow>
                  <RecordRow label="Delay">{DELAYS.find((d) => d.id === (n.trigger.kind === "event" ? n.trigger.delay : "none"))!.label}</RecordRow>
                </>
              )}
              {n.trigger.kind === "schedule" && (
                <>
                  <RecordRow label="Starts">{n.trigger.startDate ? formatShortDate(n.trigger.startDate) : <NotProvided />}</RecordRow>
                  <RecordRow label="Ends">{n.trigger.endDate ? formatShortDate(n.trigger.endDate) : "No end date"}</RecordRow>
                </>
              )}
            </Card>
            <Card>
              <RecordRow label="To">{people(effectiveTo(n))}</RecordRow>
              <RecordRow label="CC">{people(n.cc)}</RecordRow>
              <RecordRow label="BCC">{people(n.bcc)}</RecordRow>
              <RecordRow label="From">{n.fromName || <NotProvided />}</RecordRow>
              <RecordRow label="Reply-to">{n.replyTo || <NotProvided />}</RecordRow>
            </Card>
            <Card>
              <RecordRow label="Template">
                {ntTemplate(n.template).name} <span className="text-tertiary">· {ntTemplate(n.template).brand}</span>
              </RecordRow>
              <RecordRow label="Classification">{SENSITIVITY[n.sensitivity].label}</RecordRow>
              <RecordRow label="Attachments">{n.attachments.length ? n.attachments.map((a) => `${a.name} (${formatBytes(a.size)})`).join(", ") : "None"}</RecordRow>
              <RecordRow label="Sent email log">{logSummary(n)}</RecordRow>
              <RecordRow label="Category">{n.category || <NotProvided />}</RecordRow>
            </Card>
          </TabPanel>
          </>
        )}

        <TabPanel id="history" className="p-6">
          <AuditLog id={n.id} idLabel="Notification ID" items={milestones(n.history, { label: "Activated", is: (e) => ["Created", "Turned on", "Enabled"].includes(e.action) }, { created: n.createdAt, updated: n.updatedAt })} changeCount={n.history.length}>
            <Card>
              {[...n.history].reverse().map((e, i) => (
                <RecordRow key={`${e.at}-${i}`} label={formatDateTime(e.at)}>
                  <span className="flex flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span className="font-medium text-primary">{e.action}</span>
                      <span className="text-tertiary">by {e.by}</span>
                    </span>
                    {e.changes?.length ? (
                      <span className="flex flex-col gap-1">
                        {e.changes.map((c, j) => (
                          <span key={j} className="text-secondary">
                            {c.field}: <span className="text-tertiary">{c.from}</span> changed to <span className="text-primary">{c.to}</span>
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </span>
                </RecordRow>
              ))}
            </Card>
          </AuditLog>
        </TabPanel>
      </Tabs>

      <ConfirmationModal
        confirmIcon={PauseCircle}
        isOpen={confirmDisable}
        onOpenChange={setConfirmDisable}
        icon={PauseCircle}
        title={`Disable ${n.name}?`}
        description="It stops sending straight away. Emails already sent aren't affected. You can enable it again at any time."
        confirmLabel="Disable"
        onConfirm={() => {
          setConfirmDisable(false);
          onDisable();
        }}
      />
      <DestructiveModal
        confirmIcon={Trash01}
        isOpen={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete draft ${n.name || n.id}?`}
        description="The draft is deleted and can't be recovered. It never sent anything."
        confirmLabel="Delete draft"
        onConfirm={() => {
          setConfirmDelete(false);
          onDeleteDraft();
        }}
      />
    </div>
  );
}

export function NtNotFound({ id }: { id: string }) {
  const roleHref = useRoleHref();
  const root = useNtRoot();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">Notification not found</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">There is no notification {id}. It may have been created in another browser.</p>
      <Button color="link-color" size="sm" href={roleHref(root)} iconLeading={ArrowNarrowLeft}>
        Back to notifications
      </Button>
    </div>
  );
}
