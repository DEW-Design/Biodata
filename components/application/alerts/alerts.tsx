"use client";

import type { FC, ReactNode } from "react";
import { AlertCircle, Check, CheckCircle, InfoCircle, XClose } from "@untitledui/icons";
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
     * The icon that names the confirm action on a button-style alert (CONTRACTS 3.12), such as a forward arrow for "Go to DLA".
     * Link-style actions (`actionType="link"`) need none.
     * @default Check
     */
    confirmIcon?: FC<{ className?: string }>;
    /** `"trailing"` puts the confirm icon after the label, for an action that moves on (an arrow). @default "leading" */
    confirmIconPosition?: "leading" | "trailing";
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
     * Renders the alert as a self-contained card instead of a full-width banner: a rounded box
     * with a 1px border and a background tinted by `color`, with even padding. The card's look is
     * decided here, once; callers pass no border, background, radius or padding classes, so every
     * contained alert in the product looks the same (CONTRACTS 1.9: fix in the component, never
     * at the call site). Takes precedence over `tintedBackground`.
     * @default false
     */
    contained?: boolean;
    /**
     * Lets the title and description wrap onto as many lines as they need instead of truncating to
     * one line at `md`. Use for an alert that lists specifics (the fields missing from a form).
     * @default false
     */
    wrap?: boolean;
    /**
     * With `contained`: one line instead of stacked. The title and description run on together and
     * the actions sit at the right, wrapping under the text only when the card is too narrow. Use for
     * a short notice with one action ("7 flagged concepts need review across this project · Review").
     * @default false
     */
    inline?: boolean;
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
    confirmIcon = Check,
    confirmIconPosition = "leading",
    className,
    tintedBackground = false,
    hideDismissButton = false,
    contained = false,
    wrap = false,
    inline = false,
}: AlertFullWidthProps) => {
    const tone = tintedBackground ? tintMap[color] : tintMap.default;
    const icon = (
        <FeaturedIcon
            className="hidden md:flex"
            icon={iconMap[color]}
            color={color === "default" ? "gray" : color}
            theme={color === "default" ? "modern" : "outline"}
            size="md"
        />
    );
    const actions = (onConfirm || (onClose && !hideDismissButton)) && (
        <div className={cx("flex gap-3", actionType === "button" ? "flex-col-reverse md:flex-row" : "flex-row")}>
            {onClose && !hideDismissButton && (
                <Button onClick={onClose} color={actionType === "button" ? "secondary" : "link-gray"} size="sm" iconLeading={actionType === "button" ? XClose : undefined}>
                    {dismissLabel}
                </Button>
            )}
            {onConfirm && (
                <Button
                    onClick={onConfirm}
                    color={actionType === "button" ? "primary" : "link-color"}
                    size="sm"
                    iconLeading={actionType === "button" && confirmIconPosition === "leading" ? confirmIcon : undefined}
                    iconTrailing={actionType === "button" && confirmIconPosition === "trailing" ? confirmIcon : undefined}
                >
                    {confirmLabel}
                </Button>
            )}
        </div>
    );

    // Contained card: the icon at the top left, then the title with the description under it at full
    // width, then the actions as a row beneath the text (the floating alert's layout). Laying the
    // title and description side by side squeezed the description into a narrow second column.
    if (contained && inline) {
        return (
            <div className={cx("font-barlow relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-4", tintMap[color].bg, tintMap[color].border, className)}>
                {icon}
                <p className={cx("min-w-0 flex-1 text-sm text-balance text-tertiary", onClose && "pr-8")}>
                    <span className="font-semibold text-secondary">{title}</span>
                    {description && <> {description}</>}
                </p>
                {actions}
                {onClose && <CloseButton onClick={onClose} size="sm" label={dismissLabel} className="absolute top-2 right-2" />}
            </div>
        );
    }

    if (contained) {
        return (
            <div className={cx("font-barlow relative flex items-start gap-3 rounded-lg border p-4", tintMap[color].bg, tintMap[color].border, className)}>
                {icon}
                {/* The title's first line centres on the icon: the outline icon is a 20px box; the default
                    colour's "modern" icon is 40px, so its text starts 10px lower. */}
                <div className={cx("flex min-w-0 flex-1 flex-col gap-3", color === "default" && "md:pt-2.5")}>
                    <div className="flex flex-col gap-1">
                        <p className={cx("text-sm font-semibold text-balance text-secondary", onClose && "pr-8")}>{title}</p>
                        {description && <p className={cx("text-sm text-balance text-tertiary", !wrap && "md:truncate")}>{description}</p>}
                    </div>
                    {actions}
                </div>
                {onClose && <CloseButton onClick={onClose} size="sm" label={dismissLabel} className="absolute top-2 right-2" />}
            </div>
        );
    }

    return (
        <div className={cx("font-barlow relative border-t md:border-t-0 md:border-b", tone.bg, tone.border)}>
            <div className={cx("mx-auto flex max-w-container flex-col gap-4 p-4 md:flex-row md:items-center md:gap-3 md:px-8 md:py-3", className)}>
                <div className="flex flex-1 flex-col gap-4 md:w-0 md:flex-row md:items-center">
                    {icon}
                    <div className="flex flex-col gap-0.5 overflow-hidden lg:flex-row lg:gap-1.5">
                        <p className={cx("pr-8 text-sm font-semibold text-secondary md:pr-0", wrap ? "lg:shrink-0 lg:whitespace-nowrap" : "md:truncate")}>{title}</p>
                        <p className={cx("text-sm text-tertiary", !wrap && "md:truncate")}>{description}</p>
                    </div>
                </div>

                {(onConfirm || onClose) && (
                    <div className="flex gap-2">
                        {actions}
                        {onClose && <CloseButton onClick={onClose} size="sm" label={dismissLabel} className="absolute top-2 right-2 shrink-0 md:static" />}
                    </div>
                )}
            </div>
        </div>
    );
};
