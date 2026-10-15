"use client";

// Search for anything, as a tab of its own: the rail's search button opens it (designer, 12 Oct 2026: "if the search icon is
// clicked, we need to open a new tab with the ability to search for anything"). One field over everything the role can open:
// the pages of the app, projects, species, data licence requests, data sharing agreements, nominations, users and
// notifications, each kept in its own titled group with the typed text in bold. Roles see only the groups they have (a role with no
// DLA access has no DLA results; a role that sees only its own requests searches only those), by the same feature checks the
// sections use. With nothing typed it is a way in rather than an empty box: every page, every project, the first species.
// A result opens in this tab, as every move in the lab does; a record the lab does not hold yet (a request, an agreement, a
// user) opens its real page. Species and projects use the header search's own index (`GlobalSearch`).
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useMemo, useState, type ReactNode } from "react";
import { Bell01, Feather, File05, FileCheck02, FileLock01, Folder, Grid01, SearchLg, SearchMd, Users01 } from "@untitledui/icons";
import { Badge, type BadgeColor } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { useAllProjects } from "@/app/pages/_shared/created-projects-store";
import { buildSpeciesIndex, matchesSpecies } from "@/app/pages/_shared/global-search";
import { dlaStatusMeta, requestorName } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { dsaStatusMeta } from "@/app/pages/_shared/dsa/dsa-data";
import { useDsas } from "@/app/pages/_shared/dsa/dsa-store";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { nominationStatusMeta } from "@/app/pages/_shared/nominations/nomination-data";
import { useNominationScope, inNominationScope } from "@/app/pages/_shared/nominations/nomination-scope";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { useNotifications } from "@/app/pages/_shared/notifications/nt-store";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import { useUsers } from "@/app/pages/_shared/user-management/um-store";
import { REGISTRATION_SPECIES } from "@/app/pages/project-registration/data";
import { keyHref, navForRole } from "@/lib/registered-user-nav";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { plain, type Icon } from "./panel-controls";

type Scope = "all" | "pages" | "projects" | "species" | "requests" | "admin";

interface Result {
  key: string;
  title: string;
  sub?: string;
  badge?: { label: string; color: BadgeColor<"pill-color"> };
  /** Where it goes; the shell opens it in this tab when the lab holds it, and as the real page when it does not. */
  path: string;
  /** A species: the projects that recorded it, each its own link. */
  links?: { label: string; path: string }[];
  icon?: Icon;
}

interface Group {
  id: string;
  title: string;
  scope: Scope;
  icon: Icon;
  items: Result[];
}

// A group shows this many rows and offers the rest.
const BROWSE = 8;

const label = "m-0 text-xs font-semibold tracking-wide text-quaternary uppercase";
const rowCls = "flex w-full items-center gap-3 border-t border-secondary px-4 py-3 text-left first:border-t-0";
const rowLink = "outline-focus-ring hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2";

/** The typed text in bold, wherever it appears in a result. */
function Highlight({ text, term }: { text: string; term: string }) {
  const i = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-semibold text-primary">{text.slice(i, i + term.length)}</strong>
      {text.slice(i + term.length)}
    </>
  );
}

const has = (q: string, ...fields: (string | undefined)[]) => !q || fields.some((f) => f?.toLowerCase().includes(q));

