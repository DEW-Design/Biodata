"use client";

import type { FC, FocusEventHandler, PointerEventHandler, ReactNode, Ref, RefAttributes } from "react";
import { isValidElement, useCallback, useContext, useRef, useState } from "react";
import { SearchLg } from "@untitledui/icons";
import type { ComboBoxProps as AriaComboBoxProps, GroupProps as AriaGroupProps, ListBoxProps as AriaListBoxProps } from "react-aria-components";
import { ComboBox as AriaComboBox, Group as AriaGroup, Input as AriaInput, ListBox as AriaListBox, ComboBoxStateContext } from "react-aria-components";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { Popover } from "@/components/base/select/popover";
import { type CommonProps, SelectContext, type SelectItemType, sizes } from "@/components/base/select/select-shared";
import { useResizeObserver } from "@/hooks/use-resize-observer";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";

interface ComboBoxProps extends Omit<AriaComboBoxProps<SelectItemType>, "children" | "items">, RefAttributes<HTMLDivElement>, CommonProps {
    shortcut?: boolean;
    items?: SelectItemType[];
    popoverClassName?: string;
    shortcutClassName?: string;
    /** Leading icon component displayed before the input. */
    icon?: FC | ReactNode;
    /** Content rendered inside the popover, above the list - e.g. filter chips for a searchable
     * list that also needs to be filterable, not just typed into. */
    listboxHeader?: ReactNode;
    /** Content rendered inside the popover, below the list - e.g. a "Show N more results" control
     * for a capped list. Lives outside `AriaListBox`'s own item collection on purpose: a plain
     * element here doesn't go through `onSelectionChange`, so clicking it can't set `inputValue`
     * to its own label text or force-select anything the way a real (non-disabled) listbox item
     * would. */
    listboxFooter?: ReactNode;
    /** Minimum width of the popover in px. By default the list is exactly as wide as the input, which
     * clips a result that carries a second line. The list is never narrower than the input. */
    popoverMinWidth?: number;
    /** Size preset for the list's maximum height. Defaults to `size`. `"auto"` lets the list grow to
     * its content, bounded by the space left in the window. */
    popoverSize?: "sm" | "md" | "lg" | "auto";
    children: AriaListBoxProps<SelectItemType>["children"];
}

interface ComboBoxValueProps extends AriaGroupProps {
    size: "sm" | "md" | "lg";
    shortcut: boolean;
    placeholder?: string;
    shortcutClassName?: string;
    icon?: FC | ReactNode;
    onFocus?: FocusEventHandler;
    onPointerEnter?: PointerEventHandler;
    ref?: Ref<HTMLDivElement>;
}

