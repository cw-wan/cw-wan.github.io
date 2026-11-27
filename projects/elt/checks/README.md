# Data checks

Run from the repository root:

```sh
node projects/elt/checks/verify-data.mjs
```

The script uses only Node.js built-in modules. It verifies the actual original
and English trees, including every ordered parent/child relationship, source
reference, operator and character channel. It also checks label/predicate
coverage, untranslated Chinese text, and the key interpretation constraints.

`gatsby-elt.original.json` is the unchanged original Chinese structural baseline
from `ELT_Codex_Handoff.zip`, with SHA-256
`d17869b8e350465dccf0e74e421c416f67bdab94b2ffb5ef03f4301dc17ed943`.
It is retained for maintenance and is never loaded by the English page.

`../data/gatsby-elt.en.json` and `../data/labels.en.json` are direct copies of
the handoff's English tree and `reference/translations.en.json` respectively.
Their prose describes the supplied candidate event schema; the checks do not
claim that actual story-time Temporal Compactness has been established.

These data checks do not replace real-browser interaction/layout checks or
comparison with the original visualization. The original HTML and screenshot
were not present in the handoff.
