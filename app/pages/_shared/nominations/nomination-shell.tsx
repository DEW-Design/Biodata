"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowNarrowRight, Shield03, User01 } from "@untitledui/icons";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { ActionsGroup, downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { AgreementScopeNav, useAgreementScope } from "@/app/pages/_shared/agreement-scope";
import { inNominationScope, useNominationScope } from "@/app/pages/_shared/nominations/nomination-scope";
import { nominationStatusMeta, speciesFor } from "@/app/pages/_shared/nominations/nomination-data";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { NominationSwitcher } from "@/app/pages/_shared/nominations/nomination-switcher";
import { NominationVersionTool, SENSITIVITY_PATH, useNominationVersion } from "@/app/pages/_shared/nominations/nomination-version";
import { SENSITIVITY_SPECIES, accessLevelMeta, appliesToLabel, ratingSummary, releaseRiskMeta } from "@/app/pages/_shared/nominations/species-sensitivity";
import { latestChanges, ratingOf, useRatingChanges } from "@/app/pages/_shared/nominations/species-sensitivity-store";
import { SpeciesSensitivitySwitcher } from "@/app/pages/_shared/nominations/species-sensitivity-record";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { FormSidebarSlotContext } from "@/app/pages/_shared/form-section-list";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { NOMINATION_SECTION_LABEL, keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";

// The one shell every nomination route renders through (the list, a nomination's record page, the
// new and edit forms), the same shape as DlaShell. Column 2:
//   - a role with the All view (nominationAllView, or the BioData Admin) switches between All nominations (its
//     organisation's, or everyone's for the admin) and My nominations, like DLA;
//   - a Registered User sees only their own nominations: column 2 lists "My nominations" alone (designer, 6 Oct 2026),
//     where it used to be the bare section label.
// Column 2 is navigation and actions only. How a nomination is reviewed is information, so it sits
// above the table on the list (`ReviewSteps` in nomination-list.tsx), not here.
// Both get the Actions group (Export CSV of what they can see).
// Version 2 (nomination-version.tsx): the BioData Super Admin's column 2 adds "Species sensitivity" under All and My, one
// list of places like User Management's; there, Export CSV exports the species' ratings. A species' page is a record page:
// no column 2, and its section crumb switches species. The Version tool shows everywhere but the forms (version 1's in both).
const CURRENT_KEY = "nominations";

function SectionPlaceholder({ node }: { node: NavNode }) {
  const relatedLink = node.key ? node : node.items?.find((item) => item.key);
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">{node.label}</h1>
      <p className="max-w-sm text-sm text-tertiary">
        {relatedLink ? "This section has its own page - it isn't embedded here." : "This section's content hasn't been scoped yet - only its place in the navigation is decided so far."}
      </p>
      {relatedLink && (
        <Button color="link-color" size="sm" href={roleHref(keyHref(relatedLink.key!))} iconTrailing={ArrowNarrowRight}>
          Go to {relatedLink.label}
        </Button>
      )}
    </div>
  );
}

/** Version 2, BioData Super Admin: All, My and Species sensitivity in one list of places. */
function RegisterScopeNav({ onRegister }: { onRegister: boolean }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const { base } = useNominationVersion();
  const scope = useAgreementScope("all");
  return (
    <div className="flex flex-col gap-1">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Nominations</p>
      <Tabs
        orientation="vertical"
        selectedKey={onRegister ? "register" : scope}
        onSelectionChange={(key) => router.push(roleHref(key === "register" ? SENSITIVITY_PATH : `${base}?scope=${key}`))}
      >
        <TabList aria-label="Nominations" orientation="vertical" type="button-brand" fullWidth className="w-full">
          <Tab id="all" label="All nominations" icon={sectionIcons[NOMINATION_SECTION_LABEL]} />
          <Tab id="mine" label="My nominations" icon={User01} />
          <Tab id="register" label="Species sensitivity" icon={Shield03} />
        </TabList>
      </Tabs>
    </div>
  );
}

function exportRegister(changes: ReturnType<typeof useRatingChanges>) {
  const latest = latestChanges(changes);
  downloadCsv(
    "species-sensitivity.csv",
    ["Common name", "Scientific name", "Group", "Applies to", "Data release risk", "User access level", "Last changed", "Changed by"],
    SENSITIVITY_SPECIES.map((s) => {
      const rating = ratingOf(latest, s.id);
      const summary = ratingSummary(rating);
      const c = latest.get(s.id);
      return [s.commonName, s.species, s.group, appliesToLabel(rating), releaseRiskMeta[summary.risk].label, accessLevelMeta[summary.access].label, c?.at ?? "", c?.by ?? ""];
    }),
  );
}

