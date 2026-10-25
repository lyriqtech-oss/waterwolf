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
3. **Cloud:** Initial Google Gemini and OpenAI API connections are available in the desktop app for one approved page-summary action. `CloudModelProvider` and `routeAIRequest` still define broader future routing; general-purpose agents and Lyriq Cloud are not connected.

The router keeps tier-0 actions deterministic, prefers a local provider for simple tasks when available, denies cloud fallback for local-only requests, and checks budget before a cloud decision. Production must add plan limits, real estimates, caching with privacy boundaries, model observability, and explicit cloud consent.

The desktop AI bridge stores the provider name, model name, and encrypted API key in the app profile. The renderer cannot retrieve the key. A separate connection test sends only a short fixed prompt. The page-summary flow extracts up to 12,000 characters from the selected Chromium tab, shows them to the user, and requires a separate click to send them to the named provider. The host rechecks the tab URL before sending, limits the model output, disables API-side storage where supported, and treats page text as untrusted data. This is a single action, not an autonomous agent. Further providers should use dedicated adapters and explicit destination disclosure.

The first research agent reads up to three already open tabs after the user chooses them. The host holds the extracted snapshots behind a one-time, five-minute review token, checks the tabs' URLs again before execution, and sends one bounded synthesis request. It cannot navigate, click, modify pages, send messages, or continue in the background. This is a narrow autonomous read-and-synthesize workflow, not a general tool-using agent runtime.

## Browser integration

The first privileged host uses Electron `WebContentsView` for external HTTP/HTTPS pages. The shell calls only validated IPC actions, and external pages have no preload or Node access. The host sends URL, title and loading events back to React. Popup requests become WaterWolf tabs. Unsupported schemes, redirects, credential-bearing addresses, site permission requests and checks, and all downloads are blocked. The app shell has a Content Security Policy; the renderer cannot access the privileged session objects. Shield reports local aggregate counts without retaining requested URLs. Chromium handles TLS certificate rejection by default. The next milestones must add a reviewed download workflow with scanning, phishing/malware reputation, history, extensions, granular permission prompts, and active tracker blocking.

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
