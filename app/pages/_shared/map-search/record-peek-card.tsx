"use client";

import { useEffect } from "react";
import { ArrowNarrowRight, Lock01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { SpeciesPhotoCarousel } from "@/app/pages/_shared/map-search/species-photo-carousel";
import { speciesImage } from "@/app/pages/_shared/map-search/species-images";
import { eventTypeIcon, hasScientificName, rootProjectForParentEventId, rootProjectOfEvent } from "@/app/pages/_shared/map-search/search-data";
import { projectDetailPath, type DetailRecord } from "@/app/pages/_shared/map-search/record-detail";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import type { UserRole } from "@/lib/user-role";
import { recordAccess } from "@/app/pages/_shared/map-search/record-access";
import { MAP_SURFACE_EDGE } from "@/app/pages/_shared/map-search/map-surface";
import { SummaryCloseButton, SummaryFacts } from "@/app/pages/_shared/map-search/summary-card-parts";

/**
 * A record on the map, at a glance: what it is, where it came from and the three facts you decide
 * on, with one way in: "Show in project" opens the record's own page within its project
 * (`/pages/project-list/[id]/project-details/<kind>/<id>`). The full record is long; opening it for every dot or row
 * covers the map and shows far more than a first look needs, so this card sits in for it. Not
 * modal: the map and results stay usable behind it, and picking another record swaps the card.
 */
export function RecordPeekCard({ record, onClose, className }: { record: DetailRecord; onClose: () => void; className?: string }) {
  // Escape closes and never changes anything else (CONTRACTS 1.9).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const roleHref = useRoleHref();
  const role = useUserRole();
  const detailPath = projectDetailPath(record);
  const view = describe(record, role);
  const Icon = view.icon;

  return (
    <section aria-label={`${view.title}, summary`} className={cx("font-barlow relative flex w-[320px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-xl bg-primary shadow-lg", MAP_SURFACE_EDGE, className)}>
      <SummaryCloseButton onClick={onClose} onPhoto={!!view.photo} />
      {/* The card never scrolls. The photo is the part that gives way: square when there is room,
          shorter (cropped, never squashed, never under 120px) when the card is height-bounded by the
          map's right-hand column, so the name, facts and "Show in project" show in full. Only in a
          window too short for even that do the details scroll, as a last resort. Its huge shrink
          factor makes it absorb the whole shortfall before the details lose a line. */}
      {view.photo && (
        // Full-bleed: the card clips the photo, so its top corners are the card's own radius. An
        // inset photo could not be concentric here (outer radius 12px is smaller than the 16px
        // padding, so inner = outer - padding would be negative).
        <SpeciesPhotoCarousel scientificName={view.photo.scientificName} alt={view.photo.alt} className="min-h-[168px] shrink-[1000]" />
      )}
      <div className="flex min-h-0 shrink flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-start gap-3">
        {Icon && !view.photo && (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-quaternary">
            <Icon className="size-4" />
          </span>
        )}
        <div className={cx("min-w-0 flex-1", !view.photo && "pr-8")}>
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{view.eyebrow}</p>
          <h3 className="m-0! mt-0.5! text-base! font-semibold! tracking-normal! text-primary! text-balance">{view.title}</h3>
          {view.subtitle && <p className="text-sm text-tertiary italic">{view.subtitle}</p>}
        </div>
      </div>

      {view.provenance && <p className="text-sm text-secondary text-balance">{view.provenance}</p>}

      <SummaryFacts facts={view.facts} />

      {view.restricted && (
        <p className="flex items-center gap-1.5 text-sm text-tertiary">
          <Lock01 className="size-4 shrink-0" />
          Location is shown only as a block. Full precision needs a Data Licencing Agreement (DLA).
        </p>
      )}

      </div>
      {detailPath && (
        <div className="shrink-0 border-t border-secondary p-4">
          <Button color="primary" size="md" className="w-full" iconTrailing={ArrowNarrowRight} href={roleHref(detailPath)}>
            Show in project
          </Button>
        </div>
      )}
    </section>
  );
}

interface PeekView {
  eyebrow: string;
  title: string;
  subtitle?: string;
  provenance?: string;
  facts: { label: string; value: React.ReactNode }[];
  icon?: React.FC<{ className?: string }>;
  restricted?: boolean;
  /** A reference photo for a species that has one; the header icon is dropped when it is shown. */
  photo?: { scientificName: string; alt: string };
}

function describe(record: DetailRecord, role: UserRole): PeekView {
  if (record.kind === "event") {
    const e = record.event;
    const project = rootProjectOfEvent(e);
    return {
      eyebrow: e.type,
      title: e.name,
      icon: eventTypeIcon[e.type],
      provenance: e.type === "Project" ? e.org : `${project.org}, ${project.name}`,
      facts: [
        { label: "ID", value: e.code },
        { label: "Start date", value: e.startDate },
        ...(e.type === "Project" ? [{ label: "Status", value: <Badge color={e.statusColor} size="sm">{e.status}</Badge> }] : []),
        { label: "Region", value: e.region },
      ],
    };
  }
  const isOcc = record.kind === "occurrence";
  const r = isOcc ? record.occurrence : record.observation;
  const project = rootProjectForParentEventId(r.parentEventId);
  const image = speciesImage(r.species);
  return {
    // The card opens from the Species tab, so an occurrence reads as what the list called it: a species ("Species, Individual"), not by the data model's word (designer, 23 Oct 2026).
    eyebrow: `${isOcc ? "Species" : "Observation"}, ${r.type}`,
    title: r.commonName,
    subtitle: hasScientificName(r.species) ? r.species : undefined,
    provenance: project ? `${project.org}, ${project.name}` : undefined,
    facts: [
      { label: "Date", value: r.date },
      { label: "Region", value: r.region },
      ...(isOcc ? [{ label: "Count", value: record.occurrence.count ?? "Not provided" }] : [{ label: "Observer", value: record.observation.observerName }]),
    ],
    restricted: recordAccess(r, role) === "generalised",
    photo: image ? { scientificName: r.species, alt: r.commonName } : undefined,
  };
}
