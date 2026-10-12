"use client";

// What each rail section shows in the panel for /proto/post-6-oct. The lists are the real ones (`DlaAllList`, `DsaAllList`,
// `NominationList`, `UsersList`, `SpeciesList`, `NtList`, `CvList`, `ProjectListContent`, `TemplateList`), not lookalikes, taken
// without their shells. Each section's column 2 has no home in this layout, so it is described here as the section's
// views (what the bar's view menu offers) and its actions (the bar's "..." menu):
//   Projects  All projects, My projects            DLA            All requests, My requests (+ Export CSV)
//   DSA       All agreements, My agreements        Nominations    All nominations, My nominations
//   Users     Users, Roles, Permissions            Taxonomy       All species, Flora, Fauna
//   Notifications  every category                  Template Finder, Controlled Vocabulary: no views (facets not carried over)
//   Home      My BioData, Flora and Fauna Dashboard (a public user: the one dashboard)
// Not built in the lab yet, shown as a marked gap with a link to the real page: Explore, Voucher Management, Reports.
// Record pages are not in the lab either: a row that opens one leaves the lab for the real page, with the role kept.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useState, type FC, type ReactNode } from "react";
import type { Key } from "react-aria-components";
import {
  ArrowNarrowRight,
  Bell01,
  Folder,
  Key01,
  Map01,
  PieChart03,
  SwitchHorizontal01,
  Tag01,
  User01,
  UserCheck01,
  Users01,
  BarChart01,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Gap } from "@/components/scaffold/gap";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import type { AgreementScope } from "@/app/pages/_shared/agreement-scope";
import { DataOverviewContent } from "@/app/pages/_shared/data-overview";
import { GuestGradientCard } from "@/app/pages/_shared/guest-home";
import { HomeDashboardContent } from "@/app/pages/_shared/home-dashboard";
import { DlaAllList, DlaBanner } from "@/app/pages/_shared/dla/dla-list";
import { dlaStatusMeta, dlaStatusOrder, requestorName, type DlaStatus } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { DsaAllList, DsaBanner } from "@/app/pages/_shared/dsa/dsa-list";
import { dsaStatusMeta } from "@/app/pages/_shared/dsa/dsa-data";
import { useDsas } from "@/app/pages/_shared/dsa/dsa-store";
import { CvList } from "@/app/pages/_shared/ctrl-vocab/cv-list";
import { NominationList } from "@/app/pages/_shared/nominations/nomination-list";
import { nominationStatusOrder, type NominationStatus } from "@/app/pages/_shared/nominations/nomination-data";
import { useNominationScope } from "@/app/pages/_shared/nominations/nomination-scope";
import { NT_CATEGORIES } from "@/app/pages/_shared/notifications/nt-data";
import { NtList } from "@/app/pages/_shared/notifications/nt-list";
import { ProjectListContent } from "@/app/pages/_shared/project-list-content";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { SpeciesList } from "@/app/pages/_shared/taxonomy/tx-records";
import type { Kingdom } from "@/app/pages/_shared/taxonomy/tx-data";
import { TemplateList, useTemplateFilter } from "@/app/pages/_shared/template-finder/template-list";
import { speciesIcon } from "@/app/pages/_shared/template-finder/template-nav";
import { PermissionsList, RolesList, UsersList } from "@/app/pages/_shared/user-management/um-lists";
import {
  CTRL_VOCAB_SECTION_LABEL,
  DLA_SECTION_LABEL,
  DSA_SECTION_LABEL,
  NOMINATION_SECTION_LABEL,
  NOTIFICATION_SECTION_LABEL,
  REPORTS_SECTION_LABEL,
  TAXONOMY_SECTION_LABEL,
  TEMPLATE_FINDER_SECTION_LABEL,
  USER_MANAGEMENT_SECTION_LABEL,
  VOUCHER_SECTION_LABEL,
  keyHref,
  type NavNode,
} from "@/lib/registered-user-nav";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { cx } from "@/utils/cx";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { ExportMenu, ViewMenu, type PanelView } from "./panel-controls";
import { DlaGrouped, DsaGrouped, NominationsGrouped, ProjectsGrouped } from "./grouped-sections";

