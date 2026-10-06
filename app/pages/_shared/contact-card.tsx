import { Mail01, Phone01 } from "@untitledui/icons";
import { BentoCard } from "@/app/pages/_shared/bento-card";

// The contact card on a record page's Overview tab (the right-hand rail beside the record's fields): a title and an optional
// organisation, a rule, then the person's name with a mail and a phone line each led by its icon. Ported from the project page's
// own card, first by the DSA and now shared, so the DSA, a user and the next record page that has a person on it show the same card.
export function ContactCard({ title, orgLabel, name, email, phone }: { title: string; orgLabel?: string; name?: string; email?: string; phone?: string }) {
  return (
    <BentoCard className="flex-1">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
        {orgLabel && <p className="text-sm text-tertiary">{orgLabel}</p>}
      </div>
      <div className="flex flex-col gap-1 border-t border-secondary pt-4">
        {name ? <p className="text-sm font-medium text-primary">{name}</p> : <span className="text-sm text-quaternary">Not provided</span>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tertiary">
          {email && (
            <span className="flex items-center gap-1.5">
              <Mail01 className="size-3.5 text-quaternary" />
              {email}
            </span>
          )}
          {phone && (
            <span className="flex items-center gap-1.5">
              <Phone01 className="size-3.5 text-quaternary" />
              {phone}
            </span>
          )}
        </div>
      </div>
    </BentoCard>
  );
}
