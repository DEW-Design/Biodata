"use client";

// Step 1, redesigned per direct feedback: the original single long scrolling form (a) asked "Role
// or type of work" first - an odd opener, a question about the *user*, not the project - and (b)
// captured a Project Manager as just a name picked from a list, when Figma's own "Project Manager/
// s" card (node 2298:175996) shows First/Last/Email as that card's own required fields plus real
// Organisation/Role/Phone/Primary-contact detail alongside them. Both flagged directly by the user.
//
// Rebuilt as a one-question-at-a-time sequence (`TypeformCard`, see that file's own header) per
// direct request for "much more interactive... like Typeform," with mandatory questions asked
// first, in an order that opens with the project itself (not the user), and every genuinely
// optional piece of detail (a different Full Title than the short one, an end date, a manager's
// organisation/role/phone) surfaced as a "+ Add ..." the user chooses to reveal rather than an
// empty field shown by default - literally "mandatory first, optional by the user's own choice,"
// per the user's own framing.
//
// Sequence: Project name -> Abstract -> Start date -> Data ownership -> Primary contact ->
// Your role -> Project manager/s -> Review (summary + optional add-ons + "Continue").
// `isStep1Valid` gates the review card's own "Continue to Data Collection" - a final safety net
// on top of each question's own `cardValid` check, in case the two ever drift apart.

import { useState } from "react";
import { Building07, User01, Plus, Trash01, Edit05, SearchLg } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { Textarea } from "@/components/custom/textarea/textarea";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { Button } from "@/components/base/buttons/button";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { TypeformCard, ChoiceTile } from "./typeform-card";
import { ROLE_OF_WORK_OPTIONS } from "./data";
import { LogoUpload } from "./logo-upload";
import { emptyContact, emptyProjectManager, type ProjectDetailsState, type ProjectManager } from "./types";

export function isStep1Valid(details: ProjectDetailsState): boolean {
    const roleValid = !!details.roleOfWork && (details.roleOfWork !== "other" || details.roleOfWorkOther.trim().length > 0);
    const ownerValid = details.dataOwnerType === "organisation" ? details.dataOwnerOrgName.trim().length > 0 : true;
    const contact = details.dataOwnerContacts[0];
    const contactValid = !!contact && contact.firstName.trim().length > 0 && contact.lastName.trim().length > 0 && contact.email.trim().length > 0;
    const managersValid = details.projectManagers.some((m) => m.firstName.trim() && m.lastName.trim() && m.email.trim());
    return (
        details.shortTitle.trim().length > 0 &&
        details.abstract.trim().length > 0 &&
        !!details.startDate &&
        ownerValid &&
        contactValid &&
        roleValid &&
        managersValid
    );
}

const TOTAL_QUESTIONS = 7;

