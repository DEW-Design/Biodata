"use client";

import { createContext, useContext } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutOptionSwitcher } from "@/app/pages/_shared/layout-option-switcher";
import { VM_ROOT } from "@/app/pages/_shared/vouchers/vm-data";

// Voucher Management's batch table is explored in two layouts (CONTRACTS 4.4), presented through the
// Prototype tools bar's Layout tool (the designer, 2 Oct 2026: "create a version to explore how it would
// look to show separate row for each review items ... just like what we did in Figma"). Both read and
// write the same scans and decisions, with the same actions; they differ only in how a record's fields
// are laid out.
//
//   Option 1  a row per record, its fields as lines inside it.
//   Option 2  a row per field, the record's ID and key spanning them, each line's background coloured
//             by where it stands, as the Figma draws it (node 1584:10572).
//
// Every link inside a layout stays in that layout: screens read their root from this context, and
// switching layouts keeps the screen and its query.

export const VM_OPTION_2 = `${VM_ROOT}/option-2`;

export type VmOption = "1" | "2";

const VmRootContext = createContext<string>(VM_ROOT);

export function VmRootProvider({ option, children }: { option: VmOption; children: React.ReactNode }) {
  return <VmRootContext.Provider value={option === "2" ? VM_OPTION_2 : VM_ROOT}>{children}</VmRootContext.Provider>;
}

/** The route every link on this screen builds on: /pages/vouchers, or its option-2 copy. */
export function useVmRoot(): string {
  return useContext(VmRootContext);
}

export function VmOptionSwitcher() {
  const root = useVmRoot();
  const pathname = usePathname();
  const params = new URLSearchParams(useSearchParams());
  params.delete("userRole");
  const query = params.toString() ? `?${params}` : "";
  const rest = (pathname.startsWith(VM_OPTION_2) ? pathname.slice(VM_OPTION_2.length) : pathname.slice(VM_ROOT.length)) + query;
  return (
    <LayoutOptionSwitcher
      ariaLabel="Voucher Management layout"
      current={root === VM_OPTION_2 ? "2" : "1"}
      options={[
        { id: "1", label: "Option 1", description: "A row per record, its fields as lines inside it", href: `${VM_ROOT}${rest}` },
        { id: "2", label: "Option 2", description: "A row per field, coloured by where it stands, as in the Figma", href: `${VM_OPTION_2}${rest}` },
      ]}
    />
  );
}
