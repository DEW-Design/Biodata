"use client";

import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { REPORT_WIDTH as W, emptyColumn, numberColumn, textColumn, type ReportWidth, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { formatShortDate } from "@/app/pages/_shared/user-management/um-data";

// What the administration reports (User, Role, User - Role, Permission, Role - Permission, Notification config and Control vocab detail
// reports) have in common: a day as the report writes it, a day column that sorts by the day and not by its words, the columns that say who
// made a record and when, and the two kinds of Filter attribute they use (a list chosen from what the rows hold, a date).

/** The day part of an ISO day or date and time. */
export const dayOf = (iso: string | undefined) => (iso ? iso.slice(0, 10) : "");

/** A day as the app writes it ("4 Aug 2026"), or empty. */
export const dayText = (iso: string | undefined) => (iso ? formatShortDate(dayOf(iso)) : "");

/** A column of days: tabular like a number, and sorted by the day itself. */
export function dayColumn<R>(id: string, label: string, width: ReportWidth, iso: (row: R) => string | undefined): ViewColumn<R> {
  return { ...numberColumn<R>(id, label, width, (r) => dayText(iso(r))), sort: (r) => dayOf(iso(r)) || null };
}

/** A column whose value is a sequence number, pinned at the left while the table scrolls sideways. */
export const seqColumn = <R extends { seq: number }>(): ViewColumn<R> => numberColumn<R>("seq", "Seq#", W.xs, (r) => r.seq, { sticky: true });

/**
 * Who created a record and who last changed it, and when. A record that keeps its own history (a notification, a controlled vocabulary) passes the
 * values; one that does not (User Management's users, roles and permissions keep only the day they were last updated) passes only Modified on, and
 * the other three are left empty rather than made up (CONTRACTS 0.3).
 */
export function stampColumns<R>(stamp: { createdBy?: (r: R) => string | undefined; createdOn?: (r: R) => string | undefined; modifiedBy?: (r: R) => string | undefined; modifiedOn?: (r: R) => string | undefined }): ViewColumn<R>[] {
  const who = (id: string, label: string, get: ((r: R) => string | undefined) | undefined) => (get ? textColumn<R>(id, label, W.md, get) : emptyColumn<R>(id, label, W.md));
  const when = (id: string, label: string, get: ((r: R) => string | undefined) | undefined) => (get ? dayColumn<R>(id, label, W.md, get) : emptyColumn<R>(id, label, W.md));
  return [who("createdBy", "Created by", stamp.createdBy), when("createdOn", "Created on", stamp.createdOn), who("modifiedBy", "Modified by", stamp.modifiedBy), when("modifiedOn", "Modified on", stamp.modifiedOn)];
}

/** A Filter attribute that lists the values the rows hold. Left out when no row holds a value, so the menu never offers a choice that is empty. */
export function optionsAttribute<R>(id: string, label: string, rows: R[], get: (row: R) => string | string[], options: { searchable?: boolean } = {}): Attribute<R>[] {
  const choices = optionsFromValues(rows.flatMap((r) => [get(r)].flat()));
  return choices.length > 0 ? [{ id, kind: "options", label, options: choices, get, searchable: options.searchable }] : [];
}

/** A Filter attribute for a day: a row is in a range when its day is. A row with no day is in no range. */
export function dayAttribute<R>(id: string, label: string, iso: (row: R) => string | undefined): Attribute<R> {
  return {
    id,
    kind: "date",
    label,
    get: (r) => {
      const day = dayOf(iso(r));
      return day ? { start: Date.parse(`${day}T00:00:00`), end: Date.parse(`${day}T23:59:59`) } : null;
    },
  };
}

/** A Filter attribute for a span of days (a role's or a vocabulary's valid period): a row with no end is still open. */
export function periodAttribute<R>(id: string, label: string, start: (row: R) => string | undefined, end: (row: R) => string | undefined): Attribute<R> {
  return {
    id,
    kind: "date",
    label,
    get: (r) => {
      const from = dayOf(start(r));
      if (!from) return null;
      const to = dayOf(end(r));
      return { start: Date.parse(`${from}T00:00:00`), end: to ? Date.parse(`${to}T23:59:59`) : null };
    },
  };
}

/** How many different values a column holds, as the report's own figure. */
export const distinct = <R,>(rows: R[], get: (row: R) => string) => new Set(rows.map(get).filter(Boolean)).size.toLocaleString("en-AU");
