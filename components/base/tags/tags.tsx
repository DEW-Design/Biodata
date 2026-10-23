"use client";

import { type FC, type ImgHTMLAttributes, type PropsWithChildren, type RefAttributes, createContext, useContext, useState } from "react";
import { User01 } from "@untitledui/icons";
import {
    Tag as AriaTag,
    TagGroup as AriaTagGroup,
    type TagGroupProps as AriaTagGroupProps,
    TagList as AriaTagList,
    type TagProps as AriaTagProps,
} from "react-aria-components";
import { Dot } from "@/components/foundations/dot-icon";
import { cx } from "@/utils/cx";
import { TagCheckbox } from "./base-components/tag-checkbox";
import { TagCloseX } from "./base-components/tag-close-x";

export const TagAvatar = ({ src, alt, contrastBorder = true, className }: ImgHTMLAttributes<HTMLImageElement> & { contrastBorder?: boolean }) => {
    const [isFailed, setIsFailed] = useState(false);

    return (
        <div
            className={cx(
                "relative inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-tertiary",
                contrastBorder && "outline-[0.5px] -outline-offset-[0.5px] outline-black/16",
                className,
            )}
        >
            {src && !isFailed ? (
                <img data-avatar-img className="size-full object-cover" src={src} alt={alt} onError={() => setIsFailed(true)} />
            ) : (
                <User01 className="size-3 stroke-[2.25px] text-fg-quaternary" />
            )}
        </div>
    );
};

export interface TagItem {
    id: string;
    label: string;
    count?: number;
    avatarSrc?: string;
    avatarContrastBorder?: boolean;
    dot?: boolean;
    dotClassName?: string;
    isDisabled?: boolean;
    onClose?: (id: string) => void;
}

const TagGroupContext = createContext<{
    selectionMode: "none" | "single" | "multiple";
    size: "sm" | "md" | "lg";
    textSize?: "xs";
    /** The group has an `onAction`: pressing a tag does something, so it says so (pointer, a fill when pointed at, a press). */
    actionable?: boolean;
}>({
    selectionMode: "none",
    size: "sm",
});

interface TagGroupProps extends AriaTagGroupProps, RefAttributes<HTMLDivElement> {
    label: string;
    size?: "sm" | "md" | "lg";
    /** Sets the label at 12px (`text-xs`) whatever the size, so a large tag's box can sit beside 12px type, as a heading in the eyebrow layer. Opt-in; without it the size's own type (12px small, 14px medium and large). */
    textSize?: "xs";
}

export const TagGroup = ({ label, selectionMode = "none", size = "sm", textSize, children, ...otherProps }: TagGroupProps) => {
    return (
        <TagGroupContext.Provider value={{ selectionMode, size, textSize, actionable: !!otherProps.onAction }}>
            <AriaTagGroup aria-label={label} selectionMode={selectionMode} disallowEmptySelection={selectionMode === "single"} {...otherProps}>
                {children}
            </AriaTagGroup>
        </TagGroupContext.Provider>
    );
};

export const TagList = AriaTagList;

const styles = {
    sm: {
        root: {
            base: "px-2 py-0.75 text-xs leading-none font-semibold uppercase tracking-wide",
            withCheckbox: "pl-1.25",
            withAvatar: "pl-1",
            withDot: "pl-1.5",
            withCount: "pr-1",
            withClose: "pr-1",
        },
        content: "gap-1",
        count: "px-1 text-xs leading-none font-semibold",
    },
    md: {
        root: {
            base: "px-2.25 py-0.5 text-sm leading-none font-semibold uppercase tracking-wide",
            withCheckbox: "pl-1",
            withAvatar: "pl-1.25",
            withDot: "pl-1.75",
            withCount: "pr-0.75",
            withClose: "pr-1",
        },
        content: "gap-1.25",
        count: "px-1.25 text-xs leading-none font-semibold",
    },
    lg: {
        root: {
            base: "px-2.5 py-1 text-sm leading-none font-semibold uppercase tracking-wide",
            withCheckbox: "pl-1.25",
            withAvatar: "pl-1.75",
            withDot: "pl-2.25",
            withCount: "pr-1",
            withClose: "pr-1",
        },
        content: "gap-1.5",
        count: "px-1.5 text-sm leading-none font-semibold",
    },
};

