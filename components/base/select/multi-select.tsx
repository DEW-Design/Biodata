"use client";

import type { ReactNode, RefAttributes } from "react";
import { useCallback, useRef, useState } from "react";
import { CheckDone01, ChevronDown, RefreshCcw01, SearchLg, XClose } from "@untitledui/icons";
import { useFilter } from "react-aria";
import type { Selection } from "react-aria-components";
import {
    Autocomplete as AriaAutocomplete,
    Button as AriaButton,
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    Input as AriaInput,
    ListBox as AriaListBox,
    Popover as AriaPopover,
    SearchField as AriaSearchField,
    TextContext as AriaTextContext,
} from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { SelectItem } from "./select-item";
import { type CommonProps, SelectContext, type SelectItemType, sizes } from "./select-shared";

const searchSizes = {
    sm: { wrapper: "py-1", root: "px-3 py-2 gap-2 *:data-icon:size-4 *:data-icon:stroke-[2.25px]", text: "text-sm" },
    md: { wrapper: "py-0.5", root: "px-3 py-2 gap-2 *:data-icon:size-5", text: "text-md" },
    lg: { wrapper: "py-0.5", root: "px-3.5 py-2.5 gap-2 *:data-icon:size-5", text: "text-md" },
};

const footerButtonSize = {
    sm: "xs" as const,
    md: "sm" as const,
    lg: "sm" as const,
};

const popoverMaxHeights = {
    sm: "max-h-68",
    md: "max-h-76",
    lg: "max-h-92",
};

interface MultiSelectFooterProps {
    /**
     * The size of the footer buttons.
     * @default "sm"
     */
    size?: "sm" | "md" | "lg";
    /** Handler that is called when the reset button is clicked. */
    onReset?: () => void;
    /** Handler that is called when the select all button is clicked. */
    onSelectAll?: () => void;
    /** Additional class name. */
    className?: string;
}

const MultiSelectFooter = ({ size = "sm", onReset, onSelectAll, className }: MultiSelectFooterProps) => {
    const btnSize = footerButtonSize[size];

    return (
        <div className={cx("flex items-center justify-between border-t border-secondary p-3", className)}>
            <Button size={btnSize} color="secondary" iconLeading={RefreshCcw01} onClick={onReset}>
                Reset
            </Button>
            <Button size={btnSize} color="secondary" iconLeading={CheckDone01} onClick={onSelectAll}>
                Select all
            </Button>
        </div>
    );
};

interface MultiSelectEmptyStateProps {
    /**
     * The title to display.
     * @default "No results found"
     */
    title?: string;
    /**
     * The description to display.
     * @default "Please try a different search term."
     */
    description?: string;
    /** Handler that is called when the clear search button is clicked. */
    onClearSearch?: () => void;
    /** Additional class name. */
    className?: string;
}

const MultiSelectEmptyState = ({
    title = "No results found",
    description = "Please try a different search term.",
    onClearSearch,
    className,
}: MultiSelectEmptyStateProps) => (
    <div className={cx("flex flex-col items-center gap-3 px-4 py-4", className)}>
        <div className="flex flex-col items-center gap-3">
            <FeaturedIcon icon={SearchLg} size="sm" color="gray" theme="modern" />
            <div className="flex flex-col items-center gap-0.5 text-center text-sm">
                <p className="font-semibold text-primary">{title}</p>
                <p className="text-tertiary">{description}</p>
            </div>
        </div>
        {onClearSearch && (
            <Button size="sm" color="link-color" onClick={onClearSearch}>
                Clear search
            </Button>
        )}
    </div>
);

