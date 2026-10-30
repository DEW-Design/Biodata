"use client";

import { Suspense, useMemo, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users01 } from "@untitledui/icons";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { LayoutOptionSwitcher } from "@/app/pages/_shared/layout-option-switcher";
import { EditStoreProvider } from "@/app/pages/project-detail/edit-store";
import { adelaideHillsSeed } from "@/app/pages/project-detail/project-seed";
import { ProjectTab, type PeopleStyle } from "@/app/pages/project-detail/project-tab";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// LAB: where does a person on the project Overview start being read? The Published by and Project managers cards draw each person as a
// name, a Primary badge and a role on one line, the team under it and the email and phone under that, all at 14px, near the same weight and
// colour: nothing wins (the designer, 30 Oct 2026: "the hierarchy of reading is such a mess too - where do I start reading? What if we could
// maybe look into contact cards?"). The Overview below is the real one (`ProjectTab`, the real cards, the Adelaide Hills seed), with only how a
// person is drawn changing (`peopleStyle`, opt-in, so the product page is unchanged until one is chosen). Principles first (0.10): 2 One thing
// first (a focal point per person), 3 One system (the person the design system already draws, the card the DSA, DLA and user pages already
// use), 1 Say less (a rule or a card per person is a mark: does it earn its place), 7 Design every state (the second control: two people,
// one, none; and the role on the bar).
//   A  as it is
//   B  the name leads: one semibold line, role and team as one line under it, then the contacts
//   C  an avatar leads: the design system's `AvatarLabelGroup` (an avatar, a semibold name, one supporting line), contacts under the text
//   D  a card per person: C in a card of its own, the Published by and Project managers cards dissolved into their title and the cards
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.
const OPTIONS: { id: PeopleStyle; label: string; description: string }[] = [
  { id: "rows", label: "A: As it is", description: "Nothing wins: one size, near one weight and colour" },
  { id: "ladder", label: "B: The name leads", description: "2 One thing first: one semibold line, then a supporting line" },
  { id: "avatar", label: "C: An avatar leads", description: "3 One system: the design system's own person" },
  { id: "card", label: "D: A card per person", description: "3 One system: a card as DSA and DLA draw a contact; costs the card per section" },
];
type Count = "two" | "one" | "none";
const COUNTS: { id: Count; label: string; description: string }[] = [
  { id: "two", label: "Two managers", description: "As the seed has them" },
  { id: "one", label: "One manager", description: "And one contact" },
  { id: "none", label: "None named", description: "The empty states" },
];

function Lab(): ReactNode {
  const params = useSearchParams();
  const router = useRouter();
  const roleHref = useRoleHref();
  const role = useUserRole();
  const option = (OPTIONS.find((o) => o.id === params.get("option"))?.id ?? "rows") as PeopleStyle;
  const count = (COUNTS.find((c) => c.id === params.get("people"))?.id ?? "two") as Count;

  const seed = useMemo(() => {
    const d = adelaideHillsSeed.project.details;
    const details = count === "two" ? d : count === "one" ? { ...d, projectManagers: d.projectManagers.slice(0, 1), dataOwnerContacts: d.dataOwnerContacts.slice(0, 1) } : { ...d, projectManagers: [], dataOwnerContacts: [] };
    return { ...adelaideHillsSeed, project: { ...adelaideHillsSeed.project, details } };
  }, [count]);

  const go = (next: { option?: PeopleStyle; people?: Count }) => router.push(roleHref(`/proto/project-people?option=${next.option ?? option}&people=${next.people ?? count}`));
  useRegisterTool({
    id: "people",
    label: "People shown",
    barLabel: "People",
    barValue: COUNTS.find((c) => c.id === count)?.label ?? "",
    icon: Users01,
    options: COUNTS,
    value: count,
    onChange: (id) => go({ people: id as Count }),
  });

  return (
    <div className="min-h-screen bg-secondary px-6 py-8 font-barlow">
      <div className="mx-auto w-full max-w-[1500px]">
        <EditStoreProvider key={`${role}:${count}`} canEdit={role !== "public-user"} role={role} seed={seed}>
          <ProjectTab layout="v3" sheet repeatHeaderFacts={false} disclosure peopleStyle={option} />
        </EditStoreProvider>
      </div>
      <PrototypeTools />
      <LayoutOptionSwitcher ariaLabel="People options" current={option} options={OPTIONS.map((o) => ({ ...o, href: `/proto/project-people?option=${o.id}&people=${count}` }))} />
    </div>
  );
}

export default function ProjectPeopleLab(): ReactNode {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}
