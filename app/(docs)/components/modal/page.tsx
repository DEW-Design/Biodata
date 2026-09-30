"use client";

import { useState } from "react";
import type React from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { ConfirmationModal, DestructiveModal, FormModal } from "@/components/application/modals/modal";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-secondary bg-secondary p-6">
    <p className="mb-1 w-full text-xs font-semibold text-quaternary uppercase tracking-widest text-balance">
      {label}
    </p>
    {children}
  </div>
);

export default function ModalPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [destructiveOpen, setDestructiveOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Modal"
        description="Overlay dialogs built on React Aria's Modal/Dialog, in three shapes: a neutral Confirmation prompt, a Destructive warning, and a free-form Form modal for arbitrary content."
      />

      <h2 className="text-balance">Confirmation</h2>
      <p className="text-balance">
        For reversible or low-stakes actions. Every modal copies Untitled UI&apos;s own modal anatomy (its stacked
        left-aligned and horizontal examples): the close X floating in the top-right corner, a featured icon, the title with
        the description under it, and two equal-width buttons (secondary, then primary) that stack on a phone. The page
        behind is dimmed (black at 40%) and blurred.
      </p>
      <Section label="Confirmation modal">
        <Button onPress={() => setConfirmOpen(true)}>Leave page</Button>
        <ConfirmationModal
          isOpen={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Leave this page?"
          description="You have unsaved changes. If you leave now, they'll be lost."
          confirmLabel="Leave"
          isConfirmLoading={isConfirmLoading}
          onConfirm={() => {
            setIsConfirmLoading(true);
            setTimeout(() => {
              setIsConfirmLoading(false);
              setConfirmOpen(false);
            }, 900);
          }}
        />
      </Section>

      <h2 className="text-balance">Destructive</h2>
      <p className="text-balance">
        For irreversible actions - delete, remove, revoke, discard. Same shape as Confirmation, with an error icon and the
        primary button in the error colour, so the stakes read at a glance. A discard prompt
        can offer a way to keep the work (<code>secondaryLabel</code>, <code>onSecondary</code>): every form&apos;s
        discard prompt offers <strong>Save draft</strong> where a draft is possible. Three actions don&apos;t fit the two-column
        row, so that prompt switches to Untitled UI&apos;s horizontal layout: the icon beside the title and the buttons
        right-aligned.
      </p>
      <Section label="Destructive modal">
        <Button color="primary-destructive" onPress={() => setDestructiveOpen(true)}>
          Delete project
        </Button>
        <DestructiveModal
          isOpen={destructiveOpen}
          onOpenChange={setDestructiveOpen}
          title="Delete this project?"
          description={
            <>
              This will permanently delete <strong>Marketing site redesign</strong> and all of its files. This action
              can&apos;t be undone.
            </>
          }
          isConfirmLoading={isDeleteLoading}
          onConfirm={() => {
            setIsDeleteLoading(true);
            setTimeout(() => {
              setIsDeleteLoading(false);
              setDestructiveOpen(false);
            }, 900);
          }}
        />
      </Section>

      <h2 className="text-balance">Form (configurable)</h2>
      <p className="text-balance">
        A general-purpose shell - header, scrollable body, footer - that takes arbitrary <code>children</code> instead
        of a fixed title and description. Wraps content in React Aria&apos;s <code>Form</code>, so a submit button with{" "}
        <code>type=&quot;submit&quot;</code> triggers native validation before <code>onSubmit</code> fires.
      </p>
      <Section label="Form modal">
        <Button onPress={() => setFormOpen(true)}>Invite member</Button>
        <FormModal
          isOpen={formOpen}
          onOpenChange={setFormOpen}
          title="Invite a team member"
          description="They'll get an email with a link to join this workspace."
          submitLabel="Send invite"
          isSubmitLoading={isSaveLoading}
          onSubmit={() => {
            setIsSaveLoading(true);
            setTimeout(() => {
              setIsSaveLoading(false);
              setFormOpen(false);
            }, 900);
          }}
        >
          <Input label="Email address" placeholder="jane@company.com" type="email" isRequired />
          <Input label="Role" placeholder="e.g. Editor" />
        </FormModal>
      </Section>

      <h2 className="text-balance">Usage</h2>
      <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
        <code className="font-mono text-[13px] text-secondary">
{`import { useState } from "react";
import { ConfirmationModal, DestructiveModal, FormModal } from "@/components/application/modals/modal";
import { Input } from "@/components/base/input/input";

const [isOpen, setIsOpen] = useState(false);

<ConfirmationModal
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  title="Leave this page?"
  description="You have unsaved changes."
  confirmLabel="Leave"
  onConfirm={() => setIsOpen(false)}
/>

<DestructiveModal
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  title="Delete this project?"
  description="This action can't be undone."
  onConfirm={handleDelete}
/>

<FormModal
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  title="Invite a team member"
  onSubmit={handleInvite}
>
  <Input label="Email address" isRequired />
</FormModal>`}
        </code>
      </pre>

      <h2 className="text-balance">Composing your own</h2>
      <p className="text-balance">
        All three are built from the same primitives, exported alongside them for fully custom layouts:{" "}
        <code>ModalOverlay</code>, <code>Modal</code>, and <code>Dialog</code>. A plain <code>Button</code> or{" "}
        <code>CloseButton</code> with <code>slot=&quot;close&quot;</code> closes the dialog without any extra wiring.
      </p>
      <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
        <code className="font-mono text-[13px] text-secondary">
{`import { ModalOverlay, Modal, Dialog } from "@/components/application/modals/modal";
import { CloseButton } from "@/components/base/buttons/close-button";

<ModalOverlay isOpen={isOpen} onOpenChange={setIsOpen}>
  <Modal className="w-full max-w-md">
    <Dialog>
      <div className="p-6">
        <CloseButton size="sm" />
        {/* anything at all */}
      </div>
    </Dialog>
  </Modal>
</ModalOverlay>`}
        </code>
      </pre>

      <h2 className="text-balance">API</h2>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Component</th>
            <th>Key props</th>
          </tr>
        </thead>
        <tbody>
          {[
            {
              name: "ConfirmationModal",
              props: "isOpen, onOpenChange, icon (default HelpCircle), iconColor (brand | gray | success | warning), title, description, confirmLabel, cancelLabel, onConfirm, isConfirmLoading",
            },
            {
              name: "DestructiveModal",
              props: "isOpen, onOpenChange, icon (default AlertTriangle), title, description, confirmLabel (default \"Delete\"), cancelLabel, onConfirm, isConfirmLoading, secondaryLabel, onSecondary (an optional middle action, e.g. Save draft)",
            },
            {
              name: "FormModal",
              props: "isOpen, onOpenChange, icon, iconColor (default gray), title, description, children, submitLabel, cancelLabel, onSubmit, isSubmitLoading, size (sm 400px | md 480px | lg 640px)",
            },
            {
              name: "ModalHeader, ModalFooter",
              props: "The shared anatomy, for an app modal that composes its own body. ModalHeader: icon, iconColor, title, description, layout (stacked | horizontal); it also renders the floating close X. ModalFooter: layout, children (the buttons, primary last).",
            },
          ].map((r) => (
            <tr key={r.name}>
              <td>
                <code>{r.name}</code>
              </td>
              <td style={{ fontSize: "13px" }}>{r.props}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