interface MultiSelectProps extends RefAttributes<HTMLDivElement>, CommonProps {
    /** The items to display in the listbox. */
    items?: SelectItemType[];
    /** The children to render for each item. */
    children: ReactNode | ((item: SelectItemType) => ReactNode);
    /** The currently selected keys (controlled). */
    selectedKeys?: Selection;
    /** The initial selected keys (uncontrolled). */
    defaultSelectedKeys?: Selection;
    /** Handler that is called when the selection changes. */
    onSelectionChange?: (keys: Selection) => void;
    /** Whether the select is disabled. */
    isDisabled?: boolean;
    /** Whether the select is required. */
    isRequired?: boolean;
    /** Whether the select is in an invalid state. */
    isInvalid?: boolean;
    /** Additional class name for the popover. */
    popoverClassName?: string;
    /** Additional class name for the root element. */
    className?: string;
    /** Handler that is called when the reset button is clicked. */
    onReset?: () => void;
    /** Handler that is called when the select all button is clicked. */
    onSelectAll?: () => void;
    /**
     * Whether to show the footer with reset and select all buttons.
     * @default true
     */
    showFooter?: boolean;
    /**
     * Whether to show the search input in the popover.
     * @default true
     */
    showSearch?: boolean;
    /** The title to display when no items match the search. */
    emptyStateTitle?: string;
    /** The description to display when no items match the search. */
    emptyStateDescription?: string;
    /** Custom formatter for the selected count text in the trigger. */
    selectedCountFormatter?: (count: number) => ReactNode;
    /** Supporting text displayed next to the selected count in the trigger. */
    supportingText?: ReactNode;
    /**
     * "single" makes it a searchable single select: the trigger shows the chosen item (its label and
     * supporting text), picking an item closes the popover, and there is no footer.
     * @default "multiple"
     */
    selectionMode?: "multiple" | "single";
}

