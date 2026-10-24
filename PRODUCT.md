# WaterWolf product record

## Product

WaterWolf Browser is an agentic browser by Lyriq. Its primary promise is excellent conventional browsing with an optional intelligence layer that can help people act on the web. The product should remain useful without AI, an account, cloud connectivity or high-end hardware.

## Audience and jobs

The brief targets everyday users, privacy-focused users, students, developers and organizations. Their core jobs are navigating, organizing Spaces and tabs, protecting browsing, finding previous work, and optionally delegating approved actions to agents.

## Modes

- Classic Mode: full browser, AI off.
- Local Intelligence: on-device models when available.
- Lyriq Cloud: opt-in cloud models, advanced agents and automations.

## Durable constraints

Chromium is the initial browser engine target. No proprietary engine is planned for this phase, and no desktop shell is fixed to Electron. Agents must be visible and permissions scoped. Sensitive actions require explicit user approval. Accounts are optional for core browsing. Context Graph is local-first and must never upload complete browsing history without permission.

## Platform and stack

Initial deliverable: desktop-first web UI foundation, responsive down to narrow viewports. React, TypeScript, Vite, Tailwind, Zustand, Lucide and Framer Motion were specified in the user's brief. Native/Chromium integration is a later milestone.