export type SectionKey = NonNullable<NavNode["key"]>;

interface ViewState {
  views: PanelView[];
  current: string;
}

interface SectionDef {
  /** The views for the role, and the one in use (`requested` when it is one of them). */
  useView: (requested?: string) => ViewState;
  Content: FC<{ view: string; statuses?: string[]; step: number }>;
  /** The "..." menu, when the section has actions. */
  Actions?: FC;
}

const none = (): ViewState => ({ views: [], current: "" });

function pick(views: PanelView[], requested: string | undefined, fallback: string): ViewState {
  return { views, current: requested && views.some((v) => v.id === requested) ? requested : fallback };
}

/** All and My, as the agreement lists have them: a role with no All view has My alone. */
function scopeView(canAll: boolean, defaultScope: AgreementScope, requested: string | undefined, labels: { all: string; mine: string }, allIcon: PanelView["icon"]): ViewState {
  const views: PanelView[] = [...(canAll ? [{ id: "all", label: labels.all, icon: allIcon }] : []), { id: "mine", label: labels.mine, icon: User01 }];
  return pick(views, requested, canAll ? defaultScope : "mine");
}

const asStatuses = <S extends string>(order: readonly S[], statuses?: string[]) => (statuses ?? []).filter((s): s is S => (order as readonly string[]).includes(s));

// ── Per section ──

const Projects: SectionDef = {
  useView: (requested) => {
    const guest = useUserRole() === "public-user";
    const views: PanelView[] = [{ id: "all", label: "All projects", icon: Folder }, ...(guest ? [] : [{ id: "mine", label: "My projects", icon: User01 }])];
    return pick(views, requested, "all");
  },
  Content: ({ view, step }) => (step >= 4 ? <ProjectsGrouped scope={view === "mine" ? "mine" : "all"} /> : <ProjectListContent scope={view === "mine" ? "mine" : "all"} />),
};

const Dla: SectionDef = {
  useView: (requested) => {
    const canAll = useFeatureAccess("dlaAllView");
    const canReview = useFeatureAccess("dlaApproval");
    return scopeView(canAll, canReview ? "all" : "mine", requested, { all: "All requests", mine: "My requests" }, sectionIcons[DLA_SECTION_LABEL]);
  },
  Content: ({ view, statuses, step }) =>
    step >= 4 ? (
      <DlaGrouped scope={view === "mine" ? "mine" : "all"} statuses={statuses} />
    ) : (
      <DlaAllList key={`${view}:${statuses?.join(",")}`} scope={view === "mine" ? "mine" : "all"} initialStatuses={asStatuses<DlaStatus>(dlaStatusOrder, statuses)} banner={<DlaBanner />} />
    ),
  Actions: function DlaActions() {
    const dlas = useDlas();
    return (
      <ExportMenu
        onExport={() =>
          downloadCsv("data-licencing-agreements.csv", ["ID", "Requestor", "Status", "Valid to"], dlas.map((d) => [d.id, requestorName(d.requestor), dlaStatusMeta[d.status].label, d.validTo]))
        }
      />
    );
  },
};

const Dsa: SectionDef = {
  useView: (requested) => scopeView(true, "all", requested, { all: "All agreements", mine: "My agreements" }, sectionIcons[DSA_SECTION_LABEL]),
  Content: ({ view, step }) => (step >= 4 ? <DsaGrouped scope={view === "mine" ? "mine" : "all"} /> : <DsaAllList key={view} scope={view === "mine" ? "mine" : "all"} banner={<DsaBanner />} />),
  Actions: function DsaActions() {
    const dsas = useDsas();
    return <ExportMenu onExport={() => downloadCsv("data-sharing-agreements.csv", ["ID", "Data partner", "Status", "Valid to"], dsas.map((d) => [d.id, d.partner, dsaStatusMeta[d.status].label, d.validTo]))} />;
  },
};

