"use client";

import type { ComponentPropsWithRef } from "react";
import { cx } from "@/utils/cx";

const SectionHeaderRoot = (props: ComponentPropsWithRef<"div">) => (
    <div {...props} className={cx("font-barlow flex flex-col gap-5 border-b border-secondary pb-5", props.className)}>
        {props.children}
    </div>
);

const SectionHeaderGroup = (props: ComponentPropsWithRef<"div">) => (
    <div {...props} className={cx("relative flex flex-col items-start gap-4 md:flex-row", props.className)}>
        {props.children}
    </div>
);

const SectionHeaderActions = (props: ComponentPropsWithRef<"div">) => (
    <div {...props} className={cx("flex gap-3", props.className)}>
        {props.children}
    </div>
);

const SectionHeaderHeading = (props: ComponentPropsWithRef<"h2">) => (
    // `!` overrides win over the docs site's unlayered `.prose-doc h2` rule (font-size 20px,
    // 48px/12px top/bottom margin, -0.02em letter-spacing) that would otherwise bleed into this
    // heading whenever it renders inside a doc page - same fix as TableCardHeader/Accordion.
    // `text-lg`, not `text-md` - `--text-md` is never defined in app/globals.css, so `text-md`
    // compiles to no CSS at all sitewide (a separate, pre-existing gap, not fixed here).
    <h2 {...props} className={cx("m-0! text-lg! font-semibold! tracking-normal! text-primary!", props.className)}>
        {props.children}
    </h2>
);

const SectionHeaderSubheading = (props: ComponentPropsWithRef<"p">) => (
    <p {...props} className={cx("text-sm text-tertiary", props.className)}>
        {props.children}
    </p>
);

export const SectionHeader = {
    Root: SectionHeaderRoot,
    Group: SectionHeaderGroup,
    Actions: SectionHeaderActions,
    Heading: SectionHeaderHeading,
    Subheading: SectionHeaderSubheading,
};
