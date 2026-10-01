"use client";

import type { FC } from "react";
import { AlertFullWidth } from "@/components/application/alerts/alerts";

// The page banner: one full-width notice across the top of a screen's content, directly under the header and outside
// anything that scrolls, so it is the first thing read and stays put. It says one thing about the screen as a whole
// (what this person can and cannot see here) and offers the one next step. Documented at /patterns/banners.
//
// It is `AlertFullWidth` with the settings the pattern fixes, so no screen chooses them: a tinted background that
// matches its colour, padding that lines up with the screen's 24px rhythm, one action, and a single close control
// (the icon in the corner, not a second "Dismiss" button). A notice about one record or one section is the
// contained alert inside the content instead (`AlertFullWidth contained`), never this.

export type PageBannerColor = "brand" | "warning" | "error" | "success" | "gray";

export function PageBanner({
  title,
  description,
  actionLabel,
  actionIcon,
  actionIconPosition = "leading",
  onAction,
  onDismiss,
  color = "warning",
}: {
  /** What is true, in a few words: "Some locations are approximate". */
  title: string;
  /** One line on what that means for this person. */
  description: string;
  /** The next step, named by where it goes: "Go to DLA", "Sign up for access". */
  actionLabel: string;
  /** The icon that names the action (CONTRACTS 3.12): an arrow after the label for "Go to ...", a person for "Sign up". */
  actionIcon: FC<{ className?: string }>;
  actionIconPosition?: "leading" | "trailing";
  onAction: () => void;
  /** Closes it for the rest of the visit. Leave out for a notice that should stay. */
  onDismiss?: () => void;
  color?: PageBannerColor;
}) {
  return (
    <div className="shrink-0">
      <AlertFullWidth
        color={color}
        tintedBackground
        hideDismissButton
        title={title}
        description={description}
        confirmLabel={actionLabel}
        confirmIcon={actionIcon}
        confirmIconPosition={actionIconPosition}
        onConfirm={onAction}
        onClose={onDismiss}
        className="mx-0 max-w-none px-6 py-2.5 md:px-6 md:py-2.5"
      />
    </div>
  );
}
