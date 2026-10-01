"use client";

import type { FC, FocusEventHandler, PointerEventHandler, ReactNode, Ref, RefAttributes } from "react";
import { isValidElement, useCallback, useContext, useEffect, useRef, useState } from "react";
import { SearchLg } from "@untitledui/icons";
import type { ComboBoxProps as AriaComboBoxProps, GroupProps as AriaGroupProps, ListBoxProps as AriaListBoxProps } from "react-aria-components";
import { ComboBox as AriaComboBox, Group as AriaGroup, Input as AriaInput, ListBox as AriaListBox, ComboBoxStateContext, PopoverContext, ButtonContext } from "react-aria-components";
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
    /** Where the list is drawn. `"popover"` (default) floats it in its own card under the field.
     * `"inline"` draws it in place, straight under the field and scrolling inside itself, for a
     * ComboBox that already sits in a card or popup of its own (a search box at the top of a popup,
     * with the list beneath). The field, filtering, keyboard and selection behave the same either way;
     * `popoverSize` still sets the list's maximum height, and `listboxHeader`/`listboxFooter` still apply. */
    listbox?: "popover" | "inline";
    children: AriaListBoxProps<SelectItemType>["children"];
}

/** Keeps an inline list open. A ComboBox only builds its visible items while its list is open, so an
 *  inline list mounted with the field would stay empty until the first keystroke. Opens it on mount,
 *  and again whenever it closes (Escape, or a choice), so the list is always there. */
const KeepOpen = () => {
    const state = useContext(ComboBoxStateContext);
    const isOpen = state?.isOpen;
    useEffect(() => {
        // Only with nothing typed: a manual open shows every item, which would undo the filter when a
        // search matches nothing (the list then closes on its own and should stay empty).
        if (state && !isOpen && state.inputValue === "") state.open(null, "manual");
    });
    return null;
};

/** The region an inline list lives in. A ComboBox hides everything outside its input and its popover from assistive
 *  technology while it is open; an inline list has no popover, so without this the list (and anything beside it)
 *  would be hidden too, and a screen reader would hear an empty field. The popover's ref, which the ComboBox makes and
 *  reads, goes on this element instead: it is also what counts as "still inside" when focus moves from the field
 *  into the list or the footer. */
const InlineRegion = ({ children }: { children: ReactNode }) => {
    const popover = useContext(PopoverContext) as { ref?: Ref<HTMLDivElement> } | null;
    return (
        // The ComboBox hands its own trigger button, and the like, to any button inside it. A floating list is cleared of
        // those for its content (react-aria's Popover does it); an inline region has to as well, or a footer button would
        // become "Show suggestions" and drop out of the tab order.
        <div ref={popover?.ref} className="flex flex-col">
            <ButtonContext.Provider value={null}>{children}</ButtonContext.Provider>
        </div>
    );
};

// The same maximum heights the floating list uses (select/popover.tsx), for the inline list.
const inlineListMaxHeight = { sm: "max-h-56", md: "max-h-64", lg: "max-h-80", auto: "" };

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
    shortcut = false,
    size = "md",
    children,
    items,
    shortcutClassName,
    icon,
    listboxHeader,
    listboxFooter,
    popoverMinWidth,
    popoverSize,
    listbox = "popover",
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

                        {listbox === "inline" ? (
                            <InlineRegion>
                                <div className={cx("overflow-x-hidden overflow-y-auto py-1", inlineListMaxHeight[popoverSize ?? size], otherProps.popoverClassName)}>
                                    <KeepOpen />
                                    {listboxHeader}
                                    <AriaListBox items={items} className="size-full outline-hidden">
                                        {children}
                                    </AriaListBox>
                                </div>
                                {/* Fixed under the scrolling list, inside the region, so it stays on screen and in the accessibility tree. */}
                                {listboxFooter}
                            </InlineRegion>
                        ) : (
                            <Popover size={popoverSize ?? size} triggerRef={placeholderRef} style={{ width: popoverWidth, minWidth: popoverMinWidth }} className={otherProps.popoverClassName}>
                                {listboxHeader}
                                <AriaListBox items={items} className="size-full outline-hidden">
                                    {children}
                                </AriaListBox>
                                {listboxFooter}
                            </Popover>
                        )}

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
