"use client";

// The "?" beside a concept's name on an ingested record (designer, 10 Nov 2026: "On hover: Control vocab + Definitions", on the ingestion engine page first, before it is folded
// into the product). Hovering or focusing it shows what the concept is read against in the Controlled Vocabulary: the vocabulary's own definition and the values it offers, each
// with its meaning. Nothing here is written for the tooltip: every word is the vocabulary's (0.3). A concept with no vocabulary of the same name has no "?" (2.12); that is a gap
// in the vocabularies, not here, and it is listed in the decision file for the business to fill.
//
// Composed from the design system's own `Tooltip` and `TooltipTrigger` and the same help icon the form `Label` draws (`components/base/input/label.tsx`), so it reads and behaves
// as that one does (keyboard, 40px target, focus ring).

import { useMemo } from "react";
import { HelpCircle } from "@untitledui/icons";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cvStatus, resolvedEntries, type Cv } from "@/app/pages/_shared/ctrl-vocab/cv-data";
import { useCvs } from "@/app/pages/_shared/ctrl-vocab/cv-store";

// The values shown before "and N more": a tooltip is a glance, the vocabulary itself is the full list.
const VALUES_SHOWN = 6;

// "Location Method & Desc" and "Disturbance Impact (Code & Desc)" are the concept "Location Method" and "Disturbance Impact": the code and its description are one concept.
const conceptKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/\(code & desc\)|& desc/g, "")
    .replace(/[^a-z0-9]/g, "");

/** The vocabulary a concept is read against: the one with the same name. Never a near match, so a link is never a guess. */
export function vocabularyFor(concept: string, cvs: Cv[]): Cv | undefined {
  const key = conceptKey(concept);
  if (!key) return undefined;
  return cvs.find((cv) => cv.state !== "draft" && conceptKey(cv.name) === key);
}

export function ConceptHelp({ concept }: { concept: string }) {
  const cvs = useCvs();
  const cv = useMemo(() => vocabularyFor(concept, cvs), [concept, cvs]);
  if (!cv) return null;

  const entries = resolvedEntries(cv).filter((e) => e.status === "active");
  const shown = entries.slice(0, VALUES_SHOWN);
  const numbered = cv.idKind === "number";
  const archived = cvStatus(cv) === "archived";

  return (
    <Tooltip
      title={cv.name}
      placement="top"
      description={
        <span className="flex flex-col gap-1.5">
          <span>{cv.description || "Controlled vocabulary"}</span>
          {shown.length > 0 && (
            <span className="flex flex-col gap-0.5">
              {shown.map((e) => (
                <span key={e.id}>{numbered || !e.code ? e.name : e.name ? `${e.code} - ${e.name}` : e.code}</span>
              ))}
              {entries.length > shown.length && <span>{`and ${entries.length - shown.length} more`}</span>}
            </span>
          )}
          {archived && <span>Archived</span>}
        </span>
      }
    >
      <TooltipTrigger aria-label={`About ${concept}`} className="cursor-pointer text-fg-quaternary transition duration-200 hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover">
        <HelpCircle className="size-4" />
      </TooltipTrigger>
    </Tooltip>
  );
}
