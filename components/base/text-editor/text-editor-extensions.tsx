"use client";

import React, { type Key, useCallback, useRef } from "react";
import { useEditorState } from "@tiptap/react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold01, Dotpoints01, Image01, Italic01, Link01, Stars02, Underline01 } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Select } from "@/components/base/select/select";
import type { SelectItemType } from "@/components/base/select/select-shared";
import { cx } from "@/utils/cx";
import { useEditorContext } from "./text-editor";

const DEFAULT_FONT_SIZE = { id: "14px", label: "14px" } satisfies SelectItemType;

const fontSizes: SelectItemType[] = [
    { id: "12px", label: "12px" },
    DEFAULT_FONT_SIZE,
    { id: "16px", label: "16px" },
    { id: "18px", label: "18px" },
    { id: "20px", label: "20px" },
    { id: "22px", label: "22px" },
    { id: "24px", label: "24px" },
    { id: "26px", label: "26px" },
    { id: "28px", label: "28px" },
    { id: "30px", label: "30px" },
    { id: "32px", label: "32px" },
];

/**
 * Reads the colour a design token paints, by applying its utility class to a probe element. Going through the
 * class (not a `--color-*` variable) keeps it working for tokens the stylesheet only emits when they are used,
 * and keeps hex values out of this file. Returns `currentColor` where there is no document (server render).
 */
export const getTokenColor = (utilityClass: string) => {
    if (typeof document === "undefined") return "currentColor";

    const probe = document.createElement("span");
    probe.className = utilityClass;
    document.body.appendChild(probe);
    const { backgroundColor } = getComputedStyle(probe);
    probe.remove();

    return backgroundColor;
};

/**
 * Text editor button that toggles bold text.
 */
export const TextEditorBold = ({ className }: { className?: string }) => {
    const { editor, isDisabled } = useEditorContext();

    const { isBold } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isBold: editor?.isActive("bold") ?? false,
        }),
    });

    const handleToggleBold = useCallback(() => {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (editor.isActive("bold") && !hasSelection) {
            // If cursor is within bold text but no text is selected, extend the mark range before toggling
            editor.chain().focus().extendMarkRange("bold").toggleBold().run();
        } else {
            // If not in bold text OR text is already selected, just toggle normally
            editor.chain().focus().toggleBold().run();
        }
    }, [editor]);

    return (
        <ButtonUtility
            color="tertiary"
            icon={Bold01}
            aria-label="Bold ⌘B"
            isDisabled={isDisabled}
            onPress={handleToggleBold}
            className={cx(isBold && "bg-primary_hover text-fg-secondary", className)}
        />
    );
};

/**
 * Text editor button that toggles italic text.
 */
export const TextEditorItalic = ({ className }: { className?: string }) => {
    const { editor, isDisabled } = useEditorContext();

    const { isItalic } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isItalic: editor?.isActive("italic") ?? false,
        }),
    });

    const handleToggleItalic = useCallback(() => {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (editor.isActive("italic") && !hasSelection) {
            // If cursor is within italic text but no text is selected, extend the mark range before toggling
            editor.chain().focus().extendMarkRange("italic").toggleItalic().run();
        } else {
            // If not in italic text OR text is already selected, just toggle normally
            editor.chain().focus().toggleItalic().run();
        }
    }, [editor]);

    return (
        <ButtonUtility
            color="tertiary"
            icon={Italic01}
            aria-label="Italic ⌘I"
            isDisabled={isDisabled}
            onPress={handleToggleItalic}
            className={cx(isItalic && "bg-primary_hover text-fg-secondary", className)}
        />
    );
};

/**
 * Text editor button that toggles underline text.
 */
export const TextEditorUnderline = ({ className }: { className?: string }) => {
    const { editor, isDisabled } = useEditorContext();

    const { isUnderline } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isUnderline: editor?.isActive("underline") ?? false,
        }),
    });

    const handleToggleUnderline = useCallback(() => {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (editor.isActive("underline") && !hasSelection) {
            // If cursor is within underlined text but no text is selected, extend the mark range before toggling
            editor.chain().focus().extendMarkRange("underline").toggleUnderline().run();
        } else {
            // If not in underlined text OR text is already selected, just toggle normally
            editor.chain().focus().toggleUnderline().run();
        }
    }, [editor]);

    return (
        <ButtonUtility
            color="tertiary"
            icon={Underline01}
            aria-label="Underline ⌘U"
            isDisabled={isDisabled}
            onPress={handleToggleUnderline}
            className={cx(isUnderline && "bg-primary_hover text-fg-secondary", className)}
        />
    );
};

/**
 * Text editor button that toggles bullet list.
 */
export const TextEditorBulletList = ({ className }: { className?: string }) => {
    const { editor, isDisabled } = useEditorContext();

    const { isBulletList } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isBulletList: editor?.isActive("bulletList") ?? false,
        }),
    });

    return (
        <ButtonUtility
            color="tertiary"
            icon={Dotpoints01}
            aria-label="Bullet list"
            isDisabled={isDisabled}
            onPress={() => editor.chain().focus().toggleBulletList().run()}
            className={cx(isBulletList && "bg-primary_hover text-fg-secondary", className)}
        />
    );
};

/**
 * Text editor button that toggles left alignment.
 */
export const TextEditorAlignLeft = ({ className }: { className?: string }) => {
    const { editor, isDisabled } = useEditorContext();

    const { isAlignLeft } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isAlignLeft: editor?.isActive("textAlign", { align: "left" }) ?? false,
        }),
    });

    return (
        <ButtonUtility
            color="tertiary"
            icon={AlignLeft}
            aria-label="Left align"
            isDisabled={isDisabled}
            onPress={() => editor.chain().focus().setTextAlign("left").run()}
            className={cx(isAlignLeft && "bg-primary_hover text-fg-secondary", className)}
        />
    );
};

