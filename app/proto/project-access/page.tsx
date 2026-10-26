"use client";

import { Suspense, useState } from "react";
import { Columns03, Database01, Feather, Folder, Key01, Paperclip, User01 } from "@untitledui/icons";
import { Tabs } from "react-aria-components";
import { Tab, TabList, TabPanel } from "@/components/application/tabs/tabs";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { ContactsRow } from "@/app/pages/project-registration/option-2/form-sections";
import type { FormState } from "@/app/pages/project-registration/option-2/sections";
import { emptyProjectContact, initialDataCollection, initialProjectDetails, initialRestrictions, type ProjectAccessLevel, type ProjectContact } from "@/app/pages/project-registration/types";
import { ProjectAccessView } from "@/app/pages/project-detail/project-access-view";
import { isBiodataAdmin } from "@/lib/user-role";
import { useUserRole } from "@/lib/use-user-role";

// LAB (25 Oct 2026): what a Project Manager controls. The designer asked how "who is made a Project Manager will have full control
// over the project, or a page with which the project manager can assign what the user can do" should work, and approved the
// recommendation: access is set on each person where they are added (Add Project's Project contacts), and managed afterwards on a
// Project access tab on the project page. Both places are here, picked with the Screen tool on the Prototype tools bar:
//   1  Add project: the real Project contacts row (`ContactsRow showAccess`), each card with a "Project access" field.
//   2  Project page: the Project access tab, read first, changed through "Edit access" with one Cancel / Save changes bar
//      (CONTRACTS 4.8), as the project's other cards are. Its table is the role record's Users tab (`EmbeddedTableFrame`, 0.9).
// The rules shown: a Project Manager always has full control (their field is locked, with the reason); anyone else starts as View
// only; only a Project Manager or a BioData Admin can change what someone can do ("Your access" on the bar previews the others).
// Drafted, not supplied: the three levels' names and lines (`PROJECT_ACCESS_OPTIONS`), the tab's name and icon, the notice copy.
// Folded the same day (designer: "use it in the main form", "add to real project page"): Add Project's Project contacts asks it, and the
// project page has the tab (`ProjectAccessView`, which this lab now renders too).

const SCREENS = [
  { id: "create", label: "1: Add project, Project contacts", short: "Add project", description: "Access set on each person as they are added" },
  { id: "page", label: "2: Project page, Project access tab", short: "Project page", description: "Access managed after the project is created" },
];
const VIEWER = [
  { id: "full", label: "Project Manager (full control)", short: "Project Manager" },
  { id: "records", label: "Can upload and edit records", short: "Upload and edit" },
  { id: "view", label: "View only" },
];

// Placeholder people only (CONTRACTS 0.3).
const SAMPLE: ProjectContact[] = [
  { ...emptyProjectContact(1), firstName: "Olivia", lastName: "Wyatt", email: "olivia.wyatt@example.com", role: "project-manager", isPrimary: true },
  { ...emptyProjectContact(2), firstName: "Phoenix", lastName: "Baker", email: "phoenix.baker@example.com", role: "field-survey", access: "records" },
  { ...emptyProjectContact(3), firstName: "Lana", lastName: "Steiner", email: "lana.steiner@example.com", role: "research", access: "view" },
  { ...emptyProjectContact(4), firstName: "Maya", lastName: "Dewitt", email: "maya.dewitt@example.com", role: "support" },
];

export default function ProjectAccessLab() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}

function Lab() {
  const [screen, setScreen] = useState("create");
  const [people, setPeople] = useState<ProjectContact[]>(SAMPLE);
  useRegisterTool({ id: "layout", label: "Show the screen", barLabel: "Screen", icon: Columns03, options: SCREENS, value: screen, onChange: setScreen });

  return (
    <div className="min-h-screen bg-secondary font-sans">
      <PrototypeTools />
      <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-6 pt-10 pb-32">
        <header className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-wide text-tertiary uppercase">Lab · Project access</p>
          <h1 className="text-lg font-semibold text-primary">{SCREENS.find((s) => s.id === screen)!.label}</h1>
          <p className="text-sm text-tertiary">{SCREENS.find((s) => s.id === screen)!.description}. The people are shared, so a change on one screen shows on the other.</p>
        </header>
        <div className="font-barlow rounded-xl border border-secondary bg-primary p-6">
          {screen === "create" ? <CreateScreen people={people} onChange={setPeople} /> : <PageScreen people={people} onChange={setPeople} />}
        </div>
      </div>
    </div>
  );
}

function CreateScreen({ people, onChange }: { people: ProjectContact[]; onChange: (people: ProjectContact[]) => void }) {
  const state: FormState = {
    details: { ...initialProjectDetails(), dataOwnerType: "organisation", projectContacts: people },
    collection: initialDataCollection(),
    restrictions: initialRestrictions(),
  };
  return <ContactsRow state={state} onChange={(next) => onChange(next.details.projectContacts ?? [])} showErrors={false} showAccess />;
}

function PageScreen({ people, onChange }: { people: ProjectContact[]; onChange: (people: ProjectContact[]) => void }) {
  const role = useUserRole();
  const admin = isBiodataAdmin(role);
  const [viewer, setViewer] = useState<ProjectAccessLevel>("full");
  // An admin can always change access, so "Your access" has nothing to preview for one (CONTRACTS 3.8).
  useRegisterTool(admin ? null : { id: "version", label: "Your access on this project", barLabel: "Your access", icon: User01, options: VIEWER, value: viewer, onChange: (id) => setViewer(id as ProjectAccessLevel) });
  const canManage = admin || viewer === "full";

  return (
    <Tabs defaultSelectedKey="access" className="flex flex-col">
      <TabList aria-label="Project views" type="underline" size="md" className="gap-6">
        <Tab id="project" label="Project" icon={Folder} />
        <Tab id="records" label="Project records" icon={Database01} />
        <Tab id="species" label="Species" icon={Feather} />
        <Tab id="artefacts" label="Artefacts and attachments" icon={Paperclip} />
        <Tab id="access" label="Project access" icon={Key01} />
      </TabList>
      {["project", "records", "species", "artefacts"].map((id) => (
        <TabPanel key={id} id={id} className="pt-6">
          <p className="font-sans text-sm text-tertiary">Unchanged in this lab: see the project page.</p>
        </TabPanel>
      ))}
      <TabPanel id="access" className="pt-6">
        <ProjectAccessView people={people} onChange={onChange} canManage={canManage} />
      </TabPanel>
    </Tabs>
  );
}