const Nominations: SectionDef = {
  useView: (requested) => {
    const { canAll } = useNominationScope();
    return scopeView(canAll, "all", requested, { all: "All nominations", mine: "My nominations" }, sectionIcons[NOMINATION_SECTION_LABEL]);
  },
  Content: function NominationsContent({ view, statuses, step }) {
    const { organisation } = useNominationScope();
    const canReview = useFeatureAccess("nominationReview");
    if (step >= 4) return <NominationsGrouped scope={view === "mine" ? "mine" : "all"} statuses={statuses} />;
    return (
      <NominationList
        key={`${view}:${statuses?.join(",")}`}
        scope={view === "mine" ? "mine" : "all"}
        organisation={organisation}
        initialStatuses={asStatuses<NominationStatus>(nominationStatusOrder, statuses)}
        canReview={canReview}
      />
    );
  },
};

const UserManagement: SectionDef = {
  useView: (requested) =>
    pick(
      [
        { id: "users", label: "Users", icon: Users01 },
        { id: "roles", label: "Roles", icon: UserCheck01 },
        { id: "permissions", label: "Permissions", icon: Key01 },
      ],
      requested,
      "users",
    ),
  Content: ({ view }) => (view === "roles" ? <RolesList /> : view === "permissions" ? <PermissionsList /> : <UsersList />),
};

const Taxonomy: SectionDef = {
  useView: (requested) =>
    pick(
      [
        { id: "all", label: "All species", icon: sectionIcons[TAXONOMY_SECTION_LABEL] },
        { id: "Flora", label: "Flora", icon: speciesIcon("Flora") },
        { id: "Fauna", label: "Fauna", icon: speciesIcon("Fauna") },
      ],
      requested,
      "all",
    ),
  Content: ({ view }) => <SpeciesList key={view} kingdom={view === "Flora" || view === "Fauna" ? (view as Kingdom) : null} />,
};

const Notifications: SectionDef = {
  useView: (requested) => pick([{ id: "all", label: "All notifications", icon: Bell01 }, ...NT_CATEGORIES.map((c) => ({ id: c, label: c, icon: Tag01 }))], requested, "all"),
  Content: ({ view }) => <NtList key={view} category={view === "all" ? "" : view} />,
};

const ControlledVocabulary: SectionDef = {
  useView: none,
  Content: () => <CvList category="" />,
};

const TemplateFinder: SectionDef = {
  useView: none,
  Content: function TemplateFinderContent() {
    const filter = useTemplateFilter();
    return <TemplateList filter={filter} />;
  },
};

// Home is the dashboard: a signed-in role has My BioData and the Flora and Fauna Dashboard (column 2's two tabs, now the view menu);
// a public user has the one Flora and Fauna Dashboard under its gradient card, as on the real page.
const Home: SectionDef = {
  useView: (requested) => {
    const guest = useUserRole() === "public-user";
    return guest
      ? none()
      : pick(
          [
            { id: "dashboard", label: "My BioData", icon: User01 },
            { id: "overview", label: "Flora and Fauna Dashboard", icon: PieChart03 },
          ],
          requested,
          "dashboard",
        );
  },
  Content: function HomeContent({ view }) {
    const guest = useUserRole() === "public-user";
    const [tab, setTab] = useState<Key>("overview");
    if (guest) {
      return (
        <>
          <div className="p-6">
            <GuestGradientCard tab={tab} />
          </div>
          <DataOverviewContent activeTab={tab} onActiveTabChange={setTab} />
        </>
      );
    }
    return view === "overview" ? <DataOverviewContent /> : <HomeDashboardContent />;
  },
};

// ── Sections not in the lab yet ──

