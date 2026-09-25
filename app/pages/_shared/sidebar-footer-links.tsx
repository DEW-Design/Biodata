import { registeredUserFooterLinks } from "@/lib/registered-user-nav";

// The Terms / Privacy / Help links at the foot of every contextual sidebar (column 2).
export function SidebarFooterLinks() {
  return (
    <div className="flex flex-col gap-2 border-t border-secondary pt-4 text-xs text-quaternary">
      {registeredUserFooterLinks.map((link) => (
        <p key={link}>{link}</p>
      ))}
    </div>
  );
}