const MultiSelectRoot = ({
    items,
    children,
    size = "md",
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    isDisabled,
    isRequired,
    isInvalid,
    placeholder = "Select",
    label,
    hint,
    tooltip,
    hideRequiredIndicator,
    popoverClassName,
    className,
    onReset,
    onSelectAll,
    showFooter = true,
    showSearch = true,
    emptyStateTitle,
    emptyStateDescription,
    selectedCountFormatter,
    supportingText,
    selectionMode = "multiple",
}: MultiSelectProps) => {
    const single = selectionMode === "single";
    const [isOpen, setOpen] = useState(false);
    const { contains } = useFilter({ sensitivity: "base" });
    const [searchValue, setSearchValue] = useState("");

    const triggerRef = useRef<HTMLButtonElement>(null);
    const [popoverWidth, setPopoverWidth] = useState("");

    const onResize = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPopoverWidth(rect.width + "px");
    }, []);

    const selectedCount = selectedKeys instanceof Set ? selectedKeys.size : selectedKeys === "all" ? (items?.length ?? 0) : 0;
    const hasSelection = selectedCount > 0;
    const selectedItem = single && selectedKeys instanceof Set ? items?.find((item) => selectedKeys.has(item.id)) : undefined;

    const handleClearSearch = useCallback(() => {
        setSearchValue("");
    }, []);

    return (
        <SelectContext.Provider value={{ size }}>
            <div className={cx("font-barlow flex flex-col gap-1.5", className)}>
                {label && (
                    <Label isRequired={hideRequiredIndicator ? false : isRequired} isInvalid={isInvalid} tooltip={tooltip}>
                        {label}
                    </Label>
                )}

                <AriaDialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
                    <AriaButton
                        ref={triggerRef}
                        isDisabled={isDisabled}
                        onClick={onResize}
                        className={(state) =>
                            cx(
                                "relative flex w-full cursor-pointer items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary outline-hidden transition duration-100 ease-linear ring-inset",
                                (state.isFocusVisible || state.isPressed) && "ring-2 ring-brand",
                                state.isDisabled && "cursor-not-allowed opacity-50",
                            )
                        }
                    >
                        <span
                            className={cx(
                                "flex w-full items-center truncate text-left",
                                sizes[size].root,
                                "*:data-icon:shrink-0 *:data-icon:text-fg-quaternary",
                            )}
                        >
                            {single && selectedItem ? (
                                <span className={cx("flex min-w-0 items-center", sizes[size].textContainer)}>
                                    <span className={cx("truncate font-medium text-primary", sizes[size].text)}>{selectedItem.label}</span>
                                    {selectedItem.supportingText && (
                                        <span className={cx("truncate text-tertiary", sizes[size].text)}>{selectedItem.supportingText}</span>
                                    )}
                                </span>
                            ) : !single && hasSelection ? (
                                <span className={cx("flex items-center", sizes[size].textContainer)}>
                                    <span className={cx("font-medium text-primary", sizes[size].text)}>
                                        {selectedCountFormatter ? selectedCountFormatter(selectedCount) : `${selectedCount} selected`}
                                    </span>
                                    {supportingText && <span className={cx("text-tertiary", sizes[size].text)}>{supportingText}</span>}
                                </span>
                            ) : (
                                <span className={cx("text-placeholder", sizes[size].text)}>{placeholder}</span>
                            )}

                            <ChevronDown
                                aria-hidden="true"
                                className={cx("ml-auto shrink-0 text-fg-quaternary", size === "lg" ? "size-5" : "size-4 stroke-[2.25px]")}
                            />
                        </span>
                    </AriaButton>

                    <AriaPopover
                        placement="bottom"
                        offset={4}
                        containerPadding={0}
                        style={{ width: popoverWidth || undefined }}
                        className={(state) =>
                            cx(
                                // font-barlow: this Popover portals to <body>, outside any font-scoping
                                // wrapper around the trigger - see components/base/select/popover.tsx.
                                "font-barlow w-(--trigger-width) origin-(--trigger-anchor-point) overflow-hidden rounded-lg bg-primary shadow-lg ring-1 ring-secondary_alt outline-hidden will-change-transform",
                                state.isEntering &&
                                    "duration-150 ease-out animate-in fade-in placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                                state.isExiting &&
                                    "duration-100 ease-in animate-out fade-out placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                                popoverClassName,
                            )
                        }
                    >
                        <AriaDialog className="outline-hidden">
                            <AriaAutocomplete filter={contains} inputValue={searchValue} onInputChange={setSearchValue}>
                                {showSearch && (
                                    <div className={cx("border-b border-secondary", searchSizes[size].wrapper)}>
                                        <AriaSearchField aria-label="Search" value={searchValue} onChange={setSearchValue} autoFocus className="group/search">
                                            <div className={cx("flex items-center", searchSizes[size].root)}>
                                                <SearchLg data-icon aria-hidden="true" className="shrink-0 text-fg-quaternary" />
                                                <AriaInput
                                                    placeholder="Search"
                                                    className={cx(
                                                        "w-full appearance-none bg-transparent text-primary caret-[var(--ui-text-primary)] outline-hidden placeholder:text-placeholder",
                                                        searchSizes[size].text,
                                                    )}
                                                />
                                                <AriaButton
                                                    aria-label="Clear search"
                                                    className="flex shrink-0 cursor-pointer items-center justify-center rounded-sm text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 group-data-empty/search:hidden"
                                                >
                                                    <XClose aria-hidden="true" className="size-4 stroke-[2.25px]" />
                                                </AriaButton>
                                            </div>
                                        </AriaSearchField>
                                    </div>
                                )}

                                <AriaListBox
                                    aria-label={label || "Options"}
                                    items={items}
                                    selectionMode={single ? "single" : "multiple"}
                                    // Escape closes the popover and never touches the value: react-aria's
                                    // default ("clearSelection") wiped the whole selection on Escape.
                                    escapeKeyBehavior="none"
                                    selectedKeys={selectedKeys}
                                    defaultSelectedKeys={defaultSelectedKeys}
                                    onSelectionChange={(keys) => {
                                        onSelectionChange?.(keys);
                                        // A single choice is made in one pick: close, and focus returns to the trigger.
                                        if (single) setOpen(false);
                                    }}
                                    renderEmptyState={() => (
                                        <MultiSelectEmptyState
                                            title={emptyStateTitle}
                                            description={emptyStateDescription}
                                            onClearSearch={searchValue ? handleClearSearch : undefined}
                                        />
                                    )}
                                    className={cx("overflow-y-auto py-1 outline-hidden", popoverMaxHeights[size])}
                                >
                                    {children}
                                </AriaListBox>
                            </AriaAutocomplete>

                            {showFooter && !single && <MultiSelectFooter size={size} onReset={onReset} onSelectAll={onSelectAll} />}
                        </AriaDialog>
                    </AriaPopover>
                </AriaDialogTrigger>

                {/* MultiSelect is not a react-aria field, so its hint would otherwise pick up the text slots
                    of whatever surrounds it: inside a Dialog (a FormModal) that offers only "description",
                    and an invalid hint's "errorMessage" slot threw. The hint takes no outside slots. */}
                {hint && (
                    <AriaTextContext.Provider value={null}>
                        <HintText isInvalid={isInvalid} className={cx(size === "sm" && "text-xs")}>
                            {hint}
                        </HintText>
                    </AriaTextContext.Provider>
                )}
            </div>
        </SelectContext.Provider>
    );
};

const MultiSelect = MultiSelectRoot as typeof MultiSelectRoot & {
    Item: typeof SelectItem;
    Footer: typeof MultiSelectFooter;
    EmptyState: typeof MultiSelectEmptyState;
};

MultiSelect.Item = SelectItem;
MultiSelect.Footer = MultiSelectFooter;
MultiSelect.EmptyState = MultiSelectEmptyState;

export { MultiSelect };
