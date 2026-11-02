"use client";

import type { FC, ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { RefreshCcw01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

// What a collection shows in place of its table when there are no rows: the same shape as the DLA and DSA
// lists' empty states (a gray modern FeaturedIcon, a heading, one balanced line saying why and what to do,
// then the action), filling the space the table would have had. The heading carries `!` overrides so the
// doc-site prose globals never leak into it (CONTRACTS 2.7). The action is optional: a list that is empty
// because nothing exists yet has no honest "next step" to offer until the designer names one. `children` replaces the single
// action with the caller's own buttons, for an empty state with more than one way forward (a new project's records: upload a
// dataset, or add a record). `compact` (opt-in) is the same shape for a card that has nothing in it: a smaller icon and heading, no
// minimum height, so it sits inside a card without making the card tall; the heading is one level under the card's own.
export function ListEmptyState({
  icon,
  title,
  description,
  action,
  children,
  compact = false,
  headingLevel,
}: {
  icon: FC<{ className?: string }>;
  title: string;
  description: ReactNode;
  /** One button. Its icon is the action's own (`Plus` for an add, 3.12); the default is the reset arrow, which is what undoing a search or filter takes. */
  action?: { label: string; onPress: () => void; icon?: FC<{ className?: string }> };
  /** The actions, in place of `action`, when there is more than one. */
  children?: ReactNode;
  /** For a card with nothing in it, not a whole collection. @default false */
  compact?: boolean;
  /** The heading's level, one under the heading it sits beneath. @default 4 when compact, 2 otherwise */
  headingLevel?: 2 | 3 | 4;
}) {
  const Heading = `h${headingLevel ?? (compact ? 4 : 2)}` as "h2" | "h3" | "h4";
  return (
    <div className={cx("flex flex-col items-center justify-center text-center", compact ? "gap-4 p-6" : "min-h-48 flex-1 gap-6 p-12")}>
      <div className={cx("flex flex-col items-center", compact ? "max-w-sm gap-3" : "max-w-md gap-4")}>
        <FeaturedIcon icon={icon} theme="modern" color="gray" size={compact ? "md" : "lg"} />
        <div className={cx("flex flex-col", compact ? "gap-1" : "gap-2")}>
          <Heading className={cx("m-0! tracking-normal! font-semibold! text-primary!", compact ? "text-sm!" : "text-lg!")}>{title}</Heading>
          <p className="text-sm text-balance text-tertiary">{description}</p>
        </div>
      </div>
      {children ? <div className="flex flex-wrap items-center justify-center gap-3">{children}</div> : null}
      {!children && action && (
        <Button iconLeading={action.icon ?? RefreshCcw01} color="secondary" size={compact ? "sm" : undefined} onPress={action.onPress}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
