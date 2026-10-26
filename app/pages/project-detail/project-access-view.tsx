"use client";

// The project page's Project access tab (the designer, 25 Oct 2026, from `/proto/project-access`): who is on the project and what
// each can do. Everyone who can open the project sees it; a Project Manager on the project and every BioData Admin can change it.
// It is the role record's Users-tab table (`EmbeddedTableFrame`, CONTRACTS 0.9), read first and changed through "Edit access" with
// one Cancel / Save changes bar, as the project's other cards are edited (4.8). People are added, or made a Project Manager, in
// Project contacts on the Project tab, not here (designer: leave it as it is for now).

import { useState } from "react";
import { ArrowLeft, Edit05, Save01, Trash01, User01, XClose } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { Table, TableCard } from "@/components/application/table/table";
import { toast } from "@/components/application/toast/toast";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { accessKey, accessLabel, accessOf, projectPeople, ROLE_OF_WORK_OPTIONS } from "@/app/pages/project-registration/data";
import { ProjectAccessSelect } from "@/app/pages/project-registration/project-access";
import type { ProjectAccessLevel, ProjectContact } from "@/app/pages/project-registration/types";
import { EmbeddedTableFrame, useEmbeddedPaging } from "@/app/pages/_shared/user-management/um-detail";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { isBiodataAdmin } from "@/lib/user-role";
import { useUserRole } from "@/lib/use-user-role";
import { useEditStore } from "./edit-store";

const VIEWER = [
  { id: "manager", label: "A Project Manager on this project", short: "Project Manager" },
  { id: "other", label: "Not a Project Manager on this project", short: "Not a Project Manager" },
];

/** The tab on the project page: the project's people from the store, saved back as `details.projectAccess`. This build has no
 *  signed-in person to match to a contact, so whether the viewer is a Project Manager on this project is previewed with the
 *  "On this project" tool on the Prototype tools bar (it starts as not one); an admin can always change access, so has no tool. */
export function ProjectAccessTab() {
  const { project, saveProject, canEdit } = useEditStore();
  const admin = isBiodataAdmin(useUserRole());
  const [viewer, setViewer] = useState("other");
  useRegisterTool(admin || !canEdit ? null : { id: "version", label: "You are", barLabel: "On this project", icon: User01, options: VIEWER, value: viewer, onChange: setViewer });
  const canManage = admin || (canEdit && viewer === "manager");
  const people = projectPeople(project.details);

  return (
    <ProjectAccessView
      people={people}
      canManage={canManage}
      onChange={(next) =>
        saveProject({
          ...project,
          details: { ...project.details, projectAccess: Object.fromEntries(next.filter((p) => !p.isManager).map((p) => [accessKey(p), accessOf(p)])) },
        })
      }
    />
  );
}


const roleLabel = (p: ProjectContact) => (p.role === "other" ? p.roleOther : ROLE_OF_WORK_OPTIONS.find((o) => o.id === p.role)?.label) || "Not provided";
const fullName = (p: ProjectContact) => `${p.firstName} ${p.lastName}`.trim();
const initials = (p: ProjectContact) => `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();

export function ProjectAccessView({ people, onChange, canManage }: { people: ProjectContact[]; /** Called on Save changes with everyone, their access as set. */ onChange: (people: ProjectContact[]) => void; canManage: boolean }) {
  const [draft, setDraft] = useState<ProjectContact[] | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const editing = draft !== null && canManage;
  const shown = editing ? draft : people;
  const dirty = editing && draft.some((p) => accessOf(p) !== accessOf(people.find((o) => accessKey(o) === accessKey(p))!));
  const q = search.trim().toLowerCase();
  const rows = q ? shown.filter((p) => `${fullName(p)} ${p.email} ${roleLabel(p)}`.toLowerCase().includes(q)) : shown;
  const { paged, reset, footer } = useEmbeddedPaging(rows);
  const setAccess = (key: string, access: ProjectAccessLevel) => setDraft((d) => (d ?? people).map((p) => (accessKey(p) === key ? { ...p, access } : p)));

  return (
    <div className="flex flex-col gap-4">
      <AlertFullWidth
        color="gray"
        contained
        wrap
        confirmLabel=""
        title={canManage ? "Project Managers and BioData Admins have full control" : "Only a Project Manager or a BioData Admin can change access"}
        description={
          canManage
            ? "Choose what everyone else can do on this project. To add a person, or to make someone a Project Manager, edit Project contacts on the Project tab."
            : "Ask a Project Manager on this project if someone needs to do more."
        }
      />
      {/* The table's own action sits at the right of its label and search, so the table keeps the full width. */}
      <div className="relative">
        {canManage && !editing && (
          <Button color="secondary" size="sm" iconLeading={Edit05} className="absolute top-0 right-0" onClick={() => setDraft(people)}>
            Edit access
          </Button>
        )}
        <EmbeddedTableFrame
            label="People on this project"
            count={people.length}
            search={search}
            onSearch={(v) => {
              setSearch(v);
              reset();
            }}
            placeholder="Search name, email or role"
            empty={rows.length === 0 ? "No people match your search." : null}
          >
            <TableCard.Root size="sm">
              <Table aria-label="People on this project" layout="fixed" bodyScrollable>
                <Table.Header sticky>
                  <Table.Head id="name" label="Person" isRowHeader className="w-[44%]" />
                  <Table.Head id="role" label="Role in project" className="w-[22%]" />
                  <Table.Head id="access" label="Access" className="w-[34%]" />
                </Table.Header>
                <Table.Body items={paged} dependencies={[editing, draft]}>
                  {(p) => (
                    <Table.Row id={accessKey(p)} textValue={fullName(p)}>
                      <Table.Cell>
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar size="sm" initials={initials(p)} />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-primary">{fullName(p)}</span>
                            <span className="truncate text-sm text-tertiary">{p.email}</span>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-secondary">{roleLabel(p)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        {editing ? (
                          <ProjectAccessSelect person={p} size="sm" showLabel={false} onChange={(access) => setAccess(accessKey(p), access)} />
                        ) : (
                          <span className="text-sm text-secondary">{accessLabel(accessOf(p))}</span>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
              {footer}
            </TableCard.Root>
          </EmbeddedTableFrame>
      </div>

      {editing && (
        <div className="sticky bottom-0 -mx-6 -mb-6 rounded-b-xl border-t border-secondary bg-primary">
          <div className="flex items-center justify-between gap-3 px-6 py-4">
            <p className="text-sm text-tertiary">
              Editing <span className="font-semibold text-primary">Project access</span>
              {dirty && <span className="text-quaternary">, unsaved changes</span>}
            </p>
            <div className="flex items-center gap-3">
              <Button iconLeading={XClose} color="secondary" onClick={() => (dirty ? setConfirm(true) : setDraft(null))}>
                Cancel
              </Button>
              <Button
                iconLeading={Save01}
                color="primary"
                onClick={() => {
                  onChange(draft);
                  setDraft(null);
                  toast.success("Project access saved", { description: "Changes are kept for this session only. This preview has no backend." });
                }}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        confirmIcon={Trash01}
        cancelIcon={ArrowLeft}
        isOpen={confirm}
        onOpenChange={setConfirm}
        title="Discard your changes?"
        description="You have changes to Project access that haven't been saved. Leaving now will lose them."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirm(false);
          setDraft(null);
        }}
      />
    </div>
  );
}
