"use client";

// Flagged concepts across every project: the admin's page for managing all of them in one place
// (29 Sept 2026), reached from "Review all" on the admin's Home. The same review screen as a single
// project's (project-detail/review-view.tsx) with the project filter on: column 2 is the
// queue, grouped by project, with a Projects picker above it; main is the form for the one in focus.
// The project filter lives in the URL (`?project=BD-5039,BD-4988`), and `?item=` opens a given one.
//
// A second kind sits beside the questionable values (26 Oct 2026): custom concepts, columns an uploader added
// to a data sheet that BioData does not have, waiting for approval (`?kind=custom`, custom-concepts-review.tsx).
//
// Who: BioData Admin and Privileged Admin, the roles that can resolve flagged concepts. Anyone else
// gets the three-column shell with the restriction stated in main (CONTRACTS 3.7).

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowNarrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { EditStoreProvider } from "../project-detail/edit-store";
import { adelaideHillsSeed } from "../project-detail/project-seed";
import { useCanReview } from "../project-detail/field-notes";
import { usePortfolioEntries } from "../project-detail/flagged-portfolio";
import { ReviewScreen, useLiveEntries } from "../project-detail/review-view";
import { CustomConceptsReview, useOpenCustomConceptCount } from "../project-detail/custom-concepts-review";
import { FlaggedKindNav, type FlaggedKind } from "../project-detail/flagged-kind-nav";

export default function FlaggedConceptsPage() {
  return (
    <Suspense fallback={null}>
      <FlaggedConceptsWithStore />
    </Suspense>
  );
}

function FlaggedConceptsWithStore() {
  const role = useUserRole();
  return (
    <EditStoreProvider canEdit role={role} seed={adelaideHillsSeed}>
      <FlaggedConcepts />
    </EditStoreProvider>
  );
}

function FlaggedConcepts() {
  const router = useRouter();
  const role = useUserRole();
  const nav = navForRole(role);
  const roleHref = useRoleHref();
  const canReview = useCanReview();
  const searchParams = useSearchParams();
  const live = useLiveEntries();
  const portfolio = usePortfolioEntries();
  const entries = useMemo(() => [...live, ...portfolio], [live, portfolio]);
  const projectFilter = (searchParams.get("project") ?? "").split(",").filter(Boolean);
  const item = searchParams.get("item");
  // Two kinds of flagged concept: values on records that are questionable, and columns an uploader added that
  // BioData does not have (custom concepts). `?kind=custom` opens the second.
  const kind: FlaggedKind = searchParams.get("kind") === "custom" ? "custom" : "values";
  const customOpen = useOpenCustomConceptCount();
  const setKind = (next: FlaggedKind) => router.replace(roleHref(`/pages/flagged-concepts${next === "custom" ? "?kind=custom" : ""}`));
  const kindNav = <FlaggedKindNav kind={kind} onChange={setKind} valuesOpen={entries.filter((e) => e.status === "open").length} customOpen={customOpen} />;

  const goToSection = (section: NavNode) => {
    const link = section.key ? section : section.items?.find((i) => i.key);
    if (link?.key) router.push(roleHref(keyHref(link.key)));
  };
  const setProjects = (codes: string[]) => {
    const q = codes.length ? `?project=${codes.join(",")}` : "";
    router.replace(roleHref(`/pages/flagged-concepts${q}`));
  };

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection="Home"
            onSelectSection={(label) => {
              const s = nav.find((n) => n.label === label);
              if (s) goToSection(s);
            }}
          />
        }
        current="Flagged concepts"
      />
      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection="Home" onSelectSection={goToSection} />
        {canReview && kind === "custom" ? (
          <CustomConceptsReview key={item ?? "all"} kindNav={kindNav} initialItem={item} exitLabel="Back to Home" onExit={() => router.push(roleHref("/pages/dashboard"))} />
        ) : canReview ? (
          <ReviewScreen
            kindNav={kindNav}
            key={item ?? "all"}
            entries={entries}
            initialItem={item}
            showProjects
            projectFilter={projectFilter}
            onProjectFilterChange={setProjects}
            exitLabel="Back to Home"
            onExit={() => router.push(roleHref("/pages/dashboard"))}
            onGoToRecord={(entry) => {
              if (entry.live)
                router.push(
                  roleHref(
                    `/pages/project-detail?record=${encodeURIComponent(entry.live.recordId)}&field=${encodeURIComponent(entry.live.key)}`,
                  ),
                );
            }}
          />
        ) : (
          <>
            <aside
              aria-label="Section"
              className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 border-r border-secondary bg-secondary p-4 lg:flex"
            >
              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Flagged concepts</p>
            </aside>
            <main className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
              <h1 className="text-lg font-medium text-primary">Flagged concepts</h1>
              <p className="max-w-sm text-sm text-balance text-tertiary">
                Flagged concepts are reviewed by BioData Admins and Privileged Admins. Your account
                doesn&apos;t have access to this page.
              </p>
              <Button color="link-color" size="sm" href={roleHref("/pages/dashboard")} iconTrailing={ArrowNarrowRight}>
                Go to Home
              </Button>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
