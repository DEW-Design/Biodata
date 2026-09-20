"use client";

import type { FC, ReactNode } from "react";
import { ChevronLeft, ChevronRight, DownloadCloud02, Image01, FileAttachment02, VideoRecorder, FileCheck02, Link02 } from "@untitledui/icons";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { ModalOverlay, Modal, Dialog as ModalDialog } from "@/components/application/modals/modal";
import { cx } from "@/utils/cx";

// The real artefact preview/download modal - first built at /proto/project-detail, rolled into
// project-detail/option-1 per direct request, and now extracted here so the map search results
// page's own Artefacts and Attachments tab can open the exact same modal instead of a second,
// diverging copy (per direct request: "I want the modal to appear as used in [project-detail]").
// Each consumer supplies its own `artefacts` array (the data genuinely differs per page) but
// shares this one implementation, so a future change to the modal itself only has to happen once.
//
// The metadata panel (right side) was audited directly against Figma's own "Artefacts and
// Attachments Overlay" frame (https://www.figma.com/design/wer8CgO1UoCH3aQw2jQkdy/BioData-SA-High-
// Fidelity?node-id=2486-63681) and rebuilt to match its exact 12-row field set - Title/Created/
// Creator/Artefact Object Id/Description/Format/Identifier/License/Publisher/Rights Holder/Type/
// BioDataID - replacing the previous 7-field set (which included a "Linked Record" row Figma's own
// frame never shows in this panel at all; that context still lives in the modal's own header
// subtitle, exactly where it already was). Per this file's own precedent elsewhere ("Figma is the
// source of truth" for content structure, our own tokens for visual style), the modal keeps this
// codebase's real light theme rather than the reference frame's dark one - that call was already
// made and documented the first time this modal was built, against a different dark-themed
// reference; this pass only corrects the field set, not the theme.
export type ArtefactType = "image" | "pdf" | "video" | "spreadsheet" | "link";

export interface Artefact {
  id: string;
  /** Short display name - the modal's own header title and the carousel tile's own label. */
  title: string;
  type: ArtefactType;
  size: string;
  /** The specific record this artefact is attached to (an Observation, an Occurrence, ...) -
   *  shown as the header's subtitle, exactly where Figma's own frame has no equivalent row at all
   *  (its metadata panel doesn't carry this context; the modal's header is where it belongs here). */
  recordLabel: string;
  /** Figma's "Title" row - a fuller, catalogue-style title, distinct from the short `title` above. */
  metaTitle: string;
  created: string;
  creator: string;
  /** Figma's "Artefact/Object Id" row. */
  objectId: string;
  description: string;
  format: string;
  /** Figma's "Identifier" row - a real, working link to the source record. */
  identifierUrl: string;
  /** Figma's "License" row - the actual licence URL, not a short label. */
  licenseUrl: string;
  publisher: string;
  rightsHolder: string;
  /** Figma's "Type" row - a real DCMI Type Vocabulary term (StillImage/MovingImage/Text/Dataset). */
  dcType: string;
  /** Figma's "BioDataID" row. */
  bioDataId: string;
}

export const artefactTypeMeta: Record<ArtefactType, { icon: FC<{ className?: string }>; badgeColor: "error" | "blue" | "success" | "gray" }> = {
  image: { icon: Image01, badgeColor: "gray" },
  pdf: { icon: FileAttachment02, badgeColor: "error" },
  video: { icon: VideoRecorder, badgeColor: "blue" },
  spreadsheet: { icon: FileCheck02, badgeColor: "success" },
  // Added for the map search results page's own Reference Link resources - a real DCMI
  // "InteractiveResource" (see `dcType`), not a file to preview, so it gets the same real link
  // icon `resourceTypeIcon` already uses for this resource type in results-table.tsx's own
  // columns, rather than a fabricated file-type badge.
  link: { icon: Link02, badgeColor: "gray" },
};

function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
      <div className="text-sm text-primary">{children}</div>
    </div>
  );
}

function MetaLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-sm break-all text-brand-secondary underline">
      {href}
    </a>
  );
}

export function ArtefactTile({ artefact, onOpen }: { artefact: Artefact; onOpen: () => void }) {
  const meta = artefactTypeMeta[artefact.type];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-44 shrink-0 flex-col gap-2 rounded-lg border border-secondary bg-primary p-2 text-left outline-brand transition-colors duration-100 ease-linear hover:border-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div className="flex h-28 items-center justify-center rounded-md bg-secondary">
        <meta.icon className="size-8 text-quaternary" />
      </div>
      <div className="flex flex-col gap-1 px-0.5 pb-0.5">
        <p className="truncate text-xs font-medium text-primary">{artefact.title}</p>
        <p className="truncate text-xs text-quaternary">{artefact.recordLabel}</p>
        <div className="flex items-center gap-1.5">
          <Badge size="sm" color={meta.badgeColor}>
            {artefact.type}
          </Badge>
          <span className="text-xs text-quaternary">{artefact.size}</span>
        </div>
      </div>
    </button>
  );
}

