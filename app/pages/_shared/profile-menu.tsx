"use client";

import { useState } from "react";
import { Button as AriaButton, Dialog, DialogTrigger, Focusable } from "react-aria-components";
import { ChevronDown } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Popover } from "@/components/base/select/popover";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { registeredUserAccountMenu } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";

// The header's account controls, pulled out for /pages/dsa so a new screen doesn't paste a sixth
// copy. The five older shells (dashboard, project-list, project-detail, observation-detail,
// observations) still carry their own identical local copies; folding them onto this file is a
// separate cleanup, not part of the DSA work.

// DialogTrigger + our real Popover (react-aria), not a hand-rolled useState toggle - gets outside
// click and Escape dismissal for free.
export function ProfileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <DialogTrigger onOpenChange={setOpen}>
      <AriaButton className="flex items-center gap-1 rounded-md outline-brand focus-visible:outline-2 focus-visible:outline-offset-2">
        <Avatar size="md" initials="OW" alt="Olivia Wyatt" />
        <ChevronDown className={cx("size-3.5 text-quaternary transition-transform", open && "rotate-180")} />
      </AriaButton>
      <Popover size="sm" className="w-48 p-1">
        <Dialog className="outline-hidden">
          <p className="px-3 py-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Profile</p>
          {registeredUserAccountMenu.map((item) => (
            <p key={item} className="cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">
              {item}
            </p>
          ))}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

// public-user's header replacement for ProfileMenu - no account to show, and no real auth flow in
// this build, so both buttons are disabled with a "coming soon" tooltip.
export function GuestAuthActions() {
  return (
    <div className="flex items-center gap-2">
      <Tooltip title="Coming soon - authentication isn't built yet">
        <Focusable>
          <span className="inline-flex">
            <Button color="secondary" isDisabled>
              Log in
            </Button>
          </span>
        </Focusable>
      </Tooltip>
      <Tooltip title="Coming soon - authentication isn't built yet">
        <Focusable>
          <span className="inline-flex">
            <Button color="primary" isDisabled>
              Sign up
            </Button>
          </span>
        </Focusable>
      </Tooltip>
    </div>
  );
}
