"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Tabs } from "react-aria-components";
import { ArrowLeft, ClockRewind, Edit05, Save01, Shield03, Trash01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { Tab, TabList, TabPanel } from "@/components/application/tabs/tabs";
import { toast } from "@/components/application/toast/toast";
import { AuditLog } from "@/app/pages/_shared/audit-log";
import { AuditFeed } from "@/app/pages/_shared/audit-feed";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { RecordActionBar } from "@/app/pages/_shared/record-action-bar";
import { HeroMeta, RecordBackLink, RecordHero } from "@/app/pages/_shared/record-hero";
import { formatShortDate } from "@/app/pages/_shared/nominations/nomination-data";
import { SENSITIVITY_PATH } from "@/app/pages/_shared/nominations/nomination-version";
import { SENSITIVITY_SPECIES, accessLevelMeta, ratingSummary, releaseRiskMeta, ruleLabel, speciesBySlug, speciesSlug, type RatingChange } from "@/app/pages/_shared/nominations/species-sensitivity";
import { DataReleaseEditor, DataReleaseView, fromEditor, isEditorValid, toEditor, type EditorState } from "@/app/pages/_shared/nominations/species-sensitivity-editor";
import { latestChanges, ratingOf, saveSpeciesRating, useRatingChanges, useSensitivityHydrated } from "@/app/pages/_shared/nominations/species-sensitivity-store";
import { useRoleHref } from "@/lib/use-role-href";

// A species' sensitivity page, a record page like the project page (CONTRACTS 4.6): Back link, the identity card (group,
// family, last change), then tabs: Data release (the rating) and Audit log (every change). The rating is edited in place on
// its card (4.8), borrowed from Taxonomy's species page: "Edit data release" turns the card to fields with the editing
// treatment, and Cancel and Save changes sit in the footer. No modal: the designer asked for none on this screen.
// The editor and the read-only view are species-sensitivity-editor.tsx, shared with the bulk change page.

/** Section crumb on a species' page: a switcher over the species, as every record page has (4.6 item 5). */
export function SpeciesSensitivitySwitcher({ speciesId }: { speciesId: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const items = useMemo(() => SENSITIVITY_SPECIES.map((s) => ({ id: s.id, label: s.commonName, addon: s.species })).sort((a, b) => a.label.localeCompare(b.label)), []);
  return (
    <BreadcrumbSwitcher
      label="Species sensitivity"
      ariaLabel="Switch species"
      placeholder="Search species"
      items={items}
      currentId={speciesId}
      onSelect={(id) => router.push(roleHref(`${SENSITIVITY_PATH}/${speciesSlug(id)}`))}
      viewAllLabel="View all species"
      onViewAll={() => router.push(roleHref(SENSITIVITY_PATH))}
    />
  );
}

/** The record card; in edit mode it takes the one editing treatment (4.8): brand border, brand-50 halo, "Editing". */
export function Card({ title, editing, children }: { title: string; editing: boolean; children: ReactNode }) {
  return (
    <section className={editing ? "flex flex-col rounded-xl border border-brand-500 bg-primary ring-4 ring-brand-50" : "flex flex-col rounded-xl border border-secondary bg-primary"}>
      <div className="flex min-h-[3.25rem] items-center justify-between gap-3 border-b border-secondary px-5 py-3">
        <h2 className="m-0! text-sm! font-semibold! tracking-normal! text-primary!">{title}</h2>
        {editing && <p className="m-0 text-xs font-medium text-brand-secondary">Editing</p>}
      </div>
      {children}
    </section>
  );
}

/** What a change set, in a line: the audit log's note under each change. */
function describe(change: RatingChange): string {
  const r = change.rating;
  const what =
    r.appliesTo === "species"
      ? `Whole species, ${accessLevelMeta[r.access].label}`
      : r.attributes.map((a) => `${ruleLabel(a)}: ${releaseRiskMeta[a.risk].label}, ${accessLevelMeta[a.access].label}`).join("; ");
  return change.note ? `${what}. ${change.note}.` : `${what}.`;
}

export function SpeciesSensitivityRecord({ slug }: { slug: string }) {
  const roleHref = useRoleHref();
  const hydrated = useSensitivityHydrated();
  const changes = useRatingChanges();
  const species = speciesBySlug(slug);
  const [draft, setDraft] = useState<EditorState | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (!species)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-lg font-semibold text-primary">Species not found</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">There is no species at this address.</p>
        <Button color="link-color" size="sm" href={roleHref(SENSITIVITY_PATH)} iconLeading={ArrowLeft}>
          Back to species sensitivity
        </Button>
      </div>
    );
  if (!hydrated) return null;

  const rating = ratingOf(latestChanges(changes), species.id);
  const history = changes.filter((c) => c.speciesId === species.id);
  const last = history[history.length - 1];
  const dirty = !!draft && JSON.stringify(fromEditor(draft)) !== JSON.stringify(rating);

  const stopEditing = () => {
    setDraft(null);
    setShowErrors(false);
  };
  const save = () => {
    if (!draft) return;
    if (!isEditorValid(draft)) {
      setShowErrors(true);
      return;
    }
    const next = fromEditor(draft);
    saveSpeciesRating(species.id, next);
    const summary = ratingSummary(next);
    toast.success(`${species.commonName} saved`, { description: `${releaseRiskMeta[summary.risk].label}, ${accessLevelMeta[summary.access].label}` });
    stopEditing();
  };

  const events = history.map((c) => ({ status: ratingSummary(c.rating).risk, at: c.at, by: c.by, note: describe(c) }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-6 [scrollbar-gutter:stable]">
        <RecordBackLink href={roleHref(SENSITIVITY_PATH)}>Back to species sensitivity</RecordBackLink>
        <RecordHero
          eyebrow="Species sensitivity"
          title={species.commonName}
          subtitle={<span className="italic">{species.species}</span>}
          actions={<RecordActionBar onDark primary={{ id: "edit", label: "Edit data release", icon: Edit05, isDisabled: !!draft, onPress: () => setDraft(toEditor(rating)) }} />}
        >
          <HeroMeta label="Group">{species.group}</HeroMeta>
          <HeroMeta label="Family">{species.family}</HeroMeta>
          <HeroMeta label="Last changed">{last ? `${formatShortDate(last.at)}, ${last.by}` : "Never changed"}</HeroMeta>
        </RecordHero>

        <Tabs defaultSelectedKey="release" className="flex flex-col">
          <div className="shrink-0 px-6 pt-4">
            <TabList aria-label="Species sensitivity sections" type="underline" size="md">
              <Tab id="release" label="Data release" icon={Shield03} />
              <Tab id="history" label="Audit log" icon={ClockRewind} />
            </TabList>
          </div>
          <TabPanel id="release" className="p-6">
            <Card title="Data release" editing={!!draft}>
              {draft ? <DataReleaseEditor state={draft} onChange={setDraft} showErrors={showErrors} /> : <DataReleaseView rating={rating} />}
            </Card>
          </TabPanel>
          <TabPanel id="history" className="p-6">
            <AuditLog items={[{ label: "First changed", event: history[0] }, { label: "Last changed", event: last }]} changeCount={history.length}>
              <AuditFeed events={events} statusMeta={releaseRiskMeta} noun="species" />
            </AuditLog>
          </TabPanel>
        </Tabs>
      </div>

      {draft && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-secondary bg-primary px-6 py-4">
          <p className="m-0 text-sm text-tertiary">
            Editing <span className="font-semibold text-primary">Data release</span>
            {dirty ? " · Unsaved changes" : ""}
          </p>
          <div className="flex items-center gap-3">
            <Button iconLeading={XClose} color="secondary" onClick={() => (dirty ? setConfirmDiscard(true) : stopEditing())}>
              Cancel
            </Button>
            <Button iconLeading={Save01} color="primary" isDisabled={!dirty} onClick={save}>
              Save changes
            </Button>
          </div>
        </div>
      )}
      <ConfirmationModal
        confirmIcon={Trash01}
        cancelIcon={ArrowLeft}
        isOpen={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard your changes?"
        description={`The changes to ${species.commonName}'s data release will be lost.`}
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => {
          stopEditing();
          setConfirmDiscard(false);
        }}
      />
    </div>
  );
}