/**
 * Text editor button that toggles center alignment.
 */
export const TextEditorAlignCenter = ({ className }: { className?: string }) => {
    const { editor, isDisabled } = useEditorContext();

    const { isAlignCenter } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isAlignCenter: editor?.isActive("textAlign", { align: "center" }) ?? false,
        }),
    });

    return (
        <ButtonUtility
            color="tertiary"
            icon={AlignCenter}
            aria-label="Center align"
            isDisabled={isDisabled}
            onPress={() => editor.chain().focus().setTextAlign("center").run()}
            className={cx(isAlignCenter && "bg-primary_hover text-fg-secondary", className)}
        />
    );
};

/**
 * Text editor button that toggles right alignment.
 */
export const TextEditorAlignRight = ({ className }: { className?: string }) => {
    const { editor, isDisabled } = useEditorContext();

    const { isAlignRight } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isAlignRight: editor?.isActive("textAlign", { align: "right" }) ?? false,
        }),
    });

    return (
        <ButtonUtility
            color="tertiary"
            icon={AlignRight}
            aria-label="Right align"
            isDisabled={isDisabled}
            onPress={() => editor.chain().focus().setTextAlign("right").run()}
            className={cx(isAlignRight && "bg-primary_hover text-fg-secondary", className)}
        />
    );
};

/**
 * Text editor button that toggles justify alignment.
 */
export const TextEditorAlignJustify = ({ className }: { className?: string }) => {
    const { editor, isDisabled } = useEditorContext();

    const { isAlignJustify } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isAlignJustify: editor?.isActive("textAlign", { align: "justify" }) ?? false,
        }),
    });

    return (
        <ButtonUtility
            color="tertiary"
            icon={AlignJustify}
            aria-label="Justify"
            isDisabled={isDisabled}
            onPress={() => editor.chain().focus().setTextAlign("justify").run()}
            className={cx(isAlignJustify && "bg-primary_hover text-fg-secondary", className)}
        />
    );
};

/**
 * Text editor button that generates text.
 */
export const TextEditorGenerate = ({ onPress }: { onPress: () => void }) => {
    const { isDisabled } = useEditorContext();

    return <ButtonUtility color="tertiary" icon={Stars02} aria-label="Generate" isDisabled={isDisabled} onPress={onPress} />;
};

/**
 * Text editor button for inserting a link.
 */
export const TextEditorLink = ({ className }: { className?: string }) => {
    const { editor, isDisabled } = useEditorContext();

    const { isLink } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isLink: editor?.isActive("link") ?? false,
        }),
    });

    const handleSetLink = useCallback(() => {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        // If cursor is within a link but no text is selected, extend the mark range first to select the entire link
        if (editor.isActive("link") && !hasSelection) {
            editor.chain().focus().extendMarkRange("link").run();
        }

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("Please enter a link", previousUrl);

        // Cancelled.
        if (url === null) {
            return;
        }

        // If empty, remove link.
        if (url === "") {
            if (editor.isActive("link") && !hasSelection) {
                // If cursor is within link but no text selected, extend mark range before removing
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
            } else {
                // If text is selected or not in link, just remove normally
                editor.chain().focus().unsetLink().run();
            }
            return;
        }

        // Update or set link.
        if (editor.isActive("link") && !hasSelection) {
            // If cursor is within link but no text selected, extend mark range before updating
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        } else {
            // If text is selected or no link, just set normally
            editor.chain().focus().setLink({ href: url }).run();
        }
    }, [editor]);

    return (
        <ButtonUtility
            color="tertiary"
            icon={Link01}
            aria-label="Link ⌘K"
            isDisabled={isDisabled}
            onPress={handleSetLink}
            className={cx(isLink && "bg-primary_hover text-fg-secondary", className)}
        />
    );
};

/**
 * Text editor button for inserting an image.
 */
export const TextEditorImage = ({ className }: { className?: string }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { editor, isDisabled } = useEditorContext();

    const { isImage } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isImage: editor?.isActive("image") ?? false,
        }),
    });

    const triggerFileUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            const blobUrl = URL.createObjectURL(file);
            editor.chain().focus().setImage({ src: blobUrl }).run();

            // Clear the input so choosing the same file again still fires a change.
            event.target.value = "";
        },
        [editor],
    );

    return (
        <>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <ButtonUtility
                color="tertiary"
                icon={Image01}
                aria-label="Insert image"
                isDisabled={isDisabled}
                onPress={triggerFileUpload}
                className={cx(isImage && "bg-primary_hover text-fg-secondary", className)}
            />
        </>
    );
};

/**
 * Text editor button for changing the text font size.
 */
export const TextEditorFontSize = ({ className }: { className?: string }) => {
    const { editor, isDisabled } = useEditorContext();

    const { currentFontSize } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            currentFontSize: editor?.getAttributes("textStyle")?.fontSize || DEFAULT_FONT_SIZE.id,
        }),
    });

    const handleFontSizeChange = useCallback(
        (value: Key | null) => {
            editor
                .chain()
                .focus()
                .setFontSize(value as string)
                .run();
        },
        [editor],
    );

    return (
        <Select
            aria-label="Font size"
            size="sm"
            items={fontSizes}
            isDisabled={isDisabled}
            className={cx("w-full md:w-22", className)}
            value={currentFontSize}
            onChange={handleFontSizeChange}
        >
            {(fontSize) => (
                <Select.Item id={fontSize.id} className="[&_svg:not([data-icon])]:hidden">
                    {fontSize.label}
                </Select.Item>
            )}
        </Select>
    );
};
