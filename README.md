# WaterWolf Browser by Lyriq

**The agentic browser by Lyriq.** This repository contains a working desktop browsing foundation and a separate experimental rendering engine.

## Run

Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

The Vite URL previews the interface in an existing browser. To open the WaterWolf desktop app with Chromium pages:

```bash
npm run desktop
```

For checks:

```bash
npm run typecheck
npm test
npm run build
```

Opening `index.html` directly as a `file://` URL does not run the Vite app. Use the dev server or serve `dist/` after building.

## Included

- Browser shell with horizontal or vertical tabs, omnibox, sidebar, five Spaces, tab search, Split View, New Tab and internal `waterwolf://` pages.
- Desktop browsing: HTTP/HTTPS sites open in Chromium-backed tabs inside the WaterWolf window. The address bar searches DuckDuckGo by default; Google and Bing can be chosen during onboarding. Search results retain the provider's own page design. The web preview still shows a local WaterWolf Search mockup.
- Desktop tabs use separate persistent Chromium sessions for each Space. Popups open as WaterWolf tabs. Site permission requests are denied until a proper permission interface exists.
- Local bookmarks: save or edit the current page from the toolbar, search saved pages, reopen them, and remove them. Bookmarks persist in this browser's local storage.
- Engine Lab at `waterwolf://engine`: an independent HTML/CSS-subset parser and layout prototype that paints onto canvas. It supports selected selectors, colors, fonts, margins, box width, padding and borders. Controlled local documents have engine-owned back/forward history; text fields and buttons are drawn on canvas with accessible controls beneath the preview. See [ENGINE_ROADMAP.md](ENGINE_ROADMAP.md) for the eight-week research plan.
- Lyriq Command (`Ctrl/Cmd + K`), WaterWolf Actions menu, Agent Center, Shield UI, ecosystem drawer, Settings, Model Hub, Workspace, Files, Vault, Agent Pay, Schools, VOXA, Billing and About.
- First-run onboarding with optional account and AI choices. No diagnostics leave the preview.
- Light, dark and private visual states, responsive layouts, keyboard shortcuts, reduced-motion styling, and the refined vector wolf/wave symbol in `public/waterwolf-mark.svg` and `src/assets/BrandMark.tsx`.
- Typed contracts for the browser engine, local models, cloud routing, agent tools, resource-scoped permissions and approval requests.
- Unit tests for denied access, exact page scope, one-time approval, AI privacy routing and internal URL parsing.

Keyboard: `Ctrl/Cmd + T` opens a tab, `Ctrl/Cmd + W` closes one, `Ctrl/Cmd + Shift + T` reopens the last closed tab, `Ctrl/Cmd + Tab` switches tabs, `Ctrl/Cmd + 1–9` selects a tab, `Ctrl/Cmd + L` focuses the address bar, and `Ctrl/Cmd + K` opens Lyriq Command.

## Current boundaries

The desktop app uses Electron's Chromium runtime for real pages; it is not yet a standalone Chromium fork or a production browser. The research engine in `src/engine/` remains independent. WebExtensions, Shield blocking, downloads UI, browsing history, private browsing, sync, local inference, Lyriq Cloud, agent execution and payments are not connected. Site permissions are currently denied. Bookmarks and onboarding choices are stored in the local app profile. Other settings are preview state and reset on reload. The web preview at the Vite URL cannot embed arbitrary external sites.

The included agent cards are examples. No agent runs in this build. The registry is deny-by-default, and sensitive tools require a matching one-time approval. Production integration also needs isolated execution, authenticated identities, persisted and expiring grants, durable audit records, and browser-process enforcement.

See [ARCHITECTURE.md](ARCHITECTURE.md) for module boundaries, planned integration order and security requirements, and [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) for the browser interface research. The original one-file UI prototype is archived in the task workspace under `work/waterwolf-v1` for reference.

