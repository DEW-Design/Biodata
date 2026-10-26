"use client";

// What a project contact can do on the project, asked the same way wherever it is set: on each contact card in Add Project's
// Project contacts, and in each row of the project page's Project access tab (both explored in `/proto/project-access`). A
// Project Manager always has full control, so their field is shown, locked, with the reason as its hint.

import { Select } from "@/components/base/select/select";
import { accessOf, PROJECT_ACCESS_OPTIONS, PROJECT_MANAGER_ROLE } from "./data";
import type { ProjectAccessLevel, ProjectContact } from "./types";

// The levels' lines are shown in the menu only: the trigger shows the chosen level's name alone, so it is never cut off in a
// table cell (the Select trigger prints an item's `supportingText` beside its label).
const ITEMS = PROJECT_ACCESS_OPTIONS.map(({ id, label }) => ({ id, label }));
const DESCRIPTION = Object.fromEntries(PROJECT_ACCESS_OPTIONS.map((o) => [o.id, o.supportingText])) as Record<ProjectAccessLevel, string>;

export function ProjectAccessSelect({
    person,
    onChange,
    isDisabled = false,
    size = "md",
    showLabel = true,
}: {
    person: Pick<ProjectContact, "role" | "access" | "firstName" | "lastName">;
    onChange: (access: ProjectAccessLevel) => void;
    /** Read only for someone who cannot change access (only a Project Manager or a BioData Admin can). */
    isDisabled?: boolean;
    size?: "sm" | "md";
    /** False in a table row, whose column header is the label. */
    showLabel?: boolean;
}) {
    const isManager = person.role === PROJECT_MANAGER_ROLE;
    const name = `${person.firstName} ${person.lastName}`.trim() || "this person";
    return (
        <Select
            size={size}
            label={showLabel ? "Project access" : undefined}
            aria-label={showLabel ? undefined : `Project access for ${name}`}
            hint={showLabel && isManager ? "Project Managers always have full control." : undefined}
            items={ITEMS}
            selectedKey={accessOf(person)}
            onSelectionChange={(key) => onChange(key as ProjectAccessLevel)}
            isDisabled={isDisabled || isManager}
        >
            {(item) => <Select.Item {...item} supportingText={DESCRIPTION[item.id as ProjectAccessLevel]} />}
        </Select>
    );
}
