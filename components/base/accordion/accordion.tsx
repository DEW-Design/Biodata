"use client";

import type { Key, ReactNode } from "react";
import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export interface AccordionItemType {
    id: Key;
    title: ReactNode;
    content: ReactNode;
}

export interface AccordionProps {
    items: AccordionItemType[];
    /** Keys open on first render (uncontrolled). Ignored once `openKeys` is passed. @default [] */
    defaultOpenKeys?: Key[];
    /**
     * Which keys are open, controlled by the caller - lets an outside action (a "jump to this
     * flagged field" link, elsewhere on the page) force a specific section open after this
     * component has already mounted, which `defaultOpenKeys` (first-render only) can't do. Pass
     * together with `onOpenKeysChange`; omit both to keep the accordion's original fully
     * uncontrolled behavior.
     */
    openKeys?: Set<Key>;
    /** Required when `openKeys` is passed - receives the next set on every toggle. */
    onOpenKeysChange?: (keys: Set<Key>) => void;
    /** When true, opening an item closes any other open item. @default false */
    singleOpen?: boolean;
    /**
     * `"divided"` (default) is the original FAQ-page treatment - a borderless stacked list, items
     * separated by a thin top rule, large semibold titles. `"boxed"` is a second, real visual
     * treatment - each item its own bordered, rounded card (`border-brand-100`), a smaller
     * brand-coloured title, and a divider between its own header and body - matching Figma's
     * "Details Container" accordion pattern (node 220:45522 and siblings, the record-detail
     * sidebar's own per-section cards). Same interaction/state logic either way; only the item
     * chrome changes - extending the one real component rather than forking a second one, per
     * this codebase's "extend, don't fork" convention.
     * @default "divided"
     */
    variant?: "divided" | "boxed";
    className?: string;
}

/** Expand/collapse chevron - a circle with a horizontal line that rotates in a vertical one when closed. */
const AccordionChevron = ({ isOpen }: { isOpen: boolean }) => (
    <span aria-hidden="true" className="flex size-6 shrink-0 items-center text-fg-quaternary">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line className={cx("origin-center rotate-0 transition duration-150 ease-out", isOpen && "-rotate-90")} x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
    </span>
);

/**
 * A vertical list of expand/collapse question/answer (or any title/content) pairs, animated with
 * a real spring (motion/react), not a CSS transition. Extracted from
 * components/marketing/faq/faq-accordion-01.tsx, which now composes this instead of hand-rolling
 * its own expand/collapse state - the reusable interaction pattern, not tied to FAQ copy.
 */
export const Accordion = ({ items, defaultOpenKeys = [], openKeys: controlledOpenKeys, onOpenKeysChange, singleOpen = false, variant = "divided", className }: AccordionProps) => {
    const isControlled = controlledOpenKeys !== undefined;
    const [internalOpenKeys, setInternalOpenKeys] = useState(new Set(defaultOpenKeys));
    const openKeys = isControlled ? controlledOpenKeys : internalOpenKeys;

    const toggle = (id: Key) => {
        let next: Set<Key>;
        if (singleOpen) {
            next = openKeys.has(id) ? new Set() : new Set([id]);
        } else {
            next = new Set(openKeys);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
        }
        if (isControlled) {
            onOpenKeysChange?.(next);
        } else {
            setInternalOpenKeys(next);
        }
    };

    if (variant === "boxed") {
        return (
            <div className={cx("font-barlow flex flex-col gap-4", className)}>
                {items.map((item) => {
                    const isOpen = openKeys.has(item.id);
                    return (
                        <div key={item.id} className="overflow-hidden rounded-md border border-[var(--color-brand-100)] bg-primary">
                            <button
                                type="button"
                                onClick={() => toggle(item.id)}
                                aria-expanded={isOpen}
                                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left outline-focus-ring select-none focus-visible:outline-2 focus-visible:-outline-offset-2"
                            >
                                <span className="flex-1 text-md font-medium text-brand-tertiary">{item.title}</span>
                                <ChevronDown className={cx("size-5 shrink-0 text-quaternary transition-transform duration-150", isOpen && "rotate-180")} />
                            </button>
                            <motion.div
                                className="overflow-hidden border-t border-[var(--color-brand-100)]"
                                initial={false}
                                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                                transition={{ type: "spring", damping: 24, stiffness: 240, bounce: 0.4 }}
                            >
                                <div className="p-4">{item.content}</div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={cx("font-barlow flex flex-col gap-8", className)}>
            {items.map((item, index) => {
                const isOpen = openKeys.has(item.id);

                return (
                    <div key={item.id} className={cx(index !== 0 && "-mt-px border-t border-secondary pt-6")}>
                        {/*
                         * `m-0!` on the h3 and `tracking-normal!` on the title span override the docs
                         * site's unlayered `.prose-doc h3` rule (32px/8px top/bottom margin, uppercase,
                         * 0.08em letter-spacing) that would otherwise bleed into this heading whenever
                         * the accordion renders inside a doc page - same fix as TableCardHeader's `h2`.
                         */}
                        <h3 className="m-0!">
                            <button
                                type="button"
                                onClick={() => toggle(item.id)}
                                aria-expanded={isOpen}
                                className="flex w-full cursor-pointer items-start justify-between gap-2 rounded-md text-left outline-focus-ring select-none focus-visible:outline-2 focus-visible:outline-offset-2 md:gap-6"
                            >
                                <span className="text-lg! font-semibold! tracking-normal! text-primary! normal-case!">{item.title}</span>
                                <AccordionChevron isOpen={isOpen} />
                            </button>
                        </h3>

                        <motion.div
                            className="overflow-hidden"
                            initial={false}
                            animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                            transition={{ type: "spring", damping: 24, stiffness: 240, bounce: 0.4 }}
                        >
                            <div className="pt-1 pr-8 md:pr-12">{item.content}</div>
                        </motion.div>
                    </div>
                );
            })}
        </div>
    );
};
