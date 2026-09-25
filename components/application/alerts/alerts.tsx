"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle, InfoCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

const iconMap = {
    default: InfoCircle,
    brand: InfoCircle,
    gray: InfoCircle,
    error: AlertCircle,
    warning: AlertCircle,
    success: CheckCircle,
};

interface AlertFloatingProps {
    /**
     * The title of the alert.
     */
    title: string;
    /**
     * The description of the alert.
     */
    description: ReactNode;
    /**
     * The label for the confirm button.
     */
    confirmLabel: string;
    /**
     * The label for the dismiss button.
     * @default "Dismiss"
     */
    dismissLabel?: string;
    /**
     * The color of the alert.
     * @default "default"
     */
    color?: "default" | "brand" | "gray" | "error" | "warning" | "success";
    /**
     * The function to call when the dismiss button is clicked.
     */
    onClose?: () => void;
    /**
     * The function to call when the confirm button is clicked.
     */
    onConfirm?: () => void;
}

export const AlertFloating = ({ title, description, confirmLabel, onClose, onConfirm, color = "default", dismissLabel = "Dismiss" }: AlertFloatingProps) => {
    return (
        <div className="font-barlow relative flex flex-col gap-4 rounded-xl border border-primary bg-primary_alt p-4 shadow-xs md:flex-row">
            <FeaturedIcon icon={iconMap[color]} color={color === "default" ? "gray" : color} theme={color === "default" ? "modern" : "outline"} size="md" />

            <div className="flex flex-1 flex-col gap-3 md:w-0">
                <div className="flex flex-col gap-1 overflow-auto">
                    <p className="pr-8 text-sm font-semibold text-balance text-secondary md:truncate md:pr-0">{title}</p>
                    <p className="text-sm text-balance text-tertiary md:truncate">{description}</p>
                </div>

                {(onConfirm || onClose) && (
                    <div className="flex gap-3">
                        {onClose && (
                            <Button onClick={onClose} size="sm" color="link-gray">
                                {dismissLabel}
                            </Button>
                        )}
                        {onConfirm && (
                            <Button onClick={onConfirm} size="sm" color="link-color">
                                {confirmLabel}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {onClose && <CloseButton onClick={onClose} size="sm" label={dismissLabel} className="absolute top-2 right-2" />}
        </div>
    );
};

interface AlertFullWidthProps {
    /**
     * The title of the alert.
     */
    title: string;
    /**
     * The description of the alert.
     */
    description: ReactNode;
    /**
     * The label for the confirm button.
     */
    confirmLabel: string;
    /**
     * The label for the dismiss button.
     * @default "Dismiss"
     */
    dismissLabel?: string;
    /**
     * The type of the action buttons.
     * @default "button"
     */
    actionType?: "button" | "link";
    /**
     * The color of the alert.
     * @default "default"
     */
    color?: "default" | "brand" | "gray" | "error" | "warning" | "success";
    /**
     * The function to call when the dismiss button is clicked.
     */
    onClose?: () => void;
    /**
     * The function to call when the confirm button is clicked.
     */
    onConfirm?: () => void;
    /**
     * Overrides the default centered `max-w-container` + `px-8` treatment (designed for
     * standalone, full-viewport-width placements). Pass this when the alert sits inside a
     * layout that already establishes its own horizontal padding rhythm, so the alert's
     * content aligns with the content around it instead of centering independently.
     */
    className?: string;
    /**
     * When true, the alert's own background/border pick up a subtle tint matching `color`
     * (`bg-{color}-50` + `border-{color}-300`) instead of the default neutral `bg-secondary`/
     * `border-primary`.
     * @default false
     */
    tintedBackground?: boolean;
    /**
     * When true and `onClose` is set, suppresses the text "Dismiss" button in the action row -
     * the corner `CloseButton` (an icon-only close, `absolute top-2 right-2`) still renders, so
     * the alert is still fully dismissable, just via one control instead of two doing the same
     * thing. Use this when the alert already has one clear primary action and a second, separate
     * "Dismiss" button next to it would be redundant with a close icon that's already there.
     * @default false
     */
    hideDismissButton?: boolean;
    /**
     * Drops the outer wrapper's own edge-to-edge `border-t`/`bg-secondary`/`md:border-b` chrome
     * (meant for a banner spanning the full viewport width). Pass this whenever `className`
     * already supplies a self-contained shape (e.g. `rounded-lg border ...`), so that shape isn't
     * left with the default full-bleed border/background bleeding out around or underneath it.
     * Takes precedence over `tintedBackground`.
     * @default false
     */
    contained?: boolean;
    /**
     * Lets the title and description wrap onto as many lines as they need instead of truncating to
     * one line at `md`. Use for an alert that lists specifics (the fields missing from a form).
     * @default false
     */
    wrap?: boolean;
}

const tintMap: Record<NonNullable<AlertFullWidthProps["color"]>, { bg: string; border: string }> = {
    default: { bg: "bg-secondary", border: "border-primary" },
    brand: { bg: "bg-brand-50", border: "border-brand-300" },
    gray: { bg: "bg-secondary", border: "border-primary" },
    error: { bg: "bg-error-50", border: "border-error-300" },
    warning: { bg: "bg-warning-50", border: "border-warning-300" },
    success: { bg: "bg-success-50", border: "border-success-300" },
};

export const AlertFullWidth = ({
    title,
    description,
    confirmLabel,
    onClose,
    onConfirm,
    color = "default",
    actionType = "button",
    dismissLabel = "Dismiss",
    className,
    tintedBackground = false,
    hideDismissButton = false,
    contained = false,
    wrap = false,
}: AlertFullWidthProps) => {
    const tone = tintedBackground ? tintMap[color] : tintMap.default;
    return (
        <div className={cx("font-barlow relative", !contained && ["border-t md:border-t-0 md:border-b", tone.bg, tone.border])}>
            <div
                className={cx(
                    "flex flex-col gap-4 md:flex-row md:items-center md:gap-3",
                    // Full-bleed banner: centred in `max-w-container` with wide `px-8` side padding, sized for the
                    // viewport edge. Contained card: the alert IS the box, so it gets even padding all round
                    // (a `px-8` inside a rounded card left the icon floating far from the left edge).
                    contained ? "p-4" : "mx-auto max-w-container p-4 md:px-8 md:py-3",
                    className,
                )}
            >
                <div className="flex flex-1 flex-col gap-4 md:w-0 md:flex-row md:items-center">
                    <FeaturedIcon
                        className="hidden md:flex"
                        icon={iconMap[color]}
                        color={color === "default" ? "gray" : color}
                        theme={color === "default" ? "modern" : "outline"}
                        size="md"
                    />

                    <div className="flex flex-col gap-0.5 overflow-hidden lg:flex-row lg:gap-1.5">
                        <p className={cx("pr-8 text-sm font-semibold text-secondary md:pr-0", wrap ? "lg:shrink-0 lg:whitespace-nowrap" : "md:truncate")}>{title}</p>
                        <p className={cx("text-sm text-tertiary", !wrap && "md:truncate")}>{description}</p>
                    </div>
                </div>

                {(onConfirm || onClose) && (
                    <div className="flex gap-2">
                        <div className={cx("flex w-full gap-3", actionType === "button" ? "flex-col-reverse md:flex-row" : "flex-row")}>
                            {onClose && !hideDismissButton && (
                                <Button onClick={onClose} color={actionType === "button" ? "secondary" : "link-gray"} size="sm">
                                    {dismissLabel}
                                </Button>
                            )}
                            {onConfirm && (
                                <Button onClick={onConfirm} color={actionType === "button" ? "primary" : "link-color"} size="sm">
                                    {confirmLabel}
                                </Button>
                            )}
                        </div>

                        {onClose && <CloseButton onClick={onClose} size="sm" label={dismissLabel} className="absolute top-2 right-2 shrink-0 md:static" />}
                    </div>
                )}
            </div>
        </div>
    );
};
