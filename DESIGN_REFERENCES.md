# Browser design references for WaterWolf

Research date: 24 October 2026. Sources below are official product, support or design pages. WaterWolf adopts interaction principles and keeps its own brand, layout proportions, colors and icon.

| Reference | Observed design principle | WaterWolf application |
| --- | --- | --- |
| [Chromium user experience](https://www.chromium.org/user-experience/) and [toolbar guidance](https://www.chromium.org/user-experience/toolbar/) | Browser chrome should give priority to page content and frequently used controls. Tabs and search are primary navigation. | Reduced permanent toolbar actions to bookmark, Shield, downloads, Lyriq launcher, profile and menu. Other actions remain in menus and the command palette. |
| [Chromium tabs](https://www.chromium.org/user-experience/tabs/) | Tabs shrink as the strip fills; a separate list can help find a tab in a crowded window. | A compact tab strip retains favicon, title and close action. Search Tabs searches across Spaces. |
| [Firefox design update](https://blog.mozilla.org/en/firefox/new-firefox-design-is-here/) and [design rationale](https://blog.mozilla.org/en/firefox/new-firefox-design/) | Consistent icons, restrained tab emphasis, compact density, configurable New Tab and clear privacy settings. | Active tab uses a quiet surface distinction. Appearance now includes Compact browser chrome and optional vertical tabs; Shield stays immediately accessible. |
| [Arc Spaces](https://resources.arc.net/hc/en-us/articles/19228064149143-Spaces-Distinct-Browsing-Areas) and [Command Bar actions](https://start.arc.net/command-bar-actions) | Separate browsing contexts and a command surface reduce context switching. | Spaces retain independent tab sets in the prototype. Lyriq Command includes navigation, spaces, tabs and ecosystem actions. |
| [Microsoft Edge Workspaces](https://support.microsoft.com/en-us/edge/getting-started-with-microsoft-edge-workspaces) | Related tabs can be organized by activity and returned to later. | Space selection stays visible in the sidebar, while Space switching is also available by keyboard and command. |

## Decisions from the comparison

- Keep **horizontal tabs and a familiar omnibox** for immediate browser recognition.
- Use the optional sidebar for **context and organization**, not a permanent catalog of every Lyriq feature.
- Put AI behind explicit entry points. Classic Mode retains the same browser shell.
- Offer compact density and an optional vertical tab layout without changing the underlying Space model.
- Keep Shield, tab search, Spaces and the current agent state easy to find because they affect user trust and control.

The sources do not establish that the prototype has Chromium navigation, network protection, Space isolation or agent execution. Those capabilities remain separate integration milestones in [ARCHITECTURE.md](ARCHITECTURE.md).
