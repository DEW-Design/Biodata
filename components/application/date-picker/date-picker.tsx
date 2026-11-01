"use client";

// Ingested from Untitled UI (OVR-015). Changes after ingest: icons on Cancel and Apply (CONTRACTS 3.12); the typeface on the popover (2.2); the pick is held in a draft, so Apply commits it
// and Cancel, Escape and a press outside keep the date (1.9); the trigger's accessible name leads with the date it shows (React Aria's "Calendar" did not say it); and today is read when the picker mounts, not when the file loads.

import { useMemo, useRef, useState } from "react";
import { getLocalTimeZone, today } from "@internationalized/date";
import { useControlledState } from "@react-stately/utils";
import { Calendar as CalendarIcon, Check, XClose } from "@untitledui/icons";
import { useDateFormatter } from "react-aria";
import type { DatePickerProps as AriaDatePickerProps, DateValue } from "react-aria-components";
import { DatePicker as AriaDatePicker, Dialog as AriaDialog, Group as AriaGroup, Popover as AriaPopover } from "react-aria-components";
import { Button, type ButtonProps } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { Calendar } from "./calendar";

interface DatePickerProps extends AriaDatePickerProps<DateValue> {
    /** Called after Apply, once `onChange` has fired with the chosen date. */
    onApply?: () => void;
    /** Called when the choice is dropped: Cancel, Escape, or a press outside the calendar. */
    onCancel?: () => void;
    /** Controls the size of the trigger button that opens the calendar. */
    size?: ButtonProps["size"];
}

/**
 * A date chosen from a calendar that opens under a button. The date is picked in a draft: it becomes the date, and `onChange` fires, only when
 * Apply is pressed. Cancel, Escape and a press outside close the calendar and keep the date as it was (CONTRACTS 1.9: Escape closes and cancels, it never
 * changes a committed value). As ingested, every pick changed the date at once and Cancel left the pick in place.
 */
export const DatePicker = ({ value: valueProp, defaultValue, onChange, onApply, onCancel, onOpenChange, size = "sm", ...props }: DatePickerProps) => {
    const formatter = useDateFormatter({
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const [value, setValue] = useControlledState(valueProp, defaultValue || null, onChange);
    // The date being picked while the calendar is open; `undefined` when nothing is being picked, so the calendar opens on the current date.
    const [draft, setDraft] = useState<DateValue | null | undefined>(undefined);
    const applied = useRef(false);
    const highlightedDates = useMemo(() => [today(getLocalTimeZone())], []);

    const formattedDate = value ? formatter.format(value.toDate(getLocalTimeZone())) : "Select date";

    return (
        <AriaDatePicker
            aria-label="Date picker"
            shouldCloseOnSelect={false}
            {...props}
            value={draft === undefined ? value : draft}
            onChange={setDraft}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    if (!applied.current) onCancel?.();
                    applied.current = false;
                    setDraft(undefined);
                }
                onOpenChange?.(isOpen);
            }}
        >
            <AriaGroup>
                {/* React Aria names this button "Calendar" (plus the picker's label), which never says the date and does not contain the words on the button (WCAG 2.5.3): the name leads with them. */}
                <Button size={size} color="secondary" iconLeading={CalendarIcon} aria-label={formattedDate}>
                    {formattedDate}
                </Button>
            </AriaGroup>
            <AriaPopover
                offset={8}
                placement="bottom right"
                className={({ isEntering, isExiting }) =>
                    cx(
                        // Portaled out of the page, so it carries the typeface itself (CONTRACTS 2.2).
                        "font-barlow origin-(--trigger-anchor-point) will-change-transform",
                        isEntering &&
                            "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                        isExiting &&
                            "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                    )
                }
            >
                <AriaDialog aria-label="Date picker" className="rounded-2xl bg-primary shadow-xl ring ring-secondary_alt focus:outline-hidden">
                    {({ close }) => (
                        <>
                            <div className="flex px-6 py-5">
                                <Calendar highlightedDates={highlightedDates} />
                            </div>
                            <div className="grid grid-cols-2 gap-3 border-t border-secondary p-4">
                                <Button size="md" color="secondary" iconLeading={XClose} onClick={close}>
                                    Cancel
                                </Button>
                                <Button
                                    size="md"
                                    color="primary"
                                    iconLeading={Check}
                                    onClick={() => {
                                        applied.current = true;
                                        setValue(draft === undefined ? value : draft);
                                        onApply?.();
                                        close();
                                    }}
                                >
                                    Apply
                                </Button>
                            </div>
                        </>
                    )}
                </AriaDialog>
            </AriaPopover>
        </AriaDatePicker>
    );
};