interface TagProps extends AriaTagProps, RefAttributes<object>, Omit<TagItem, "label" | "id"> {
    /** An icon before the label, for a tag that names a kind of thing (an area: circle, polygon, point). Opt-in; none by default. */
    icon?: FC<{ className?: string }>;
    /** Told when the pointer is over the tag, so what it stands for can be shown elsewhere (the map outlines the area). Opt-in. */
    onHoverChange?: (hovered: boolean) => void;
    /** Drawn as pointed at while what it stands for is (the area's shape under the pointer on the map): the same fill as the tag's own hover. Opt-in. */
    highlighted?: boolean;
}

export const Tag = ({
    id,
    avatarSrc,
    avatarContrastBorder = true,
    dot,
    dotClassName,
    isDisabled,
    count,
    className,
    children,
    onClose,
    icon: Icon,
    onHoverChange,
    highlighted,
}: PropsWithChildren<TagProps>) => {
    const context = useContext(TagGroupContext);

    const leadingContent = avatarSrc ? (
        <TagAvatar src={avatarSrc} alt="Avatar" contrastBorder={avatarContrastBorder} />
    ) : dot ? (
        <Dot className={cx("text-fg-success-secondary", dotClassName)} size="sm" />
    ) : Icon ? (
        <Icon className={cx("shrink-0 text-fg-quaternary", context.size === "sm" ? "size-3" : context.textSize === "xs" || context.size === "md" ? "size-3.5" : "size-4")} />
    ) : null;

    return (
        <AriaTag
            id={id}
            isDisabled={isDisabled}
            textValue={typeof children === "string" ? children : undefined}
            className={(state) =>
                cx(
                    "font-barlow flex cursor-default items-center gap-0.75 rounded-md bg-primary text-secondary ring-1 ring-primary outline-focus-ring transition duration-50 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2",
                    styles[context.size].root.base,
                    context.textSize === "xs" && "text-xs",

                    // With avatar
                    avatarSrc && styles[context.size].root.withAvatar,
                    // With X button
                    (onClose || state.allowsRemoving) && styles[context.size].root.withClose,
                    // With dot, or an icon (the same room)
                    (dot || Icon) && styles[context.size].root.withDot,
                    // With count
                    typeof count === "number" && styles[context.size].root.withCount,
                    // With checkbox
                    context.selectionMode !== "none" && styles[context.size].root.withCheckbox,
                    // Pressing it does something (the group has an `onAction`): the pointer says so, the fill confirms it, and a press is felt
                    context.actionable && "cursor-pointer hover:bg-primary_hover data-pressed:scale-[0.96]",
                    highlighted && "bg-primary_hover",
                    // Disabled
                    isDisabled && "cursor-not-allowed",

                    typeof className === "function" ? className(state) : className,
                )
            }
        >
            {({ isSelected, isDisabled, allowsRemoving }) => (
                // `contents` adds no box: the wrapper is only there to hear the pointer over the whole tag (react-aria's own hover is off for a tag that is not selectable).
                <div className="contents" onPointerEnter={onHoverChange ? () => onHoverChange(true) : undefined} onPointerLeave={onHoverChange ? () => onHoverChange(false) : undefined}>
                    <div className={cx("flex items-center gap-1", styles[context.size].content)}>
                        {context.selectionMode !== "none" && <TagCheckbox size={context.size} isSelected={isSelected} isDisabled={isDisabled} />}

                        {leadingContent}

                        {children}

                        {typeof count === "number" && (
                            <span className={cx("flex items-center justify-center rounded-[3px] bg-tertiary text-center", styles[context.size].count)}>
                                {count}
                            </span>
                        )}
                    </div>

                    {(onClose || allowsRemoving) && (
                        <TagCloseX size={context.size} excludeFromTabOrder={allowsRemoving} onPress={() => id && onClose?.(id.toString())} />
                    )}
                </div>
            )}
        </AriaTag>
    );
};
