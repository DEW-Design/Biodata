"use client";

import type { FC, ReactNode } from "react";
import { useState } from "react";
import { Menu01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import type { NavNode } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";

// The icon rail and contextual sidebar are both `hidden ... lg:flex` - below `lg` there was no way
// to reach any section at all, including the My BioData/Flora and Fauna Dashboard tab switcher
// that lives inside the sidebar. This is the fallback: a `lg:hidden` trigger in the header that
// opens the same top-level sections (plus optional extra content, e.g. Home's two tabs) in a real
// Modal, so narrower viewports keep a path to every section instead of losing navigation outright.
export function MobileNavTrigger({
  sections,
  sectionIcons,
  activeSection,
  onSelectSection,
  children,
}: {
  sections: NavNode[];
  sectionIcons: Record<string, FC<{ className?: string }>>;
  activeSection: string;
  onSelectSection: (label: string) => void;
  /** Extra content below the section list (e.g. Home's My BioData/Flora and Fauna Dashboard tabs) - a
   * render prop so it can close this modal itself, the same way selecting a section does. */
  children?: ReactNode | ((close: () => void) => ReactNode);
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button color="secondary" iconLeading={Menu01} aria-label="Open navigation" className="lg:hidden" />
      <ModalOverlay isDismissable>
        <Modal className="w-full max-w-xs">
          <Dialog aria-label="Navigation">
            <nav aria-label="Primary" className="flex flex-col gap-0.5 p-2">
              {sections.map((section) => {
                const Icon = sectionIcons[section.label];
                const active = section.label === activeSection;
                return (
                  <button
                    key={section.label}
                    type="button"
                    onClick={() => {
                      onSelectSection(section.label);
                      setIsOpen(false);
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
                      active ? "bg-brand-solid text-white" : "text-primary hover:bg-secondary",
                    )}
                  >
                    {Icon && <Icon className="size-4.5 shrink-0" />}
                    {section.label}
                  </button>
                );
              })}
            </nav>
            {children && (
              <div className="flex flex-col gap-0.5 border-t border-secondary p-2">{typeof children === "function" ? children(() => setIsOpen(false)) : children}</div>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
