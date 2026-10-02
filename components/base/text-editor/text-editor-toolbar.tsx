"use client";

import { type RefAttributes } from "react";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import {
    TextEditorAlignCenter,
    TextEditorAlignLeft,
    TextEditorBold,
    TextEditorBulletList,
    TextEditorFontSize,
    TextEditorGenerate,
    TextEditorImage,
    TextEditorItalic,
    TextEditorLink,
    TextEditorUnderline,
} from "./text-editor-extensions";

interface TextEditorToolbarProps extends RefAttributes<HTMLDivElement> {
    className?: string;
    type?: "simple" | "advanced";
    floating?: boolean;
    hideFontSize?: boolean;
    /** Shows the Generate button on the advanced toolbar. Leave unset until the caller has something for it to do. */
    onGenerate?: () => void;
}

export const TextEditorToolbar = ({ className, ref, type = "simple", floating = false, hideFontSize, onGenerate }: TextEditorToolbarProps) => {
    if (type === "simple") {
        return (
            <div
                className={cx(
                    "flex w-max flex-wrap gap-0.5 md:flex-nowrap",
                    floating && "rounded-lg bg-primary p-1 shadow-lg ring-1 ring-secondary_alt",
                    className,
                )}
            >
                <Tooltip title="Bold ⌘B">
                    <TextEditorBold />
                </Tooltip>
                <Tooltip title="Italic ⌘I">
                    <TextEditorItalic />
                </Tooltip>
                <Tooltip title="Underline ⌘U">
                    <TextEditorUnderline />
                </Tooltip>

                <div className="p-1.5">
                    <div className="h-full w-px rounded-full bg-[var(--ui-border-primary)]" />
                </div>

                <Tooltip title="Left align">
                    <TextEditorAlignLeft />
                </Tooltip>
                <Tooltip title="Center align">
                    <TextEditorAlignCenter />
                </Tooltip>
                <Tooltip title="Bullet list">
                    <TextEditorBulletList />
                </Tooltip>
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className={cx(
                "flex w-max max-w-full flex-col items-start justify-center gap-2 md:flex-row md:flex-wrap md:items-center md:justify-start md:gap-3",
                floating && "rounded-xl bg-primary p-2 shadow-lg ring-1 ring-secondary_alt",
                className,
            )}
        >
            {!floating && (
                <div className="flex gap-2">
                    {!hideFontSize && <TextEditorFontSize />}
                </div>
            )}

            <div className="flex flex-wrap gap-0.5 md:flex-nowrap">
                <Tooltip title="Bold ⌘B">
                    <TextEditorBold />
                </Tooltip>
                <Tooltip title="Italic ⌘I">
                    <TextEditorItalic />
                </Tooltip>
                <Tooltip title="Underline ⌘U">
                    <TextEditorUnderline />
                </Tooltip>

                <div className="p-1.5">
                    <div className="h-full w-px rounded-full bg-[var(--ui-border-primary)]" />
                </div>

                <Tooltip title="Left align">
                    <TextEditorAlignLeft />
                </Tooltip>
                <Tooltip title="Center align">
                    <TextEditorAlignCenter />
                </Tooltip>
                <Tooltip title="Bullet list">
                    <TextEditorBulletList />
                </Tooltip>

                <div className="p-1.5">
                    <div className="h-full w-px rounded-full bg-[var(--ui-border-primary)]" />
                </div>

                <Tooltip title="Link ⌘K">
                    <TextEditorLink />
                </Tooltip>
                <Tooltip title="Insert image">
                    <TextEditorImage />
                </Tooltip>

                {onGenerate && (
                    <>
                        <div className="p-1.5">
                            <div className="h-full w-px rounded-full bg-[var(--ui-border-primary)]" />
                        </div>

                        <Tooltip title="Generate">
                            <TextEditorGenerate onPress={onGenerate} />
                        </Tooltip>
                    </>
                )}
            </div>
        </div>
    );
};
