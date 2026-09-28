"use client";

import { useEffect, type FC } from "react";
import { ArrowNarrowRight, Lock01, XClose } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { speciesImage } from "@/app/pages/_shared/map-search/species-images";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { rootProjectForParentEventId, rootProjectOfEvent, eventTypeIcon } from "@/app/pages/_shared/map-search/search-data";
import { projectDetailPath, type DetailRecord } from "@/app/pages/_shared/map-search/record-detail";
import { useRoleHref } from "@/lib/use-role-href";

/**
 * A record on the map, at a glance: what it is, where it came from and the three facts you decide
 * on, with one way in to the full record. That is the project's own page (`/pages/project-detail`,
 * with the record pre-selected in its tree where it can be) or, for a project with no page in this
 * preview, the full `RecordDetailSidebar`. The full record is long; opening it for every dot or row
 * covers the map and shows far more than a first look needs, so this card sits in for it. Not
 * modal: the map and results stay usable behind it, and picking another record swaps the card.
 */
export function RecordPeekCard({ record, onViewFull, onClose, className }: { record: DetailRecord; onViewFull: () => void; onClose: () => void; className?: string }) {
  // Escape closes and never changes anything else (CONTRACTS 1.9).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const roleHref = useRoleHref();
  // The full record is the project's own page. Only one project has a page in this preview, so
  // every other record falls back to the full sidebar rather than a dead link.
  const detailPath = projectDetailPath(record);
  const view = describe(record);
  const Icon = view.icon;

  return (
    <section aria-label={`${view.title}, summary`} className={cx("font-barlow relative flex w-[320px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-xl border border-secondary bg-primary shadow-lg", className)}>
      {/* Always the card's top-right corner, over the photo when there is one (on a solid chip, so
          it reads on any image) and over the plain header when there is not. */}
      <button
        type="button"
        aria-label="Close summary"
        onClick={onClose}
        className={cx(
          "absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full text-fg-quaternary outline-focus-ring transition duration-100 ease-linear before:absolute before:-inset-1.5 hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
          view.photo ? "bg-primary shadow-sm hover:bg-secondary" : "hover:bg-secondary",
        )}
      >
        <XClose className="size-4" />
      </button>
      {view.photo && (
        // Full-bleed: the card clips the photo, so its top corners are the card's own radius. An
        // inset photo could not be concentric here (outer radius 12px is smaller than the 16px
        // padding, so inner = outer - padding would be negative).
        <figure className="m-0 flex flex-col">
          <SpeciesPhoto scientificName={view.photo.scientificName} alt={view.photo.alt} fallbackIcon={view.photo.fallbackIcon} className="h-36 w-full rounded-none outline-0" />
          <figcaption className="px-4 pt-2 text-xs text-tertiary">
            Photo: {view.photo.credit.creator}, {view.photo.credit.licence},{" "}
            <a href={view.photo.credit.sourceUrl} target="_blank" rel="noreferrer" className="underline outline-focus-ring underline-offset-2 hover:text-secondary focus-visible:outline-2">
              Atlas of Living Australia
            </a>
          </figcaption>
        </figure>
      )}
      <div className="flex flex-col gap-3 p-4">
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

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {view.facts.map((fact) => (
          <div key={fact.label} className="contents">
            <dt className="text-tertiary">{fact.label}</dt>
            <dd className="m-0 text-primary">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {view.restricted && (
        <p className="flex items-center gap-1.5 text-sm text-tertiary">
          <Lock01 className="size-4 shrink-0" />
          Location is approximate. Full precision needs a data licence agreement.
        </p>
      )}

      <Button
        color="primary"
        size="md"
        className="w-full"
        iconTrailing={ArrowNarrowRight}
        {...(detailPath ? { href: roleHref(detailPath) } : { onPress: onViewFull })}
      >
        View full record
      </Button>
      </div>
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
  photo?: { scientificName: string; alt: string; fallbackIcon: FC<{ className?: string }>; credit: { creator: string; licence: string; sourceUrl: string } };
}

function describe(record: DetailRecord): PeekView {
  if (record.kind === "event") {
    const e = record.event;
    const project = rootProjectOfEvent(e);
    return {
      eyebrow: e.type,
      title: e.name,
      icon: eventTypeIcon[e.type],
      provenance: e.type === "Project" ? e.org : `${project.org} · ${project.name}`,
      facts: [
        { label: "ID", value: e.code },
        { label: "Started", value: e.startDate },
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
    eyebrow: `${isOcc ? "Occurrence" : "Observation"} · ${r.type}`,
    title: r.commonName,
    subtitle: r.species,
    provenance: project ? `${project.org} · ${project.name}` : undefined,
    facts: [
      { label: "Date", value: r.date },
      { label: "Region", value: r.region },
      ...(isOcc ? [{ label: "Count", value: record.occurrence.count ?? "Not provided" }] : [{ label: "Observer", value: record.observation.observerName }]),
    ],
    restricted: r.licenceLevel === "Level 2",
    photo: image && r.group ? { scientificName: r.species, alt: r.commonName, fallbackIcon: SPECIES_GROUP_ICON[r.group], credit: image } : undefined,
  };
}
