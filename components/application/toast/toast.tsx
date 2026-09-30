"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle, InfoCircle } from "@untitledui/icons";
import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

export type ToastColor = "default" | "brand" | "gray" | "error" | "warning" | "success";

const iconMap = {
    default: InfoCircle,
    brand: InfoCircle,
    gray: InfoCircle,
    error: AlertCircle,
    warning: AlertCircle,
    success: CheckCircle,
};

interface ToastCardProps {
    /**
     * The title of the toast.
     */
    title: string;
    /**
     * The description of the toast.
     */
    description?: ReactNode;
    /**
     * The color of the toast.
     * @default "default"
     */
    color?: ToastColor;
    /**
     * The label for the optional action button.
     */
    actionLabel?: string;
    /**
     * The function to call when the action button is clicked.
     */
    onAction?: () => void;
    /**
     * The function to call when the toast is dismissed.
     */
    onDismiss: () => void;
}

/** The visual card rendered inside every toast - same anatomy as `AlertFloating`, sized for the corner of the viewport. */
export const ToastCard = ({ title, description, color = "default", actionLabel, onAction, onDismiss }: ToastCardProps) => {
    return (
        <div className="font-barlow relative flex w-full max-w-sm gap-3 rounded-xl border border-primary bg-primary_alt p-4 shadow-lg">
            <FeaturedIcon icon={iconMap[color]} color={color === "default" ? "gray" : color} theme={color === "default" ? "modern" : "outline"} size="md" />

            <div className="flex flex-1 flex-col gap-1 pr-6">
                <p className="text-sm font-semibold text-balance text-secondary">{title}</p>
                {description && <p className="text-sm text-balance text-tertiary">{description}</p>}

                {actionLabel && onAction && (
                    <div className="-ml-3 mt-1">
                        <Button onClick={onAction} size="sm" color="link-color">
                            {actionLabel}
                        </Button>
                    </div>
                )}
            </div>

            <CloseButton onClick={onDismiss} size="sm" label="Dismiss" className="absolute top-2 right-2" />
        </div>
    );
};

interface ShowToastOptions {
    description?: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    /** Milliseconds before the toast auto-dismisses. Pass `Infinity` to require manual dismissal. */
    duration?: number;
}

function showToast(color: ToastColor, title: string, options: ShowToastOptions = {}) {
    const { description, actionLabel, onAction, duration } = options;

    return sonnerToast.custom(
        (id) => (
            <ToastCard
                title={title}
                description={description}
                color={color}
                actionLabel={actionLabel}
                onAction={onAction}
                onDismiss={() => sonnerToast.dismiss(id)}
            />
        ),
        { duration, unstyled: true },
    );
}

/** DEW-styled toasts - thin wrapper over `sonner`'s imperative API that renders `ToastCard` instead of sonner's default look. */
export const toast = {
    default: (title: string, options?: ShowToastOptions) => showToast("default", title, options),
    brand: (title: string, options?: ShowToastOptions) => showToast("brand", title, options),
    gray: (title: string, options?: ShowToastOptions) => showToast("gray", title, options),
    error: (title: string, options?: ShowToastOptions) => showToast("error", title, options),
    warning: (title: string, options?: ShowToastOptions) => showToast("warning", title, options),
    success: (title: string, options?: ShowToastOptions) => showToast("success", title, options),
    dismiss: sonnerToast.dismiss,
};

/** Where every toast appears. Fixed here, once, for the whole product: toasts stack in the bottom-right
 *  corner, away from the header's search, Add menu and account controls, and from the record actions
 *  that sit at the top right of a page. `Toaster` takes no position prop on purpose, so no screen can
 *  move them (CONTRACTS 1.9: fix in the component, never at the call site). */
export const TOAST_POSITION = "bottom-right" as const;

/** Distance from the viewport edges. Lifted 88px from the bottom on every screen so a toast clears a
 *  form's footer (73px tall: Save draft and Continue) and never covers the buttons that raised it. */
export const TOAST_OFFSET = { bottom: 88, right: 24 } as const;

/** Mounts sonner's viewport. Render once, near the root layout - `toast.*()` can then be called from anywhere. */
export function Toaster() {
    return <SonnerToaster position={TOAST_POSITION} offset={TOAST_OFFSET} mobileOffset={{ bottom: 88, right: 16, left: 16 }} gap={12} toastOptions={{ unstyled: true }} />;
}
