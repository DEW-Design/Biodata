"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { localIsoDate } from "@/app/pages/_shared/agreement-status";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { todayIso } from "@/app/pages/_shared/dla/dla-data";
import { PUBLISHED_PROJECT_STATUSES, projects } from "@/app/pages/_shared/project-list-data";
import { projectDetailsPath, projectTabPath } from "@/app/pages/_shared/project-routes";
import { isBiodataAdmin, type UserRole } from "@/lib/user-role";

// The emulation behind the Activity lab. There is no activity engine, and none is built here: a small store holds the datasets
// the example has submitted for approval, and `activityFor` reads what each person would be told from them, the way the product
// would read it from the dataset store (a dataset at "Under review" with no approval waits for an admin; `approveDataset` records
// who approved and when). Kept apart from the real dataset store so the example never adds a dataset to the product's lists.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

/** The placeholder admin who approves in the example (0.3: placeholder people only). */
const APPROVER = "Phoenix Baker";

export interface Submission {
  id: string;
  projectId: string;
  projectName: string;
  uploader: string;
  /** `YYYY-MM-DD`. */
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface ActivityLabState {
  submissions: Submission[];
  /** What each audience has opened, by `audience:key`. One browser is one person at a time, and the person is the role being viewed. */
  read: Record<string, true>;
  /** Whether the starting example has been put in, so a first visit is not empty and "Clear it all" stays cleared. */
  seeded: boolean;
}

const useActivityLab = create<ActivityLabState>()(
  persist(() => ({ submissions: [] as Submission[], read: {} as Record<string, true>, seeded: false as boolean }), {
    name: "biodata-activity-lab",
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

/** The example's projects: the project list's published ones, so the names and the links are the product's. */
const exampleProjects = () => projects.filter((p) => PUBLISHED_PROJECT_STATUSES.includes(p.status));

/** A dataset is submitted for approval, as a registered user: it reaches Under review and waits for an admin. */
export function submitExample(): void {
  useActivityLab.setState((s) => {
    const options = exampleProjects();
    const project = options[s.submissions.length % options.length];
    const id = `DS-${new Date().getFullYear()}-${String(900 + s.submissions.length + 1).padStart(5, "0")}`;
    return { submissions: [...s.submissions, { id, projectId: project.id, projectName: project.name, uploader: CURRENT_USER_NAME, submittedAt: todayIso() }] };
  });
}

/** An admin approves the dataset that has waited longest. */
export function approveOldest(): void {
  useActivityLab.setState((s) => {
    const waiting = s.submissions.find((x) => !x.approvedAt);
    if (!waiting) return s;
    return { submissions: s.submissions.map((x) => (x === waiting ? { ...x, approvedAt: todayIso(), approvedBy: APPROVER } : x)) };
  });
}

/** The starting example: one dataset waiting for an admin (so the admin has something) and one already approved (so the uploader has something). */
export function startAgain(): void {
  const [waiting, approved] = exampleProjects();
  const yesterday = localIsoDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const year = new Date().getFullYear();
  useActivityLab.setState({
    submissions: [
      { id: `DS-${year}-00901`, projectId: approved.id, projectName: approved.name, uploader: CURRENT_USER_NAME, submittedAt: yesterday, approvedAt: todayIso(), approvedBy: APPROVER },
      { id: `DS-${year}-00902`, projectId: waiting.id, projectName: waiting.name, uploader: CURRENT_USER_NAME, submittedAt: todayIso() },
    ],
    read: {},
    seeded: true,
  });
}

/** Nothing at all, to see the empty states. */
export function clearAll(): void {
  useActivityLab.setState({ submissions: [], read: {}, seeded: true });
}

/** Loads the saved example, and puts the starting one in on a first visit. */
function useExample() {
  useRehydrate(useActivityLab);
  const hydrated = useHydrated(useActivityLab);
  const seeded = useActivityLab((s) => s.seeded);
  const count = useActivityLab((s) => s.submissions.length);
  useEffect(() => {
    if (!hydrated || seeded) return;
    if (count === 0) startAgain();
    else useActivityLab.setState({ seeded: true });
  }, [hydrated, seeded, count]);
}

export type ActivityKind = "awaiting" | "approved";

export interface ActivityItem {
  /** Who it is for: an admin is told of a dataset to approve, the uploader of its approval. */
  audience: "admin" | "uploader";
  key: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  /** `YYYY-MM-DD`. */
  at: string;
  action: { label: string; href: string };
}

/** What a role would be told, newest first. A signed-out visitor is told nothing: Activity is about a person's own work and requests. */
export function activityFor(role: UserRole, submissions: Submission[]): ActivityItem[] {
  if (role === "public-user") return [];
  const items: ActivityItem[] = isBiodataAdmin(role)
    ? submissions
        .filter((x) => !x.approvedAt)
        .map((x) => ({
          audience: "admin" as const,
          key: `awaiting:${x.id}`,
          kind: "awaiting" as const,
          title: `Dataset ${x.id} is awaiting your approval`,
          detail: `${x.projectName}, submitted by ${x.uploader}`,
          at: x.submittedAt,
          action: { label: "Review dataset", href: projectTabPath(x.projectId, "datasets") },
        }))
    : submissions
        .filter((x) => x.approvedAt)
        .map((x) => ({
          audience: "uploader" as const,
          key: `approved:${x.id}`,
          kind: "approved" as const,
          title: `Dataset ${x.id} on ${x.projectName} has been approved`,
          detail: `Approved by ${x.approvedBy}`,
          at: x.approvedAt as string,
          action: { label: "View project", href: projectDetailsPath(x.projectId) },
        }));
  return items.sort((a, b) => b.at.localeCompare(a.at) || b.key.localeCompare(a.key));
}

export type ActivityEntry = ActivityItem & { unread: boolean };

/** The role's Activity with what has been opened, and the ways to open one or all. */
export function useActivity(role: UserRole) {
  useExample();
  const submissions = useActivityLab((s) => s.submissions);
  const read = useActivityLab((s) => s.read);
  const items = activityFor(role, submissions);
  const entries: ActivityEntry[] = items.map((i) => ({ ...i, unread: !read[`${i.audience}:${i.key}`] }));
  const markRead = (item: ActivityItem) => useActivityLab.setState((s) => ({ read: { ...s.read, [`${item.audience}:${item.key}`]: true } }));
  const markAllRead = () => useActivityLab.setState((s) => ({ read: { ...s.read, ...Object.fromEntries(items.map((i) => [`${i.audience}:${i.key}`, true as const])) } }));
  return { entries, unread: entries.filter((e) => e.unread).length, markRead, markAllRead };
}

/** How many datasets wait for an admin, for the bar's tool. */
export function useWaitingCount(): number {
  useExample();
  return useActivityLab((s) => s.submissions.filter((x) => !x.approvedAt).length);
}
