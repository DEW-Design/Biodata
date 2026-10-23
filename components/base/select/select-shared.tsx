"use client";

import type { FC, ReactNode } from "react";
import { createContext } from "react";
import { cx } from "@/utils/cx";

export type SelectItemType = {
    /** Unique identifier for the item. */
    id: string | number;
    /** The primary display text. */
    label?: string;
    /** Avatar image URL. */
    avatarUrl?: string;
    /** Whether the item is disabled. */
    isDisabled?: boolean;
    /** The end of the label that is never cut: where the label is too long for its line the middle gives way and this stays (a file's version and extension, "01.xlsx"). Opt-in; without it a long label is cut at its end. */
    labelEnd?: string;
    /** Secondary text displayed alongside the label. */
    supportingText?: string;
    /** Leading icon component or element. */
    icon?: FC | ReactNode;
};

export interface CommonProps {
    /** Helper text displayed below the input. */
    hint?: string;
    /** Field label displayed above the input. */
    label?: string;
    /** Tooltip text for the help icon next to the label. */
    tooltip?: string;
    /**
     * The size of the component.
     * @default "md"
     */
    size?: "sm" | "md" | "lg";
    /** Placeholder text when no value is selected. */
    placeholder?: string;
    /** Whether to hide the required indicator from the label. */
    hideRequiredIndicator?: boolean;
}

export const sizes = {
    sm: {
        root: "py-2 pl-3 pr-2.5 gap-2 *:data-icon:size-4 *:data-icon:stroke-[2.25px]",
        withIcon: "",
        text: "text-sm",
        textContainer: "gap-x-1.5",
        shortcut: "pr-2.5",
    },
    md: { root: "py-2 px-3 gap-2 *:data-icon:size-5", withIcon: "", text: "text-md", textContainer: "gap-x-1.5", shortcut: "pr-2.5" },
    lg: { root: "py-2.5 px-3.5 gap-2 *:data-icon:size-5", withIcon: "", text: "text-md", textContainer: "gap-x-1.5", shortcut: "pr-3" },
};

export const SelectContext = createContext<{ size: "sm" | "md" | "lg"; truncateAtWords?: boolean }>({ size: "md" });

/** The pieces `text-overflow` may cut between: each word, and each underscore-ended chunk of a file name, is one unbreakable piece, with the whitespace between kept as it is. */
const pieces = (text: string) => text.split(/(\s+)/).flatMap((chunk) => (!chunk || /^\s+$/.test(chunk) ? [chunk] : (chunk.match(/[^_]+_*|_+/g) ?? [chunk])));

/**
 * A label that is cut by a strategy rather than at whatever character the line runs out on:
 * - `atWords`: the cut falls between words (and between the chunks of a file name), so "Flinders Ranges Reptile Atlas" gives "Flinders Ranges..." and not "Flinders Ranges Reptil...". Each piece after the first is an atomic inline,
 *   which `text-overflow` drops whole; the first stays plain so a line too short for even one word still shows the start of it.
 * - `labelEnd`: the middle gives way and the end stays ("flinders_bush...01.xlsx"), for a name whose end tells it from its neighbours. It is cut by character, not by word: a word dropped whole would leave the room it had empty,
 *   a hole between the ellipsis and the end that stays.
 * The full text is the tooltip, since something is cut.
 */
export const TruncatedLabel = ({ label, labelEnd, atWords, className }: { label: string; labelEnd?: string; atWords?: boolean; className?: string }) => (
    <span title={label + (labelEnd ?? "")} className={cx("flex max-w-full min-w-0", className)}>
        {/* With an end that stays the text is two boxes, which a screen reader would read with a break between them: the two are hidden from it and the whole is read once. */}
        <span aria-hidden={labelEnd ? true : undefined} className="min-w-0 truncate">
            {atWords && !labelEnd
                ? pieces(label).map((piece, i) =>
                      i === 0 || !piece || /^\s+$/.test(piece) ? (
                          piece
                      ) : (
                          <span key={i} className="inline-block">
                              {piece}
                          </span>
                      ),
                  )
                : label}
        </span>
        {labelEnd && (
            <>
                <span aria-hidden="true" className="shrink-0 whitespace-pre">
                    {labelEnd}
                </span>
                <span className="sr-only">{label + labelEnd}</span>
            </>
        )}
    </span>
);
