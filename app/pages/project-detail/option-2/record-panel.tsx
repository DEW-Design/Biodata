"use client";

// The record view/edit panel - opened by clicking a row in either the Tree view or the Table view
// (records-view.tsx) or a row in the Species table (species-view.tsx). One `SidePanel` (the same
// real right-anchored slide-over map search's own record-detail sidebar uses), its accordion
// sections built from record-fields.tsx's field specs - each section renders through
// `FieldSection` (field-editor.tsx), which carries its own Edit/Save/Cancel affordance per
// section, matching this build's Figma edit-mode reference exactly (every "Details Container"
// frame is a set of independently-editable accordion sections, not one page-wide form).

import { useMemo, useState, type Key, type ReactNode } from "react";
import { ChevronSelectorVertical } from "@untitledui/icons";
import { Accordion } from "@/components/base/accordion/accordion";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { SidePanel } from "@/app/pages/_shared/map-search/side-panel";
import type { SearchEvent } from "@/app/pages/_shared/map-search/search-data";
import { FieldSection, type CustomPropertyRow, emptyCustomPropertyRow } from "./field-editor";
import { buildSections, recordKey, recordTitle, seedValues, type DetailRecord } from "./record-fields";
import { useRecordStore } from "./record-store";

function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
      <div className="text-sm text-primary">{children}</div>
    </div>
  );
}

function ProjectSummaryHeader({ project }: { project: SearchEvent }) {
  return (
    <div className="mb-6 flex flex-col gap-5 border-b border-secondary pb-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h2 className="text-xl font-medium text-primary">{project.name}</h2>
      </div>
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <MetaField label="Project ID">{project.code}</MetaField>
        <MetaField label="Status">
          <BadgeWithDot size="sm" color={project.statusColor}>
            {project.status}
          </BadgeWithDot>
        </MetaField>
        <MetaField label="Published by">{project.org}</MetaField>
      </div>
    </div>
  );
}

export function RecordEditPanel({ record, project, onClose }: { record: DetailRecord | null; project: SearchEvent; onClose: () => void }) {
  const sections = useMemo(() => (record ? buildSections(record) : []), [record]);
  const currentKey = record ? recordKey(record) : null;
  const store = useRecordStore();

  const [openState, setOpenState] = useState<{ key: string | null; openKeys: Set<Key> }>({ key: null, openKeys: new Set() });
  if (openState.key !== currentKey) {
    setOpenState({ key: currentKey, openKeys: new Set(sections[0] ? [sections[0].id] : []) });
  }

  const allOpen = sections.length > 0 && openState.openKeys.size === sections.length;
  const toggleAll = () => setOpenState((s) => ({ ...s, openKeys: allOpen ? new Set() : new Set(sections.map((sec) => sec.id)) }));

  const accordionItems = record
    ? sections.map((section) => {
        const storeKey = `${currentKey}:${section.id}`;
        const seed = seedValues(record, section);
        const values = { ...seed, ...store.getSection(storeKey) };

        return {
          id: section.id,
          title: section.title,
          content: section.isCustomProperty ? (
            <FieldSection
              fields={[]}
              values={{}}
              onSave={() => {}}
              customProperty={{
                rows: store.getCustomRows(storeKey, [emptyCustomPropertyRow(1)]) as CustomPropertyRow[],
                onChange: (rows) => store.setCustomRows(storeKey, rows),
              }}
            />
          ) : (
            <FieldSection fields={section.fields ?? []} values={values} onSave={(next) => store.setSection(storeKey, next)} />
          ),
        };
      })
    : [];

  return (
    <SidePanel
      isOpen={record != null}
      onOpenChange={(open) => !open && onClose()}
      title={record ? recordTitle(record) : "Details"}
      widthClassName="max-w-2xl"
      headerActions={
        record && (
          <Tooltip title={allOpen ? "Collapse all sections" : "Expand all sections"}>
            <TooltipTrigger
              onPress={toggleAll}
              aria-label={allOpen ? "Collapse all sections" : "Expand all sections"}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
            >
              <ChevronSelectorVertical className="size-4" />
            </TooltipTrigger>
          </Tooltip>
        )
      }
    >
      {record && (
        <>
          <ProjectSummaryHeader project={project} />
          <Accordion items={accordionItems} variant="boxed" openKeys={openState.openKeys} onOpenKeysChange={(keys) => setOpenState((s) => ({ ...s, openKeys: keys }))} />
        </>
      )}
    </SidePanel>
  );
}
