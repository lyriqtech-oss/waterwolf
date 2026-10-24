# WaterWolf research engine · eight-week plan

Start: 24 October 2026. Target review: 19 December 2026. This is a research milestone, not a promise of Chrome compatibility or a safe general-purpose browser.

## Goal

Build an independently implemented, testable HTML/CSS renderer for a controlled subset of pages, embedded as a research mode in the WaterWolf UI. Production browsing remains a separate integration decision.

| Week | Dates | Deliverable | Exit gate |
| --- | --- | --- | --- |
| 1 | 24–30 Oct | HTML tree, text layout, display list, canvas painter, Engine Lab | Local sample renders; parser and wrapping tests pass. **Started in this revision.** |
| 2 | 31 Oct–6 Nov | Robust HTML tokenizer and tree construction for selected elements | Malformed markup fixtures recover predictably; unsupported tags are classified. Early fixes now handle quoted `>` and raw script/style content. |
| 3 | 7–13 Nov | CSS tokenizer, selectors, cascade and inheritance | Color, font, spacing and backgrounds work in fixtures without browser CSS layout. **A limited implementation is now in the branch; broader fixtures and box layout remain.** |
| 4 | 14–20 Nov | Block, inline and box model layout | Nested blocks, line breaks, margins and scrolling match reference screenshots within defined tolerances. |
| 5 | 21–27 Nov | Images, links, focus, basic forms and input | Controlled local pages are usable by mouse and keyboard. |
| 6 | 28 Nov–4 Dec | HTTP(S) resource loader and navigation history | Selected public test pages load with redirects and clear error states; no credential handling. |
| 7 | 5–11 Dec | JavaScript integration spike and DOM events | Small scripted fixtures work; unsupported APIs are explicit. No untrusted script is given privileged access. |
| 8 | 12–19 Dec | Compatibility, crash and performance suite; packaging decision | Measured test report, known limitations and recommendation for next phase. |

## Current implementation

`src/engine/html.ts` tokenizes a narrow HTML subset and builds a tree. `src/engine/css.ts` parses selected declarations, tag/class/ID and descendant selectors, then applies specificity and inline styles. `src/engine/layout.ts` turns the tree and selected CSS into positioned drawing commands. `src/features/EngineLab.tsx` paints them onto a canvas. Open `waterwolf://engine` or choose **Engine Lab** from the WaterWolf menu. The lab does not execute scripts, fetch remote content, implement the full CSS box model, or isolate processes. Browser canvas is currently used for text measurement and pixels; the parsing and layout decisions are WaterWolf code.

## Quality gates

- Keep unit fixtures for parsing, layout and malformed input. Add web-platform-tests subsets only when the corresponding feature exists.
- Measure compatibility on a fixed list of local pages. Record pass/fail counts and screenshots rather than claiming broad web support.
- Treat external documents as untrusted. Before loading arbitrary sites or running their scripts, introduce a separate content process, sandbox, origin model, permissions and resource limits.
- At the end of week 4, decide whether to continue the TypeScript prototype, port the core to Rust, or contribute to an existing engine. Rust is not installed in the current workspace environment.

## Reference specifications

- [HTML parsing](https://html.spec.whatwg.org/multipage/parsing.html)
- [Servo architecture](https://book.servo.org/design-documentation/architecture.html)
- [Web Platform Tests](https://web-platform-tests.org/)
- [Chromium site isolation](https://www.chromium.org/developers/design-documents/site-isolation/)
