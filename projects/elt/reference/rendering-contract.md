# Existing rendering: implementation record

This is a record of the renderer created in the conversation on 2026-11-09, not a recovered HTML export or a verified screenshot baseline. Use a recovered original export when available. The temporary HTML and embedded image bytes were removed by workspace maintenance. The original source data has been recovered intact.

## Required composition

- Heading: “The Great Gatsby”; subtitle identifies Event Logic Tree and the 2013 movie imagery.
- Eight round character portraits, ordered G, D, N, T, J, M, W, H. H is an initial, not an invented actor portrait.
- A compact operator legend: SEQ / Sequence; SYNC / Temporal alignment; GUARD / Interval containment; Character = channel.
- Breadcrumb navigation above one tree. No surrounding dashboard, giant landing-page hero, sidebar or force-directed graph.
- Movie stills inside selected composite nodes; character portraits inside primitive nodes.
- Collapsible “Image and story sources” at the bottom.

## Tree behavior

- Initial focus is `Root`.
- At tree-container width >= 620 px, the initial overview expands only Root, Connection, Collapse and Consequences. Its five terminal composites are Entry, Reunion, Confrontation, Tragedy and Aftermath. It shows 9 nodes and 8 edges; the full data still has 73 nodes.
- At narrower widths the focus plus its immediate children are displayed.
- For other composite focuses, show up to two descendant levels on desktop, and one descendant level on narrow screens. Do not flatten the underlying binary tree.
- “Expand · n” changes focus to that composite. `n` is the exact number of descendant primitives, not a confidence score.
- “View primitive” focuses the primitive, showing the full predicate, character, stable node ID and evidence link.
- Breadcrumbs return to ancestors. Deep paths retain the root, an ellipsis, and the two nearest ancestors.
- A focused primitive is still navigable back through the breadcrumb.
- Parent/child ordering is stable. SEQ uses First / Then; SYNC uses Aligned; GUARD uses Inner / Outer (child 0 = inner event, child 1 = containing interval).

## Layout and styling recorded in the earlier source

- Transparent, unframed visualization canvas; subdued operator fills and thin neutral connector curves.
- Intended desktop content width: approximately 736 CSS px. Keep the diagram centered at a comparable width rather than stretching it to fill a 1440 px screen.
- Cast strip: 8 columns; 4 columns below 560 px.
- Portrait diameters: cast 48 px; primitive node 56 px; focused primitive 84 px; participant miniatures 20 px.
- Portrait crop defaults: 230% auto, center top. Myrtle: center 6%. George Wilson: 280% auto, 26% center.
- Node widths: focused node at most 310 px; intermediate composite at most 210 px; terminal node at most 180 px, constrained by available subtree width.
- Scene image heights: 82 px in ordinary nodes, 132 px in focused nodes, 112 px for focused nodes below 560 px.
- Connector stroke: 1.4 px; vertical child offset: parent node's measured height + 44 px. Each subtree is placed relative to its own parent, not one global row height.
- Node dimensions are measured after English text wraps. Font readiness and resize changes trigger re-layout. Long text must never overlap edges or neighboring nodes.
- Existing color vocabulary: `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--font-size-base`, and `--viz-series-1/2/3` for SEQ/SYNC/GUARD fills. Original theme values depended on the ChatGPT host; a fragment alone does not include all required styles.
- Existing utility classes included `.btn`, `.btn-ghost`, `.text-small`, `.text-muted`, `.sr-only`, and `.cursor-interaction`. Their standalone definitions and tooltip behavior must be included locally. Never assume ChatGPT will supply them on GitHub Pages.
- Reuse actual source typography and computed values where recovered; do not infer exact host font metrics from this record.
- Short position transitions on navigation; respect `prefers-reduced-motion`; no continuous animation.

## Fidelity boundary

English translation necessarily changes text wrapping. Match composition, image selection/cropping, fonts, color tokens, spacing, focus behavior and topology; allow only the vertical growth needed for readable English. A new implementation compared only against its own screenshot is not evidence of matching the ChatGPT original.

The prior renderer was checked structurally and with simulated DOM interactions, but it was not successfully verified in a real browser. Browser rendering and screenshots remain required for this migration.
