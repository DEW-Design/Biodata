"use client";

// Custom component - not yet in components/base|application/**. See CONTEXT.md's "Custom
// components" section: this lives here until a stakeholder decides it belongs in the design
// system proper, at which point it moves to components/base (and this directory entry goes away),
// same lifecycle as components/custom/date-range/date-range-control.tsx.
//
// A real single-date picker: the same segmented DD/MM/YYYY DateField/DateSegment primitives
// components/base/input/input-date.tsx already styles, plus a real calendar-icon trigger button
// that opens a real Calendar popover - built on react-aria-components' own `DatePicker`
// composition (DateField + Button + Popover + Calendar) and the real DEW Popover
// (components/base/select/popover.tsx), the same combination date-range-control.tsx already
// proved out for a date *range*. `input-date.tsx` itself is untouched - it's a real, already-
// documented DEW component (see /components/input) whose segmented-only behaviour matches its own
// Figma reference, so this is an additive control for contexts that specifically need a clickable
// calendar, not a change to that component's contract. First real consumer: the Add Project
// wizard's Start Date/End Date/Embargo End Date fields, per direct request that every date field
// across all three steps be "a date selector," not a type-the-digits-only field.

import { useContext, type ReactNode } from "react";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "@untitledui/icons";
import {
    Button as AriaButton,
    Calendar,
    CalendarCell,
    CalendarStateContext,
    CalendarGrid,
    CalendarGridBody,
    CalendarGridHeader,
    CalendarHeaderCell,
    DateInput as AriaDateInput,
    DatePicker as AriaDatePicker,
    type DatePickerProps as AriaDatePickerProps,
    DateSegment as AriaDateSegment,
    Dialog,
    Group as AriaGroup,
    Heading,
    type DateValue,
} from "react-aria-components";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { Popover } from "@/components/base/select/popover";
import { cx } from "@/utils/cx";

export interface InputDatePickerProps<T extends DateValue = DateValue> extends Omit<AriaDatePickerProps<T>, "children" | "className"> {
    label?: string;
    hint?: ReactNode;
    hideRequiredIndicator?: boolean;
    className?: string;
}

// "Today" shortcut under the calendar: picks today's date (disabled when today is outside the field's
// min/max). Reads the surrounding Calendar's own state, so it needs no props.
function TodayButton() {
    const state = useContext(CalendarStateContext);
    const now = today(getLocalTimeZone());
    const unavailable = !state || state.isCellDisabled(now);
    return (
        <div className="mt-2 flex justify-center border-t border-secondary pt-2">
            <AriaButton
                slot={null}
                isDisabled={unavailable}
                onPress={() => state?.setValue(now)}
                className={({ isDisabled }) =>
                    cx("rounded-md px-3 py-1 text-sm font-semibold text-brand-secondary outline-focus-ring transition-colors hover:bg-brand-secondary focus-visible:outline-2", isDisabled && "pointer-events-none opacity-30")
                }
            >
                Today
            </AriaButton>
        </div>
    );
}

