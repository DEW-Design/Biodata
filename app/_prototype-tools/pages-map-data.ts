import { isPageBlockedFor } from "./page-gates";
import { AREAS, SCREENS, type Area, type Screen } from "@/app/pages/_shared/screen-index";
import type { UserRole } from "@/lib/user-role";

// The Pages map's data (the Pages tool on the bar, and the lab `/proto/site-map`): the screens in the one list `/pages` uses
// (`app/pages/_shared/screen-index.ts`), grouped by area, with a screen nested under the screen it sits inside (an option
// route under its screen, a record page under the page that lists it), and what each role can do with each.

export interface MapNode {
  screen: Screen;
  children: MapNode[];
}

export interface MapArea {
  area: Area;
  roots: MapNode[];
  count: number;
}

const segments = (path: string) => path.split("/").filter(Boolean);
const isInside = (path: string, parent: string) => path !== parent && path.startsWith(`${parent}/`);

/** The screen a screen sits inside: the one in the same area whose route is the longest proper beginning of its own. */
function parentOf(screen: Screen): Screen | undefined {
  let best: Screen | undefined;
  for (const other of SCREENS) {
    if (other.area !== screen.area || !isInside(screen.path, other.path)) continue;
    if (!best || segments(other.path).length > segments(best.path).length) best = other;
  }
  return best;
}

export function buildMap(): MapArea[] {
  const nodes = new Map(SCREENS.map((s) => [s.path, { screen: s, children: [] as MapNode[] }]));
  const roots = new Map<Area, MapNode[]>();
  for (const node of nodes.values()) {
    const parent = parentOf(node.screen);
    if (parent) nodes.get(parent.path)?.children.push(node);
    else roots.set(node.screen.area, [...(roots.get(node.screen.area) ?? []), node]);
  }
  return AREAS.filter((a) => roots.has(a)).map((area) => ({ area, roots: roots.get(area) ?? [], count: SCREENS.filter((s) => s.area === area).length }));
}

export interface Availability {
  open: boolean;
  /** Why not, in the words the map shows: "BioData Admin only". */
  reason: string | null;
}

const ADMINS: UserRole[] = ["biodata-super-admin", "biodata-admin"];

/** Whether a role can use a screen: its whole page gated behind a feature the role lacks (the bar's own rule), or a screen the
 *  index says is for signed-in people or for admins. The page is still reachable (it shows its restriction), so the map dims
 *  such a screen and says why instead of hiding it. */
export function availability(screen: Screen, role: UserRole): Availability {
  const gated = isPageBlockedFor(screen.path, role);
  if (screen.access === "Signed in" && role === "public-user") return { open: false, reason: "Signed in only" };
  if (screen.access === "BioData Admin" && !ADMINS.includes(role)) return { open: false, reason: "BioData Admin only" };
  if (screen.access === "BioData Super Admin" && role !== "biodata-super-admin") return { open: false, reason: "BioData Super Admin only" };
  if (gated) return { open: false, reason: screen.access === "Everyone" ? "Not open to this role" : `${screen.access} only` };
  return { open: true, reason: null };
}

export function matchesQuery(screen: Screen, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [screen.name, screen.path, screen.description, screen.area].some((v) => v.toLowerCase().includes(q));
}
