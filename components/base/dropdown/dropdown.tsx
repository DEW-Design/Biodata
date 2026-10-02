"use client";

import { type FC, type RefAttributes, useCallback } from "react";
import { Check, ChevronRight, DotsVertical } from "@untitledui/icons";
import type {
    ButtonProps as AriaButtonProps,
    MenuItemProps as AriaMenuItemProps,
    MenuProps as AriaMenuProps,
    PopoverProps as AriaPopoverProps,
    SeparatorProps as AriaSeparatorProps,
    MenuItemRenderProps,
} from "react-aria-components";
import {
    Button as AriaButton,
    Header as AriaHeader,
    Menu as AriaMenu,
    MenuItem as AriaMenuItem,
    MenuSection as AriaMenuSection,
    MenuTrigger as AriaMenuTrigger,
    Popover as AriaPopover,
    Separator as AriaSeparator,
} from "react-aria-components";
import { cx } from "@/utils/cx";
import { Avatar } from "../avatar/avatar";
import { CheckboxBase } from "../checkbox/checkbox";
import { RadioButtonBase } from "../radio-buttons/radio-buttons";
import { ToggleBase } from "../toggle/toggle";

interface DropdownItemProps extends AriaMenuItemProps {
    /** The label of the item to be displayed. */
    label?: string;
    /** An addon to be displayed on the right side of the item. */
    addon?: string;
    /** If true, the item will not have any styles. */
    unstyled?: boolean;
    /** An icon to be displayed on the left side of the item. */
    icon?: FC<{ className?: string }>;
    /** Avatar URL to be displayed on the left side of the item. */
    avatarUrl?: string;
    /**
     * The selection indicator to be displayed on the item. `"checkmark"` reserves a column on the left for a tick (the labels
     * line up whether or not an item is on); `"checkmark-end"` draws the tick after the label only on what is on, and reserves
     * nothing, so a menu where few items are on has no empty column beside the labels.
     */
    selectionIndicator?: "checkmark" | "checkmark-end" | "checkbox" | "radio" | "toggle" | "none";
    /** A destructive action (delete, remove): error-coloured label and icon, and an error-tinted hover. */
    destructive?: boolean;
}

