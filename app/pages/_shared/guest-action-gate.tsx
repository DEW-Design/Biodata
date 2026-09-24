"use client";

import { useState, type FC } from "react";
import { Heading as AriaHeading } from "react-aria-components";
import { useRouter } from "next/navigation";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { useRoleHref } from "@/lib/use-role-href";

// The moment of delight, for the two header actions ("Add project"/"Upload dataset") that need a
// signed-in account: a guest used to just not see these buttons at all - honest, but a dead end
// with no invitation in it. Flagged directly by the user: reveal them, and turn the "you can't do
// this" moment into a warm, specific preview of what signing up unlocks, rather than a wall.
//
// Built on the real `ConfirmationModal`'s own anatomy (FeaturedIcon + title + description + a
// 2-button row, see components/application/modals/modal.tsx) rather than that component directly -
// this isn't a confirm/cancel choice, it's two equally-weighted real actions (Log in, Sign up), so
// forcing it through `cancelLabel`/`confirmLabel` semantics would misrepresent what it is.
//
// "Log in"/"Sign up" are real buttons, not disabled-with-tooltip like `GuestAuthActions`'s header
// pair - clicking either now navigates to the real /pages/auth/login or /pages/auth/signup flow
// (see CONTEXT.md's dated entry for the auth flow build) instead of firing a "not built yet"
// toast, now that a real flow exists to send the user to.
export function SignUpPromptModal({
  isOpen,
  onOpenChange,
  icon: Icon,
  title,
  description,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  icon: FC<{ className?: string }>;
  title: string;
  description: string;
}) {
  const router = useRouter();

  const respond = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Modal className="w-full max-w-xs">
        <Dialog>
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between">
              <FeaturedIcon icon={Icon} color="brand" theme="light" size="lg" />
              <CloseButton size="sm" slot="close" />
            </div>
            <div className="flex flex-col gap-1">
              <AriaHeading slot="title" className="text-md font-semibold text-primary">
                {title}
              </AriaHeading>
              <p className="text-sm text-tertiary">{description}</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Button color="secondary" size="lg" onClick={() => respond("/pages/auth/login")}>
                Log in
              </Button>
              <Button color="primary" size="lg" onClick={() => respond("/pages/auth/signup")}>
                Sign up
              </Button>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

// The visible, always-shown version of a header action that needs an account - same Button, same
// label/icon, every role sees it (no more hiding it outright for public-user). Only public-user's
// click behaviour differs: everyone else's click still does nothing (the real flow behind "Add
// project"/"Upload dataset" isn't built for anyone yet, signed in or not - this only fixes what
// happens when a *guest specifically* reaches for it), a guest's click opens the invite modal.
//
// A plain `useState` toggle driving a standalone `ModalOverlay`, not a `DialogTrigger` wrapping
// the button - same shape `ConfirmationModal` itself uses (components/application/modals/modal.tsx),
// since the trigger and the overlay aren't siblings-by-convention here, the button needs to render
// identically (same Button, no extra wrapper) whether or not it happens to be gated.
export function GuestActionButton({
  icon,
  label,
  color,
  isGuest,
  modalTitle,
  modalDescription,
  href,
}: {
  icon: FC<{ className?: string }>;
  label: string;
  color: "primary" | "secondary";
  isGuest: boolean;
  modalTitle: string;
  modalDescription: string;
  /** Where a signed-in user's click goes - carries the active role forward via `useRoleHref`, same
   *  as every other internal navigation in this build. Omit to keep the button a no-op (still true
   *  for "Upload dataset" - no real flow exists behind it yet). */
  href?: string;
}) {
  const [open, setOpen] = useState(false);
  const roleHref = useRoleHref();
  const router = useRouter();

  if (!isGuest) {
    return (
      <Button color={color} iconLeading={icon} onClick={href ? () => router.push(roleHref(href)) : undefined}>
        {label}
      </Button>
    );
  }

  return (
    <>
      <Button color={color} iconLeading={icon} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <SignUpPromptModal isOpen={open} onOpenChange={setOpen} icon={icon} title={modalTitle} description={modalDescription} />
    </>
  );
}