/** Every group the role can search, filtered by the text (all of each group when there is none). */
function useGroups(q: string): Group[] {
  const role = useUserRole();
  const all = useAllProjects();
  const dlas = useDlas();
  const dsas = useDsas();
  const nominations = useNominations();
  const users = useUsers();
  const notifications = useNotifications();
  const canDla = useFeatureAccess("dlaAccess");
  const canAllDla = useFeatureAccess("dlaAllView");
  const canDsa = useFeatureAccess("dsaManagement");
  const canNominate = useFeatureAccess("nominationAccess");
  const canUsers = useFeatureAccess("userManagement");
  const canNotifications = useFeatureAccess("notificationManagement");
  const { canAll: canAllNominations, organisation } = useNominationScope();
  const index = useMemo(() => buildSpeciesIndex(role), [role]);

  return useMemo(() => {
    const speciesMatches = (q ? index.filter((s) => matchesSpecies(s, q)) : [...index]).sort(
      (a, b) => Number(b.commonName.toLowerCase().startsWith(q)) - Number(a.commonName.toLowerCase().startsWith(q)) || a.commonName.localeCompare(b.commonName),
    );
    // A project matches by its own words, or because it recorded a matching species (and says which).
    const via = new Map<string, string>();
    if (q) for (const s of speciesMatches.slice(0, 20)) for (const id of s.projectIds) if (!via.has(id)) via.set(id, s.commonName);

    const pages: Result[] = navForRole(role)
      .filter((n) => n.key && has(q, plain(n.label)))
      .map((n) => ({ key: n.label, title: plain(n.label), path: keyHref(n.key!), icon: sectionIcons[n.label] }));
    const projects: Result[] = all
      .filter((p) => has(q, p.name, p.code, p.org) || via.has(p.id))
      .map((p) => ({
        key: p.id,
        title: p.name,
        sub: `${p.code} · ${p.org}${!has(q, p.name, p.code, p.org) ? ` · recorded ${via.get(p.id)}` : ""}`,
        badge: { label: p.status, color: p.statusColor },
        path: projectDetailsPath(p.id),
      }));
    const species: Result[] = speciesMatches.map((s) => ({
      key: s.species,
      title: s.commonName,
      sub: s.species,
      path: `/pages/observations?q=${encodeURIComponent(s.commonName)}`,
      icon: SPECIES_GROUP_ICON[s.group],
      links: s.projectIds.map((id, i) => ({ label: s.projectNames[i], path: projectDetailsPath(id) })),
    }));

    const records: Group[] = [];
    if (canDla) {
      const items = dlas
        .filter((d) => canAllDla || requestorName(d.requestor) === CURRENT_USER_NAME)
        .filter((d) => has(q, d.id, requestorName(d.requestor), d.requestor.organisation, d.purpose, ...d.locations.map((l) => l.name)))
        .map((d) => ({ key: d.id, title: d.id, sub: `${requestorName(d.requestor)} · ${d.requestor.organisation}`, badge: { label: dlaStatusMeta[d.status].label, color: dlaStatusMeta[d.status].badgeColor }, path: `/pages/dla/${d.id}` }));
      records.push({ id: "dla", title: "Data licence requests", scope: "requests", icon: FileLock01, items });
    }
    if (canDsa) {
      const items = dsas
        .filter((d) => has(q, d.id, d.partner, d.purpose))
        .map((d) => ({ key: d.id, title: d.id, sub: d.partner, badge: { label: dsaStatusMeta[d.status].label, color: dsaStatusMeta[d.status].badgeColor }, path: `/pages/dsa/${d.id}` }));
      records.push({ id: "dsa", title: "Data sharing agreements", scope: "requests", icon: FileCheck02, items });
    }
    if (canNominate) {
      const items = nominations
        .filter((n) => inNominationScope(n, canAllNominations ? "all" : "mine", organisation))
        .map((n) => ({ n, name: REGISTRATION_SPECIES.find((s) => s.id === n.speciesId)?.commonName ?? n.speciesId }))
        .filter(({ n, name }) => has(q, n.id, name, n.speciesId, n.nominator.name, n.nominator.organisation))
        .map(({ n, name }) => ({ key: n.id, title: name, sub: `${n.id} · ${n.nominator.name}`, badge: { label: nominationStatusMeta[n.status].label, color: nominationStatusMeta[n.status].badgeColor }, path: `/pages/nominations/${n.id}` }));
      records.push({ id: "nominations", title: "Nominations", scope: "requests", icon: Feather, items });
    }
    if (canUsers) {
      const items = users
        .filter((u) => has(q, u.displayName, u.firstName, u.lastName, u.username, u.email, u.organisation, u.position))
        .map((u) => ({ key: u.id, title: u.displayName || `${u.firstName} ${u.lastName}`, sub: `${u.email}${u.organisation ? ` · ${u.organisation}` : ""}`, path: `/pages/user-management/users/${u.id}` }));
      records.push({ id: "users", title: "Users", scope: "admin", icon: Users01, items });
    }
    if (canNotifications) {
      const items = notifications.filter((n) => has(q, n.name, n.category)).map((n) => ({ key: n.id, title: n.name, sub: n.category, path: `/pages/notifications/${n.id}` }));
      records.push({ id: "notifications", title: "Notifications", scope: "admin", icon: Bell01, items });
    }

    const groups: Group[] = [
      { id: "pages", title: "Pages", scope: "pages", icon: Grid01, items: pages },
      { id: "projects", title: "Projects", scope: "projects", icon: Folder, items: projects },
      { id: "species", title: "Species", scope: "species", icon: Feather, items: species },
      // Records are looked for only once something is typed: with nothing typed, every request and user is a list, not a way in.
      ...(q ? records : []),
    ];
    return groups.filter((g) => g.items.length > 0);
  }, [q, role, index, all, dlas, dsas, nominations, users, notifications, canDla, canAllDla, canDsa, canNominate, canUsers, canNotifications, canAllNominations, organisation]);
}

