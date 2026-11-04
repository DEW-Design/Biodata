"use client";

import { useSyncExternalStore } from "react";
import { AlertTriangle, BookOpen01, GitBranch01, PlayCircle } from "@untitledui/icons";
import { PageHeader } from "@/components/PageHeader";
import { Tabs } from "@/components/application/tabs/tabs";
import { DLA_GAPS, DLA_RULES } from "@/config/workflows/dla-workflow";
import { BusinessRulesView } from "./business-rules-view";
import { GapsView } from "./gaps-view";
import { RulesView } from "./rules-view";
import { SandboxView } from "./sandbox-view";

// "A way to visualise how business rules are working, and a sandbox for us to see how the workflows hold up, and identify any gaps we can fix.
// One flow at a time, starting with DLA" (the designer, 3 Nov 2026). The Rules tab draws and tabulates the flow, the Business rules tab places the rules
// the business gave onto it ("the next step is to map the actual BR to the workflow", 3 Nov 2026), the Sandbox walks a request through it as any role
// with a clock, and the Gaps tab keeps what we find. The rules are `config/workflows/dla-workflow.ts`, the same way
// `/config/data-model` reads `config/data-model-schema.ts`. Like that page it is not in the docs navigation: it is reached by its address.
//
// What is drawn is read from the product where the product can be read (statuses, the clock's moves, who has which access, which emails
// Notification Management would send) and written down by hand where it cannot (the buttons each status shows). Activity is proposed.
//
// It renders after the page has mounted: the sandbox starts from today's date and the emails come from this browser's Notification Management,
// neither of which the static build knows.

const subscribe = () => () => {};

export default function WorkflowsPage() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div className="prose-doc">
      <PageHeader
        section="Config"
        title="Workflows"
        description="How a business rule works, and a sandbox to see where it holds up. One flow at a time, starting with the Data Licence Agreement (DLA)."
      />

      <Tabs>
        {/* Four tabs do not fit a phone: the strip scrolls sideways, with room under it so the underline is not cut (2.16). */}
        <div className="-mb-1.5 overflow-x-auto pb-1.5">
          <Tabs.List type="underline" size="sm">
            <Tabs.Item id="rules" label="Rules" icon={GitBranch01} />
            <Tabs.Item id="business-rules" label="Business rules" icon={BookOpen01} badge={DLA_RULES.length} />
            <Tabs.Item id="sandbox" label="Sandbox" icon={PlayCircle} />
            <Tabs.Item id="gaps" label="Gaps" icon={AlertTriangle} badge={DLA_GAPS.length} />
          </Tabs.List>
        </div>
        <div className="mt-6">
          <Tabs.Panel id="rules">{mounted && <RulesView />}</Tabs.Panel>
          <Tabs.Panel id="business-rules">{mounted && <BusinessRulesView />}</Tabs.Panel>
          <Tabs.Panel id="sandbox">{mounted && <SandboxView />}</Tabs.Panel>
          <Tabs.Panel id="gaps">{mounted && <GapsView />}</Tabs.Panel>
        </div>
      </Tabs>
    </div>
  );
}
