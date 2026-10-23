"use client";

import { useState } from "react";
import { ArrowRight, ChevronSelectorVertical } from "@untitledui/icons";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Popover } from "@/components/base/select/popover";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";

// The section crumb of a breadcrumb ("Projects") as a switcher: the label with an up-down caret, opening
// a popup so the person can jump to another record in that section without going back to the table,
// searching and clicking in. The popup is one card: the design system's searchable `ComboBox` at the
// top (a search box, with its list drawn straight beneath it; `listbox="inline"`), about six rows showing
// with the rest scrolling inside, and a bar fixed at the bottom ("View all projects") that goes to the
// full table. Search matches the name or the ID. The current record is ticked. Sept 30 2026, per the
// designer: first a plain menu, then "this has to be a searchable component ... combobox", then "the
// popup with the search box is what I meant". The project pages are the first user (`ProjectSwitcher`);
// other record pages can use the same piece.

export interface BreadcrumbSwitcherItem {
  id: string;
  label: string;
  /** A short secondary value shown after the label, e.g. the project's ID. Searchable too. */
  addon?: string;
}

// The current record is the list's selected item (`selectedKey`), so it is drawn as the design system draws a selected item everywhere: its row tinted and a brand-coloured tick at the right. It was a small
// grey tick at the left of an otherwise plain row, so a row the pointer was resting on (tinted by hover) looked like the chosen one and the chosen one did not look chosen (the designer, 23 Oct 2026: "the
// selection isn't clear ... what have I chosen?").

export function BreadcrumbSwitcher({
  label,
  ariaLabel,
  placeholder,
  items,
  currentId,
  onSelect,
  viewAllLabel,
  onViewAll,
}: {
  /** The crumb's text, e.g. "Projects". */
  label: string;
  /** Names the crumb button, the popup and the search box, e.g. "Switch project". */
  ariaLabel: string;
  /** The search box's placeholder, e.g. "Search projects". */
  placeholder: string;
  items: BreadcrumbSwitcherItem[];
  currentId?: string;
  onSelect: (id: string) => void;
  /** The bar fixed at the foot of the popup, e.g. "View all projects". */
  viewAllLabel: string;
  onViewAll: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const close = () => setIsOpen(false);

  return (
    <AriaDialogTrigger
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setQuery("");
      }}
    >
      <AriaButton
        aria-label={ariaLabel}
        className={({ isFocusVisible }) =>
          cx(
            "hit-area ghost-fill flex cursor-pointer items-center gap-0.5 rounded-md text-tertiary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-primary",
            isFocusVisible && "outline-2 outline-offset-2",
          )
        }
      >
        {label}
        <ChevronSelectorVertical className="size-4 shrink-0 text-fg-quaternary" aria-hidden />
      </AriaButton>
      <Popover size="auto" placement="bottom start" offset={12} className="w-96 py-0">
        <AriaDialog aria-label={ariaLabel} className="flex flex-col outline-hidden">
          <div className="p-2">
            <Select.ComboBox
              size="sm"
              aria-label={ariaLabel}
              placeholder={placeholder}
              autoFocus
              listbox="inline"
              popoverSize="md"
              // Inside the ComboBox's own region, so it stays visible to assistive technology while the list is open (a ComboBox
              // hides everything outside its input and list). The negative margins take it out to the popup's edges.
              listboxFooter={
                <div className="-mx-2 -mb-2 mt-2 border-t border-secondary p-1">
                  <Button
                    color="tertiary"
                    size="sm"
                    iconTrailing={ArrowRight}
                    className="w-full justify-between"
                    onPress={() => {
                      close();
                      onViewAll();
                    }}
                  >
                    {viewAllLabel}
                  </Button>
                </div>
              }
              items={items.map((item) => ({ id: item.id, label: item.label, supportingText: item.addon }))}
              selectedKey={currentId}
              inputValue={query}
              onInputChange={setQuery}
              // Only a real choice counts: the ComboBox also reports an empty selection when it opens or is
              // tabbed out of, and that must not close the popup. Choosing the current record just closes.
              onSelectionChange={(key) => {
                if (key === null) return;
                if (key !== currentId) onSelect(String(key));
                close();
              }}
            >
              {/* Choosing the row that is already the selection reports no change, so it closes the popup itself. */}
              {(item) => <Select.Item {...item} onAction={item.id === currentId ? close : undefined} aria-label={item.id === currentId ? `${item.label}, current` : undefined} />}
            </Select.ComboBox>
          </div>
        </AriaDialog>
      </Popover>
    </AriaDialogTrigger>
  );
}
