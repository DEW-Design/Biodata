"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button as AriaButton } from "react-aria-components";
import { Glasses01 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { useUserRole } from "@/lib/use-user-role";
import { USER_ROLES, type UserRole } from "@/lib/user-role";

// A dev tool, not a BioData SA feature - there's no real login in this exploratory build, so the
// only way to preview a role today is hand-editing the `?userRole=` URL param, which the user
// flagged directly as "flimsy" after doing it repeatedly to check the public-user work. A FAB
// (bottom-right, `bg-primary-solid` - near-black, not the DEW brand colour, so it doesn't read as
// a real branded action button) opening straight onto the role list.
//
// `Dropdown` (components/base/dropdown/dropdown.tsx, react-aria's `MenuTrigger`), not `Select` -
// the first pass used a `DialogTrigger`+`Select`, which took two clicks to actually pick a role
// (open the popover, then open the Select's own listbox on top of it). `Dropdown.Root` accepts any
// trigger, not just its own `DotsButton` convenience wrapper, so the FAB itself is the trigger and
// every role sits in the menu that opens directly under it - one click to open, one to pick,
// flagged directly by the user as the whole point of collapsing this into a FAB in the first place.
const roleOptions = USER_ROLES.map((role) => ({ id: role, label: role }));

export function RoleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRole = useUserRole();

  const setRole = (role: UserRole) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("userRole", role);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="fixed right-5 bottom-5 z-50">
      <Dropdown.Root>
        <AriaButton
          aria-label="Preview a different role"
          className="flex size-12 items-center justify-center rounded-full bg-primary-solid text-white shadow-lg outline-brand transition duration-100 ease-linear hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.96]"
        >
          <Glasses01 className="size-5" />
        </AriaButton>
        <Dropdown.Popover placement="top right">
          <Dropdown.Menu
            aria-label="Preview role"
            selectionMode="single"
            selectedKeys={[activeRole]}
            onSelectionChange={(keys) => {
              if (keys === "all") return;
              const [role] = Array.from(keys) as UserRole[];
              if (role) setRole(role);
            }}
          >
            {roleOptions.map((item) => (
              <Dropdown.Item key={item.id} id={item.id} label={item.label} />
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
    </div>
  );
}
