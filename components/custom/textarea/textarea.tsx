"use client";

// Real, working multi-line text field - graduated straight to a real component rather than a `?`
// gap marker, since a plain textarea has none of the complexity that earned `DateRangeControl` its
// "custom" staging first (see CONTEXT.md's "Custom components" section for that precedent). No
// `components/base/input/**` file (or anywhere else in this repo) exports one - confirmed by grep
// before writing this - so this borrows `Input`'s exact wrapper tokens (rounded-lg bg-primary
// shadow-xs ring-1 ring-primary, focus ring-2 ring-brand, invalid ring-error_subtle) rather than
// inventing a parallel visual language, and reuses the same `TextField`/`Label`/`HintText`
// primitives Input itself is built from.

import type { ReactNode, Ref } from "react";
import type { TextFieldProps as AriaTextFieldProps } from "react-aria-components";
import { TextArea as AriaTextArea } from "react-aria-components";
import { TextField } from "@/components/base/input/input";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { cx } from "@/utils/cx";

export interface TextareaProps extends Omit<AriaTextFieldProps, "children"> {
    label?: string;
    hint?: ReactNode;
    placeholder?: string;
    rows?: number;
    hideRequiredIndicator?: boolean;
    className?: string;
    textareaClassName?: string;
    ref?: Ref<HTMLTextAreaElement>;
}

export const Textarea = ({
    label,
    hint,
    placeholder,
    rows = 4,
    hideRequiredIndicator,
    className,
    textareaClassName,
    ref,
    ...props
}: TextareaProps) => {
    return (
        <TextField aria-label={!label ? placeholder : undefined} {...props} className={className}>
            {({ isRequired, isInvalid, isDisabled }) => (
                <>
                    {label && (
                        <Label isRequired={hideRequiredIndicator ? !hideRequiredIndicator : isRequired} isInvalid={isInvalid}>
                            {label}
                        </Label>
                    )}

                    <div
                        className={cx(
                            "relative flex w-full flex-row rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset transition-shadow duration-100 ease-linear",
                            "has-focus-within:ring-2 has-focus-within:ring-brand",
                            isDisabled && "cursor-not-allowed opacity-50",
                            isInvalid && "ring-error_subtle",
                            isInvalid && "has-focus-within:ring-2 has-focus-within:ring-error",
                        )}
                    >
                        <AriaTextArea
                            ref={ref}
                            rows={rows}
                            placeholder={placeholder}
                            className={cx(
                                "m-0 w-full resize-y bg-transparent px-3.5 py-3 text-base text-primary ring-0 outline-hidden placeholder:text-placeholder disabled:cursor-not-allowed",
                                textareaClassName,
                            )}
                        />
                    </div>

                    {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
                </>
            )}
        </TextField>
    );
};

Textarea.displayName = "Textarea";
