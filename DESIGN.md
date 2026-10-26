# WaterWolf design system

## Direction

Quiet, precise browser chrome. The New Tab is deliberately calm; tools live in the sidebar, command palette or contextual popovers. The wolf and wave symbol carries the brand without repeating its name in the toolbar.

## Tokens

Light: background `#F7F9FC`, surface `#FFFFFF`, secondary surface `#F0F3F7`, border `#DDE4EC`, primary text `#101828`, secondary text `#475467`, navy `#0B2A4A`, blue `#1677FF`, blue hover `#EAF3FF`.

Dark: background `#0C0F14`, surface `#12161D`, secondary surface `#181D25`, border `#252B35`, primary text `#F5F7FA`, secondary text `#A7B0BE`, blue `#2684FF`.

Inter 400/500/600, compact 12–14 px controls, 25 px page headings, 40 px New Tab heading. Spacing follows 4 px increments. Control radii 6–10 px; modal radius 16 px. Borders and elevation are restrained.

## Components and states

Tab bar: active, inactive, hover, sleeping, agent indicator, searchable overflow, and horizontal or vertical layout. Sidebar: expanded and compact; the Spaces list is visible while Lyriq apps live in a drawer. Omnibox: default and focus. Settings: select and checkbox preferences, including compact chrome. Shield: standard, strict and custom preference states. Overlays: menu, command, agent actions and Lyriq ecosystem. New Tab: Classic and optional AI suggestions. Onboarding: six short steps with skip.

Buttons and fields provide visible focus. Motion is 120–180 ms and disabled under reduced-motion preference. The CSS tokens live in `src/style.css`; SVG brand assets live in `public/` and `src/assets/`.
