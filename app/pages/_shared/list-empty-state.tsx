"use client";

import type { FC, ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { RefreshCcw01 } from "@untitledui/icons";

// What a collection shows in place of its table when there are no rows: the same shape as the DLA and DSA
// lists' empty states (a gray modern FeaturedIcon, a heading, one balanced line saying why and what to do,
// then the action), filling the space the table would have had. The heading carries `!` overrides so the
// doc-site prose globals never leak into it (CONTRACTS 2.7). The action is optional: a list that is empty
// because nothing exists yet has no honest "next step" to offer until the designer names one.
export function ListEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: FC<{ className?: string }>;
  title: string;
  description: ReactNode;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <div className="flex min-h-48 flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
      <div className="flex max-w-md flex-col items-center gap-4">
        <FeaturedIcon icon={icon} theme="modern" color="gray" size="lg" />
        <div className="flex flex-col gap-2">
          <h2 className="m-0! text-lg! font-semibold! tracking-normal! text-primary!">{title}</h2>
          <p className="text-sm text-balance text-tertiary">{description}</p>
        </div>
      </div>
      {action && (
        <Button iconLeading={RefreshCcw01} color="secondary" onPress={action.onPress}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
