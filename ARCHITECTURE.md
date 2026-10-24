# Architecture and delivery boundary

## Layers

```text
React UI + Zustand state
        ↓
BrowserEngineAdapter · AgentToolRegistry · LocalModelProvider · Model Router
        ↓
Future Chromium integration and Lyriq services
```

The experimental `src/engine/` module is a separate HTML-subset parser, layout engine and display-list painter. It is available in `waterwolf://engine` for local research fixtures. It is not connected to ordinary tabs or external navigation. Its eight-week plan and safety gates are in [ENGINE_ROADMAP.md](ENGINE_ROADMAP.md).

`src/components/` owns chrome and overlays. `src/features/` owns pages and onboarding. `src/stores/` owns demo state. `src/core/` owns contracts and policies. A future desktop host may use Chromium source, CEF, or a fork; no Electron dependency is assumed.

## Three product modes

1. **Classic:** Default. No model, account, or cloud calls. Browsing must remain first-class.
2. **Local Intelligence:** `LocalModelProvider` allows ONNX, WebGPU, llama.cpp, DirectML, CoreML or other implementations without changing the UI. `NoLocalModelProvider` reports unavailable cleanly.
3. **Lyriq Cloud:** `CloudModelProvider` and `routeAIRequest` define a future cost- and privacy-aware path. The current project does not call a provider.

The router keeps tier-0 actions deterministic, prefers a local provider for simple tasks when available, denies cloud fallback for local-only requests, and checks budget before a cloud decision. Production must add plan limits, real estimates, caching with privacy boundaries, model observability, and explicit cloud consent.

## Browser integration

Replace `previewEngine` with a privileged process adapter. UI code should never gain direct access to Chromium internals. The host must emit tab, navigation, download, history, extension, security, and resource-use events back to state stores. Internal URLs must be resolved by a trusted handler. External pages must run in Chromium's isolated site processes, with CSP and sandboxing enforced outside React.

Spaces currently group tabs. The host must partition cookies, storage, sessions, history, credentials, extensions, agents and optional proxy settings by Space before claiming isolation.

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
