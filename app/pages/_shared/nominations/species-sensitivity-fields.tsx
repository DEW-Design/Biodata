"use client";

import { Badge } from "@/components/base/badges/badges";
import { Select } from "@/components/base/select/select";
import {
  ACCESS_LEVEL_ORDER,
  RELEASE_RISK_ORDER,
  STANDARD_ACCESS,
  accessLevelMeta,
  isAccessAllowed,
  releaseRiskMeta,
  type AccessLevel,
  type ReleaseRisk,
} from "@/app/pages/_shared/nominations/species-sensitivity";

// The risk badge and the two selects, used by the species sensitivity list (bulk change) and a species' page (editing).
// Choosing a risk sets the level to its standard one; a level below the standard cannot be chosen (species-sensitivity.ts).
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