function ManagerOptionalFields({ manager, onChange }: { manager: ProjectManager; onChange: (patch: Partial<ProjectManager>) => void }) {
    return (
        <div className="flex flex-col gap-4 border-t border-secondary pt-4">
            <Input label="Organisation / Institution" placeholder="Search or type to select" icon={SearchLg} value={manager.organisation} onChange={(v) => onChange({ organisation: v })} />
            <Select
                label="Role or type of work"
                placeholder="Select role or type of work"
                items={ROLE_OF_WORK_OPTIONS}
                selectedKey={manager.role}
                onSelectionChange={(key) => onChange({ role: key as string, roleOther: key === "other" ? manager.roleOther : "" })}
            >
                {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
            </Select>
            {manager.role === "other" && (
                <Input label="Please specify" value={manager.roleOther} onChange={(v) => onChange({ roleOther: v })} />
            )}
            <Input label="Phone Number" placeholder="Enter contact number" value={manager.phone} onChange={(v) => onChange({ phone: v })} />
        </div>
    );
}

function ManagerCard({
    manager,
    index,
    canRemove,
    onChange,
    onRemove,
    onSetPrimary,
}: {
    manager: ProjectManager;
    index: number;
    canRemove: boolean;
    onChange: (patch: Partial<ProjectManager>) => void;
    onRemove: () => void;
    /** Marks this manager the (sole) primary contact - see the Step1ProjectDetails-level
     *  `setPrimaryManager` for the mutual-exclusivity rule. */
    onSetPrimary: () => void;
}) {
    const hasOptionalDetail = !!(manager.organisation || manager.role || manager.phone);
    const [expanded, setExpanded] = useState(hasOptionalDetail);

    return (
        <BentoCard className="gap-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary">Manager {index + 1}</p>
                {canRemove && <Button color="secondary" size="sm" iconLeading={Trash01} aria-label={`Remove manager ${index + 1}`} onClick={onRemove} />}
            </div>
            {/* Primary contact stays visible at the top of every card, matching Figma's own
                "Project Manager/s" frame (node 2298:175996) exactly - it had been nested inside
                the "+ Add organisation, role or phone" reveal, burying a real, always-relevant
                choice behind an optional-details disclosure. Flagged directly by the user off a
                screenshot. Turning one manager's toggle on clears every other manager's, so
                exactly one primary contact exists at a time rather than several. */}
            <Toggle label="Primary contact" isSelected={manager.isPrimary} onChange={(v) => (v ? onSetPrimary() : onChange({ isPrimary: false }))} size="sm" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="First Name" placeholder="John" isRequired value={manager.firstName} onChange={(v) => onChange({ firstName: v })} />
                <Input label="Last Name" placeholder="Doe" isRequired value={manager.lastName} onChange={(v) => onChange({ lastName: v })} />
            </div>
            <Input label="Email" placeholder="john.doe@sa.gov.au" type="email" isRequired value={manager.email} onChange={(v) => onChange({ email: v })} />
            {expanded ? (
                <ManagerOptionalFields manager={manager} onChange={onChange} />
            ) : (
                <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={() => setExpanded(true)}>
                    Add organisation, role or phone
                </Button>
            )}
        </BentoCard>
    );
}

export function Step1ProjectDetails({
    value,
    onChange,
    onComplete,
    startAtReview = false,
}: {
    value: ProjectDetailsState;
    onChange: (value: ProjectDetailsState) => void;
    /** Called from the review card's "Continue to Data Collection" - advances the outer wizard to
     *  Step 2. Step 1 owns its own internal card navigation (see `cardIndex` below); this is the
     *  one point where it hands control back to `page.tsx`. */
    onComplete: () => void;
    /** Mounts straight onto the Review card instead of Question 1 - used when the user clicks
     *  this (already-completed) step's own header in `RegistrationStepper` to jump back to it, so
     *  they land on their summary with edit-jump links rather than being walked through all 7
     *  questions again from scratch. A one-time initial value only (React's lazy `useState`
     *  initializer) - this component remounts fresh every time `page.tsx` switches `step` away
     *  from and back to 1, so it's re-evaluated correctly on every such visit. */
    startAtReview?: boolean;
}) {
    const [cardIndex, setCardIndex] = useState(() => (startAtReview ? TOTAL_QUESTIONS : 0));
    const [showFullTitle, setShowFullTitle] = useState(!value.sameAsShortTitle);
    const [showEndDate, setShowEndDate] = useState(!!value.endDate);
    const patch = (partial: Partial<ProjectDetailsState>) => onChange({ ...value, ...partial });

    const updateContact = (id: number, patchFields: Partial<(typeof value.dataOwnerContacts)[number]>) =>
        patch({ dataOwnerContacts: value.dataOwnerContacts.map((c) => (c.id === id ? { ...c, ...patchFields } : c)) });
    const addContact = () => patch({ dataOwnerContacts: [...value.dataOwnerContacts, emptyContact(Math.max(0, ...value.dataOwnerContacts.map((c) => c.id)) + 1)] });

    const updateManager = (id: number, patchFields: Partial<ProjectManager>) =>
        patch({ projectManagers: value.projectManagers.map((m) => (m.id === id ? { ...m, ...patchFields } : m)) });
    const addManager = () => patch({ projectManagers: [...value.projectManagers, emptyProjectManager(Math.max(0, ...value.projectManagers.map((m) => m.id)) + 1)] });
    const removeManager = (id: number) => {
        const removingPrimary = value.projectManagers.find((m) => m.id === id)?.isPrimary;
        const remaining = value.projectManagers.filter((m) => m.id !== id);
        // Same "promote the next remaining row" precedent as the auth flow's own primary-role
        // rows - a project team should never end up with zero primary contacts just because the
        // one holding that flag was removed.
        patch({ projectManagers: removingPrimary && remaining.length ? remaining.map((m, i) => (i === 0 ? { ...m, isPrimary: true } : m)) : remaining });
    };
    const setPrimaryManager = (id: number) => patch({ projectManagers: value.projectManagers.map((m) => ({ ...m, isPrimary: m.id === id })) });

    const contact = value.dataOwnerContacts[0];
    const goTo = (i: number) => setCardIndex(i);
    const next = () => setCardIndex((i) => i + 1);
    const back = () => setCardIndex((i) => Math.max(0, i - 1));

    const cardValid = [
        value.shortTitle.trim().length > 0,
        value.abstract.trim().length > 0,
        !!value.startDate,
        value.dataOwnerType === "individual" || value.dataOwnerOrgName.trim().length > 0,
        contact.firstName.trim().length > 0 && contact.lastName.trim().length > 0 && contact.email.trim().length > 0,
        !!value.roleOfWork && (value.roleOfWork !== "other" || value.roleOfWorkOther.trim().length > 0),
        value.projectManagers.some((m) => m.firstName.trim() && m.lastName.trim() && m.email.trim()),
    ];

    if (cardIndex === 0) {
        return (
            <TypeformCard cardKey={0} step={1} totalSteps={TOTAL_QUESTIONS} kicker="Project details" title="What's your project called?" description="A short, user-facing name people will see first - you can add the full official title later if it's different." showBack={false} nextDisabled={!cardValid[0]} onNext={next}>
                <Input aria-label="Project short title" placeholder="E.g., Biodiversity Monitoring of the Coorong Wetlands 2025" value={value.shortTitle} onChange={(v) => patch({ shortTitle: v })} size="lg" inputClassName="text-lg" />
            </TypeformCard>
        );
    }

    if (cardIndex === 1) {
        return (
            <TypeformCard cardKey={1} step={2} totalSteps={TOTAL_QUESTIONS} kicker="Project details" title={`Tell us what "${value.shortTitle}" is about`} description="Include background, aims and objectives - when, where, what, how, why, who." nextDisabled={!cardValid[1]} onNext={next} onBack={back}>
                <Textarea aria-label="Abstract" placeholder="E.g., Please include background, aims and objectives." rows={6} value={value.abstract} onChange={(v) => patch({ abstract: v })} autoFocus />
            </TypeformCard>
        );
    }

    if (cardIndex === 2) {
        return (
            <TypeformCard cardKey={2} step={3} totalSteps={TOTAL_QUESTIONS} kicker="Project details" title="When does this project start?" description="You can add an end date later if this isn't ongoing." nextDisabled={!cardValid[2]} onNext={next} onBack={back}>
                <InputDatePicker aria-label="Start date" value={value.startDate} onChange={(v) => patch({ startDate: v })} className="w-full max-w-xs" />
            </TypeformCard>
        );
    }

    if (cardIndex === 3) {
        return (
            <TypeformCard cardKey={3} step={4} totalSteps={TOTAL_QUESTIONS} kicker="Data ownership" title="Who owns this data?" description="The organisation or person responsible for this project's data." nextDisabled={!cardValid[3]} onNext={next} onBack={back}>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <ChoiceTile icon={Building07} label="Organisation / Institution" isSelected={value.dataOwnerType === "organisation"} onClick={() => patch({ dataOwnerType: "organisation" })} />
                        <ChoiceTile icon={User01} label="Individual / Person" isSelected={value.dataOwnerType === "individual"} onClick={() => patch({ dataOwnerType: "individual" })} />
                    </div>
                    {value.dataOwnerType === "organisation" && (
                        <>
                            <Input label="Organisation / Institution name" placeholder="Department for Housing and Urban Development" isRequired value={value.dataOwnerOrgName} onChange={(v) => patch({ dataOwnerOrgName: v })} autoFocus />
                            <LogoUpload value={value.dataOwnerOrgLogo} onChange={(dataOwnerOrgLogo) => patch({ dataOwnerOrgLogo })} orgName={value.dataOwnerOrgName} />
                        </>
                    )}
                </div>
            </TypeformCard>
        );
    }

    if (cardIndex === 4) {
        const title = value.dataOwnerType === "organisation" ? `Who's the primary contact at ${value.dataOwnerOrgName || "your organisation"}?` : "What's your name and email?";
        return (
            <TypeformCard cardKey={4} step={5} totalSteps={TOTAL_QUESTIONS} kicker="Data ownership" title={title} nextDisabled={!cardValid[4]} onNext={next} onBack={back}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="First Name" placeholder="John" isRequired value={contact.firstName} onChange={(v) => updateContact(contact.id, { firstName: v })} autoFocus />
                    <Input label="Last Name" placeholder="Doe" isRequired value={contact.lastName} onChange={(v) => updateContact(contact.id, { lastName: v })} />
                </div>
                <Input label="Email" placeholder="john.doe@sa.gov.au" type="email" isRequired value={contact.email} onChange={(v) => updateContact(contact.id, { email: v })} />
                <Input label="Phone Number (optional)" placeholder="Enter contact number" value={contact.phone} onChange={(v) => updateContact(contact.id, { phone: v })} />
            </TypeformCard>
        );
    }

    if (cardIndex === 5) {
        return (
            <TypeformCard cardKey={5} step={6} totalSteps={TOTAL_QUESTIONS} kicker="About you" title="Lastly - what's your role on this project?" description="This helps us understand who's contributing to BioData SA." nextDisabled={!cardValid[5]} onNext={next} onBack={back}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {ROLE_OF_WORK_OPTIONS.map((option) => (
                        <ChoiceTile key={option.id} label={option.label} isSelected={value.roleOfWork === option.id} onClick={() => patch({ roleOfWork: option.id, roleOfWorkOther: option.id === "other" ? value.roleOfWorkOther : "" })} />
                    ))}
                </div>
                {value.roleOfWork === "other" && (
                    <Input label="Please specify" placeholder="Describe your role or type of work" isRequired value={value.roleOfWorkOther} onChange={(v) => patch({ roleOfWorkOther: v })} autoFocus />
                )}
            </TypeformCard>
        );
    }

    if (cardIndex === 6) {
        return (
            <TypeformCard cardKey={6} step={7} totalSteps={TOTAL_QUESTIONS} kicker="Project team" title="Who's managing this project day to day?" description="Add at least one project manager - their organisation, role and phone are optional extras you can add if you'd like." nextDisabled={!cardValid[6]} onNext={next} onBack={back}>
                <div className="flex flex-col gap-4">
                    {value.projectManagers.map((manager, i) => (
                        <ManagerCard
                            key={manager.id}
                            manager={manager}
                            index={i}
                            canRemove={value.projectManagers.length > 1}
                            onChange={(p) => updateManager(manager.id, p)}
                            onRemove={() => removeManager(manager.id)}
                            onSetPrimary={() => setPrimaryManager(manager.id)}
                        />
                    ))}
                    <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={addManager}>
                        Add another manager
                    </Button>
                </div>
            </TypeformCard>
        );
    }

    // Review - a summary of every mandatory answer, plus the genuinely optional detail (a
    // different Full Title, an End Date, more Data Owner contacts) surfaced as explicit "+ Add"
    // choices rather than empty fields shown by default, per the user's own framing.
    const roleLabel = value.roleOfWork === "other" ? value.roleOfWorkOther : ROLE_OF_WORK_OPTIONS.find((o) => o.id === value.roleOfWork)?.label;
    const managerCount = value.projectManagers.filter((m) => m.firstName.trim() && m.lastName.trim()).length;

    return (
        <TypeformCard cardKey="review" step={TOTAL_QUESTIONS} totalSteps={TOTAL_QUESTIONS} kicker="Review" title="You're all set for Project Identification" description="Review your answers below, or add a few more optional details before continuing." showQuestionCount={false} nextLabel="Continue to Data Collection" nextDisabled={!isStep1Valid(value)} onNext={onComplete} onBack={back}>
            {/* `divide-secondary` isn't a real utility in this repo's hand-curated layer (see
                species-restriction.tsx's own note on this same bug) - divider colour set via the
                real `--ui-border-secondary` variable instead. */}
            <div className="flex flex-col rounded-xl border border-secondary [&>*+*]:border-t [&>*+*]:border-[var(--ui-border-secondary)]">
                {[
                    { label: "Project name", value: value.shortTitle, goToIndex: 0 },
                    { label: "Abstract", value: value.abstract, goToIndex: 1 },
                    { label: "Start date", value: value.startDate?.toString(), goToIndex: 2 },
                    { label: "Data owner", value: value.dataOwnerType === "organisation" ? `${value.dataOwnerOrgName}${value.dataOwnerOrgLogo ? " · logo added" : ""}` : `${contact.firstName} ${contact.lastName}`.trim(), goToIndex: 3 },
                    { label: "Primary contact", value: `${contact.firstName} ${contact.lastName}`.trim() + (contact.email ? ` · ${contact.email}` : ""), goToIndex: 4 },
                    { label: "Your role", value: roleLabel, goToIndex: 5 },
                    { label: "Project manager/s", value: `${managerCount} added`, goToIndex: 6 },
                ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                            <p className="text-xs font-semibold text-quaternary uppercase">{row.label}</p>
                            <p className="truncate text-sm text-secondary">{row.value || "-"}</p>
                        </div>
                        <Button color="link-gray" size="sm" iconLeading={Edit05} aria-label={`Edit ${row.label}`} onClick={() => goTo(row.goToIndex)} />
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-secondary pt-4">
                <p className="text-sm font-medium text-secondary">Optional details</p>
                <div className="flex flex-wrap gap-3">
                    {!showFullTitle && (
                        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => setShowFullTitle(true)}>
                            Different full title
                        </Button>
                    )}
                    {!showEndDate && (
                        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => setShowEndDate(true)}>
                            End date
                        </Button>
                    )}
                    {value.dataOwnerContacts.length === 1 && (
                        <Button color="secondary" size="sm" iconLeading={Plus} onClick={addContact}>
                            Another data owner contact
                        </Button>
                    )}
                </div>

                {showFullTitle && (
                    <Input
                        label="Full Title"
                        placeholder="The project's complete or official name"
                        value={value.fullTitle}
                        onChange={(v) => patch({ fullTitle: v, sameAsShortTitle: false })}
                        hint="Leave blank to keep using the short title as the full title"
                    />
                )}
                {showEndDate && <InputDatePicker label="End Date" value={value.endDate} onChange={(v) => patch({ endDate: v })} minValue={value.startDate ?? undefined} className="w-full max-w-xs" />}
                {value.dataOwnerContacts.length > 1 &&
                    value.dataOwnerContacts.slice(1).map((c, i) => (
                        <BentoCard key={c.id} className="gap-4">
                            <p className="text-sm font-medium text-primary">Contact {i + 2}</p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input label="First Name" value={c.firstName} onChange={(v) => updateContact(c.id, { firstName: v })} />
                                <Input label="Last Name" value={c.lastName} onChange={(v) => updateContact(c.id, { lastName: v })} />
                                <Input label="Email" value={c.email} onChange={(v) => updateContact(c.id, { email: v })} />
                                <Input label="Phone Number" value={c.phone} onChange={(v) => updateContact(c.id, { phone: v })} />
                            </div>
                        </BentoCard>
                    ))}
            </div>
        </TypeformCard>
    );
}
