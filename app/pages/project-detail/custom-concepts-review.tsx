"use client";

// Custom concepts: the admin's second queue on the Flagged concepts page (26 Oct 2026). A custom concept is a
// column an uploader added to a data sheet that is not in the data model or any controlled vocabulary; it is
// flagged for approval when the dataset is uploaded (`dataset-upload/custom-concepts.ts`). The first queue on
// the page (`ReviewScreen`) is questionable values on records; this one is concepts, so it is the page's
// other kind, switched in column 2 (`FlaggedKindNav`, flagged-kind-nav.tsx), and it is laid out the same way (CONTRACTS 4.1, 0.9):
// column 2 is the queue (a progress bar, Open and Decided, the items), main is a `FormPage` for the one in
// focus, with one decision each and the next one opening.
//
// One decision per concept, not per upload: "Soil pH" added in three datasets is one item whose decision
// covers all three, and an approved concept is known to every later upload.
//
// Who: BioData Admin and Privileged Admin, as for the questionable values (the page's gate).

import { useMemo, useState, type ReactNode } from "react";
import { ListBox, ListBoxItem, ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { ArrowNarrowLeft, CheckCircle, Columns03, XCircle, Save01 } from "@untitledui/icons";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { TextArea } from "@/components/base/textarea/textarea";
import { toast } from "@/components/application/toast/toast";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import { formatShortDate } from "@/app/pages/_shared/dsa/dsa-data";
import { searchEvents } from "@/app/pages/_shared/map-search/search-data";
import { conceptStatusMeta, customConceptActions, describePlace, type ConceptStatus, type CustomConcept } from "@/app/pages/_shared/dataset-upload/custom-concepts";
import { useConceptsToReview } from "@/app/pages/_shared/dataset-upload/custom-concepts-views";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";
import { daysSince } from "./flagged-portfolio";
import { segmentClass, segmentTrayClass } from "./segmented";
import { waited } from "./review-view";

interface Group {
  id: string;
  key: string;
  name: string;
  status: ConceptStatus;
  requests: CustomConcept[];
  daysWaiting: number | null;
}

/** Requests grouped by concept: the pending ones as the open queue, the decided ones as the decided list. */
function groupConcepts(concepts: CustomConcept[], decided: boolean): Group[] {
  const groups = new Map<string, Group>();
  for (const c of concepts) {
    if ((c.status !== "pending") !== decided) continue;
    const id = `${c.status}|${c.key}`;
    const found = groups.get(id);
    if (found) found.requests.push(c);
    else groups.set(id, { id, key: c.key, name: c.name, status: c.status, requests: [c], daysWaiting: null });
  }
  return [...groups.values()]
    .map((g) => {
      // Open: how long the oldest request has waited. Decided: how long ago it was decided.
      const date = decided ? g.requests[0].decidedAt : g.requests.map((r) => r.uploadedAt).sort()[0];
      return { ...g, daysWaiting: date ? daysSince(date) : null };
    })
    .sort((a, b) => (decided ? (a.daysWaiting ?? 0) - (b.daysWaiting ?? 0) : (b.daysWaiting ?? 0) - (a.daysWaiting ?? 0)));
}

const projectName = (projectId: string, code: string) => searchEvents.find((e) => e.id === projectId)?.name ?? code;

/** How many custom concepts are waiting, for the kind switch (one per concept, however many datasets added it). */
export function useOpenCustomConceptCount(): number {
  const concepts = useConceptsToReview();
  return useMemo(() => new Set(concepts.filter((c) => c.status === "pending").map((c) => c.key)).size, [concepts]);
}

export function CustomConceptsReview({
  kindNav,
  initialItem,
  exitLabel,
  onExit,
}: {
  /** The page's switch between its two kinds, drawn at the top of column 2. */
  kindNav: ReactNode;
  initialItem?: string | null;
  exitLabel: string;
  onExit: () => void;
}) {
  const roleHref = useRoleHref();
  const concepts = useConceptsToReview();
  const openGroups = useMemo(() => groupConcepts(concepts, false), [concepts]);
  const decidedGroups = useMemo(() => groupConcepts(concepts, true), [concepts]);

  const [view, setView] = useState<"open" | "decided">(() => (initialItem && decidedGroups.some((g) => g.id === initialItem) ? "decided" : "open"));
  const [selectedId, setSelectedId] = useState<string | null>(initialItem ?? null);
  const [decision, setDecision] = useState<"approved" | "rejected" | "">("");
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);

  const items = view === "open" ? openGroups : decidedGroups;
  const selected = items.find((g) => g.id === selectedId) ?? items[0];
  const index = selected ? items.indexOf(selected) : -1;
  const last = index >= items.length - 1;
  const total = openGroups.length + decidedGroups.length;
  const projectsWaiting = new Set(openGroups.flatMap((g) => g.requests.map((r) => r.projectId))).size;

  const select = (id: string | undefined) => {
    setSelectedId(id ?? null);
    setDecision("");
    setReason("");
    setTried(false);
  };

  const missing = [...(!decision ? ["a decision"] : []), ...(decision === "rejected" && !reason.trim() ? ["a reason for not approving"] : [])];

  const save = () => {
    if (!selected || selected.status !== "pending") return;
    if (missing.length) {
      setTried(true);
      return;
    }
    const group = selected;
    const before = customConceptActions.decide(group.key, decision as "approved" | "rejected", reason);
    const next = items[index + 1] ?? items[index - 1];
    select(next?.id);
    toast.success(decision === "approved" ? `${group.name} approved` : `${group.name} not approved`, {
      description: decision === "approved" ? "It is a known concept from now on." : "The reason is shown to the people who uploaded it.",
      actionLabel: "Undo",
      onAction: () => {
        customConceptActions.restore(before);
        setView("open");
        select(group.id);
      },
    });
  };

  const itemRow = (g: Group) => (
    <ListBoxItem
      key={g.id}
      id={g.id}
      textValue={g.name}
      className={({ isSelected, isFocusVisible }) =>
        cx("flex cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2 outline-hidden transition-colors", isSelected ? "bg-brand-secondary" : "hover:bg-tertiary", isFocusVisible && "ring-2 ring-focus-ring ring-inset")
      }
    >
      {({ isSelected }) => (
        <>
          <div className="flex items-center gap-2">
            {g.status === "pending" ? <Columns03 className="size-3.5 shrink-0 text-fg-warning-primary" /> : g.status === "approved" ? <CheckCircle className="size-3.5 shrink-0 text-fg-success-primary" /> : <XCircle className="size-3.5 shrink-0 text-fg-error-primary" />}
            <span className={cx("min-w-0 flex-1 truncate text-sm font-semibold", isSelected ? "text-brand-secondary" : "text-secondary")}>{g.name}</span>
            <span className="shrink-0 text-xs text-tertiary">{waited(g.daysWaiting)}</span>
          </div>
          <span className="truncate pl-[22px] text-xs text-tertiary">{g.requests.length === 1 ? `1 upload, ${projectName(g.requests[0].projectId, g.requests[0].projectCode)}` : `${g.requests.length} uploads`}</span>
        </>
      )}
    </ListBoxItem>
  );

  return (
    <>
      {/* ── Column 2: the queue ── */}
      <aside aria-label="Custom concepts" className="hidden w-[300px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
        <div className="flex min-h-0 flex-col gap-4">
          <button type="button" onClick={onExit} className="flex w-fit items-center gap-1.5 text-sm font-medium text-tertiary outline-focus-ring hover:text-primary focus-visible:outline-2">
            <ArrowNarrowLeft className="size-4" />
            {exitLabel}
          </button>
          {kindNav}
          <div className="flex flex-col gap-2">
            <ProgressBarBase value={total ? (decidedGroups.length / total) * 100 : 100} />
            <p className="text-xs text-balance text-tertiary">
              {openGroups.length === 0 ? "All decided" : `${openGroups.length} waiting, from ${projectsWaiting} ${projectsWaiting === 1 ? "project" : "projects"}`}
            </p>
          </div>
          <ToggleButtonGroup
            aria-label="Waiting or decided"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[view]}
            onSelectionChange={(keys) => {
              setView([...keys][0] as "open" | "decided");
              select(undefined);
            }}
            className={cx(segmentTrayClass, "w-full")}
          >
            <ToggleButton id="open" className={(s) => cx(segmentClass(s), "flex-1 justify-center")}>
              Waiting <CountBadge count={openGroups.length} />
            </ToggleButton>
            <ToggleButton id="decided" className={(s) => cx(segmentClass(s), "flex-1 justify-center")}>
              Decided <CountBadge count={decidedGroups.length} />
            </ToggleButton>
          </ToggleButtonGroup>
          {items.length > 0 ? (
            <ListBox
              aria-label={view === "open" ? "Custom concepts waiting for a decision" : "Decided custom concepts"}
              selectionMode="single"
              selectionBehavior="replace"
              disallowEmptySelection
              selectedKeys={selected ? [selected.id] : []}
              onSelectionChange={(keys) => select([...keys][0] as string)}
              className="-mx-1 flex flex-col gap-1 outline-hidden"
            >
              {items.map(itemRow)}
            </ListBox>
          ) : (
            <p className="text-sm text-tertiary">{view === "open" ? "Nothing waiting for a decision." : "Nothing decided yet."}</p>
          )}
        </div>
      </aside>

      {/* ── Main: the concept in focus ── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
            <CheckCircle className="size-8 text-fg-success-primary" />
            <h1 className="text-lg font-semibold text-primary">{view === "open" ? "All clear" : "Nothing decided yet"}</h1>
            <p className="max-w-sm text-sm text-balance text-tertiary">
              {view === "open" ? "No custom concepts are waiting. New ones show up here when someone uploads a column BioData doesn't have." : "Decided concepts show here with the reason when one was given."}
            </p>
            <Button color="secondary" iconLeading={ArrowNarrowLeft} onClick={onExit} className="mt-2">
              {exitLabel}
            </Button>
          </div>
        ) : (
          <FormPage
            key={selected.id}
            eyebrow={`Custom concept - ${index + 1} of ${items.length} ${view === "open" ? "waiting" : "decided"}`}
            title={selected.name}
            badge={
              <Badge size="sm" color={conceptStatusMeta[selected.status].color}>
                {conceptStatusMeta[selected.status].label}
              </Badge>
            }
            subtitle="A column that isn't in the data model or any controlled vocabulary."
            onBack={index > 0 ? () => select(items[index - 1].id) : undefined}
            problems={tried && missing.length ? { items: missing } : undefined}
            primaryLabel={view === "open" ? "Save decision" : last ? exitLabel : "Next"}
            primaryIsContinue={view === "decided" && !last}
            primaryIcon={view === "open" ? Save01 : undefined}
            onPrimary={view === "open" ? save : last ? onExit : () => select(items[index + 1].id)}
          >
            <FormRow title="Added in" description={selected.requests.length > 1 ? "Your decision covers every one of these uploads." : "The upload that has it."}>
              <ul aria-label="Uploads that added this concept" className="m-0 flex list-none flex-col p-0 [&>li:not(:first-child)]:border-t [&>li:not(:first-child)]:border-secondary">
                {selected.requests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="m-0 text-sm font-semibold text-primary">
                        {r.datasetId}, {projectName(r.projectId, r.projectCode)}
                      </p>
                      <p className="m-0 text-xs text-balance break-words text-tertiary">{describePlace(r.places, true)}</p>
                      <p className="m-0 text-xs text-tertiary">
                        Added by {r.uploadedBy}, {formatShortDate(r.uploadedAt)}
                      </p>
                    </div>
                    <Button size="sm" color="link-color" href={roleHref(`/pages/project-list/${r.projectId}/project-details?view=datasets`)}>
                      Open datasets
                    </Button>
                  </li>
                ))}
              </ul>
            </FormRow>

            {selected.status === "pending" ? (
              <>
                <FormRow title="Decision" required description={`Waiting ${waited(selected.daysWaiting).toLowerCase()}.`} error={tried && !decision ? "Choose approve or not approve" : undefined}>
                  <RadioGroup aria-label="Decision" value={decision} onChange={(v) => setDecision(v as "approved" | "rejected")}>
                    <RadioButton value="approved" label="Approve" hint="It becomes a known concept. Later uploads with this column are not flagged." />
                    <RadioButton value="rejected" label="Do not approve" hint="The people who uploaded it see the reason." />
                  </RadioGroup>
                </FormRow>
                <FormRow title="Reason" required={decision === "rejected"} description={decision === "rejected" ? "Shown to the people who uploaded it." : "Optional when approving."}>
                  <TextArea
                    aria-label="Reason"
                    isRequired={decision === "rejected"}
                    isInvalid={tried && decision === "rejected" && !reason.trim()}
                    rows={3}
                    value={reason}
                    onChange={setReason}
                    placeholder="For example: this is already recorded as Site Comment."
                  />
                </FormRow>
              </>
            ) : (
              <FormRow title="Decision">
                <div className={cx("flex flex-col gap-1 rounded-lg border px-3 py-2.5", selected.status === "approved" ? "border-secondary bg-secondary" : "border-error-200 bg-error-25")}>
                  <p className="m-0 text-sm font-semibold text-primary">{conceptStatusMeta[selected.status].label}</p>
                  {selected.requests[0].reason && <p className="m-0 text-sm text-balance text-secondary">{selected.requests[0].reason}</p>}
                  <p className="m-0 text-xs text-tertiary">
                    {selected.requests[0].decidedBy}, {selected.requests[0].decidedAt ? formatShortDate(selected.requests[0].decidedAt) : ""}
                  </p>
                </div>
              </FormRow>
            )}
          </FormPage>
        )}
      </main>
    </>
  );
}
