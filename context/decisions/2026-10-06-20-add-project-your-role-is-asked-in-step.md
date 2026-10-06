# 2026-10-06 - Add Project: Your role is asked in Step 2, not Step 1

- **Oct 6 2026: Add Project: Your role is asked in Step 2, not Step 1.** The designer: "Projects Creation Flow: Step 3 - Role
  should be shown in Step 2. Please fix." The live flow has no "Role" in Step 3 (Privacy and Restrictions): "Your role" sat in
  Step 1 (Project Identification), as question 6 of 7 in Option 1 and under Data owner in Option 2. Asked which was meant; the
  designer chose "Move to Step 2 (Data Collection)".
  - **Changed, Option 1 (`/pages/project-registration`).** Step 1 is now six questions (name, abstract, start date, data owner,
    primary contact, project managers) and its review no longer lists the role. Step 2 is now four: extent, focus areas,
    method, then "Lastly - what's your role on this project?" as question 4 of 4, with the same choice tiles and the required
    "Please specify" for Other. Step 2's review lists "Your role" with an edit link back to that question. Step 2 takes the role
    as props (`role`, `onRoleChange`) and `page.tsx` writes it to the project details, so `roleOfWork` stays where the project
    page and the project edit flow already read it. `isStep2Valid(collection, role)` now needs the role.
  - **Changed, Option 2 (`/pages/project-registration/option-2`).** The "Your role" row left the Data owner section and sits in
    Step 2's "Method and details" section, after Methodology and before Optional details. Validity moved with it: Data owner no
    longer needs a role, Method and details does, and the "Details missing" alert names "Your role" there. The review lists it
    under Data Collection and Methodology, with its edit link going to Method and details. Section descriptions were updated.
  - **Contract.** CONTRACTS.md 4.7's open note now says registration asks the role in Step 2. No clause was weakened: 4.7 item 2
    (no separate "your role" row on the project page) is about the project page, and is unchanged.
  - **Verified:** `tsc`, `eslint` on `app/pages/project-registration` and `check:contracts` pass. In a live browser, as Registered
    User: Option 1 Step 1 shows "Question 1 of 6" through "6 of 6", its review has six rows and no role, Step 2's role question
    is "4 of 4" with Continue disabled until a role is chosen, and Step 2's review shows "Your role: Research". Option 2: the Data
    owner section lists Data owner, Primary contact and Project managers only, Method and details lists Survey type, Method,
    Methodology, Your role, and Continue on an empty section names all four in the alert. Zero console errors. Not run: the whole
    flow to "Create project" and the project page that reads the role afterwards, `npm run build`, and the Review step of Option 2
    (not opened). Not committed.
  - **Open.** (1) Whether the role should instead sit with the data owner's contact in registration (4.7), which the contract
    already leaves for the designer. (2) A person who finished Step 1 before this change is not affected (state is in memory only).
