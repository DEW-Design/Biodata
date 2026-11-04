import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

// Draft (23 Oct 2026): the principles are read out of the decision log and the designer's own words, not invented. The wording is the agent's, and each is for the designer to confirm or correct.
// The same list, in short, is `.claude/rules/ref-principles.md`, which loads when a screen or component is built; the rules that hold each one are in CONTRACTS.md.

function Principle({
  n,
  title,
  line,
  ask,
  heldBy,
  see,
}: {
  n: number;
  title: string;
  line: string;
  ask: string;
  heldBy: string;
  see?: { href: string; label: string };
}) {
  // The clauses are one list on the page, one per line, not a run-on sentence between semicolons.
  const clauses = heldBy.replace(/\.$/, "").split("; ");
  return (
    <section className="my-10 flex flex-col gap-4 border-t border-secondary pt-8">
      <div className="flex items-baseline gap-4">
        <span className="font-barlow text-sm font-semibold text-quaternary tabular-nums">{String(n).padStart(2, "0")}</span>
        <h2 className="font-barlow m-0! text-2xl font-semibold tracking-tight text-primary text-balance">{title}</h2>
      </div>
      <p className="font-barlow m-0 max-w-[62ch] text-lg text-secondary text-balance">{line}</p>
      <div className="font-barlow flex flex-col gap-5">
        {/* The question is the point of a principle, so it is the one boxed callout; the clauses are the reference under it, unboxed and quieter. */}
        <div className="rounded-xl border border-secondary bg-secondary p-4">
          <p className="m-0 mb-1 text-xs font-semibold tracking-wide text-quaternary uppercase">Ask of a screen</p>
          <p className="m-0 text-base text-primary text-balance">{ask}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">Contract clauses</p>
          <ul className="m-0 list-none p-0 text-sm text-secondary sm:columns-2 sm:gap-x-8">
            {clauses.map((c) => (
              <li key={c} className="mb-1.5 break-inside-avoid text-balance">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {see && (
        <p className="font-barlow m-0 text-sm">
          <Link href={see.href} className="text-brand-secondary hover:underline">
            {see.label}
          </Link>
        </p>
      )}
    </section>
  );
}

export default function PrinciplesPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Principles"
        title="Design principles"
        description="Why the interface is the way it is. The contracts say what is binding. These are what the contracts keep protecting, and where an exploration starts."
      />

      <p className="text-balance">
        There are nine. They weren&apos;t written first. They were read out of 550 dated decisions and what the designer said in each, and the same few things kept coming up. Each has a question to ask of any screen and the
        contract clauses that hold it. <strong>This is a draft for the designer to confirm.</strong> If a principle is wrong or missing, change it here and in{" "}
        <code>.claude/rules/ref-principles.md</code>, which a session reads when it builds a screen.
      </p>
      <p className="text-balance">
        <Link href="/principles/craft">Craft details</Link> has the values, and shows how each principle is applied in the details.
      </p>

      <Principle
        n={1}
        title="Say less"
        line="Nothing on screen without a purpose. A mark stays if it tells a person something they need. Everything else is noise, however correct the behaviour behind it."
        ask="What would be lost if I took this away? Is this fact already shown, in another treatment, on this screen?"
        heldBy="2.12 nothing on screen without a purpose; 4.3 never restate a fact in two treatments; 2.10 no affordance for a shortcut that is not real."
        see={{ href: "/patterns/banners", label: "One notice, one fact, one next step: Banners" }}
      />

      <Principle
        n={2}
        title="One thing first"
        line="One focal point per view, one primary action, and a type ladder in which every level is one step from the next. Hierarchy comes from subtraction. The important thing is prominent because the rest recedes."
        ask="Where does the eye go first, and is that the right place? How many things here look like the main thing?"
        heldBy="2.9 type hierarchy; 4.3 one focal point; 3.12 an icon names every action; the one primary button per view."
        see={{ href: "/primitives/typography", label: "The scale: Typography" }}
      />

      <Principle
        n={3}
        title="One system"
        line="The same job has the same pattern everywhere. Find the closest page that does it and reuse it. Add a behaviour to a component once, for everyone. A control keeps its treatment across states."
        ask="Which existing screen does this job? Where does mine differ from it, and is the difference earned?"
        heldBy="0.9 borrow and reuse; 1.1 one source of components; 1.6 extend, do not fork; 1.9 behaviour patterns flow through every component; 3.1 to 3.7 one shell."
        see={{ href: "/patterns/filters", label: "One filter for every table: Filters" }}
      />

      <Principle
        n={4}
        title="Tell the truth"
        line="Real components, real content, real data. A view shows its source's fields as the source writes them, never an invented label, a made-up value or a lookalike component. Where the truth is missing, say so."
        ask="Where does every word and number on this screen come from? If it is derived from a table, is it the table's own?"
        heldBy="0.3 no fabrication; 1.2 no match, no substitute; 2.15 a derived view shows the source's fields as the source does; 2.5 Figma is the source of truth; 4.7 show only what is approved."
        see={{ href: "/patterns/map-list-card", label: "A list that is the report's own fields: Map list card" }}
      />

      <Principle
        n={5}
        title="Make it obvious"
        line="A person knows where they are, what this is, what they can do, and how to get back, without being told. Controls look like controls, state is visible, labels are in the person's words."
        ask="I know where I've come from. I know what to do here. I know how to get back. (the designer's own test)"
        heldBy="3.11 to 3.13 an icon on every item, action and tab; 4.6 a record page's back link and breadcrumb switcher; 2.4 one icon per concept; 2.14 a key lines up."
        see={{ href: "/patterns/navigation", label: "Where you are: Navigation" }}
      />

      <Principle
        n={6}
        title="Reveal in steps"
        line="Tier, don't dump. Put the often-checked first and the rest behind a tab, a fold or a click. When load and one extra click are in tension, take the click. A fade says there is more."
        ask="What is the least a person needs to see first, and how do they reach the rest?"
        heldBy="4.3 cognitive load; 4.1 sections in column 2; 4.2 list then deep dive; 4.6 record pages."
        see={{ href: "/patterns/forms", label: "Sections, not a wall: Forms" }}
      />

      <Principle
        n={7}
        title="Design every state"
        line="Empty, one, many, all hidden, loading, error, and every role. A role removes features. It does not get a different screen."
        ask="What does this look like with nothing, with five hundred, and for the public user? Does a control change between states, and what does the person get from that?"
        heldBy="0.7 anticipate; 3.4 persona consistency; 4.2e empty tables; 4.2f stable tables; the state walk in ref-shell.md."
      />

      <Principle
        n={8}
        title="Reach everyone"
        line="Every control is easy to hit with a finger and a mouse, works from the keyboard, has contrast, and does not depend on motion."
        ask="Can this be used with a thumb, with Tab, and with the sound off and the motion reduced?"
        heldBy="1.9 behaviour patterns (keyboard, Escape, focus); 2.16 a hit area built into the component; 2.1 contrast comes from the tokens."
        see={{ href: "/principles/craft", label: "The hit area, shown: Craft details" }}
      />

      <Principle
        n={9}
        title="Craft shows"
        line="The details are made, not left: concentric corners, edges that read on any background, a token for every colour, space and radius, tabular figures, quiet motion, a scroll that does not draw a bar down a card. They are measured in a browser, not eyeballed."
        ask="Did I measure it? Would I see this if it were wrong, or only if it were right?"
        heldBy="2.1 tokens only; 2.13 concentric corners; 2.14 a key lines up; 2.16 hit area; 0.6 item 4 a live pass with numbers; 0.5 honest reporting."
        see={{ href: "/principles/craft", label: "The catalogue: Craft details" }}
      />

      <h2 className="text-balance">Where two pull apart</h2>
      <p className="text-balance">
        Principles disagree, and a screen is where it shows. These are the resolutions the work so far has used. They&apos;re proposals. Where a case isn&apos;t covered, the designer decides and the answer is
        added here.
      </p>
      <ul className="m-0 max-w-[640px] list-none space-y-3 p-0 text-sm leading-[1.7] text-secondary text-balance [&_strong]:font-semibold [&_strong]:text-primary">
        <li>
          <strong>Say less and Make it obvious.</strong> Label the control and show its state. Don&apos;t add a sentence to explain it. Fix a missing affordance with a control, not with copy (the filter tabs on Map visualise).
        </li>
        <li>
          <strong>One system and Craft shows.</strong> Make a better detail once, in the component, so every screen gets it (the hit area, the ghost button&apos;s fill). Never make it at one screen.
        </li>
        <li>
          <strong>Reveal in steps and findable in three clicks.</strong> Take the click, and give a shortcut: a count on the tab, Show N more, a link to the record.
        </li>
        <li>
          <strong>Tell the truth and Say less.</strong> A view carries the source&apos;s fields, in its order and words, and no more. The Map visualise card is the table&apos;s own fields, not a summary of them.
        </li>
      </ul>

      <h2 className="text-balance">Exploring design-first</h2>
      <p className="text-balance">
        An exploration is a new screen, a layout option, a lab or a restyle. It goes in this order, and nothing is built before the third step (CONTRACTS 0.10).
      </p>
      <ol className="m-0 max-w-[640px] list-decimal space-y-3 pl-5 text-sm leading-[1.7] text-secondary text-balance marker:text-quaternary [&_strong]:font-semibold [&_strong]:text-primary">
        <li>
          <strong>The job.</strong> Who is doing what, on which screen, with which role. One sentence.
        </li>
        <li>
          <strong>The principles at stake.</strong> The two or three that bear on it, and where they pull apart. If they do and nothing settles it, ask one precise question before building.
        </li>
        <li>
          <strong>The ground.</strong> The states and roles to walk, the closest existing page, the data that is really there, the components that exist.
        </li>
        <li>
          <strong>Options, not one guess,</strong> when the direction is open: real components in a lab, behind the layout switcher, each saying which principle it favours. A reference gives interaction and
          structure, never styling.
        </li>
        <li>
          <strong>Judge it against the principles before showing it:</strong> the wayfinding test, the state walk, the table test (every word from its source), a measured pass in a browser. Say what was measured.
        </li>
        <li>
          <strong>Record why,</strong> in the principle&apos;s terms, when the designer chooses. When the same fix is made twice, make it a check.
        </li>
      </ol>

      <h2 className="text-balance">A worked example</h2>
      <p className="text-balance">
        Map visualise started as a list of computed phrases. It now shows the table&apos;s own fields (4), with the group heading in every view (3) and a trail that passes the wayfinding test (5). It has one
        concept and one type ladder (2), a fade and a pinned button instead of a scrollbar (6, 9), and touch targets from the components (8). It then became a pattern, <Link href="/patterns/map-list-card">Map list card</Link>, so
        that Explore&apos;s list took the same polish (3).
      </p>

      <h2 className="text-balance">What this is not</h2>
      <ul className="m-0 max-w-[640px] list-none space-y-3 p-0 text-sm leading-[1.7] text-secondary text-balance [&_strong]:font-semibold [&_strong]:text-primary">
        <li>It doesn&apos;t replace the contracts. A principle never overrides a clause (CONTRACTS 0.1). It decides what no clause covers.</li>
        <li>It is not finished. It was written in one pass from the log and has not been confirmed by the designer. Where the evidence is thin, so is the principle.</li>
        <li>It is not a style guide. Colour, type, space, radius, shadow and motion are in Primitives. Craft details covers how they&apos;re used.</li>
      </ul>
    </div>
  );
}
