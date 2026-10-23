// The edge of every surface that floats over the map (the search and results cards, the record summary, the key, the zoom
// buttons), and the lines inside them.
//
// It is the neutral dark at 12 per cent, not a solid light grey. A solid grey (the old `border-secondary`) is one colour, so it
// is a pale line on the sea, a darker one on the land and a different one again over a road; 12 per cent of the same dark
// is always "a little darker than what is behind it". On the white of the card it is the same line as before (measured:
// within 2 of 255 on each channel of the old `gray-200`), so the dividers inside a card do not change; the difference is at
// the card's outer edge, where the map is under it.
//
// `bg-clip-padding` is what lets the edge be see-through: a border is painted over the element's own background, so without it
// the 12 per cent would land on the card's white and be a solid grey again, whatever the map is. With it the white stops at the
// padding edge and the map shows through the border. The border's width is unchanged, so nothing inside the card moves.
export const MAP_SURFACE_EDGE = "border border-gray-950/12 bg-clip-padding";

/** A line inside a surface that floats over the map (a header's divider, the rule between two buttons). */
export const MAP_SURFACE_RULE = "border-gray-950/12";

// A scroll area inside a card that floats over the map (a list of results, a record's summary): no scroll chaining out of it. `overscroll-contain` keeps a scroll that reaches the end of the list from carrying on into what is behind it
// (the map). Its scrollbar is the product's one (a thumb drawn over its edge, `app/_scrollbars`, CONTRACTS 2.17), which takes no width, so the badge column sits as far in from the right as the text does from the left on every system
// (it was 15px further in where a classic bar showed, and the card looked lopsided). What says there is more is the row cut off at the bottom, the fade (`ScrollFade`) and the pinned "Show more" button.
export const MAP_SURFACE_SCROLL = "overscroll-contain";
