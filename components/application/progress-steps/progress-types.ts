import type { FC, RefAttributes, SVGProps } from "react";

export type Step = {
    title: string;
    /** Optional: a step can be just a title (the setup-profile steps). */
    description?: string;
    connector?: boolean;
    status: "incomplete" | "current" | "complete";
    /** Makes the step a button (Enter and Space work). Use it to let a person go back to a completed step. */
    onClick?: () => void;
    /** Marks a step that needs attention (title, description and dot turn red). Supported by the `icon` and `number` types. */
    error?: boolean;
};

export type ComponentType = "icon" | "number" | "featured-icon";

export type IconType = FC<SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>> & {
    color?: string;
    size?: number;
};

export type ItemsType<T extends ComponentType> = T extends "featured-icon" ? Step & { icon: IconType } : Step & { icon?: IconType };

export type ProgressIconType = ItemsType<"icon">;
export type ProgressFeaturedIconType = ItemsType<"featured-icon">;

export interface CommonProps {
    items: ProgressIconType[];
    size?: "sm" | "md";
    orientation?: "vertical" | "horizontal";
    className?: string;
}

export type StepBaseProps<T extends ComponentType> = {
    size?: "sm" | "md";
    type?: T;
} & ItemsType<T>;

export interface ProgressIconsCenteredProps<T extends ComponentType> extends Omit<CommonProps, "items"> {
    type?: T;
    connector?: boolean;
    /** The number shown on the first step (`number` type). Lets consecutive groups keep counting. @default 1 */
    startAt?: number;
    items: ItemsType<T>[];
}

export interface ProgressMinimalIconsProps extends CommonProps {
    text?: boolean;
}
