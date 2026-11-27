# Migration validation — 2026-11-27

The English page is a reconstruction from the supplied rendering contract,
not a recovered original HTML export.

## Data

`node projects/elt/checks/verify-data.mjs` passed. All 73 unique nodes retain
their IDs, kinds, operators, channels, evidence references, parent relationships,
and ordered children. The counts are 37 primitives, 36 binary composites,
28 SEQ, 5 GUARD, 3 SYNC, and eight channels. English labels and predicates cover
every node. The supplied source URLs and interpretation constraints are retained.

## Real browser

`checks/verify-browser.mjs` passed in installed Chrome 158.0.8127.37 against a
repository-root HTTP server at `/projects/elt/`:

- All 37 primitive details and 36 composite focuses visited through actual
  buttons, with return navigation through each parent breadcrumb.
- 148 layout checks, including 320, 390, 736, 1280, and 1600 px viewports;
  the desktop tree is capped at 736 CSS px. The 620 px tree and 560 px cast
  thresholds are checked on both sides.
- Root, Reunion, Plaza, FatalReturn, Shooting, Funeral, and J_backstory checked
  in light and dark themes. Root has nine nodes and eight edges on desktop,
  and three nodes on narrow screens.
- No overlapping nodes, clipped node content, page horizontal overflow, or
  connector curves crossing node interiors after layout settles. Every child
  starts 44 px below its own measured parent bottom.
- Keyboard activation, local tooltips, Escape dismissal, collapsed breadcrumb
  ancestors, browser history, direct fragment URLs, refresh, trailing-slash
  redirects, reduced motion, and collapsible source credits checked.
- No console errors, uncaught exceptions, failed requests, or failed image
  loads. The page and its accessible labels use English.

Thirteen screenshots were captured as local QA artifacts. The inspected scenes
include the overview, reunion, Plaza, collision, shooting, funeral, and Jordan's
long predicate. Historical image URLs yielded all seven actor portraits and
seven scene stills; files were decoded and visually inspected. Henry Gatz uses
the original H placeholder. Provenance and hashes are in `assets/manifest.json`.

## Remaining acceptance item

**Functionality verified; fidelity to the original visualization awaits comparison.**
The original complete HTML, embedded image bytes, host CSS snapshot, and
reference screenshot are missing from the handoff. New screenshots establish
the behavior and appearance of this reconstruction only. An original export or
reference screenshot is needed to assess any remaining visual differences.

## Deployment

The authenticated Pages API confirmed existing publication from `main`, path
`/`, with `build_type: legacy` and HTTPS enabled. The existing homepage,
publication source, and workflow configuration are unchanged. Final live
deployment status is checked separately after pushing this source revision.
