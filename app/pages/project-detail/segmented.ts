// The segmented switch used on this page (the Tree / Table switch). Every other switch between two or
// three modes here (the note tabs in edit) uses these same classes, so they look the same.

import { cx } from "@/utils/cx";

export const segmentTrayClass =
  "flex w-max gap-1 rounded-[10px] bg-secondary p-1 ring-1 ring-secondary ring-inset";

export const segmentClass = ({
  isSelected,
  isDisabled,
}: {
  isSelected: boolean;
  isDisabled?: boolean;
}) =>
  cx(
    "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2",
    isSelected
      ? "bg-primary_alt text-secondary shadow-xs"
      : "text-quaternary hover:text-secondary",
    isDisabled && "cursor-not-allowed opacity-50 hover:text-quaternary",
  );
