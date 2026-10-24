# WaterWolf Browser by Lyriq

**The agentic browser by Lyriq.** This repository is the first UI and architecture foundation. It is a working React prototype, with clear boundaries around the browser engine, AI models, agents, accounts, payments, storage, and protection.

## Run

Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For checks:

```bash
npm run typecheck
npm test
npm run build
```

Opening `index.html` directly as a `file://` URL does not run the Vite app. Use the dev server or serve `dist/` after building.

## Included

- Browser shell with horizontal or vertical tabs, omnibox, sidebar, five Spaces, tab search, Split View, New Tab and internal `waterwolf://` pages.
- Local bookmarks: save or edit the current page from the toolbar, search saved pages, reopen them, and remove them. Bookmarks persist in this browser's local storage.
- Engine Lab at `waterwolf://engine`: an independent HTML-subset parser and layout prototype that paints onto canvas. See [ENGINE_ROADMAP.md](ENGINE_ROADMAP.md) for the eight-week research plan.
- Lyriq Command (`Ctrl/Cmd + K`), WaterWolf Actions menu, Agent Center, Shield UI, ecosystem drawer, Settings, Model Hub, Workspace, Files, Vault, Agent Pay, Schools, VOXA, Billing and About.
- First-run onboarding with optional account and AI choices. No diagnostics leave the preview.
- Light, dark and private visual states, responsive layouts, keyboard shortcuts, reduced-motion styling, and the refined vector wolf/wave symbol in `public/waterwolf-mark.svg` and `src/assets/BrandMark.tsx`.
- Typed contracts for the browser engine, local models, cloud routing, agent tools, resource-scoped permissions and approval requests.
- Unit tests for denied access, exact page scope, one-time approval, AI privacy routing and internal URL parsing.

Keyboard: `Ctrl/Cmd + T` opens a tab, `Ctrl/Cmd + W` closes one, `Ctrl/Cmd + Shift + T` reopens the last closed tab, `Ctrl/Cmd + Tab` switches tabs, `Ctrl/Cmd + 1–9` selects a tab, `Ctrl/Cmd + L` focuses the address bar, and `Ctrl/Cmd + K` opens Lyriq Command.

## Current boundaries

This is **not a Chromium browser binary**. The `BrowserEngineAdapter` in `src/core/browserEngine.ts` is an integration point. External navigation, WebExtensions, Shield blocking, file access, sync, local inference, Lyriq Cloud, agent execution and payments are not connected. Their screens indicate that state rather than reporting invented activity. Spaces currently separate tabs in UI state; they do not isolate cookies or storage yet. Bookmarks and onboarding choices are stored only in this browser profile. Other settings are preview state and reset on reload.

The included agent cards are examples. No agent runs in this build. The registry is deny-by-default, and sensitive tools require a matching one-time approval. Production integration also needs isolated execution, authenticated identities, persisted and expiring grants, durable audit records, and browser-process enforcement.

See [ARCHITECTURE.md](ARCHITECTURE.md) for module boundaries, planned integration order and security requirements, and [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) for the browser interface research. The original one-file UI prototype is archived in the task workspace under `work/waterwolf-v1` for reference.