function NotInLab({ title, page, icon: Icon }: { title: string; page: SectionKey; icon: FC<{ className?: string }> }) {
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-start gap-4 p-6">
      <Gap name={`${title}, in this layout`} note="Not built in this lab yet. The real page opens in the current layout." className="max-w-md" />
      <Button color="secondary" size="sm" iconLeading={Icon} iconTrailing={ArrowNarrowRight} href={roleHref(keyHref(page))}>
        Open {title}
      </Button>
    </div>
  );
}

const placeholder = (title: string, page: SectionKey, icon: FC<{ className?: string }>): SectionDef => ({ useView: none, Content: () => <NotInLab title={title} page={page} icon={icon} /> });

export const SECTIONS: Record<SectionKey, SectionDef> = {
  dashboard: Home,
  "project-list": Projects,
  observations: placeholder("Explore", "observations", Map01),
  dla: Dla,
  dsa: Dsa,
  nominations: Nominations,
  "user-management": UserManagement,
  "template-finder": TemplateFinder,
  "ctrl-vocab": ControlledVocabulary,
  taxonomy: Taxonomy,
  notifications: Notifications,
  vouchers: placeholder(VOUCHER_SECTION_LABEL, "vouchers", SwitchHorizontal01),
  reports: placeholder(REPORTS_SECTION_LABEL, "reports", BarChart01),
};

/** The tab's icon: the rail's own, so a section is the same shape in the rail, the tab and the bar. */
export function sectionIcon(label: string) {
  return sectionIcons[label];
}

/** Section labels by key, for tabs and crumbs opened from a path rather than from the rail. */
export const SECTION_LABELS: Record<SectionKey, string> = {
  dashboard: "Home",
  "project-list": "Projects",
  observations: "Explore",
  dla: DLA_SECTION_LABEL,
  dsa: DSA_SECTION_LABEL,
  nominations: NOMINATION_SECTION_LABEL,
  "user-management": USER_MANAGEMENT_SECTION_LABEL,
  "template-finder": TEMPLATE_FINDER_SECTION_LABEL,
  "ctrl-vocab": CTRL_VOCAB_SECTION_LABEL,
  taxonomy: TAXONOMY_SECTION_LABEL,
  notifications: NOTIFICATION_SECTION_LABEL,
  vouchers: VOUCHER_SECTION_LABEL,
  reports: REPORTS_SECTION_LABEL,
};

/** A section's view menu, as a component so each section's hooks run under its own tab (keyed by the tab). */
export function SectionViewMenu({ section, view, onChange }: { section: SectionKey; view?: string; onChange: (id: string) => void }) {
  const { views, current } = SECTIONS[section].useView(view);
  return <ViewMenu views={views} current={current} onChange={onChange} ariaLabel="View" />;
}

export function SectionActions({ section }: { section: SectionKey }) {
  const Actions = SECTIONS[section].Actions;
  return Actions ? <Actions /> : null;
}

// Step 3 takes the headers off the real lists without touching them: a list's title block (its title, count and subtitle), its
// rule and its padding, and Home's gradient banner, are hidden by their structure here, and the primary action that shared the row
// stays, at the right. Every list's section header has this shape (SectionHeader: a root, a group, the title block first).
const QUIET_HEADERS = [
  "[&_div.relative.items-start>div.flex-1]:hidden",
  "[&_div.relative.items-start]:justify-end",
  "[&_div.border-b:has(>div.relative.items-start)]:border-b-0 [&_div.border-b:has(>div.relative.items-start)]:p-3",
  "[&_div.p-6:has(>div.bg-gradient-to-b)]:hidden",
].join(" ");

export function SectionContent({ section, view, statuses, step }: { section: SectionKey; view?: string; statuses?: string[]; step: number }): ReactNode {
  const def = SECTIONS[section];
  const { current } = def.useView(view);
  return (
    <div className={cx("flex min-h-0 flex-1 flex-col", step >= 3 && QUIET_HEADERS, step >= 3 && section === "dashboard" && "pt-4")}>
      <def.Content view={current} statuses={statuses} step={step} />
    </div>
  );
}