const SCOPES: { id: Scope; title: string; icon: Icon }[] = [
  { id: "all", title: "All", icon: SearchLg },
  { id: "pages", title: "Pages", icon: Grid01 },
  { id: "projects", title: "Projects", icon: Folder },
  { id: "species", title: "Species", icon: Feather },
  { id: "requests", title: "Requests", icon: File05 },
  { id: "admin", title: "Admin", icon: Users01 },
];

export function SearchPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const roleHref = useRoleHref();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [expanded, setExpanded] = useState<string[]>([]);

  const term = query.trim();
  const q = term.toLowerCase();
  const groups = useGroups(q);
  const go = (path: string) => onNavigate(roleHref(path));

  const inScope = (s: Scope) => groups.filter((g) => s === "all" || g.scope === s);
  const countOf = (s: Scope) => inScope(s).reduce((n, g) => n + g.items.length, 0);
  // A scope with nothing in it is not offered.
  const scopes = SCOPES.filter((s) => s.id === "all" || countOf(s.id) > 0);

  const panel = (s: Scope): ReactNode => {
    const shown = inScope(s);
    if (shown.length === 0) {
      return <p className="m-0 py-8 text-center text-sm text-tertiary">Nothing matches &ldquo;{term}&rdquo;. Try a name, an ID, a project code, an organisation or a species.</p>;
    }
    return (
      <div className="flex flex-col gap-6">
        {shown.map((g) => {
          // On All a long group shows its first rows and offers the rest; on its own scope it shows them all.
          const every = expanded.includes(g.id) || s !== "all";
          const rows = every ? g.items : g.items.slice(0, BROWSE);
          return (
            <section key={g.id} className="flex flex-col gap-2">
              <h2 className={label}>
                {g.title} <span className="font-normal tabular-nums">{g.items.length}</span>
              </h2>
              <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                {rows.map((r) => (
                  <ResultRow key={r.key} r={r} fallback={g.icon} term={term} go={go} />
                ))}
                {!every && g.items.length > BROWSE && (
                  <button type="button" onClick={() => setExpanded((e) => [...e, g.id])} className={`w-full border-t border-secondary px-4 py-3 text-left text-sm font-medium text-brand-secondary hover:text-brand-secondary_hover ${rowLink}`}>
                    Show all {g.items.length}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-6">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-2xl font-semibold text-primary">Search</h1>
        <p className="m-0 text-sm text-tertiary">Pages, projects, species, requests, agreements, people and notifications.</p>
      </div>
      <Input
        aria-label="Search everything"
        placeholder="Search for anything"
        icon={SearchMd}
        value={query}
        onChange={(v) => {
          setQuery(v);
          setExpanded([]);
        }}
        onClear={query ? () => setQuery("") : undefined}
        autoFocus
      />
      <Tabs selectedKey={scopes.some((s) => s.id === scope) ? scope : "all"} onSelectionChange={(k) => setScope(k as Scope)} className="flex flex-col gap-6">
        <TabList aria-label="Kind of result" type="underline" size="md" className="gap-6">
          {scopes.map((s) => (
            <Tab key={s.id} id={s.id} label={s.title} icon={s.icon} badge={countOf(s.id)} />
          ))}
        </TabList>
        {scopes.map((s) => (
          <TabPanel key={s.id} id={s.id}>
            {panel(s.id)}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}

function ResultRow({ r, fallback, term, go }: { r: Result; fallback: Icon; term: string; go: (path: string) => void }) {
  const RowIcon = r.icon ?? fallback;
  const body = (
    <>
      <RowIcon className="size-5 shrink-0 text-quaternary" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-primary">
          <Highlight text={r.title} term={term} />
          {r.links && r.sub && <span className="font-normal text-tertiary italic"> {r.sub}</span>}
        </span>
        {r.links ? (
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-tertiary">
            Recorded in
            {r.links.map((l) => (
              <button key={l.path} type="button" onClick={() => go(l.path)} className="rounded-sm text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2">
                {l.label}
              </button>
            ))}
          </span>
        ) : (
          r.sub && (
            <span className="truncate text-sm text-tertiary">
              <Highlight text={r.sub} term={term} />
            </span>
          )
        )}
      </span>
      {r.badge && (
        <Badge size="sm" color={r.badge.color}>
          {r.badge.label}
        </Badge>
      )}
    </>
  );
  // A species row is not one button (its projects are links of their own); every other row is.
  return r.links ? (
    <div className={rowCls}>{body}</div>
  ) : (
    <button type="button" onClick={() => go(r.path)} className={`${rowCls} ${rowLink}`}>
      {body}
    </button>
  );
}
