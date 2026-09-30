# 2026-09-24 - `AlertFullWidth` (`components/application/alerts/alerts.tsx`) shipped a real bug that had

- **Sept 24 2026: `AlertFullWidth` (`components/application/alerts/alerts.tsx`) shipped a real bug that had
  already landed in production - a stray border/background line under every "contained card" instance,
  caught via `/proto/collection-sidebar`'s own new banners** (see the "Section header, then search, then
  table" contract above for that build) but not introduced by them. The component's outer wrapper always
  renders `border-t border-primary bg-secondary md:border-t-0 md:border-b` - correct for its default
  full-viewport-width banner look, but every caller that overrides the inner `className` to look like a
  self-contained bordered card (`dla-detail.tsx`'s 4 status banners: Under Review/Rejected/Withdrawn/
  Expired, all using `className="max-w-none rounded-lg border border-{color}-200 ..."`) still had the
  outer wrapper's own flat, unrounded `bg-secondary`/`border-b` bleeding out underneath the rounded card -
  flagged directly by the user off a screenshot ("what's with the stroke underneath?"). Fixed with a new,
  additive `contained?: boolean` prop (default `false`, so the component's default full-bleed look is
  unchanged for any caller that doesn't pass it) - when `true`, the outer wrapper drops its own border/
  background classes entirely, leaving the caller's own `className` fully in charge of the shape. Checked
  every real consumer before calling it fixed, per the sibling-file-grep rule: `dla-detail.tsx`'s 4
  instances and the new `/proto/collection-sidebar` banners all needed `contained` added (done);
  `dashboard-options`' `ContinueBanner` (`className="px-6"`, no border/rounding) and `observations/
  page.tsx`'s Level 1/2 banner (no `className` override at all) both genuinely want the default
  full-bleed look and were correctly left untouched. Verified live via `getComputedStyle` on both the
  proto's own banner and a real `dla-detail.tsx` "Under Review" banner - outer wrapper's
  `border-bottom-width`/`background-color` both compute to `0px`/transparent post-fix, only the inner
  card's own `1px` border remains. `tsc --noEmit`/`eslint` clean on all three touched files.
  - **Superseded for `/proto/collection-sidebar`'s own two banners, same day: `AlertFullWidth` was
    the wrong component for the job entirely, not just visually broken - "are you sure the alert
    component is the correct component? ... this is a classic violation of the design system,"**
    per direct feedback. Right the first time: `TaskItem` (`app/pages/_shared/home-dashboard.tsx`)
    already settled this exact question once, in its own doc comment - "The banner (`AlertFullWidth`,
    color="warning") is real but deliberately not used here: neither DLA requests nor species
    nominations need the user's action right now - both are 'submitted, waiting on someone else's
    review' - so an 'Action required' banner would misrepresent their actual state." An `Alert`
    communicates something about *this page's own current state* (every legitimate `AlertFullWidth`
    use in this codebase does exactly that: `dla-detail.tsx`'s own record-status banners, `observations`'
    own data-scope notice, `dashboard-options`' own continue-task strip) - a computed fact about
    *other* records, with its own status and a link elsewhere, is a `TaskItem`, not an alert.
    `TaskItem` was exported (was file-local to `home-dashboard.tsx`) and given one additive prop,
    `onActionClick` (alongside its existing `actionHref`), for a second real consumer whose action
    switches the current page's own view instead of navigating away - both are now real, working
    call sites, not a fork. `/proto/collection-sidebar`'s "Needs attention" and "Nearest to expiry"
    are now real `TaskItem` cards (a status `Badge` sourced directly from `dsaStatusMeta`/
    `dlaStatusMeta`, not invented copy) - the `AlertFullWidth`-specific `contained`/`actionType`
    fixes above no longer apply to this file at all, since it doesn't use the component any more;
    they stay correct and in place for `dla-detail.tsx`'s own legitimate usage. Verified `tsc
    --noEmit`/`eslint` clean and live: both cards render as real bordered `TaskItem` rows with a
    real status badge, "Review drafts"/"Review requests" switch the page's own status view with no
    navigation, "View agreement"/"View request" navigate to the real record - zero console errors.