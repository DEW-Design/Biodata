"use client";

// The search box in a collection toolbar: the row of search, then Filter (and view or table controls)
// that sits above a list, a table or a tree. One width everywhere (CONTRACTS 4.2c): 384px
// (`max-w-sm`), shrinking only on a narrow screen, small size, the SearchMd icon. It never grows to
// fill the row, so Filter always sits right beside it, where the other lists put it.

import { SearchMd } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";

export function ToolbarSearch({
  label,
  placeholder,
  value,
  onChange,
  onClear,
}: {
  /** Accessible name, e.g. "Search projects". */
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  /** Defaults to clearing to an empty string - override only when clearing also needs to reset
   * something else (e.g. pagination). */
  onClear?: () => void;
}) {
  return (
    <div className="w-full max-w-sm shrink-0">
      <Input
        aria-label={label}
        size="sm"
        icon={SearchMd}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onClear={onClear ?? (() => onChange(""))}
        clearLabel="Clear search"
      />
    </div>
  );
}
