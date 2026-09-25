// Stacking order for the layers that float over a page. Kept in one place so a new overlay picks
// its level from here instead of guessing a number (Tailwind scans this file, so the class names
// below are generated).
//
//   z-[1000]   map controls and the floating results panel (Leaflet's own panes reach ~700)
//   z-[9999]   full-screen takeovers (the registration map, the docked edit column)
//   z-[10000]  the floating dev tools (role switcher, layout options); menus z-[10001]
//   z-[20000]  modals and slide-over panels - above everything, the dev tools included
//   popovers   react-aria sets its own z-index of 100000, so a menu or date picker inside a modal
//              still opens above it
export const MODAL_Z_INDEX = "z-[20000]";
