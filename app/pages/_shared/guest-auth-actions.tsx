import { Button } from "@/components/base/buttons/button";

// public-user's header replacement for ProfileMenu - there's no account to show an avatar/
// Profile Settings/Logout for, so a signed-out guest gets a real "Log in / Sign up" entry point
// instead (the real IA screenshot's "Header > Login / Sign up" item). Previously disabled with a
// "coming soon" tooltip in 7 separate, duplicated local copies of this component (dashboard,
// dashboard/option-2, project-list and option-2, project-detail,
// observation-detail, observations) - now that a real /pages/auth/** flow
// exists, extracted into one shared, enabled component (same "fix the duplicated pattern once it
// needs a real behaviour change" precedent as this build's other consolidations, e.g.
// SectionHeader) rather than updating 7 divergent copies. Two buttons, not one combined control -
// the screenshot's single nav-tree label names the header's auth entry point as a concept, not
// one literal button.
export function GuestAuthActions() {
  return (
    <div className="flex items-center gap-2">
      <Button color="secondary" href="/pages/auth/login">
        Log in
      </Button>
      <Button color="primary" href="/pages/auth/signup">
        Sign up
      </Button>
    </div>
  );
}