function ScopeNav() {
  const nominations = useNominations();
  const changes = useRatingChanges();
  const { canAll, organisation } = useNominationScope();
  const { version, base } = useNominationVersion();
  const pathname = usePathname();
  const canRate = useFeatureAccess("speciesSensitivity");
  const withRegister = version === 2 && canRate;
  const onRegister = withRegister && pathname.startsWith(SENSITIVITY_PATH);
  const visible = nominations.filter((n) => inNominationScope(n, canAll ? "all" : "mine", organisation));

  return (
    <div className="flex flex-col gap-1">
      {withRegister ? (
        <RegisterScopeNav onRegister={onRegister} />
      ) : (
        <AgreementScopeNav
          heading="Nominations"
          basePath={base}
          defaultScope={canAll ? "all" : "mine"}
          myLabel="My nominations"
          allLabel="All nominations"
          allIcon={sectionIcons[NOMINATION_SECTION_LABEL]}
          showAll={canAll}
        />
      )}
      <ActionsGroup
        onExportCsv={() =>
          onRegister
            ? exportRegister(changes)
            : downloadCsv(
                "sensitive-species-nominations.csv",
                ["ID", "Species", "Scientific name", "Protection", "Nominated by", "Status", "Updated"],
                visible.map((n) => {
                  const species = speciesFor(n.speciesId);
                  return [n.id, species?.commonName ?? "", n.speciesId, n.scope === "all" ? "All data" : "Specific attributes", n.nominator.name, nominationStatusMeta[n.status].label, n.updatedAt];
                }),
              )
        }
      />
    </div>
  );
}

export function NominationShell({
  breadcrumbCurrent,
  recordId,
  formSidebar = false,
  speciesId,
  children,
}: {
  /** The page-specific final crumb (a nomination ID, "New nomination"). When set, the section crumb links back to the list. */
  breadcrumbCurrent?: string;
  /** The ID of the nomination a deep-dive page shows (not set on forms): the section crumb becomes a switcher over the nominations. */
  recordId?: string;
  /** A create/edit form is rendered: column 2 becomes the form's section list (portalled via `FormSidebar`). */
  formSidebar?: boolean;
  /** A species' sensitivity page (version 2): a record page, its section crumb a switcher over the species. */
  speciesId?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();
  const canAccess = useFeatureAccess("nominationAccess");
  const nav = navForRole(role);
  const roleHref = useRoleHref();
  const { base } = useNominationVersion();

  const [localSection, setLocalSection] = useState<string | null>(null);
  const activeSection = localSection ?? NOMINATION_SECTION_LABEL;
  const otherSection = localSection ? nav.find((section) => section.label === localSection) : undefined;
  const [formSlot, setFormSlot] = useState<HTMLElement | null>(null);
  const showScopeNav = canAccess && !otherSection;

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key === CURRENT_KEY) setLocalSection(null);
    else if (relatedLink?.key) router.push(roleHref(keyHref(relatedLink.key)));
    else setLocalSection(section.label);
  };

  let main: ReactNode = children;
  if (otherSection) main = <SectionPlaceholder node={otherSection} />;
  else if (!canAccess)
    main = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-lg font-semibold text-primary">{NOMINATION_SECTION_LABEL}</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">Nominating a sensitive species needs a free BioData SA account. Create one to nominate a species and follow its review.</p>
        <Button color="link-color" size="sm" href={roleHref("/pages/dashboard")} iconTrailing={ArrowNarrowRight}>
          Go to Home
        </Button>
      </div>
    );

  // A record's page (a user, a request, a report ...) has no column 2: the whole width is the record (CONTRACTS 3.7). Its
  // navigation is the breadcrumb switcher, and its actions are in the record's own card.
  const recordPage = showScopeNav && (!!recordId || !!speciesId) && !formSidebar;

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      {canAccess && !formSidebar && <NominationVersionTool recordId={recordId} />}
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={activeSection}
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          >
            {showScopeNav && !formSidebar ? () => <ScopeNav /> : undefined}
          </MobileNavTrigger>
        }
        section={
          speciesId && canAccess && !otherSection ? (
            <SpeciesSensitivitySwitcher speciesId={speciesId} />
          ) : recordId && canAccess && !otherSection ? (
            <NominationSwitcher currentId={recordId} />
          ) : breadcrumbCurrent && !otherSection ? (
            <Link href={roleHref(base)} className="hover:text-primary">
              {activeSection}
            </Link>
          ) : (
            activeSection
          )
        }
        current={otherSection ? undefined : breadcrumbCurrent}
      />

      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection={canAccess || otherSection ? activeSection : null} onSelectSection={goToSection} />

        {!recordPage && (
          <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
            {showScopeNav && formSidebar ? (
              <div ref={setFormSlot} />
            ) : showScopeNav ? (
              <ScopeNav />
            ) : (
              <div className="flex flex-col gap-1">
                <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{otherSection?.label ?? NOMINATION_SECTION_LABEL}</p>
                {otherSection?.items?.map((item) => (
                  <p key={item.label} className="px-2 py-2 text-sm text-tertiary">
                    {item.label}
                  </p>
                ))}
              </div>
            )}
          </aside>
        )}

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <FormSidebarSlotContext.Provider value={formSlot}>{main}</FormSidebarSlotContext.Provider>
        </main>
      </div>
    </div>
  );
}
