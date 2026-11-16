"use client";

import { ArrowDown, ArrowUp, CornerDownLeft } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { CommandMenuNavigationIcon } from "./command-menu-navigation-icon";

interface CommandMenuFooterProps {
    className?: string;
}

// The ingested footer also drew a settings button and a "return to parent" hint. Nothing in the component opens settings or navigates to a parent, so both
// were dropped (CONTRACTS 2.10, 2.12): a hint is a promise. The three left are wired by React Aria (arrows, Enter, Escape). `bg-alpha-white/80` is not a defined utility.
export const CommandMenuFooter = ({ className }: CommandMenuFooterProps) => (
    <footer
        className={cx(
            "absolute inset-x-0 bottom-0 flex items-center gap-x-3 bg-primary p-2 pl-4.5 ring-1 ring-secondary_alt max-md:hidden",
            className,
        )}
    >
        <div className="flex gap-4">
            <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                    <CommandMenuNavigationIcon type="icon" icon={ArrowUp} />
                    <CommandMenuNavigationIcon type="icon" icon={ArrowDown} />
                </div>
                <span className="text-sm font-semibold text-tertiary">to navigate</span>
            </div>
            <div className="flex items-center gap-2">
                <CommandMenuNavigationIcon type="icon" icon={CornerDownLeft} />
                <span className="text-sm font-semibold text-tertiary">to select</span>
            </div>
            <div className="flex items-center gap-2">
                <CommandMenuNavigationIcon type="text" label="esc" />
                <span className="text-sm font-semibold text-tertiary">to close</span>
            </div>
        </div>
    </footer>
);
