"use client";

// Ingested from Untitled UI (OVR-016). Changes after ingest: icons on Cancel and Apply (CONTRACTS 3.12); the typeface on the popover (2.2); the dead `text-md` on the dash is `text-sm` (2.1);
// the pick, and a preset, are held in a draft, so Apply commits them and Cancel, Escape and a press outside keep the range (1.9); the trigger's accessible name leads with the range it shows;
// today is read when the picker mounts; and the three short
// presets show from `md` to `lg` too (as ingested there were none between the two).

import { useMemo, useRef, useState } from "react";
import { endOfMonth, endOfWeek, getLocalTimeZone, startOfMonth, startOfWeek, today } from "@internationalized/date";
import { useControlledState } from "@react-stately/utils";
import { Calendar as CalendarIcon, Check, XClose } from "@untitledui/icons";
import { useDateFormatter } from "react-aria";
import type { DateRangePickerProps as AriaDateRangePickerProps, DateValue } from "react-aria-components";
import { DateRangePicker as AriaDateRangePicker, Dialog as AriaDialog, Group as AriaGroup, Popover as AriaPopover, useLocale } from "react-aria-components";
import { Button, type ButtonProps } from "@/components/base/buttons/button";
import { InputDateBase } from "@/components/base/input/input-date";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cx } from "@/utils/cx";
import { RangeCalendar, RangePresetButton } from "./range-calendar";

interface DateRangePickerProps extends AriaDateRangePickerProps<DateValue> {
    /** Controls the size of the trigger button that opens the calendar. */
    size?: ButtonProps["size"];
    /** Called after Apply, once `onChange` has fired with the chosen range. */
    onApply?: () => void;
    /** Called when the choice is dropped: Cancel, Escape, or a press outside the calendar. */
    onCancel?: () => void;
}

/**
 * A date range chosen from a calendar that opens under a button, with presets (Today to All time) beside it. As in `DatePicker`, the range is picked in
 * a draft: it becomes the range, and `onChange` fires, only when Apply is pressed. Cancel, Escape and a press outside keep the range as it was
 * (CONTRACTS 1.9). As ingested, every pick and every preset changed the range at once and Cancel left the pick in place.
 */
export const DateRangePicker = ({ value: valueProp, defaultValue, onChange, onApply, onCancel, onOpenChange, size = "sm", ...props }: DateRangePickerProps) => {
    const { locale } = useLocale();
    // The preset column is `lg` and up. Below it the three short presets sit above the grid, and as ingested they were drawn below `md` only, so from `md` to `lg` there were none.
    const isLarge = useBreakpoint("lg");
    const formatter = useDateFormatter({
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const [value, setValue] = useControlledState(valueProp, defaultValue || null, onChange);
    // The range being picked while the calendar is open; `undefined` when nothing is being picked.
    const [draft, setDraft] = useState<typeof value | undefined>(undefined);
    const applied = useRef(false);
    const [focusedValue, setFocusedValue] = useState<DateValue | null>(null);

    const now = useMemo(() => today(getLocalTimeZone()), []);
    const highlightedDates = useMemo(() => [now], [now]);

    const formattedStartDate = value?.start ? formatter.format(value.start.toDate(getLocalTimeZone())) : "Select date";
    const formattedEndDate = value?.end ? formatter.format(value.end.toDate(getLocalTimeZone())) : "Select date";

    const presets = useMemo(
        () => ({
            today: { label: "Today", value: { start: now, end: now } },
            yesterday: { label: "Yesterday", value: { start: now.subtract({ days: 1 }), end: now.subtract({ days: 1 }) } },
            thisWeek: { label: "This week", value: { start: startOfWeek(now, locale), end: endOfWeek(now, locale) } },
            lastWeek: {
                label: "Last week",
                value: {
                    start: startOfWeek(now, locale).subtract({ weeks: 1 }),
                    end: endOfWeek(now, locale).subtract({ weeks: 1 }),
                },
            },
            thisMonth: { label: "This month", value: { start: startOfMonth(now), end: endOfMonth(now) } },
            lastMonth: {
                label: "Last month",
                value: {
                    start: startOfMonth(now).subtract({ months: 1 }),
                    end: endOfMonth(now).subtract({ months: 1 }),
                },
            },
            thisYear: { label: "This year", value: { start: startOfMonth(now.set({ month: 1 })), end: endOfMonth(now.set({ month: 12 })) } },
            lastYear: {
                label: "Last year",
                value: {
                    start: startOfMonth(now.set({ month: 1 }).subtract({ years: 1 })),
                    end: endOfMonth(now.set({ month: 12 }).subtract({ years: 1 })),
                },
            },
            allTime: {
                label: "All time",
                value: {
                    start: now.set({ year: 2000, month: 1, day: 1 }),
                    end: now,
                },
            },
        }),
        [locale, now],
    );

    return (
        <AriaDateRangePicker
            aria-label="Date range picker"
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
                {/* React Aria names this button "Calendar" (plus the picker's label), which never says the range and does not contain the words on the button (WCAG 2.5.3): the name leads with them. */}
                <Button size={size} color="secondary" iconLeading={CalendarIcon} aria-label={value ? `${formattedStartDate} to ${formattedEndDate}` : "Select dates"}>
                    {!value ? <span className="text-placeholder">Select dates</span> : `${formattedStartDate} – ${formattedEndDate}`}
                </Button>
            </AriaGroup>
            <AriaPopover
                placement="bottom right"
                offset={8}
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
                <AriaDialog aria-label="Date range picker" className="flex rounded-2xl bg-primary shadow-xl ring ring-secondary_alt focus:outline-hidden">
                    {({ close }) => (
                        <>
                            <div className="hidden w-38 flex-col gap-0.5 border-r border-solid border-secondary p-3 lg:flex">
                                {Object.values(presets).map((preset) => (
                                    <RangePresetButton
                                        key={preset.label}
                                        value={preset.value}
                                        onClick={() => {
                                            setDraft(preset.value);
                                            setFocusedValue(preset.value.start);
                                        }}
                                    >
                                        {preset.label}
                                    </RangePresetButton>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <RangeCalendar
                                    focusedValue={focusedValue}
                                    onFocusChange={setFocusedValue}
                                    highlightedDates={highlightedDates}
                                    showPresetsOnDesktop={!isLarge}
                                    presets={{
                                        lastWeek: presets.lastWeek,
                                        lastMonth: presets.lastMonth,
                                        lastYear: presets.lastYear,
                                    }}
                                />
                                <div className="flex justify-between gap-3 border-t border-secondary p-4">
                                    <div className="hidden items-center gap-2 md:flex">
                                        <InputDateBase slot="start" size="sm" />
                                        <div className="text-sm text-quaternary">–</div>
                                        <InputDateBase slot="end" size="sm" />
                                    </div>
                                    <div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto">
                                        <Button size="sm" color="secondary" iconLeading={XClose} onClick={close}>
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
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
                                </div>
                            </div>
                        </>
                    )}
                </AriaDialog>
            </AriaPopover>
        </AriaDateRangePicker>
    );
};