export function ArtefactCarousel({ artefacts, onOpen }: { artefacts: Artefact[]; onOpen: (index: number) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {artefacts.map((artefact, i) => (
        <ArtefactTile key={artefact.id} artefact={artefact} onOpen={() => onOpen(i)} />
      ))}
    </div>
  );
}

// Same structure as the reference this was originally vetted against (big preview left, attached-
// resources list below it, metadata panel + download right) - restyled entirely with our own
// Modal/Dialog/Badge/Button, our light surfaces (not the reference's dark theme, which was a
// detail of that other viewer's own styling, not something to copy). Only image artefacts get a
// real preview; non-image types show their file-type icon large, same honest "no invented
// lookalike" rule as the carousel tiles.
export function ArtefactLightbox({
  artefacts,
  index,
  onClose,
  onNavigate,
}: {
  artefacts: Artefact[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const artefact = index !== null ? artefacts[index] : null;
  if (!artefact || index === null) return null;
  const meta = artefactTypeMeta[artefact.type];

  return (
    <ModalOverlay isOpen isDismissable onOpenChange={(open) => !open && onClose()}>
      <Modal className="w-full max-w-4xl">
        <ModalDialog aria-label={artefact.title}>
          <div className="flex items-center justify-between gap-4 border-b border-secondary px-6 py-4">
            <div>
              <h2 className="text-md font-semibold text-primary">{artefact.title}</h2>
              <p className="text-sm text-tertiary">{artefact.recordLabel}</p>
            </div>
            <CloseButton onPress={onClose} label="Close" />
          </div>
          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-4">
              <div className="relative flex h-80 items-center justify-center rounded-lg bg-secondary">
                <meta.icon className="size-16 text-quaternary" />
                <button
                  type="button"
                  aria-label="Previous artefact"
                  onClick={() => onNavigate((index - 1 + artefacts.length) % artefacts.length)}
                  className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-tertiary shadow-sm outline-brand hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next artefact"
                  onClick={() => onNavigate((index + 1) % artefacts.length)}
                  className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-tertiary shadow-sm outline-brand hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  Attached Resources <CountBadge count={artefacts.length} color="gray" />
                </p>
                {/* max-h + overflow - project-detail's own 4-item list never needed this, but the
                    map search results page's Artefacts and Attachments tab can carry many more
                    resources at once, so this list scrolls internally rather than growing the
                    modal past a sane height. */}
                <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                  {artefacts.map((item, i) => {
                    const itemMeta = artefactTypeMeta[item.type];
                    const active = i === index;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onNavigate(i)}
                        className={cx(
                          "flex items-center gap-3 rounded-md border p-2 text-left outline-brand transition-colors duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
                          active ? "border-brand-300 bg-brand-50" : "border-secondary hover:bg-secondary",
                        )}
                      >
                        <itemMeta.icon className="size-4 shrink-0 text-quaternary" />
                        <span className="flex-1 truncate text-sm text-primary">{item.title}</span>
                        <span className="shrink-0 text-xs text-quaternary">{item.size}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Metadata panel - exact field set/order from Figma's "MetaSection" (node
                I2486:63512;1892:26966): Title/Created/Creator/Artefact Object Id/Description/
                Format/Identifier/License/Publisher/Rights Holder/Type/BioDataID. */}
            <div className="flex flex-col gap-4 border-secondary lg:border-l lg:pl-6">
              <div className="flex flex-col gap-3 overflow-y-auto lg:max-h-[26rem]">
                <MetaField label="Title">{artefact.metaTitle}</MetaField>
                <MetaField label="Created">{artefact.created}</MetaField>
                <MetaField label="Creator">{artefact.creator}</MetaField>
                <MetaField label="Artefact/Object Id">{artefact.objectId}</MetaField>
                <MetaField label="Description">{artefact.description}</MetaField>
                <MetaField label="Format">{artefact.format}</MetaField>
                <MetaField label="Identifier">
                  <MetaLink href={artefact.identifierUrl} />
                </MetaField>
                <MetaField label="License">
                  <MetaLink href={artefact.licenseUrl} />
                </MetaField>
                <MetaField label="Publisher">{artefact.publisher}</MetaField>
                <MetaField label="Rights Holder">{artefact.rightsHolder}</MetaField>
                <MetaField label="Type">{artefact.dcType}</MetaField>
                <MetaField label="BioDataID">{artefact.bioDataId}</MetaField>
              </div>
              <Button color="primary" iconLeading={DownloadCloud02} className="mt-auto w-full">
                Download
              </Button>
            </div>
          </div>
        </ModalDialog>
      </Modal>
    </ModalOverlay>
  );
}
