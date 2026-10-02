"use client";

import { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { LayoutOptionSwitcher } from "@/app/pages/_shared/layout-option-switcher";
import { NT_ROOT } from "@/app/pages/_shared/notifications/nt-data";

// Notification Management is being explored in two layouts (CONTRACTS 4.4), presented through the
// Prototype tools bar's Layout tool. Both read and write the same notifications, with the same fields
// and rules; Option 2 changes only the screens (the designer, 1 Oct 2026: "I dont want you to change
// any functionalities ... I want you to come up with a better UI and visual flow").
//
// Every link inside a layout stays in that layout: screens read their root from this context instead
// of NT_ROOT, and switching layouts keeps the screen (the list, a notification, its edit form).

export const NT_OPTION_2 = `${NT_ROOT}/option-2`;

export type NtOption = "1" | "2";

const NtRootContext = createContext<string>(NT_ROOT);

export function NtRootProvider({ option, children }: { option: NtOption; children: React.ReactNode }) {
  return <NtRootContext.Provider value={option === "2" ? NT_OPTION_2 : NT_ROOT}>{children}</NtRootContext.Provider>;
}

/** The route every link on this screen builds on: /pages/notifications, or its option-2 copy. */
export function useNtRoot(): string {
  return useContext(NtRootContext);
}

export function NtOptionSwitcher() {
  const root = useNtRoot();
  const pathname = usePathname();
  const rest = pathname.startsWith(NT_OPTION_2) ? pathname.slice(NT_OPTION_2.length) : pathname.slice(NT_ROOT.length);
  return (
    <LayoutOptionSwitcher
      ariaLabel="Notification Management layout"
      current={root === NT_OPTION_2 ? "2" : "1"}
      options={[
        { id: "1", label: "Option 1", description: "Table list, a Preview, Settings and History record, the three-section form", href: `${NT_ROOT}${rest}` },
        { id: "2", label: "Option 2", description: "Status tabs and readable triggers, a How it works overview, the email building beside every step", href: `${NT_OPTION_2}${rest}` },
      ]}
    />
  );
}
