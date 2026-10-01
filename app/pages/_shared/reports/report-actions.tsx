"use client";

import { ArrowUpRight, Link01, Star01 } from "@untitledui/icons";
import { Button as AriaButton } from "react-aria-components";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { toast } from "@/components/application/toast/toast";
import { formatDateTime } from "@/app/pages/_shared/reports/ingestion-report-data";
import { toggleFavourite } from "@/app/pages/_shared/reports/reports-store";
import type { ReportEntry } from "@/app/pages/_shared/reports/reports-data";
import { BASE_PATH } from "@/lib/base-path";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";

// What a person can do to one report from the landing, on its card and on its row: star it, and the rest in a "..." menu
// (designer, 1 Oct 2026: "Favourites, row-level actions in the 3 dot menu").

export function FavouriteButton({ report, isFavourite }: { report: ReportEntry; isFavourite: boolean }) {
  return (
    <AriaButton
      aria-label={isFavourite ? `Remove ${report.title} from favourites` : `Add ${report.title} to favourites`}
      aria-pressed={isFavourite}
      onPress={() => toggleFavourite(report.id)}
      className={({ isFocusVisible }) =>
        cx(
          "flex cursor-pointer items-center rounded-md p-1 outline-focus-ring transition duration-100 ease-linear hover:text-fg-quaternary_hover",
          isFavourite ? "text-fg-brand-secondary_alt" : "text-fg-quaternary",
          isFocusVisible && "outline-2 outline-offset-2",
        )
      }
    >
      <Star01 className={cx("size-4", isFavourite && "fill-current")} aria-hidden />
    </AriaButton>
  );
}

export function ReportMenu({ report, isFavourite }: { report: ReportEntry; isFavourite: boolean }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const actions: { id: string; label: string; icon: typeof Star01; run: () => void }[] = [
    { id: "open", label: "Open report", icon: ArrowUpRight, run: () => router.push(roleHref(report.path)) },
    { id: "favourite", label: isFavourite ? "Remove from favourites" : "Add to favourites", icon: Star01, run: () => toggleFavourite(report.id) },
    {
      id: "copy",
      label: "Copy link",
      icon: Link01,
      run: () => {
        const url = new URL(`${BASE_PATH}${roleHref(report.path)}`, window.location.origin).toString();
        navigator.clipboard?.writeText(url);
        toast.success("Link copied", { description: report.title });
      },
    },
  ];
  return (
    <Dropdown.Root>
      <Dropdown.DotsButton aria-label={`Actions for ${report.title}`} className="p-1" />
      <Dropdown.Popover placement="bottom right">
        <Dropdown.Menu aria-label={`Actions for ${report.title}`} onAction={(key) => actions.find((a) => a.id === key)?.run()}>
          {actions.map((a) => (
            <Dropdown.Item key={a.id} id={a.id} label={a.label} icon={a.icon} />
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

/** When a report was last opened, or that it has not been. */
export function openedLabel(ms: number | undefined): string {
  return ms ? formatDateTime(ms) : "Not opened yet";
}
