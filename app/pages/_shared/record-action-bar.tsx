"use client";

import type { FC } from "react";
import { DotsHorizontal } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";

export interface RecordAction {
  id: string;
  label: string;
  /** Required: every action button carries an icon that names the action (CONTRACTS 3.12). */
  icon: FC<{ className?: string }>;
  onPress: () => void;
  isDisabled?: boolean;
  /** Ends the record or discards it. Sits below a divider in the menu, never beside the primary. */
  destructive?: boolean;
}

/**
 * The action row on a record page (DSA, DLA, user management). One primary action (the next step in the workflow), at
 * most a couple of secondary ones that are the natural alternative to it (Reject beside Approve,
 * Download), and everything else in a "More actions" menu, with the destructive ones set apart.
 * A menu that would hold a single action is shown as that button instead.
 */
export function RecordActionBar({
  primary,
  secondary = [],
  menu = [],
  onDark = false,
}: {
  primary?: RecordAction;
  secondary?: RecordAction[];
  menu?: RecordAction[];
  /** On the record's gradient card (RecordHero): the project page's pattern, one white button for the
   *  next step (or the first secondary when there is no step) and every other action in a "..." menu,
   *  destructive ones below a divider. */
  onDark?: boolean;
}) {
  if (onDark) return <DarkActions primary={primary ?? secondary[0]} rest={[...(primary ? secondary : secondary.slice(1)), ...menu]} />;
  const single = menu.length === 1 ? menu[0] : null;
  const menuItems = single ? [] : [...menu.filter((a) => !a.destructive), ...menu.filter((a) => a.destructive)];
  const firstDestructive = menuItems.findIndex((a) => a.destructive);
  const hasNeutral = menuItems.some((a) => !a.destructive);

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {secondary.map((a) => (
        <Button key={a.id} color="secondary" iconLeading={a.icon} isDisabled={a.isDisabled} onPress={a.onPress}>
          {a.label}
        </Button>
      ))}
      {primary && (
        <Button color="primary" iconLeading={primary.icon} isDisabled={primary.isDisabled} onPress={primary.onPress}>
          {primary.label}
        </Button>
      )}
      {single && (
        <Button color={single.destructive ? "link-destructive" : "secondary"} iconLeading={single.icon} onPress={single.onPress}>
          {single.label}
        </Button>
      )}
      {menuItems.length > 0 && (
        <Dropdown.Root>
          <Button color="secondary" iconLeading={DotsHorizontal} aria-label="More actions" />
          <Dropdown.Popover placement="bottom right">
            <Dropdown.Menu
              aria-label="More actions"
              onAction={(key) => menuItems.find((a) => a.id === key)?.onPress()}
            >
              {menuItems.flatMap((a, i) => [
                ...(hasNeutral && i === firstDestructive ? [<Dropdown.Separator key={`sep-${a.id}`} />] : []),
                <Dropdown.Item key={a.id} id={a.id} label={a.label} icon={a.icon} isDisabled={a.isDisabled} />,
              ])}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      )}
    </div>
  );
}

function DarkActions({ primary, rest }: { primary?: RecordAction; rest: RecordAction[] }) {
  const items = [...rest.filter((a) => !a.destructive), ...rest.filter((a) => a.destructive)];
  const firstDestructive = items.findIndex((a) => a.destructive);
  const hasNeutral = items.some((a) => !a.destructive);
  if (!primary && items.length === 0) return null;
  return (
    <div className="flex shrink-0 items-center gap-2">
      {primary && (
        <Button color="secondary" size="sm" iconLeading={primary.icon} isDisabled={primary.isDisabled} onPress={primary.onPress}>
          {primary.label}
        </Button>
      )}
      {items.length > 0 && (
        <Dropdown.Root>
          <Dropdown.DotsButton aria-label="More actions" className="p-1 text-white/80 hover:text-white" />
          <Dropdown.Popover placement="bottom right">
            <Dropdown.Menu aria-label="More actions" onAction={(key) => items.find((a) => a.id === key)?.onPress()}>
              {items.flatMap((a, i) => [
                ...(hasNeutral && i === firstDestructive ? [<Dropdown.Separator key={`sep-${a.id}`} />] : []),
                <Dropdown.Item key={a.id} id={a.id} label={a.label} icon={a.icon} isDisabled={a.isDisabled} />,
              ])}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      )}
    </div>
  );
}
