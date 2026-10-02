"use client";

import { useState } from "react";
import type { Key } from "react-aria-components";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { ComboBox } from "@/components/base/select/combobox";
import { SelectItem, SelectSection } from "@/components/base/select/select-item";
import { Tag, TagGroup, TagList } from "@/components/base/tags/tags";
import { ABOUT } from "@/app/pages/_shared/notifications/nt-data";
import type { RecipientOption } from "@/app/pages/_shared/notifications/nt-directory";

// One field for who an email goes to, read like the To line of an email: the chosen recipients as
// tags (remove with their X), and a search below that adds one at a time. It replaces the separate
// role and people multi-selects and the mixed role-or-person CC list (the designer, 1 Oct 2026:
// "picking roles and users is very counter-intuitive").
//
// Built for thousands of people: nothing is listed until it matters. Down with nothing typed offers the
// person the event is about and the roles (a short list); people are found by typing, at most
// PEOPLE_LIMIT at a time with the number of further matches, so the list never becomes a scroll
// through everyone. The pattern is the header's global search (sections with counts, a capped list).

const PEOPLE_LIMIT = 8;
const PROMPT_ID = "__prompt";

export function RecipientField({
  label,
  value,
  onChange,
  roles,
  people,
  about,
  labelOf,
  isRequired,
  isInvalid,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (keys: string[]) => void;
  roles: RecipientOption[];
  people: RecipientOption[];
  /** The event's "the submitter", when the event has a person it is about. */
  about?: string;
  labelOf: (key: string) => string;
  isRequired?: boolean;
  isInvalid?: boolean;
  hint?: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const chosen = new Set(value);
  const matches = (o: RecipientOption) => !q || o.label.toLowerCase().includes(q) || (o.detail ?? "").toLowerCase().includes(q);

  const aboutShown = !!about && !chosen.has(ABOUT) && (!q || about.toLowerCase().includes(q));
  const roleMatches = roles.filter((o) => !chosen.has(o.id) && matches(o));
  const peopleMatches = q ? people.filter((o) => !chosen.has(o.id) && matches(o)) : [];
  const shownPeople = peopleMatches.slice(0, PEOPLE_LIMIT);
  const morePeople = peopleMatches.length - shownPeople.length;
  const nothing = !aboutShown && roleMatches.length === 0 && peopleMatches.length === 0;

  const add = (key: Key | null) => {
    if (key == null || key === PROMPT_ID) return;
    onChange([...value, String(key)]);
    setQuery("");
  };
  const detailOf = (key: string) => (key === ABOUT ? "From the event" : key.startsWith("role:") ? "Role" : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      <Label isRequired={isRequired} isInvalid={isInvalid}>
        {label}
      </Label>
      {value.length > 0 && (
        <TagGroup label={`${label} recipients`} size="md" onRemove={(keys) => onChange(value.filter((k) => !keys.has(k)))}>
          <TagList className="flex flex-wrap gap-1.5 pb-1">
            {value.map((key) => (
              <Tag key={key} id={key} onClose={() => onChange(value.filter((k) => k !== key))}>
                {detailOf(key) === "Role" ? `${labelOf(key)} (role)` : labelOf(key).charAt(0).toUpperCase() + labelOf(key).slice(1)}
              </Tag>
            ))}
          </TagList>
        </TagGroup>
      )}
      <ComboBox
        aria-label={`Add to ${label}`}
        placeholder={value.length ? "Type to add another role or person" : "Type a role or a person's name"}
        shortcut={false}
        // Opens as you type, or with Down, as an email client's To field does. Opening on focus (the
        // ComboBox default) reopened the list after every pick, over Add CC and the controls below.
        menuTrigger="input"
        defaultFilter={() => true}
        inputValue={query}
        onInputChange={setQuery}
        selectedKey={null}
        onSelectionChange={add}
        isInvalid={isInvalid}
      >
        {nothing ? (
          <SelectItem key={`none:${q}`} id={PROMPT_ID} label={q ? `No role or person matches "${query.trim()}"` : "Everyone is already added"} isDisabled />
        ) : (
          <>
            {aboutShown && (
              <SelectSection key={`about:${q}`} title="From the event">
                <SelectItem id={ABOUT} label={about.charAt(0).toUpperCase() + about.slice(1)} supportingText="Whoever the event is about" />
              </SelectSection>
            )}
            {roleMatches.length > 0 && (
              <SelectSection key={`roles:${q}`} title="Roles" count={roleMatches.length}>
                {roleMatches.map((o) => (
                  <SelectItem key={o.id} id={o.id} label={o.label} supportingText={o.detail} highlight={query.trim()} />
                ))}
              </SelectSection>
            )}
            {q ? (
              shownPeople.length > 0 && (
                <SelectSection key={`people:${q}`} title="People" count={peopleMatches.length}>
                  {shownPeople.map((o) => (
                    <SelectItem key={o.id} id={o.id} label={o.label} supportingText={o.detail} highlight={query.trim()} />
                  ))}
                  {morePeople > 0 && <SelectItem key={`more:${q}`} id={PROMPT_ID} label={`${morePeople.toLocaleString()} more match. Keep typing to narrow them down.`} isDisabled />}
                </SelectSection>
              )
            ) : (
              <SelectSection key="people:" title="People" count={people.length}>
                <SelectItem id={PROMPT_ID} label={`Type a name or organisation to find one of ${people.length.toLocaleString()} people`} isDisabled />
              </SelectSection>
            )}
          </>
        )}
      </ComboBox>
      {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
    </div>
  );
}