const DropdownItem = ({ label, children, addon, icon: Icon, avatarUrl, unstyled, selectionIndicator = "checkmark", destructive = false, ...props }: DropdownItemProps) => {
    const SelectionIndicator = useCallback(
        (state: MenuItemRenderProps & { className?: string }) => {
            if (selectionIndicator === "checkmark") {
                return (
                    <Check
                        aria-hidden="true"
                        className={cx("size-4 shrink-0 stroke-[2.25px] text-fg-brand-primary", !state.isSelected && "invisible", state.className)}
                    />
                );
            }
            if (selectionIndicator === "checkbox") {
                return (
                    <CheckboxBase
                        isSelected={state.isSelected && !state.hasSubmenu}
                        isIndeterminate={state.isSelected && state.hasSubmenu}
                        size="sm"
                        className={cx("shrink-0", state.className)}
                    />
                );
            }
            if (selectionIndicator === "radio") {
                return <RadioButtonBase isSelected={state.isSelected} className={cx("shrink-0", state.className)} />;
            }
            if (selectionIndicator === "toggle") {
                return <ToggleBase slim size="sm" isSelected={state.isSelected} className={cx("shrink-0", state.className)} />;
            }
            return null;
        },
        [selectionIndicator],
    );

    if (unstyled) {
        return <AriaMenuItem id={label} textValue={label} {...props} />;
    }

    return (
        <AriaMenuItem
            {...props}
            className={(state) =>
                cx(
                    "group block cursor-pointer px-1.5 py-px outline-hidden",
                    state.isDisabled && "cursor-not-allowed opacity-50",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        >
            {(state) => (
                <div
                    className={cx(
                        "relative flex items-center rounded-md px-2.5 py-2 outline-focus-ring transition duration-100 ease-linear",
                        !state.isDisabled && (destructive ? "group-hover:bg-error-primary" : "group-hover:bg-primary_hover"),
                        state.isFocused && (destructive ? "bg-error-primary" : "bg-primary_hover"),
                        // A row whose submenu is open stays marked while the pointer is over the submenu, so the pair reads as one
                        // (the parent is where you came from, as in a macOS or iOS menu).
                        state.isOpen && !destructive && "bg-primary_hover",
                        state.isFocusVisible && "outline-2 -outline-offset-2",
                        state.hasSubmenu && "pr-1.5",
                    )}
                >
                    {state.selectionMode !== "none" && !avatarUrl && !Icon && <SelectionIndicator {...state} className="mr-2" />}

                    {avatarUrl && (
                        <div className="mr-2 flex size-4 items-center justify-center">
                            <Avatar aria-hidden="true" size="xs" src={avatarUrl} alt={label} className="size-5" />
                        </div>
                    )}

                    {Icon && <Icon aria-hidden="true" className={cx("mr-2 size-4 shrink-0 stroke-[2.25px]", destructive ? "text-fg-error-secondary" : "text-fg-quaternary")} />}

                    <span
                        className={cx(
                            "grow truncate text-sm font-semibold",
                            destructive ? "text-error-primary" : "text-secondary",
                            state.isFocused && (destructive ? "text-error-primary_hover" : "text-secondary_hover"),
                        )}
                    >
                        {label || (typeof children === "function" ? children(state) : children)}
                    </span>

                    {addon && <span className="ml-1 shrink-0 pr-1 text-xs font-medium text-quaternary">{addon}</span>}

                    {selectionIndicator === "checkmark-end" && state.selectionMode !== "none" && state.isSelected && (
                        <Check aria-hidden="true" className="ml-2 size-4 shrink-0 stroke-[2.25px] text-fg-brand-primary" />
                    )}

                    {state.selectionMode !== "none" && (avatarUrl || Icon) && <SelectionIndicator {...state} className="ml-1" />}

                    {state.hasSubmenu && <ChevronRight aria-hidden="true" className="ml-auto size-4 shrink-0 stroke-[2.25px] text-fg-quaternary" />}
                </div>
            )}
        </AriaMenuItem>
    );
};

type DropdownMenuProps<T extends object> = AriaMenuProps<T>;

const DropdownMenu = <T extends object>(props: DropdownMenuProps<T>) => {
    return (
        <AriaMenu
            // Escape closes the menu and never touches what is ticked: react-aria's default ("clearSelection") wiped every
            // tick in a multiple-selection menu on the first Escape, and ate the key so it took a second to close (CONTRACTS 1.9a).
            escapeKeyBehavior="none"
            {...props}
            className={(state) =>
                cx("h-min overflow-y-auto py-1 outline-hidden select-none", typeof props.className === "function" ? props.className(state) : props.className)
            }
        />
    );
};

type DropdownPopoverProps = AriaPopoverProps;

const DropdownPopover = (props: DropdownPopoverProps) => {
    return (
        <AriaPopover
            placement="bottom right"
            // 12px, not react-aria's 8: the trigger's pressed and focus ring (DropdownDotsButton draws a
            // 2px outline 2px out, so it reaches 4px) is open while the menu is, and at 8px the menu sat
            // 4px from the ring and read as touching the button. 4px of ring + the same 8px gap every
            // other trigger has. Callers can still pass their own `offset`.
            offset={12}
            {...props}
            className={(state) =>
                cx(
                    // font-barlow: this Popover portals to <body>, outside any font-scoping
                    // wrapper around the trigger - see components/base/select/popover.tsx.
                    // min-h-fit: a menu keeps its full height, so when there isn't room below the
                    // trigger react-aria flips it above (or beside) instead of shrinking it into a
                    // tiny scrolling box (CONTRACTS 1.9: behaviour fixed once, in the component).
                    "font-barlow min-h-fit w-62 origin-(--trigger-anchor-point) overflow-auto rounded-lg bg-primary shadow-lg ring-1 ring-secondary_alt will-change-transform",
                    state.isEntering &&
                        "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                    state.isExiting &&
                        "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        >
            {props.children}
        </AriaPopover>
    );
};

/**
 * The popover of a submenu (`SubmenuTrigger`). It tucks against its parent menu and lines its first row up with the row
 * that opened it, as a macOS or iOS menu does, instead of floating a trigger-sized gap away at an unrelated height:
 * a slight overlap (`offset`) and the popover's own padding taken off (`crossOffset`). Extra props pass through.
 */
const DropdownSubmenuPopover = (props: DropdownPopoverProps) => {
    return <DropdownPopover placement="end top" offset={-2} {...props} crossOffset={props.crossOffset ?? -5} />;
};

const DropdownSeparator = (props: AriaSeparatorProps) => {
    return <AriaSeparator {...props} className={cx("my-1 h-px w-full bg-[var(--ui-border-secondary)]", props.className)} />;
};

const DropdownDotsButton = ({ "aria-label": ariaLabel = "Open menu", ...props }: AriaButtonProps & RefAttributes<HTMLButtonElement>) => {
    return (
        <AriaButton
            {...props}
            aria-label={ariaLabel}
            className={(state) =>
                cx(
                    "cursor-pointer rounded-md text-fg-quaternary outline-focus-ring transition duration-100 ease-linear",
                    (state.isPressed || state.isHovered) && "text-fg-quaternary_hover",
                    (state.isPressed || state.isFocusVisible) && "outline-2 outline-offset-2",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        >
            <DotsVertical className="size-5 transition-inherit-all" />
        </AriaButton>
    );
};

export const Dropdown = {
    Root: AriaMenuTrigger,
    Popover: DropdownPopover,
    SubmenuPopover: DropdownSubmenuPopover,
    Menu: DropdownMenu,
    Section: AriaMenuSection,
    SectionHeader: AriaHeader,
    Item: DropdownItem,
    Separator: DropdownSeparator,
    DotsButton: DropdownDotsButton,
};
