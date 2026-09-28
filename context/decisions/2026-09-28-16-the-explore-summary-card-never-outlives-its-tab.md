# 2026-09-28 - the Explore summary card never outlives its tab, and it no longer scrolls on laptop-sized windows, per page feedback ("If I select projects, why is the species card still showing?"; "I just want the height to be fixed, so that there's no scroll on those preview cards").

- **Sept 28 2026: the Explore summary card never outlives its tab, and it no longer scrolls on laptop-sized windows, per page feedback ("If I select projects, why is the species card still showing?"; "I just want the height to be fixed, so that there's no scroll on those preview cards").**
  - **The bug:** the card followed the selected record, not the active tab, so a species card stayed open on the Projects tab. Nothing cleared it when the tab, keyword or areas changed. Now `observations-search.tsx` does two things. Switching tabs closes the card. The card also only renders while its record is one of the active tab's plotted results (`peekVisible`), so a new keyword or a removed area that drops the record also removes its card.
  - **No scroll:**
    - The photo absorbs the height shortfall (`shrink-[1000]`, never under 120px), the details sit under it, and "Show in project" is pinned in the footer.
    - The map key moved to the bottom of the left column, so the right column (zoom, card) has the full map height.
    - A real overlap found while measuring: on short windows the photo drew over the species name, because the figure shrank below its own photo floor plus the credit line. The figure now has a 168px floor.
  - **Phone width (panels stacked):** the search card keeps a 72px floor (its title row and Add area) and gives up the rest of its height. The map key steps aside while a card is open, because both cannot fit under the search card.
  - **Verified:** a Playwright pass measured the search card, zoom, summary card, key, scale bar and attribution at 1708x934, 1440x900, 1280x800, 1280x720, 1024x650, 1024x560, 800x700 and 500x800:
    - no overlaps at any size;
    - the photo never covers the text;
    - "Show in project" is always inside the card;
    - the details do not scroll at 1280x720 and above.
    A tab test: species card open, switch to Projects, the card closes; back to Species, it stays closed; an Occurrences card closes when a keyword matches nothing. Zero console errors. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean.
  - **Honest limit:** when the map is shorter than about 560px (1024x650 and smaller windows), the photo, the name and facts, and the button do not all fit at once. The photo stops at its floor and the details scroll as a last resort. Removing that scroll means hiding the photo on short maps, which is a designer decision. Not committed.