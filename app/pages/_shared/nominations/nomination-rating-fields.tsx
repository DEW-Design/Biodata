"use client";

import { Badge } from "@/components/base/badges/badges";
import { Select } from "@/components/base/select/select";
import {
  ACCESS_LEVEL_ORDER,
  OPEN,
  RELEASE_RISK_ORDER,
  STANDARD_ACCESS,
  accessLevelMeta,
  isAccessAllowed,
  releaseRiskMeta,
  ruleLabel,
  type AccessLevel,
  type Rating,
  type ReleaseRisk,
  type SpeciesRating,
} from "@/app/pages/_shared/nominations/nomination-rating";

// The risk badge and the two selects, used where a nomination is rated (its record page while under review, the form's Review
// step), and a rating as read. Choosing a risk sets the level to its standard one; a level below the standard cannot be chosen
// (nomination-rating.ts).
// Each risk option carries its treatment (Obfuscated 1 km², Embargo / withheld ...), in the list and in the closed field.

export function RiskBadge({ risk }: { risk: ReleaseRisk }) {
  return (
    <Badge size="sm" color={releaseRiskMeta[risk].badgeColor}>
      {releaseRiskMeta[risk].label}
    </Badge>
  );
}

export function RiskSelect({
  value,
  onChange,
  label,
  showHint = true,
  size = "md",
  isInvalid,
}: {
  value: ReleaseRisk | null;
  onChange: (risk: ReleaseRisk) => void;
  /** Without a label the field is named by its placeholder (a row of fields, the bulk bar). */
  label?: string;
  showHint?: boolean;
  size?: "sm" | "md";
  isInvalid?: boolean;
}) {
  return (
    <Select
      label={label}
      aria-label={label ? undefined : "Data release risk"}
      placeholder="Data release risk"
      size={size}
      items={RELEASE_RISK_ORDER.map((id) => ({ id, label: releaseRiskMeta[id].label, supportingText: releaseRiskMeta[id].short }))}
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as ReleaseRisk)}
      isInvalid={isInvalid}
      // The field already says the treatment (Obfuscated 1 km² ...); the hint adds only what it leaves out.
      hint={showHint && (value === "low" || value === "medium") ? "Location text is generalised as well." : undefined}
    >
      {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
    </Select>
  );
}

export function AccessSelect({
  risk,
  value,
  onChange,
  label,
  showHint = true,
  size = "md",
}: {
  risk: ReleaseRisk | null;
  value: AccessLevel | null;
  onChange: (access: AccessLevel) => void;
  label?: string;
  showHint?: boolean;
  size?: "sm" | "md";
}) {
  const standard = risk ? STANDARD_ACCESS[risk] : null;
  return (
    <Select
      label={label}
      aria-label={label ? undefined : "User access level"}
      placeholder="User access level"
      size={size}
      isDisabled={!risk}
      items={ACCESS_LEVEL_ORDER.map((id) => ({ id, label: accessLevelMeta[id].label, isDisabled: !!risk && !isAccessAllowed(risk, id) }))}
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as AccessLevel)}
      hint={
        showHint && risk && value
          ? standard && standard !== "level-1"
            ? `Seen as held by ${accessLevelMeta[value].who}. ${releaseRiskMeta[risk].label} risk can't go below ${accessLevelMeta[standard].label}.`
            : `Seen as held by ${accessLevelMeta[value].who}.`
          : undefined
      }
    >
      {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
    </Select>
  );
}

/** One rating as read: the badge and level, then the treatment and who sees it as held. */
export function RatingValue({ rating }: { rating: Rating }) {
  return (
    <span className="flex flex-col items-start gap-1">
      <span className="flex flex-wrap items-center gap-2">
        <RiskBadge risk={rating.risk} />
        <span>{accessLevelMeta[rating.access].label}</span>
      </span>
      <span className="text-tertiary">
        {releaseRiskMeta[rating.risk].treatment}. Seen as held by {accessLevelMeta[rating.access].who}.
      </span>
    </span>
  );
}

/** The species' current rating in one value: what an admin reviewing a nomination checks it against. */
export function CurrentRatingValue({ rating }: { rating: SpeciesRating }) {
  if (rating.appliesTo === "species")
    return (
      <span className="flex flex-col gap-1">
        <span>Whole species</span>
        <RatingValue rating={rating} />
      </span>
    );
  return (
    <div className="flex flex-col gap-3">
      {rating.attributes.map((a) => (
        <span key={a.id} className="flex flex-col gap-1">
          <span>{ruleLabel(a)}</span>
          <RatingValue rating={a} />
        </span>
      ))}
      <span className="text-tertiary">
        Every other attribute: {releaseRiskMeta[OPEN.risk].label}, {accessLevelMeta[OPEN.access].label}
      </span>
    </div>
  );
}
