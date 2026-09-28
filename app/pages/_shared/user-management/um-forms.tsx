"use client";

import { useState } from "react";
import type { DateValue, Key, Selection } from "react-aria-components";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Plus, SearchMd, Trash01 } from "@untitledui/icons";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import { FormSectionList, FormSidebar, deriveSectionStatus } from "@/app/pages/_shared/form-section-list";
import { INDIVIDUAL, UM_ORGANISATIONS, accessStatusMeta, permissionCategories, type RoleKind, type UmRole } from "@/app/pages/_shared/user-management/um-data";
import { PermissionGroups } from "@/app/pages/_shared/user-management/um-detail";
import { usePermissions, useRoles, type PermissionDraft, type RoleDraft, type UserDraft } from "@/app/pages/_shared/user-management/um-store";

// The three User Management add forms, on THE form page (CONTRACTS.md 4.1). Fields follow the
// wireframe (Figma YMproGZfrFB5jUqPHPxMhk, node 1558:10575, frames "Add User", "Add Role", "Add
// Permission"), fitted to the form pattern:
// - Add user has three field groups, so its sections live in column 2 (User details, Organisation
//   and access, Roles). The wireframe's "Role *" text field in User details is "Position" here: the
//   list shows it as a job title, and roles are assigned once, in the Roles section.
// - Add role and Add permission are short, one page each.
// Nothing turns red until the person tries to move on; the "Details missing" alert names what is
// missing. Cancel asks before discarding.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isoOf = (d: DateValue | null) => (d ? d.toString() : "");

function DiscardModal({ isOpen, onOpenChange, what, onDiscard }: { isOpen: boolean; onOpenChange: (o: boolean) => void; what: string; onDiscard: () => void }) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`Discard this ${what}?`}
      description={`What you've entered for this ${what} will be lost.`}
      confirmLabel="Discard"
      onConfirm={onDiscard}
    />
  );
}

// ---------------------------------------------------------------- role picker

/**
 * The wireframe's "Assign Roles" panel: system roles as a checklist, custom roles as a checkbox tree
 * (Department > role type > role, the real `TreeView`, which cascades a department's tick to its
 * roles), and a search that narrows the tree by department. Archived roles can't be assigned.
 */
