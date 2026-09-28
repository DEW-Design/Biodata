# 2026-09-22 - project-detail takes the Master Flows Project Details copy, and the records tree follows the confirmed

- **Sept 22 2026: project-detail takes the Master Flows Project Details copy, and the records tree follows the confirmed
  data model.** Source: Figma `yzQY87GXoyGGGPJDnh1hmi` node `10:58214` (Project Details Container, 11 accordions). The
  frame's accordions are not reproduced, they are the copy source: the existing tabs and layout are unchanged.
  - **Copy brought in:** title and Project No (Kangaroo Island Wildlife Rehabilitation, BD - 5034), Full Project Name,
    the full Abstract, "Data Owner/s" and "Project Manager/s" with a Primary and a Secondary Contact each, and the
    Details tab's Locations (Data Collection Location: MGA Easting/Northing, Latitude, Longitude, Study Area
    Description), Data Collection Scope, Permit and URI / DOI Number, in the frame's order. Where the frame leaves a
    field empty the row reads "Not provided", not a stray "-" (design principle above). "Targetted Species" is corrected
    to "Targeted Species". Contacts use the placeholder cast (Olivia Wyatt, Phoenix Baker, Maya Dewitt, Lana Steiner)
    instead of the frame's "Olivia Rhye", per the placeholder-person contract; email and phone values are the frame's.
  - **Not readable through Figma MCP:** the frame's last three accordions (Privacy and Restrictions, Additional
    Details, Comments) sit in nested instance slots that return no content, so the Restrictions and Additional
    Information tabs keep their existing copy. Re-pull them when the frame is opened in the desktop app.
  - **Kept, not overwritten:** dates, status, publisher, dataset table and record counts are data, not frame copy.
  - **Known mismatch:** project-list's real row is still named "Adelaide Hills Bushland Survey" and links here, and
    project-list-content already has a separate "Kangaroo Island Recovery Monitoring" row. Decide which project this
    page is, then rename the list row to match.
  - **Records tree, `app/pages/_shared/project-record-tree.ts` (new, shared by project-detail and observation-detail,
    which used to keep drifting local copies):** Project > Site > Visit > Occurrence > Observation, an Occurrence
    parenting exactly one Observation of the same type (Individual, Population, Non-biotic, Community).
    Transect/Quadrat/Ramble nest under the Visit they belong to. The Project is the tree's root node.