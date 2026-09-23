"use client";

// The one-question-at-a-time shell Step 1 and Step 2 are built from - per direct request for
// "much more interactive and interesting, like Typeform" instead of one long scrolling form.
// Enter-to-advance is a real, working keyboard convenience (see the `onKeyDownCapture` below),
// but deliberately has no visible "press Enter" hint or icon - per direct follow-up feedback to
// "use the button from DEW design system so it's not very obvious that we are following typeform
// style," Back/Continue are the same real `Button` component and colour pairing (`secondary`/
// `primary`) used in every other footer in this wizard (Steps 2 and 3's own Back/Next), not a
// visually distinct "Typeform tell." `AnimatePresence`/`motion` (already a dependency, used by
// `components/base/accordion/accordion.tsx`) animate the slide between cards.

import type { ComponentType, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

export function TypeformCard({
    cardKey,
    step,
    totalSteps,
    kicker,
    title,
    description,
    children,
    onBack,
    onNext,
    nextLabel = "Continue",
    nextDisabled = false,
    showBack = true,
    showQuestionCount = true,
}: {
    /** Unique per-card key so AnimatePresence knows this is a new card to animate in/out. */
    cardKey: string | number;
    step: number;
    totalSteps: number;
    /** Small label above the title, e.g. "Project details". */
    kicker: string;
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    onBack?: () => void;
    onNext: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
    showBack?: boolean;
    /** Off for the final review card - "Question 8 of 7" reads as a bug, not a summary screen. */
    showQuestionCount?: boolean;
}) {
    return (
        <div className="flex w-full flex-col gap-8">
            <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-brand-solid transition-all duration-500 ease-out" style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>

            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={cardKey}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0, pointerEvents: "auto" }}
                    // `mode="wait"` keeps the outgoing card mounted (and, by default, still fully
                    // clickable) for the length of its own exit animation - a real bug, not just a
                    // testing artifact: a fast double click/double-Enter on "Continue" could land
                    // a second time on the *old* card's own still-visible button before the new
                    // card ever mounts, silently skipping whatever question was supposed to come
                    // next (caught live: it skipped the Abstract question entirely, landing two
                    // cards ahead with the field still empty). `pointerEvents: "none"` during exit
                    // makes the fading-out card inert the instant it starts leaving.
                    exit={{ opacity: 0, y: -16, pointerEvents: "none" }}
                    transition={{ type: "spring", damping: 26, stiffness: 260 }}
                    className="mx-auto flex w-full max-w-2xl flex-col gap-8"
                >
                    <div
                        // Not a real `<form>` - react-aria's `Input` calls `stopPropagation()` on
                        // its own Enter keydown (confirmed live: a bubble-phase listener on this
                        // wrapper never fired at all, a real native `<form onSubmit>` never fired
                        // either), so a bubble-phase listener up here can never see it. Capture
                        // phase runs before that internal handler gets a chance to stop it.
                        // Scoped to a real `<input>` target only (an allowlist, not "everything
                        // except textarea") so it can never double-fire alongside a `Select`'s own
                        // Enter-to-open/choose handling - that trigger is a `<button>`, never an
                        // `<input>`, so it's untouched here.
                        onKeyDownCapture={(e) => {
                            if (e.key !== "Enter" || nextDisabled) return;
                            if ((e.target as HTMLElement).tagName !== "INPUT") return;
                            e.preventDefault();
                            onNext();
                        }}
                        className="flex flex-col gap-8"
                    >
                        <div className="flex flex-col gap-3">
                            <span className="text-xs font-semibold tracking-wide text-brand-tertiary uppercase">
                                {kicker}
                                {showQuestionCount && ` · Question ${step} of ${totalSteps}`}
                            </span>
                            <h2 className="text-display-xs font-semibold text-balance text-primary">{title}</h2>
                            {description && <p className="text-base text-tertiary">{description}</p>}
                        </div>

                        <div className="flex flex-col gap-4">{children}</div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            {showBack && onBack && (
                                <Button type="button" color="secondary" onClick={onBack}>
                                    Back
                                </Button>
                            )}
                            <Button type="button" color="primary" isDisabled={nextDisabled} onClick={onNext}>
                                {nextLabel}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// A big, clickable tile - the Typeform-style stand-in for a plain radio button, used for Data
// Owner type and Role or type of work (a handful of options, one choice) - reads as an answer to
// tap rather than a form control to fill in.
export function ChoiceTile({
    icon: Icon,
    label,
    hint,
    isSelected,
    isDisabled = false,
    onClick,
}: {
    icon?: ComponentType<{ className?: string }>;
    label: string;
    hint?: string;
    isSelected: boolean;
    /** Locked into its current (always-selected) state - e.g. "Biological," which every project
     *  always includes and the user can't opt out of. Rendered as a selected tile the user can
     *  see but not toggle, rather than hidden or silently unclickable with no explanation. */
    isDisabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={isDisabled ? undefined : onClick}
            disabled={isDisabled}
            aria-pressed={isSelected}
            aria-disabled={isDisabled}
            className={cx(
                "flex flex-1 flex-col items-start gap-2 rounded-xl border p-5 text-left transition-colors",
                isSelected ? "border-[var(--color-brand-500)] bg-brand-50" : "border-secondary bg-primary hover:bg-secondary",
                isDisabled && "cursor-not-allowed",
            )}
        >
            {Icon && <Icon className={cx("size-5", isSelected ? "text-brand-tertiary" : "text-fg-quaternary")} />}
            <span className={cx("text-sm font-semibold", isSelected ? "text-brand-tertiary" : "text-secondary")}>{label}</span>
            {hint && <span className="text-sm text-tertiary">{hint}</span>}
        </button>
    );
}
