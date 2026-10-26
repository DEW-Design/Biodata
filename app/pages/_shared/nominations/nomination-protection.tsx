"use client";

import { useState } from "react";
import { Map01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { EmbeddedTable } from "@/app/pages/_shared/embedded-table";
import { AreasMap } from "@/app/pages/_shared/nominations/nomination-areas";
import { areaMethodLabel, attributeLabel, attributeValueLabel, kindOf, locationArea, removalKey, type Nomination, type NominationArea } from "@/app/pages/_shared/nominations/nomination-data";
import { AccessSelect, RiskBadge, RiskSelect } from "@/app/pages/_shared/nominations/nomination-rating-fields";
import { STANDARD_ACCESS, accessLevelMeta, areaRatingKey, releaseRiskMeta, type Rating } from "@/app/pages/_shared/nominations/nomination-rating";
import { geoExtentSummary } from "@/app/pages/project-registration/geo-extent-picker";

// What a nomination protects, as read: a table (the designer, 14 Oct 2026: "can you create a table version. the card view makes it
// look like reason is the main subject here", then "lets go with the table"; the cards grouped by reason were deleted). One row per
// thing protected, in the order chosen, the attribute first (the row header), then what is protected, its reason (always written
// out: "the reason must be displayed everytime"), and for admins the data release risk and user access level, each its own
// column. A Location has a row per area: each area has its own reason and its own rating ("location can be rated per area"). An
// embedded table (4.2): the page scrolls, it is paged. While an admin rates (the record under review) the two selects sit in the
// rating columns. Used by the record page (version 3) and the form's Review step.
// The accepted restrictions the nomination asks to change (25 Oct 2026) follow what it sets, one row each: the restriction's
// nomination id marked "Change requested", then where and what it restricts now. The main reason covers it; it is not rated.

type Subject = Pick<Nomination, "kind" | "speciesId" | "scope" | "attributes" | "justification" | "location" | "ratings" | "removals">;

interface Entry {
  /** The rating key (`nominationRatingKeys`): "species", "location", an attribute's id, or an area's key. */
  key: string;
  title: string;
  value: string;
  reason: string;
  areas?: NominationArea[];
  /** A location nomination's area is the subject itself: its map is open from the start. */
  mapOpen?: boolean;
  /** An accepted restriction this nomination asks to change: its nomination's id. */
  removeFrom?: string;
}

/** Every protected item in the order chosen, with its reason (its own, or the nomination's main reason). */
export function protectionEntries(n: Subject): Entry[] {
  const main = n.justification.trim();
  if (kindOf(n) === "location") {
    const place = n.location ? locationArea(n.location) : null;
    return [
      {
        key: "location",
        title: n.location?.name.trim() || "Location not named",
        value: n.location ? `Everything recorded here. ${geoExtentSummary(n.location.extent)}` : "Everything recorded here",
        reason: main,
        areas: place ? [place] : undefined,
        mapOpen: true,
      },
    ];
  }
  const removed = (n.removals ?? []).map((r): Entry => ({ key: removalKey(r.key), title: r.key, value: r.summary, reason: main, removeFrom: r.key }));
  if (n.scope === "all") return [{ key: "species", title: "All data", value: "Every record of the species, and everything recorded with it", reason: main }, ...removed];
  const added = n.attributes.flatMap((a): Entry[] => {
    if (!a.attribute) return [];
    if (a.attribute === "location")
      return a.areas.map((area) => ({ key: areaRatingKey(a.id, area.id), title: attributeLabel(a), value: "", reason: (area.justification ?? main).trim(), areas: [area] }));
    return [{ key: String(a.id), title: attributeLabel(a), value: attributeValueLabel(a), reason: (a.justification ?? main).trim() }];
  });
  return [...added, ...removed];
}

function AreasLine({ areas, mapOpen = false }: { areas: NominationArea[]; mapOpen?: boolean }) {
  const [showMap, setShowMap] = useState(mapOpen);
  return (
    <div className="flex flex-col gap-2">
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {areas.map((area) => (
          <li key={area.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-secondary">{area.name}</span>
            <Badge size="sm" color="gray">
              {areaMethodLabel(area)}
            </Badge>
          </li>
        ))}
      </ul>
      <div>
        <Button color="link-gray" size="sm" iconLeading={Map01} onPress={() => setShowMap((v) => !v)}>
          {showMap ? "Hide map" : "View on map"}
        </Button>
      </div>
      {showMap && <AreasMap areas={areas} className="h-56" />}
    </div>
  );
}

function Protected({ entry }: { entry: Entry }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {entry.value && <span className="text-sm text-secondary">{entry.value}</span>}
      {entry.areas && entry.areas.length > 0 && <AreasLine areas={entry.areas} mapOpen={entry.mapOpen} />}
    </div>
  );
}

/** One half of a rating as read: the risk badge and its treatment, or the access level. */
function RatingPart({ rating, part }: { rating?: Rating; part: "risk" | "access" }) {
  if (!rating) return part === "risk" ? <span className="text-sm text-tertiary">Not rated</span> : null;
  if (part === "access") return <span className="text-sm text-primary">{accessLevelMeta[rating.access].label}</span>;
  return (
    <span className="flex flex-col items-start gap-1 text-sm">
      <RiskBadge risk={rating.risk} />
      <span className="text-tertiary">{releaseRiskMeta[rating.risk].short}</span>
    </span>
  );
}

export function ProtectionView({
  nomination: n,
  showRatings,
  rate,
}: {
  nomination: Subject;
  /** Admins and above see each item's rating. */
  showRatings: boolean;
  /** While an admin rates (the record under review): the fields replace the read rating. */
  rate?: { onChange: (key: string, rating: Rating) => void; showErrors: boolean };
}) {
  const entries = protectionEntries(n);
  const ratings = n.ratings ?? {};

  if (entries.length === 0) return <p className="text-sm text-tertiary">No attributes chosen yet</p>;

  const risk = (e: Entry) => {
    if (e.removeFrom) return null;
    const value = ratings[e.key];
    if (!rate) return <RatingPart rating={value} part="risk" />;
    return (
      <RiskSelect
        size="sm"
        showHint={false}
        value={value?.risk ?? null}
        isInvalid={rate.showErrors && !value}
        onChange={(r) => rate.onChange(e.key, { risk: r, access: STANDARD_ACCESS[r] })}
      />
    );
  };
  const access = (e: Entry) => {
    if (e.removeFrom) return null;
    const value = ratings[e.key];
    if (!rate) return <RatingPart rating={value} part="access" />;
    return <AccessSelect size="sm" showHint={false} risk={value?.risk ?? null} value={value?.access ?? null} onChange={(a) => value && rate.onChange(e.key, { ...value, access: a })} />;
  };

  const rows = entries.map((e) => ({ ...e, id: e.key }));
  const w = showRatings
    ? { item: "w-[16%]", value: "w-[22%]", reason: "w-[30%]", risk: "w-[15%]", access: "w-[17%]" }
    : { item: "w-[20%]", value: "w-[30%]", reason: "w-[50%]", risk: "", access: "" };

  // The basic table while every row fits one page, the paged card past that (4.2h).
  return (
    <EmbeddedTable
      ariaLabel="What this nomination protects"
      minWidth={showRatings ? "min-w-[1040px]" : "min-w-[720px]"}
      columns={[
        { id: "item", label: "Attribute", className: w.item, isRowHeader: true },
        { id: "value", label: "Protected", className: w.value },
        { id: "reason", label: "Reason", className: w.reason },
        ...(showRatings
          ? [
              { id: "risk", label: "Data release risk", className: w.risk },
              { id: "access", label: "User access level", className: w.access },
            ]
          : []),
      ]}
      rows={rows}
      cell={(row, column) => {
        if (column === "item")
          return (
            <span className="flex flex-col items-start gap-1">
              <span className="text-sm font-medium text-primary">{row.title}</span>
              {row.removeFrom && (
                <Badge size="sm" color="blue">
                  Change requested
                </Badge>
              )}
            </span>
          );
        if (column === "value") return <Protected entry={row} />;
        if (column === "reason") return <p className={row.reason ? "text-sm whitespace-pre-line text-secondary" : "text-sm text-quaternary"}>{row.reason || "Not provided"}</p>;
        if (column === "risk") return risk(row);
        return access(row);
      }}
    />
  );
}
