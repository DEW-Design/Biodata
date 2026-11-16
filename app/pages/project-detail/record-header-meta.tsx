"use client";

// Under a record's name, in the full view's and the side panel's header (designer, 9 Nov 2026: "On all the header, somehow show
// the parent ID, Name and Date and time"): what the record belongs to, as its ID then its name, and when it started. A record at
// the top of the tree (a site) belongs to the project, so the project is its parent. A site has no date of its own, so it shows
// no date. The time is the record's Start time (Temporal details), shown when it has one.
//
// A label before its value, side by side, as the landscape scores' IBRA association and subregion read (text-sm, the label
// tertiary, the value primary); an identifier before its name takes a hyphen (CONTRACTS 2.3).

import { useEditStore } from "./edit-store";
import { hasDateField } from "./field-schema";
import { formatDate, formatTime, startTimeOf, type SurveyRecord } from "./survey-data";

export function RecordHeaderMeta({ record }: { record: SurveyRecord }) {
  const store = useEditStore();
  const parent = store.recordById(record.parentId);
  const parentText = parent ? `${parent.code} - ${parent.name}` : `${store.meta.code} - ${store.project.details.shortTitle}`;
  const time = startTimeOf(record);
  const dated = hasDateField(record) && !!record.date;
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      <div className="flex min-w-0 gap-1.5">
        <dt className="shrink-0 text-tertiary">Parent</dt>
        <dd className="min-w-0 text-balance text-primary">{parentText}</dd>
      </div>
      {dated && (
        <div className="flex gap-1.5">
          <dt className="shrink-0 text-tertiary">{time ? "Start date and time" : "Start date"}</dt>
          <dd className="text-primary tabular-nums">
            {formatDate(record.date)}
            {time && `, ${formatTime(time)}`}
          </dd>
        </div>
      )}
    </dl>
  );
}
