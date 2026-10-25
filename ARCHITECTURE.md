# Architecture and delivery boundary

## Layers

```text
React UI + Zustand state
        ↓
Electron IPC bridge → Chromium WebContentsView per external tab
        ↓
BrowserEngineAdapter · AgentToolRegistry · LocalModelProvider · Model Router
```

The experimental `src/engine/` module is a separate HTML-subset parser, layout engine and display-list painter. It is available in `waterwolf://engine` for local research fixtures. It is not connected to ordinary tabs or external navigation. Its eight-week plan and safety gates are in [ENGINE_ROADMAP.md](ENGINE_ROADMAP.md).

`src/components/` owns chrome and overlays. `src/features/` owns pages and onboarding. `src/stores/` owns UI state. `src/core/` owns contracts and policies. `electron/` is the current desktop host; its narrow preload API isolates the React shell from privileged Electron calls.

## Three product modes

1. **Classic:** Default. No model, account, or cloud calls. Browsing must remain first-class.
2. **Local Intelligence:** `LocalModelProvider` allows ONNX, WebGPU, llama.cpp, DirectML, CoreML or other implementations without changing the UI. `NoLocalModelProvider` reports unavailable cleanly.
3. **Lyriq Cloud:** `CloudModelProvider` and `routeAIRequest` define a future cost- and privacy-aware path. The current project does not call a provider.

The router keeps tier-0 actions deterministic, prefers a local provider for simple tasks when available, denies cloud fallback for local-only requests, and checks budget before a cloud decision. Production must add plan limits, real estimates, caching with privacy boundaries, model observability, and explicit cloud consent.

## Browser integration

The first privileged host uses Electron `WebContentsView` for external HTTP/HTTPS pages. The shell calls only validated IPC actions, and external pages have no preload or Node access. The host sends URL, title and loading events back to React. Popup requests become WaterWolf tabs, unsupported schemes are blocked, and site permissions are denied. The next milestones must add downloads, history, extension and security events, permission prompts, certificate error handling and robust CSP for the shell.

Spaces group tabs and use separate persistent Chromium partitions for cookies and site storage. Full Space isolation still needs separate history, credentials, extensions, agents and optional proxy settings.

## Agents and approval

`AgentToolRegistry` registers typed tools and denies unregistered or unpermitted operations. Grants are resource-scoped to a page URL, tab ID or Space ID. Sensitive tools demand an approved request bound to the same agent and tool, consumed once. Production must persist approvals, bind them to exact action arguments and expiry, record an audit trail, enforce grants in the privileged browser process, and ensure actions such as payment, message sending, account changes, deletion, executable downloads, security changes and password changes receive user confirmation.

Agents must always show an access indicator, current site, tools, cost and permissions when running. The current Agent Center contains labeled examples and no active work.

## Next integration milestones

1. Desktop host and real `BrowserEngineAdapter`; navigation, tabs, internal pages, history and downloads.
2. Per-Space browser profiles, Vault and extension permission enforcement.
3. Shield network and privacy engine with real per-site metrics.
4. Device capability detection and local model provider, with memory unload when idle.
5. Lyriq authentication, encrypted Sync, Workspace and Files.
6. Agent runtime with isolated tools, durable approvals and audit log.
7. Agent Pay, Schools, VOXA and enterprise policy services.

Performance targets require measurement in the eventual Chromium host; this UI preview alone cannot validate startup time, idle CPU, memory use or tab suspension.
