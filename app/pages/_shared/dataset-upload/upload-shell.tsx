"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowLeft, ArrowNarrowRight, FileSearch01 } from "@untitledui/icons";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { Button } from "@/components/base/buttons/button";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { FormSidebarSlotContext } from "@/app/pages/_shared/form-section-list";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import type { SearchEvent } from "@/app/pages/_shared/map-search/search-data";
import { keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// The shell for the upload-dataset route (/pages/project-list/<id>/upload): the rail with Projects
// active, column 2 holding the form's section list (portalled in by `FormSidebar`, CONTRACTS 4.1),
// and main. A person who may not upload, or a project that does not exist, still gets all three
// columns with the reason in main (CONTRACTS 3.7). Same shape as `NominationShell`.
export function UploadShell({ project, children }: { project?: SearchEvent; children: ReactNode }) {
  const router = useRouter();
  const role = useUserRole();
  const roleHref = useRoleHref();
  const canUpload = useFeatureAccess("datasetUpload");
  const nav = navForRole(role);
  const [formSlot, setFormSlot] = useState<HTMLElement | null>(null);

  const goToSection = (section: NavNode) => {
    const target = section.key ? section : section.items?.find((item) => item.key);
    if (target?.key) router.push(roleHref(keyHref(target.key)));
  };

  const projectsHref = roleHref("/pages/project-list");
  const showForm = canUpload && !!project;

  let main: ReactNode = children;
  if (!project) {
    main = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <FileSearch01 className="size-6 text-fg-quaternary" />
        <h1 className="text-lg font-semibold text-balance text-primary">This project isn&apos;t available</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">The link may be incomplete, or the project may have been removed.</p>
        <Button color="secondary" size="sm" href={projectsHref} iconLeading={ArrowNarrowLeft}>
          Back to projects
        </Button>
      </div>
    );
  } else if (!canUpload) {
    main = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-lg font-medium text-primary">Upload dataset</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">Uploading a dataset needs a free BioData SA account. Create one to add datasets to {project.name}.</p>
        <Button color="link-color" size="sm" href={roleHref(projectDetailsPath(project.id))} iconTrailing={ArrowNarrowRight}>
          Go to the project
        </Button>
      </div>
    );
  }

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <RoleSwitcher />
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection="Projects"
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          />
        }
        renderBreadcrumb={(orgLabel) => (
          <Breadcrumb
            orgLabel={orgLabel}
            section={
              <>
                <Link href={projectsHref} className="hover:text-primary">
                  Projects
                </Link>
                {project && (
                  <>
                    <span>/</span>
                    <Link href={roleHref(projectDetailsPath(project.id))} className="hover:text-primary">
                      {project.name}
                    </Link>
                  </>
                )}
              </>
            }
            current="Upload dataset"
          />
        )}
      />

      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection="Projects" onSelectSection={goToSection} />

        <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          {showForm ? (
            <div ref={setFormSlot} />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Upload dataset</p>
            </div>
          )}
          <SidebarFooterLinks />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <FormSidebarSlotContext.Provider value={formSlot}>{main}</FormSidebarSlotContext.Provider>
        </main>
      </div>
    </div>
  );
}
