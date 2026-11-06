"use client";

import { Suspense, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell01, Inbox01, PieChart03, User01 } from "@untitledui/icons";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { HomeDashboardContent } from "@/app/pages/_shared/home-dashboard";
import { GuestAboutAside } from "@/app/pages/_shared/guest-home";
import { LayoutOptionSwitcher } from "@/app/pages/_shared/layout-option-switcher";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { RestrictedState } from "@/app/pages/_shared/restricted-state";
import { keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { approveOldest, clearAll, startAgain, submitExample, useActivity, useWaitingCount } from "./activity-store";
import { ActivityBell, ActivityPageBody, ActivityPanel } from "./activity-ui";

// LAB: where does a person find out that something needs them, or has happened to their request? Activity is the UX name for it
// ("notifications" stays Notification Management's, the email an admin configures; the designer, 3 Nov 2026). Nothing in the product
// tells an admin a dataset is waiting, or the uploader that it was approved: the workflow page marks every Activity line Proposed.
//
// The job (the designer, 5 Nov 2026): a user submits a dataset for approval and the admin is told; once the admin approves it, the user
// sees "dataset on project has been approved" and can view the project. There is no activity engine: the example is emulated, from a
// small store the Prototype tools' "Example" menu drives (a dataset is submitted; the admin approves the oldest; start again, which is also
// where a first visit starts, with one dataset waiting for the admin and one already approved; or clear it all for the empty states). Switch
// "Viewing as" between a Registered User and a BioData Admin to see each side. Nothing is saved to the product, only to this browser.
//
// Principles first (0.10): 1 Say less (a row says one thing and offers one next step; an empty list says what will appear), 5 Make it
// obvious (what happened, on which project, where to go; unread is visible), 6 Reveal in steps (a count first, the list one press away),
// 7 Design every state (nothing, one, many, read and unread, the admin, the uploader, a signed-out visitor who has none), 3 One system
// (the row, the section header and the tabs are the product's). Where they pull apart: Say less against Make it obvious, as a panel is
// always read and a bell only when pressed.
//   A  a section on Home, above the rest: always in view, takes room from Home
//   B  its own screen, All and Unread in column 2: the longest list, one more place to go to
//   C  a bell after the Add menu, the list in a popover: no room taken, found only by the count
// Option C needs the header's opt-in `activity` slot (AppHeader), empty everywhere else.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

type Option = "home" | "page" | "bell";

const OPTIONS: { id: Option; label: string; description: string }[] = [
  { id: "home", label: "A: A section on Home", description: "1 Say less, 5 Make it obvious: always in view" },
  { id: "page", label: "B: Its own screen", description: "6 Reveal in steps: All and Unread in column 2" },
  { id: "bell", label: "C: A bell in the header", description: "6 Reveal in steps: a count, the list one press away" },
];

const HREF = (id: Option) => `/proto/activity-notifications?option=${id}`;

function LabShell({ option, scope, onScope, children }: { option: Option; scope: "all" | "unread"; onScope: (s: "all" | "unread") => void; children: ReactNode }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const role = useUserRole();
  const nav = navForRole(role);
  const onActivityScreen = option === "page";
  const { unread } = useActivity(role);
  const goTo = (s: NavNode) => {
    const key = s.key ?? s.items?.find((i) => i.key)?.key;
    if (key) router.push(roleHref(keyHref(key)));
  };
  const activeSection = onActivityScreen ? null : "Home";
  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      <AppHeader
        mobileNav={<MobileNavTrigger sections={nav} sectionIcons={sectionIcons} activeSection={activeSection ?? ""} onSelectSection={(l) => { const s = nav.find((n) => n.label === l); if (s) goTo(s); }} />}
        current={onActivityScreen ? "Activity" : undefined}
        activity={option === "bell" ? <ActivityBell /> : undefined}
      />
      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection={activeSection} onSelectSection={goTo} />
        {role === "public-user" ? (
          <GuestAboutAside sectionLabel={onActivityScreen ? "Activity" : "Home"} />
        ) : (
          <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{onActivityScreen ? "Activity" : "Home"}</p>
              {onActivityScreen ? (
                <Tabs key="activity" orientation="vertical" selectedKey={scope} onSelectionChange={(k) => onScope(k === "unread" ? "unread" : "all")}>
                  <TabList aria-label="Activity" orientation="vertical" type="button-brand" fullWidth className="w-full">
                    <Tab id="all" label="All activity" icon={Inbox01} />
                    <Tab id="unread" label="Unread" icon={Bell01} badge={unread} />
                  </TabList>
                </Tabs>
              ) : (
                <Tabs key="home" orientation="vertical" selectedKey="mine" onSelectionChange={() => {}}>
                  <TabList aria-label="Home" orientation="vertical" type="button-brand" fullWidth className="w-full">
                    <Tab id="mine" label="My BioData" icon={User01} />
                    <Tab id="fauna" label="Flora and Fauna Dashboard" icon={PieChart03} />
                  </TabList>
                </Tabs>
              )}
            </div>
          </aside>
        )}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]">{children}</main>
      </div>
    </div>
  );
}

function Lab() {
  const params = useSearchParams();
  const role = useUserRole();
  const option: Option = params.get("option") === "page" ? "page" : params.get("option") === "bell" ? "bell" : "home";
  const [scope, setScope] = useState<"all" | "unread">("all");
  const waiting = useWaitingCount();

  useRegisterTool({
    id: "activity",
    label: "Run the example",
    barLabel: "Example",
    barValue: `${waiting} waiting`,
    icon: Bell01,
    options: [
      { id: "submit", label: "A dataset is submitted", description: "A registered user's dataset reaches Under review; the admin is told" },
      { id: "approve", label: "The admin approves the oldest", description: "The uploader is told it has been approved" },
      { id: "reset", label: "Start again", description: "One dataset waiting and one approved, nothing opened" },
      { id: "clear", label: "Clear it all", description: "Nothing at all, to see the empty states" },
    ],
    value: "",
    onChange: (id) => (id === "submit" ? submitExample() : id === "approve" ? approveOldest() : id === "clear" ? clearAll() : startAgain()),
  });

  let content: ReactNode;
  if (role === "public-user") {
    content = <RestrictedState title="Activity" description="Activity is about your own datasets and requests, so it needs a free BioData SA account. View the app as a Registered User or a BioData Admin to see it." />;
  } else if (option === "page") {
    content = <ActivityPageBody scope={scope} />;
  } else if (option === "home") {
    content = (
      <>
        <ActivityPanel />
        <HomeDashboardContent />
      </>
    );
  } else {
    content = <HomeDashboardContent />;
  }

  return (
    <>
      <LayoutOptionSwitcher ariaLabel="Where Activity shows" options={OPTIONS.map((o) => ({ ...o, href: HREF(o.id) }))} current={option} />
      <LabShell option={option} scope={scope} onScope={setScope}>
        {content}
      </LabShell>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}
