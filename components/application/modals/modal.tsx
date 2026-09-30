"use client";

import type { FC, FormEvent, ReactNode } from "react";
import { AlertTriangle, HelpCircle } from "@untitledui/icons";
import type { DialogProps as AriaDialogProps, ModalOverlayProps as AriaModalOverlayProps } from "react-aria-components";
import { Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Form as AriaForm, Heading as AriaHeading, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { MODAL_Z_INDEX } from "@/lib/layers";
import { cx } from "@/utils/cx";

export const DialogTrigger = AriaDialogTrigger;

export const ModalOverlay = (props: AriaModalOverlayProps) => {
    return (
        <AriaModalOverlay
            {...props}
            className={(state) =>
                cx(
                    MODAL_Z_INDEX,
                    "fixed inset-0 flex min-h-dvh w-full items-end justify-center bg-overlay px-4 outline-hidden backdrop-blur-[6px] sm:items-center sm:justify-center sm:px-8",
                    // Vertical padding
                    "pt-(--modal-pt) pb-(--modal-pb) [--modal-pb:clamp(16px,8vh,64px)] [--modal-pt:16px] sm:[--modal-pb:32px] sm:[--modal-pt:32px]",
                    // Animations
                    state.isEntering && "duration-300 ease-out animate-in fade-in",
                    state.isExiting && "duration-200 ease-in animate-out fade-out",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        />
    );
};

export const Modal = (props: AriaModalOverlayProps) => (
    <AriaModal
        {...props}
        className={(state) =>
            cx(
                "rounded-xl bg-primary align-middle shadow-xl outline-hidden max-sm:overflow-y-auto sm:rounded-2xl",
                // Max height based on parent's vertical padding
                "max-h-[calc(var(--visual-viewport-height)-var(--modal-pt)-var(--modal-pb))]",
                // Animations
                state.isEntering && "duration-300 ease-out animate-in zoom-in-95",
                state.isExiting && "duration-200 ease-in animate-out zoom-out-95",
                typeof props.className === "function" ? props.className(state) : props.className,
            )
        }
    />
);

export const Dialog = (props: AriaDialogProps) => (
    <AriaDialog
        {...props}
        // font-barlow: Modal/ModalOverlay portal to a container appended straight to <body>,
        // outside whatever font-scoping wrapper rendered the trigger - so like Popover
        // (see components/base/select/popover.tsx), it can't inherit the font and falls
        // back to the site default (Geist) instead.
        className={cx("relative max-h-[inherit] w-full overflow-y-auto font-barlow outline-hidden", props.className)}
    />
);

// ── Anatomy, copied from Untitled UI's own modal examples (npx untitledui add modals/stacked-left-aligned,
// modals/destructive-stacked-left-aligned, modals/horizontal, modals/destructive-horizontal,
// modals/input-field), with only our tokens and copy rules applied (text-base for Untitled's text-md,
// text-balance on copy that can wrap). Do not restyle it here: match Untitled.
//
// - Stacked (400px): the close X floats in the top-right corner; a 40px "modern" featured icon; the
//   title with the description under it; two equal-width buttons (secondary, then primary) in a
//   two-column row, stacked full width with the primary on top on a phone. No divider.
// - Horizontal (544px): the icon beside the title, and the buttons right-aligned at their natural
//   width. Used when a modal has three actions (a discard prompt with Save draft), which don't fit
//   Untitled's two-column row.
// The page behind is dimmed (`bg-overlay`, black 40%) as well as blurred.

type ModalLayout = "stacked" | "horizontal";
type ModalIconColor = "brand" | "gray" | "error" | "warning" | "success";

function ModalHeader({
    icon: Icon,
    iconColor = "brand",
    title,
    description,
    layout = "stacked",
}: {
    icon?: FC<{ className?: string }>;
    iconColor?: ModalIconColor;
    title: string;
    description?: ReactNode;
    layout?: ModalLayout;
}) {
    return (
        <>
            <CloseButton theme="light" size="sm" className="absolute top-3 right-3 z-20 sm:top-4 sm:right-4" />
            <div className={cx("flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6", layout === "horizontal" && "sm:flex-row")}>
                {Icon && (
                    <div className={cx("relative", layout === "horizontal" ? "size-max" : "w-max")}>
                        <FeaturedIcon color={iconColor} size="md" theme="modern" icon={Icon} />
                    </div>
                )}
                {/* Room on the right for the floating X wherever the title is on the first row. */}
                <div className={cx("z-10 flex flex-col gap-0.5", (!Icon || layout === "horizontal") && "pr-8")}>
                    <AriaHeading slot="title" className="text-base font-semibold text-balance text-primary">
                        {title}
                    </AriaHeading>
                    {description && <p className="text-sm text-balance text-tertiary">{description}</p>}
                </div>
            </div>
        </>
    );
}

function ModalFooter({ layout = "stacked", children }: { layout?: ModalLayout; children: ReactNode }) {
    return (
        <div
            className={cx(
                "z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 sm:px-6 sm:pt-8 sm:pb-6",
                layout === "stacked" ? "*:grow sm:grid sm:grid-cols-2" : "sm:flex-row sm:items-center sm:justify-end",
            )}
        >
            {children}
        </div>
    );
}

const layoutWidth: Record<ModalLayout, string> = { stacked: "w-full sm:max-w-100", horizontal: "w-full sm:max-w-136" };

interface ConfirmationModalProps {
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    /** @default HelpCircle */
    icon?: FC<{ className?: string }>;
    /** @default "brand" */
    iconColor?: "brand" | "gray" | "success" | "warning";
    title: string;
    description?: ReactNode;
    /** @default "Confirm" */
    confirmLabel?: string;
    /** @default "Cancel" */
    cancelLabel?: string;
    onConfirm?: () => void;
    isConfirmLoading?: boolean;
}

/** Neutral "are you sure?" prompt for a reversible or low-stakes action (Untitled UI's stacked left-aligned modal). */
export const ConfirmationModal = ({
    isOpen,
    onOpenChange,
    icon = HelpCircle,
    iconColor = "brand",
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    isConfirmLoading,
}: ConfirmationModalProps) => (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={!isConfirmLoading}>
        <Modal className={layoutWidth.stacked}>
            <Dialog>
                <ModalHeader icon={icon} iconColor={iconColor} title={title} description={description} />
                <ModalFooter>
                    <Button color="secondary" size="md" slot="close">
                        {cancelLabel}
                    </Button>
                    <Button color="primary" size="md" isLoading={isConfirmLoading} onPress={onConfirm}>
                        {confirmLabel}
                    </Button>
                </ModalFooter>
            </Dialog>
        </Modal>
    </ModalOverlay>
);

interface DestructiveModalProps {
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    /** @default AlertTriangle */
    icon?: FC<{ className?: string }>;
    title: string;
    description?: ReactNode;
    /** @default "Delete" */
    confirmLabel?: string;
    /** @default "Cancel" */
    cancelLabel?: string;
    onConfirm?: () => void;
    isConfirmLoading?: boolean;
    /**
     * An optional way to keep the work instead of losing it, shown between Cancel and the destructive
     * action - "Save draft" in a form's discard prompt. With it, the modal uses Untitled UI's horizontal
     * layout, since three actions don't fit the stacked two-column row. Omit when there is nothing to keep.
     */
    secondaryLabel?: string;
    onSecondary?: () => void;
}

/** Warns before an irreversible action (delete, remove, revoke, discard): Untitled UI's destructive modal, with an error icon and the confirm button in the destructive colour. */
export const DestructiveModal = ({
    isOpen,
    onOpenChange,
    icon = AlertTriangle,
    title,
    description,
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    onConfirm,
    isConfirmLoading,
    secondaryLabel,
    onSecondary,
}: DestructiveModalProps) => {
    const layout: ModalLayout = secondaryLabel && onSecondary ? "horizontal" : "stacked";
    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={!isConfirmLoading}>
            <Modal className={layoutWidth[layout]}>
                <Dialog>
                    <ModalHeader icon={icon} iconColor="error" title={title} description={description} layout={layout} />
                    <ModalFooter layout={layout}>
                        <Button color="secondary" size="md" slot="close">
                            {cancelLabel}
                        </Button>
                        {layout === "horizontal" && (
                            <Button color="secondary" size="md" isDisabled={isConfirmLoading} onPress={onSecondary}>
                                {secondaryLabel}
                            </Button>
                        )}
                        <Button color="primary-destructive" size="md" isLoading={isConfirmLoading} onPress={onConfirm}>
                            {confirmLabel}
                        </Button>
                    </ModalFooter>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

interface FormModalProps {
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    /** A featured icon above the title, as in Untitled UI's form modals. */
    icon?: FC<{ className?: string }>;
    /** @default "gray" */
    iconColor?: ModalIconColor;
    title: string;
    description?: ReactNode;
    /** Form fields - typically `Input`/`Checkbox`/etc. from `components/base`. */
    children: ReactNode;
    /** @default "Save" */
    submitLabel?: string;
    /** @default "Cancel" */
    cancelLabel?: string;
    onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
    isSubmitLoading?: boolean;
    /** @default "md" */
    size?: "sm" | "md" | "lg";
}

const formModalSizes = {
    sm: "sm:max-w-100",
    md: "sm:max-w-120",
    lg: "sm:max-w-160",
};

/**
 * General-purpose modal shell for arbitrary content - most commonly a form (Untitled UI's input-field
 * and form modals): the stacked header, the fields, and the two-button row.
 */
export const FormModal = ({
    isOpen,
    onOpenChange,
    icon,
    iconColor = "gray",
    title,
    description,
    children,
    submitLabel = "Save",
    cancelLabel = "Cancel",
    onSubmit,
    isSubmitLoading,
    size = "md",
}: FormModalProps) => (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={!isSubmitLoading}>
        <Modal className={cx("w-full", formModalSizes[size])}>
            <Dialog>
                <AriaForm
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit?.(e);
                    }}
                >
                    <ModalHeader icon={icon} iconColor={iconColor} title={title} description={description} />
                    <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6">{children}</div>
                    <ModalFooter>
                        <Button color="secondary" size="md" slot="close" isDisabled={isSubmitLoading}>
                            {cancelLabel}
                        </Button>
                        <Button type="submit" color="primary" size="md" isLoading={isSubmitLoading}>
                            {submitLabel}
                        </Button>
                    </ModalFooter>
                </AriaForm>
            </Dialog>
        </Modal>
    </ModalOverlay>
);

/** The shared header and footer, for app modals that compose their own body (the sign-up invite, Add location). */
export { ModalHeader, ModalFooter };
