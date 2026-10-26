"use client";

import { Badge } from "@/components/base/badges/badges";
import { EmbeddedTable } from "@/app/pages/_shared/embedded-table";
import { nominationStatusMeta, restrictionConditions, restrictionWhere, type Nomination } from "@/app/pages/_shared/nominations/nomination-data";

// A species' existing restrictions, whoever nominated them, as a table like the Review step's: one row per restriction, which is
// one nomination (the designer, 25 Oct 2026: a restriction is the species where it is found, "restrict all pigeons found within
// Adelaide hills that['s] sex is male and has any other attribute"). Where it applies, what a record must match there, and the
// nomination's status as the nominations list shows it. Shown on the species step once a species is chosen: "any user who wants
// to restrict a species shall know what is restricted already". Read only: no action on a row (the designer, 25 Oct 2026: "no need
// for any action button here. Just show the changes"); what should change is nominated on the next step.
// The basic table while it fits one page, the paged card past that (`EmbeddedTable`, 4.2h).

export function ExistingRestrictionsTable({ restrictions }: { restrictions: Nomination[] }) {
  return (
    <EmbeddedTable
      ariaLabel="Existing restrictions for this species"
      minWidth="min-w-[560px]"
      columns={[
        { id: "id", label: "Nomination", className: "w-[22%]", isRowHeader: true },
        { id: "where", label: "Where", className: "w-[24%]" },
        { id: "what", label: "Restricted", className: "w-[30%]" },
        { id: "status", label: "Status", className: "w-[24%]" },
      ]}
      rows={restrictions}
      cell={(n, column) => {
        if (column === "id") return <span className="text-sm font-medium whitespace-nowrap text-primary tabular-nums">{n.id}</span>;
        if (column === "where") return <span className="text-sm text-secondary">{restrictionWhere(n)}</span>;
        if (column === "what")
          return (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {restrictionConditions(n).map((c) => (
                <li key={c} className="text-sm text-secondary">
                  {c}
                </li>
              ))}
            </ul>
          );
        return (
          <Badge size="sm" color={nominationStatusMeta[n.status].badgeColor}>
            {nominationStatusMeta[n.status].label}
          </Badge>
        );
      }}
    />
  );
}