export function InputDatePicker<T extends DateValue = DateValue>({ label, hint, hideRequiredIndicator, className, ...props }: InputDatePickerProps<T>) {
    return (
        <AriaDatePicker {...props} className={cx("font-barlow group flex h-max w-full flex-col items-start justify-start gap-1.5", className)}>
            {({ isInvalid, isRequired }) => (
                <>
                    {label && (
                        <Label isRequired={hideRequiredIndicator ? !hideRequiredIndicator : isRequired} isInvalid={isInvalid}>
                            {label}
                        </Label>
                    )}

                    <AriaGroup
                        className={({ isFocusWithin, isDisabled, isInvalid }) =>
                            cx(
                                "flex w-full flex-row items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary transition-shadow duration-100 ease-linear ring-inset",
                                isFocusWithin && !isDisabled && "ring-2 ring-brand",
                                isDisabled && "cursor-not-allowed opacity-50",
                                isInvalid && "ring-error_subtle",
                                isInvalid && isFocusWithin && "ring-2 ring-error",
                            )
                        }
                    >
                        <AriaDateInput className="flex flex-1 px-3 py-2 text-sm">
                            {(segment) => (
                                <AriaDateSegment
                                    segment={segment}
                                    className={cx(
                                        "rounded px-0.5 text-primary tabular-nums caret-transparent focus:bg-brand-solid focus:font-medium focus:text-white focus:outline-hidden",
                                        segment.isPlaceholder && "text-placeholder uppercase",
                                        segment.type === "literal" && "text-fg-quaternary",
                                    )}
                                />
                            )}
                        </AriaDateInput>
                        <AriaButton
                            aria-label="Open calendar"
                            className="flex items-center px-3 py-2 text-fg-quaternary outline-hidden transition-colors hover:text-fg-quaternary_hover"
                        >
                            <CalendarIcon className="size-4" />
                        </AriaButton>
                    </AriaGroup>

                    {/* size="md" then an explicit w-auto override - same "cap the height, opt out
                        of the width-matches-trigger default" pattern date-range-control.tsx
                        already uses for its own Popover, since a calendar's natural width has
                        nothing to do with this field's own (often narrow) input width. */}
                    <Popover size="md" className="w-auto p-3">
                        <Dialog className="outline-hidden">
                            <Calendar>
                                <header className="mb-3 flex items-center justify-between gap-2">
                                    <AriaButton
                                        slot="previous"
                                        className={({ isDisabled }) =>
                                            cx(
                                                "flex size-7 items-center justify-center rounded-md text-quaternary outline-hidden transition-colors hover:bg-secondary",
                                                isDisabled && "pointer-events-none opacity-30",
                                            )
                                        }
                                    >
                                        <ChevronLeft className="size-4" />
                                    </AriaButton>
                                    <Heading className="text-sm font-semibold text-primary" />
                                    <AriaButton
                                        slot="next"
                                        className={({ isDisabled }) =>
                                            cx(
                                                "flex size-7 items-center justify-center rounded-md text-quaternary outline-hidden transition-colors hover:bg-secondary",
                                                isDisabled && "pointer-events-none opacity-30",
                                            )
                                        }
                                    >
                                        <ChevronRight className="size-4" />
                                    </AriaButton>
                                </header>
                                <CalendarGrid className="border-collapse">
                                    <CalendarGridHeader>
                                        {(day) => <CalendarHeaderCell className="size-8 text-xs font-medium text-quaternary">{day}</CalendarHeaderCell>}
                                    </CalendarGridHeader>
                                    <CalendarGridBody>
                                        {(date) => (
                                            <CalendarCell
                                                date={date}
                                                className={({ isSelected, isDisabled, isOutsideMonth, isFocusVisible, isToday }) =>
                                                    cx(
                                                        "flex size-8 cursor-pointer items-center justify-center rounded-md text-sm text-primary outline-hidden transition-colors hover:bg-secondary",
                                                        // Today is marked so it can always be found: bold brand text and a brand ring (a
                                                        // selected today keeps the solid fill).
                                                        isToday && !isSelected && "font-semibold text-brand-secondary ring-1 ring-brand ring-inset",
                                                        isSelected && "bg-brand-solid text-white hover:bg-brand-solid",
                                                        isOutsideMonth && "text-quaternary",
                                                        isDisabled && "pointer-events-none cursor-not-allowed opacity-30 hover:bg-transparent",
                                                        isFocusVisible && "outline-2 outline-offset-2 outline-brand",
                                                    )
                                                }
                                            />
                                        )}
                                    </CalendarGridBody>
                                </CalendarGrid>
                                <TodayButton />
                            </Calendar>
                        </Dialog>
                    </Popover>

                    {hint && (
                        <HintText isInvalid={isInvalid}>
                            {hint}
                        </HintText>
                    )}
                </>
            )}
        </AriaDatePicker>
    );
}

InputDatePicker.displayName = "InputDatePicker";