export function RolePicker({ value, onChange, invalid }: { value: string[]; onChange: (ids: string[]) => void; invalid?: boolean }) {
  const roles = useRoles().filter((r) => r.status !== "archived");
  const system = roles.filter((r) => r.kind === "system");
  const custom = roles.filter((r) => r.kind === "custom");
  const [deptSearch, setDeptSearch] = useState("");
  const selectedSet = new Set(value);

  const departments = [...new Set(custom.map((r) => r.department!))].filter((d) => d.toLowerCase().includes(deptSearch.trim().toLowerCase()));
  const toggleSystem = (id: string, on: boolean) => onChange(on ? [...value, id] : value.filter((v) => v !== id));
  const customIds = new Set(custom.map((r) => r.id));
  const onTreeChange = (keys: Selection) => {
    const picked = keys === "all" ? [...customIds] : [...keys].map(String).filter((k) => customIds.has(k));
    onChange([...value.filter((v) => !customIds.has(v)), ...picked]);
  };

  const statusNote = (r: UmRole) => (r.status === "active" ? undefined : `${accessStatusMeta[r.status].label} role`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-primary">System roles</p>
        {system.map((r) => (
          <Checkbox key={r.id} label={r.name} hint={statusNote(r) ? `${r.description} ${statusNote(r)}.` : r.description} isSelected={selectedSet.has(r.id)} onChange={(on) => toggleSystem(r.id, on)} />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-primary">Custom roles</p>
        <div className="w-full max-w-sm">
          <Input aria-label="Search by department" size="sm" icon={SearchMd} placeholder="Search by department" value={deptSearch} onChange={setDeptSearch} />
        </div>
        {departments.length === 0 ? (
          <p className="text-sm text-tertiary">No department matches your search.</p>
        ) : (
          <TreeView
            aria-label="Custom roles"
            selectionMode="multiple"
            selectedKeys={new Set<Key>(value.filter((v) => customIds.has(v)))}
            onSelectionChange={onTreeChange}
            defaultExpandedKeys={[...departments, ...custom.map((r) => `${r.department}/${r.roleType}`)]}
          >
            {departments.map((dept) => {
              const inDept = custom.filter((r) => r.department === dept);
              const types = [...new Set(inDept.map((r) => r.roleType))];
              return (
                <TreeView.Item key={dept} id={dept} textValue={dept}>
                  <TreeView.ItemContent>{dept}</TreeView.ItemContent>
                  {types.map((type) => (
                    <TreeView.Item key={`${dept}/${type}`} id={`${dept}/${type}`} textValue={type}>
                      <TreeView.ItemContent>{type}</TreeView.ItemContent>
                      {inDept
                        .filter((r) => r.roleType === type)
                        .map((r) => (
                          <TreeView.Item key={r.id} id={r.id} textValue={r.name}>
                            <TreeView.ItemContent>{statusNote(r) ? `${r.name} (${statusNote(r)})` : r.name}</TreeView.ItemContent>
                          </TreeView.Item>
                        ))}
                    </TreeView.Item>
                  ))}
                </TreeView.Item>
              );
            })}
          </TreeView>
        )}
      </div>
      {invalid && <p className="text-sm text-error-primary">Choose at least one role</p>}
    </div>
  );
}

/** Everything the chosen roles allow, grouped by category: the wireframe's permissions preview, for all chosen roles together. */
export function PermissionPreview({ roleIds }: { roleIds: string[] }) {
  const roles = useRoles();
  const permissions = usePermissions();
  const granted = new Set(roles.filter((r) => roleIds.includes(r.id)).flatMap((r) => r.permissionIds));
  return <PermissionGroups permissions={permissions.filter((p) => granted.has(p.id))} emptyLabel="Choose a role to see what it allows." />;
}

// ---------------------------------------------------------------- add user

type UserSection = "details" | "access" | "roles";
const USER_SECTIONS: UserSection[] = ["details", "access", "roles"];
const USER_SECTION_META: Record<UserSection, { title: string; description: string }> = {
  details: { title: "User details", description: "Who the person is and how to reach them." },
  access: { title: "Organisation and access", description: "Who they work for, and when their access starts and ends." },
  roles: { title: "Roles", description: "What they can do. System roles apply across BioData SA; custom roles belong to one organisation." },
};

interface UserFormState {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  position: string;
  organisation: string | null;
  startDate: DateValue | null;
  endDate: DateValue | null;
  roleIds: string[];
}

function userProblems(s: UserFormState): Record<UserSection, string[]> {
  const details: string[] = [];
  if (!s.firstName.trim()) details.push("First name");
  if (!s.lastName.trim()) details.push("Last name");
  if (!EMAIL.test(s.email.trim())) details.push("A valid email");
  if (!s.position.trim()) details.push("Position");
  const access: string[] = [];
  if (!s.organisation) access.push("Organisation");
  if (!s.startDate) access.push("Start date");
  if (s.startDate && s.endDate && s.endDate.compare(s.startDate) < 0) access.push("An end date after the start date");
  const roles = s.roleIds.length === 0 ? ["At least one role"] : [];
  return { details, access, roles };
}

export function AddUserForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (draft: UserDraft) => void }) {
  const [s, setS] = useState<UserFormState>({
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    position: "",
    organisation: null,
    startDate: today(getLocalTimeZone()),
    endDate: null,
    roleIds: [],
  });
  const [section, setSection] = useState<UserSection>("details");
  const [visited, setVisited] = useState<Set<UserSection>>(new Set());
  const [blocked, setBlocked] = useState<Set<UserSection>>(new Set());
  const [submitPressed, setSubmitPressed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const patch = (p: Partial<UserFormState>) => {
    setS((prev) => ({ ...prev, ...p }));
    setDirty(true);
  };
  const problems = userProblems(s);
  const index = USER_SECTIONS.indexOf(section);
  const isLast = index === USER_SECTIONS.length - 1;
  const showErrors = (id: UserSection) => submitPressed || blocked.has(id);
  const err = (id: UserSection, ok: boolean) => showErrors(id) && !ok;

  const goTo = (next: UserSection) => {
    setVisited((v) => new Set(v).add(section));
    setSection(next);
  };
  const proceed = (next: UserSection) => {
    if (USER_SECTIONS.indexOf(next) > index && problems[section].length > 0) {
      setBlocked((b) => new Set(b).add(section));
      return;
    }
    goTo(next);
  };
  const submit = () => {
    setSubmitPressed(true);
    const firstBad = USER_SECTIONS.find((id) => problems[id].length > 0);
    if (firstBad) {
      setSection(firstBad);
      return;
    }
    onSubmit({
      firstName: s.firstName.trim(),
      lastName: s.lastName.trim(),
      displayName: s.displayName.trim() || undefined,
      email: s.email.trim(),
      phone: s.phone.trim() || undefined,
      position: s.position.trim(),
      organisation: s.organisation === INDIVIDUAL ? "" : (s.organisation ?? ""),
      startDate: isoOf(s.startDate),
      endDate: isoOf(s.endDate) || undefined,
      roleIds: s.roleIds,
    });
  };

  const items = USER_SECTIONS.map((id) => ({
    id,
    title: USER_SECTION_META[id].title,
    status: deriveSectionStatus({ isCurrent: id === section, isValid: problems[id].length === 0, visited: visited.has(id), attempted: showErrors(id) }),
    detail: showErrors(id) && problems[id].length > 0 && id !== section ? `${problems[id].length} to fix` : undefined,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FormSidebar>
        <FormSectionList
          heading="Add user"
          groups={[{ sections: items }]}
          progress={{ done: items.filter((i) => i.status === "complete").length, total: USER_SECTIONS.length }}
          onSelect={(id) => proceed(id as UserSection)}
        />
      </FormSidebar>
      <FormPage
        eyebrow={`Add user - Step ${index + 1} of ${USER_SECTIONS.length}`}
        title={USER_SECTION_META[section].title}
        subtitle={`${USER_SECTION_META[section].description} Fields marked * are required.`}
        onCancel={() => (dirty ? setConfirmCancel(true) : onCancel())}
        onBack={index > 0 ? () => goTo(USER_SECTIONS[index - 1]!) : undefined}
        problems={showErrors(section) && problems[section].length > 0 ? { items: problems[section] } : undefined}
        primaryLabel={isLast ? "Add user" : "Continue"}
        primaryIsContinue={!isLast}
        onPrimary={isLast ? submit : () => proceed(USER_SECTIONS[index + 1]!)}
      >
        {section === "details" && (
          <>
            <FormRow title="Name" required>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="First name" isRequired value={s.firstName} onChange={(v) => patch({ firstName: v })} isInvalid={err("details", !!s.firstName.trim())} hint={err("details", !!s.firstName.trim()) ? "Enter a first name" : undefined} />
                <Input label="Last name" isRequired value={s.lastName} onChange={(v) => patch({ lastName: v })} isInvalid={err("details", !!s.lastName.trim())} hint={err("details", !!s.lastName.trim()) ? "Enter a last name" : undefined} />
              </div>
              <Input label="Display name / alias" placeholder="Their preferred name, if different" value={s.displayName} onChange={(v) => patch({ displayName: v })} />
            </FormRow>
            <FormRow title="Contact" required>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email"
                  type="email"
                  isRequired
                  placeholder="name@organisation.org.au"
                  value={s.email}
                  onChange={(v) => patch({ email: v })}
                  isInvalid={err("details", EMAIL.test(s.email.trim()))}
                  hint={err("details", EMAIL.test(s.email.trim())) ? "Enter a valid email address" : "Their sign-in and where the invitation goes."}
                />
                <Input label="Contact no." type="tel" placeholder="+61" value={s.phone} onChange={(v) => patch({ phone: v })} />
              </div>
            </FormRow>
            <FormRow title="Position" required description="Their job title, shown beside their name. Access comes from roles, in the last section.">
              <Input aria-label="Position" isRequired placeholder="Field Officer" value={s.position} onChange={(v) => patch({ position: v })} isInvalid={err("details", !!s.position.trim())} hint={err("details", !!s.position.trim()) ? "Enter their position" : undefined} />
            </FormRow>
          </>
        )}

        {section === "access" && (
          <>
            <FormRow title="Organisation / institution" required description="Registered users with no organisation are individuals.">
              <Select
                aria-label="Organisation / institution"
                isRequired
                placeholder="Select an organisation"
                items={[...UM_ORGANISATIONS, INDIVIDUAL].map((id) => ({ id, label: id }))}
                selectedKey={s.organisation}
                onSelectionChange={(key) => patch({ organisation: key as string })}
                isInvalid={err("access", !!s.organisation)}
                hint={err("access", !!s.organisation) ? "Choose an organisation" : undefined}
              >
                {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
              </Select>
            </FormRow>
            <FormRow title="Access period" required description="Leave the end date empty for ongoing access.">
              <div className="grid gap-4 sm:grid-cols-2">
                <InputDatePicker label="Start date" isRequired value={s.startDate} onChange={(v) => patch({ startDate: v })} isInvalid={err("access", !!s.startDate)} hint={err("access", !!s.startDate) ? "Choose a start date" : undefined} />
                <InputDatePicker label="End date" value={s.endDate} onChange={(v) => patch({ endDate: v })} minValue={s.startDate ?? undefined} />
              </div>
            </FormRow>
          </>
        )}

        {section === "roles" && (
          <>
            <FormRow title="Assign roles" required>
              <RolePicker value={s.roleIds} onChange={(roleIds) => patch({ roleIds })} invalid={err("roles", s.roleIds.length > 0)} />
            </FormRow>
            <FormRow title="What they can do" description="Every permission the chosen roles give, together.">
              <PermissionPreview roleIds={s.roleIds} />
            </FormRow>
          </>
        )}
      </FormPage>
      <DiscardModal isOpen={confirmCancel} onOpenChange={setConfirmCancel} what="user" onDiscard={onCancel} />
    </div>
  );
}

// ---------------------------------------------------------------- add role

export function AddRoleForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (draft: RoleDraft) => void }) {
  const [kind, setKind] = useState<RoleKind>("custom");
  const [department, setDepartment] = useState<string | null>(null);
  const [roleType, setRoleType] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<DateValue | null>(today(getLocalTimeZone()));
  const [endDate, setEndDate] = useState<DateValue | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const touch = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setDirty(true);
  };

  const missing = [
    ...(kind === "custom" && !department ? ["Department"] : []),
    ...(!roleType.trim() ? ["Role type"] : []),
    ...(!name.trim() ? ["Role name"] : []),
    ...(!startDate ? ["Start date"] : []),
    ...(!description.trim() ? ["Role description"] : []),
  ];
  const bad = (ok: boolean) => attempted && !ok;

  const submit = () => {
    setAttempted(true);
    if (missing.length) return;
    onSubmit({
      kind,
      department: kind === "custom" ? (department ?? undefined) : undefined,
      roleType: roleType.trim(),
      name: name.trim(),
      description: description.trim(),
      startDate: isoOf(startDate),
      endDate: isoOf(endDate) || undefined,
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FormPage
        title="Add role"
        subtitle="A new role starts with no permissions. A start date ahead schedules it. Fields marked * are required."
        onCancel={() => (dirty ? setConfirmCancel(true) : onCancel())}
        problems={attempted && missing.length ? { items: missing } : undefined}
        primaryLabel="Add role"
        onPrimary={submit}
      >
        <FormRow title="Role details" required description="A system role applies across BioData SA; a custom role belongs to one department.">
          <RadioGroup aria-label="Role kind" orientation="horizontal" value={kind} onChange={(v) => touch(setKind)(v as RoleKind)}>
            <RadioButton value="system" label="System role" />
            <RadioButton value="custom" label="Custom role" />
          </RadioGroup>
          {kind === "custom" && (
            <Select
              label="Department"
              isRequired
              placeholder="Select department"
              items={UM_ORGANISATIONS.map((id) => ({ id, label: id }))}
              selectedKey={department}
              onSelectionChange={(key) => touch(setDepartment)(key as string)}
              isInvalid={bad(!!department)}
              hint={bad(!!department) ? "Choose a department" : undefined}
            >
              {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
            </Select>
          )}
          <Input
            label="Role type"
            isRequired
            placeholder="Data Submission"
            value={roleType}
            onChange={touch(setRoleType)}
            isInvalid={bad(!!roleType.trim())}
            hint={bad(!!roleType.trim()) ? "Enter a role type" : "The group the role sits in, e.g. Data Submission or Administration."}
          />
        </FormRow>
        <FormRow title="Role" required>
          <Input label="Role name" isRequired placeholder="Reviewer" value={name} onChange={touch(setName)} isInvalid={bad(!!name.trim())} hint={bad(!!name.trim()) ? "Enter a role name" : undefined} />
          <TextArea
            label="Role description"
            isRequired
            rows={3}
            placeholder="What people with this role do"
            value={description}
            onChange={touch(setDescription)}
            isInvalid={bad(!!description.trim())}
            hint={bad(!!description.trim()) ? "Describe the role" : undefined}
          />
        </FormRow>
        <FormRow title="Active period" required description="Leave the end date empty for a role with no end.">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputDatePicker label="Start date" isRequired value={startDate} onChange={touch(setStartDate)} isInvalid={bad(!!startDate)} hint={bad(!!startDate) ? "Choose a start date" : undefined} />
            <InputDatePicker label="End date" value={endDate} onChange={touch(setEndDate)} minValue={startDate ?? undefined} />
          </div>
        </FormRow>
      </FormPage>
      <DiscardModal isOpen={confirmCancel} onOpenChange={setConfirmCancel} what="role" onDiscard={onCancel} />
    </div>
  );
}

// ---------------------------------------------------------------- add permission

const NEW_CATEGORY = "__new__";

export function AddPermissionForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (drafts: PermissionDraft[]) => void }) {
  const categories = permissionCategories(usePermissions());
  const [category, setCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [entries, setEntries] = useState([{ key: 1, name: "", description: "" }]);
  const [startDate, setStartDate] = useState<DateValue | null>(today(getLocalTimeZone()));
  const [endDate, setEndDate] = useState<DateValue | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const categoryValue = category === NEW_CATEGORY ? newCategory.trim() : (category ?? "");
  const missing = [
    ...(!categoryValue ? ["Category"] : []),
    ...(entries.some((e) => !e.name.trim()) ? ["Permission name"] : []),
    ...(entries.some((e) => !e.description.trim()) ? ["Description"] : []),
    ...(!startDate ? ["Start date"] : []),
  ];
  const bad = (ok: boolean) => attempted && !ok;
  const update = (key: number, p: Partial<{ name: string; description: string }>) => {
    setEntries((list) => list.map((e) => (e.key === key ? { ...e, ...p } : e)));
    setDirty(true);
  };

  const submit = () => {
    setAttempted(true);
    if (missing.length) return;
    onSubmit(
      entries.map((e) => ({
        category: categoryValue,
        name: e.name.trim(),
        description: e.description.trim(),
        startDate: isoOf(startDate),
        endDate: isoOf(endDate) || undefined,
      })),
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FormPage
        title="Add permission"
        subtitle="Add one permission, or several in the same category. A start date ahead schedules them. Fields marked * are required."
        onCancel={() => (dirty ? setConfirmCancel(true) : onCancel())}
        problems={attempted && missing.length ? { items: missing } : undefined}
        primaryLabel={entries.length > 1 ? `Add ${entries.length} permissions` : "Add permission"}
        onPrimary={submit}
      >
        <FormRow title="Category" required description="Permissions are grouped by category wherever they're listed.">
          <Select
            aria-label="Category"
            isRequired
            placeholder="Select a category"
            items={[...categories.map((id) => ({ id, label: id })), { id: NEW_CATEGORY, label: "New category" }]}
            selectedKey={category}
            onSelectionChange={(key) => {
              setCategory(key as string);
              setDirty(true);
            }}
            isInvalid={bad(!!category)}
            hint={bad(!!category) ? "Choose a category" : undefined}
          >
            {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
          </Select>
          {category === NEW_CATEGORY && (
            <Input
              label="Category name"
              isRequired
              placeholder="Specimen Data"
              value={newCategory}
              onChange={(v) => {
                setNewCategory(v);
                setDirty(true);
              }}
              isInvalid={bad(!!newCategory.trim())}
              hint={bad(!!newCategory.trim()) ? "Name the new category" : undefined}
            />
          )}
        </FormRow>
        <FormRow title="Permissions" required>
          {entries.map((e, i) => (
            <div key={e.key} className="flex flex-col gap-4 rounded-lg border border-secondary p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-primary">Permission {i + 1}</p>
                {entries.length > 1 && (
                  <Button
                    color="link-destructive"
                    size="sm"
                    iconLeading={Trash01}
                    onPress={() => {
                      setEntries((list) => list.filter((x) => x.key !== e.key));
                      setDirty(true);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Input label="Permission name" isRequired placeholder="Read Datasets" value={e.name} onChange={(v) => update(e.key, { name: v })} isInvalid={bad(!!e.name.trim())} hint={bad(!!e.name.trim()) ? "Enter a permission name" : undefined} />
              <Input
                label="Description"
                isRequired
                placeholder="Access public biodiversity datasets"
                value={e.description}
                onChange={(v) => update(e.key, { description: v })}
                isInvalid={bad(!!e.description.trim())}
                hint={bad(!!e.description.trim()) ? "Enter a short description" : undefined}
              />
            </div>
          ))}
          <div>
            <Button
              color="link-color"
              size="sm"
              iconLeading={Plus}
              onPress={() => {
                setEntries((list) => [...list, { key: Math.max(...list.map((x) => x.key)) + 1, name: "", description: "" }]);
                setDirty(true);
              }}
            >
              Add another permission
            </Button>
          </div>
        </FormRow>
        <FormRow title="Active period" required description="Leave the end date empty for a permission with no end.">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputDatePicker
              label="Start date"
              isRequired
              value={startDate}
              onChange={(v) => {
                setStartDate(v);
                setDirty(true);
              }}
              isInvalid={bad(!!startDate)}
              hint={bad(!!startDate) ? "Choose a start date" : undefined}
            />
            <InputDatePicker
              label="End date"
              value={endDate}
              onChange={(v) => {
                setEndDate(v);
                setDirty(true);
              }}
              minValue={startDate ?? undefined}
            />
          </div>
        </FormRow>
      </FormPage>
      <DiscardModal isOpen={confirmCancel} onOpenChange={setConfirmCancel} what="permission" onDiscard={onCancel} />
    </div>
  );
}
