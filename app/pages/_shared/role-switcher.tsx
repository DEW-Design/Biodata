"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button as AriaButton } from "react-aria-components";
import { Glasses01 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { hasFeatureAccess, type FeatureKey } from "@/config/role-access.config";
import { useUserRole } from "@/lib/use-user-role";
import { USER_ROLES, type UserRole } from "@/lib/user-role";

// Route prefixes whose *entire* page is gated behind one feature flag, rather than a single
// control inside an otherwise-visible page (the ordinary case - see config/role-access.config.ts's
// own build convention). DSA is the one instance of this so far: `DsaShell` replaces all of `main`
// with a restriction message for any role `dsaManagement` doesn't cover. Kept as an explicit,
// short list rather than inferred from nav-tree membership - project-detail/observation-detail are
// real, unrestricted pages with no nav key of their own, so "not a nav key" isn't the same signal
// as "this role can't view it".
const wholePageGates: { prefix: string; feature: FeatureKey }[] = [
  { prefix: "/pages/dsa", feature: "dsaManagement" },
  { prefix: "/pages/dla", feature: "dlaAccess" },
];

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
    // Switching to a role that can't view the page you're currently previewing shouldn't strand
    // you on that same URL showing its own "you don't have access" fallback - that fallback is
    // correct for someone who lands on the URL directly (an old link, a bookmark), but this
    // switcher is a live preview tool, so it re-routes to Home instead. Flagged directly by the
    // user off a screenshot: switching to public-user while on a DSA record showed the restricted
    // page rather than taking them somewhere they could actually explore.
    const isBlocked = wholePageGates.some(({ prefix, feature }) => pathname.startsWith(prefix) && !hasFeatureAccess(feature, role));
    const targetPath = isBlocked ? "/pages/dashboard" : pathname;
    // A blocked redirect starts a clean query string (dropping e.g. DSA's own `?status=`) rather
    // than carrying params that mean nothing on the destination page.
    const params = new URLSearchParams(isBlocked ? undefined : searchParams.toString());
    params.set("userRole", role);
    router.push(`${targetPath}?${params.toString()}`);
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
