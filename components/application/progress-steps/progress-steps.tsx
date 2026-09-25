"use client";

import type { FC } from "react";
import { cx } from "@/utils/cx";
import { FeaturedIconLeft, FeaturedIconTop, IconLeft, IconLeftNumber, IconOnly, IconTop, IconTopNumber, TextLine, statuses } from "./progress-step-base";
import type { CommonProps, ComponentType, ProgressIconsCenteredProps, ProgressMinimalIconsProps, IconType, Step } from "./progress-types";

// The step components share one loose prop shape at the call site; each variant only reads what it needs.
type AnyStepProps = Step & { icon?: IconType; size?: "sm" | "md"; step: number };

const progressIcons = {
    horizontal: {
        icon: IconTop,
        number: IconTopNumber,
        "featured-icon": FeaturedIconTop,
    },
    vertical: {
        icon: IconLeft,
        number: IconLeftNumber,
        "featured-icon": FeaturedIconLeft,
    },
};

const IconsWithText = <T extends ComponentType>(props: ProgressIconsCenteredProps<T>) => {
    const { type = "icon", orientation = "vertical", size = "sm", connector = true, startAt = 1, items, className } = props;
    const length = items.length;
    // Single step component based on the type.
    const StepBase = progressIcons[orientation][type] as FC<AnyStepProps>;

    return (
        <div
            style={{
                gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`,
            }}
            className={cx(
                "font-barlow grid items-start justify-start",
                orientation === "horizontal" && "w-full gap-4",
                orientation === "vertical" && "grid-cols-1!",
                className,
            )}
        >
            {items.map((item, index) => (
                <StepBase
                    key={index}
                    {...(item as Step & { icon?: IconType })}
                    size={size}
                    connector={!connector ? false : item.connector || index !== length - 1}
                    step={startAt + index}
                />
            ))}
        </div>
    );
};

const MinimalIcons = ({ items, text = false, size = "sm", className }: ProgressMinimalIconsProps) => {
    const gaps = {
        sm: "gap-3",
        md: "gap-4",
        lg: "gap-5",
    };

    const completed = items.filter((item) => item.status === "complete").length;

    return (
        <div className={cx("font-barlow flex w-full flex-row items-center justify-center", gaps[size], className)}>
            {text && (
                <p className="text-sm font-medium text-secondary">
                    Step {completed} of {items.length}
                </p>
            )}
            {items.map((item, index) => (
                <IconOnly key={index} {...(item as Step & { icon?: IconType })} size={size} />
            ))}
        </div>
    );
};

const MinimalIconsConnected = ({ items, size = "sm", orientation = "horizontal", className }: CommonProps) => {
    return (
        <div className={cx("font-barlow flex w-full items-center justify-center", className)}>
            {items.map((item, index) => (
                <div key={index} className="flex items-center justify-center">
                    <IconOnly {...(item as Step & { icon?: IconType })} size={size} />
                    <span
                        className={cx(
                            "w-20 flex-1 border-t-2",
                            statuses[item.status].connector,
                            orientation === "vertical" && "w-12",
                            index === items.length - 1 && "hidden",
                        )}
                    />
                </div>
            ))}
        </div>
    );
};

const TextWithLine = ({ items, orientation = "horizontal", size = "sm", className }: CommonProps) => {
    return (
        <div
            style={{
                gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
            }}
            className={cx(
                "font-barlow grid w-full items-start justify-start",
                orientation === "horizontal" ? "gap-4" : "gap-5",
                orientation === "vertical" && "grid-cols-1!",
                className,
            )}
        >
            {items.map((item, index) => (
                <TextLine key={index} {...(item as Step & { icon?: IconType })} size={size} />
            ))}
        </div>
    );
};

export const Progress = {
    IconsWithText,
    MinimalIcons,
    MinimalIconsConnected,
    TextWithLine,
};