const ComboBoxValue = ({ size, shortcut, placeholder, shortcutClassName, icon: IconProp, ref, ...otherProps }: ComboBoxValueProps) => {
    const state = useContext(ComboBoxStateContext);

    const value = state?.selectedItem?.value || null;
    const inputValue = state?.inputValue || null;

    const first = inputValue?.split(value?.supportingText)?.[0] || "";
    const last = inputValue?.split(first)[1];

    return (
        <AriaGroup
            ref={ref}
            {...otherProps}
            className={({ isFocusWithin, isDisabled }) =>
                cx(
                    "relative flex w-full items-center gap-2 rounded-lg bg-primary shadow-xs ring-1 ring-primary outline-hidden transition-shadow duration-100 ease-linear ring-inset",
                    isDisabled && "cursor-not-allowed opacity-50",
                    isFocusWithin && "ring-2 ring-brand",

                    // Icon styles
                    "*:data-icon:shrink-0 *:data-icon:text-fg-quaternary",

                    sizes[size].root,
                )
            }
        >
            {isReactComponent(IconProp) ? (
                <IconProp data-icon className="pointer-events-none" aria-hidden="true" />
            ) : isValidElement(IconProp) ? (
                IconProp
            ) : (
                <SearchLg data-icon className="pointer-events-none" aria-hidden="true" />
            )}

            <div className="relative flex w-full items-center">
                {inputValue && (
                    <span className={cx("absolute top-1/2 z-0 inline-flex w-full -translate-y-1/2 truncate", sizes[size].textContainer)} aria-hidden="true">
                        <p className={cx("font-medium text-primary", sizes[size].text)}>{first}</p>
                        {last && <p className={cx("-ml-0.75 text-tertiary", sizes[size].text)}>{last}</p>}
                    </span>
                )}

                <AriaInput
                    placeholder={placeholder}
                    className={cx(
                        "z-10 w-full appearance-none bg-transparent text-transparent caret-[var(--ui-text-primary)] placeholder:text-placeholder focus:outline-hidden disabled:cursor-not-allowed",
                        sizes[size].text,
                    )}
                />
            </div>

            {shortcut && (
                <div
                    className={cx(
                        "absolute inset-y-0.5 right-0.5 z-10 hidden items-center rounded-r-[inherit] bg-linear-to-r from-transparent to-[var(--ui-bg-primary)] to-40% pl-8 md:flex",
                        sizes[size].shortcut,
                        shortcutClassName,
                    )}
                >
                    <span
                        className="pointer-events-none rounded px-1 py-px text-xs font-medium text-quaternary ring-1 ring-secondary select-none ring-inset"
                        aria-hidden="true"
                    >
                        ⌘K
                    </span>
                </div>
            )}
        </AriaGroup>
    );
};

export const ComboBox = ({
    placeholder = "Search",
    shortcut = true,
    size = "md",
    children,
    items,
    shortcutClassName,
    icon,
    listboxHeader,
    listboxFooter,
    popoverMinWidth,
    popoverSize,
    hideRequiredIndicator,
    ...otherProps
}: ComboBoxProps) => {
    const placeholderRef = useRef<HTMLDivElement>(null);
    const [popoverWidth, setPopoverWidth] = useState("");

    // Resize observer for popover width
    const onResize = useCallback(() => {
        if (!placeholderRef.current) return;

        const divRect = placeholderRef.current?.getBoundingClientRect();

        setPopoverWidth(divRect.width + "px");
    }, [placeholderRef, setPopoverWidth]);

    useResizeObserver({
        ref: placeholderRef,
        box: "border-box",
        onResize,
    });

    return (
        <SelectContext.Provider value={{ size }}>
            <AriaComboBox menuTrigger="focus" {...otherProps}>
                {(state) => (
                    <div className="font-barlow flex flex-col gap-1.5">
                        {otherProps.label && (
                            <Label isRequired={hideRequiredIndicator ? false : state.isRequired} tooltip={otherProps.tooltip}>
                                {otherProps.label}
                            </Label>
                        )}

                        <ComboBoxValue
                            ref={placeholderRef}
                            placeholder={placeholder}
                            shortcut={shortcut}
                            shortcutClassName={shortcutClassName}
                            icon={icon}
                            size={size}
                            // This is a workaround to correctly calculating the trigger width
                            // while using ResizeObserver wasn't 100% reliable.
                            onFocus={onResize}
                            onPointerEnter={onResize}
                        />

                        <Popover size={popoverSize ?? size} triggerRef={placeholderRef} style={{ width: popoverWidth, minWidth: popoverMinWidth }} className={otherProps.popoverClassName}>
                            {listboxHeader}
                            <AriaListBox items={items} className="size-full outline-hidden">
                                {children}
                            </AriaListBox>
                            {listboxFooter}
                        </Popover>

                        {otherProps.hint && (
                            <HintText isInvalid={state.isInvalid} className={cx(size === "sm" && "text-xs")}>
                                {otherProps.hint}
                            </HintText>
                        )}
                    </div>
                )}
            </AriaComboBox>
        </SelectContext.Provider>
    );
};
