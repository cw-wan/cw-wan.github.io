# The Great Gatsby — Event Logic Tree

A self-contained English visualization at
[`/projects/elt/`](https://cw-wan.github.io/projects/elt/). It uses plain HTML,
CSS, JavaScript, and local images; there is no production build or runtime
dependency. The repository homepage is independent and is not changed by this
page.

## Run and check

From the repository root, start a static server:

```sh
python -m http.server 8765
```

Open `http://127.0.0.1:8765/projects/elt/`. Serve the repository root rather
than the ELT directory so the public subdirectory path is exercised.

Run the structure and translation checks from the repository root:

```sh
node projects/elt/checks/verify-data.mjs
```

For real-browser interaction and responsive-layout checks, keep the server
running and use a separate terminal:

```sh
npm install --no-save --package-lock=false playwright
node projects/elt/checks/verify-browser.mjs
```

The browser check uses an installed Chrome by default. Set `ELT_BROWSER=msedge`
to use an installed Microsoft Edge. `ELT_BASE_URL` overrides the default URL
above; `ELT_QA_OUTPUT` sets the directory for screenshots and the JSON report
(default: `elt-qa`, relative to the working directory). For example, in
PowerShell:

```powershell
$env:ELT_BROWSER = 'msedge'
$env:ELT_QA_OUTPUT = '../elt-qa'
$env:ELT_BASE_URL = 'http://127.0.0.1:8765/projects/elt/'
node projects/elt/checks/verify-browser.mjs
```

Playwright is a development check dependency only. Do not commit `node_modules`
or generated QA output. Check results are established by the generated report;
see [VALIDATION.md](./VALIDATION.md) for the recorded migration checks and their
limitations.

## Data and images

- `data/gatsby-elt.en.json` and `data/labels.en.json` are unchanged copies of the
  handoff's English tree and translation table. The tree has 73 unique nodes:
  37 primitives and 36 binary composites, using 28 SEQ, 5 GUARD, and 3 SYNC
  operators across eight character channels. Stable IDs, ordered children, and
  evidence references must be preserved.
- `checks/gatsby-elt.original.json` retains the supplied Chinese structural
  baseline for comparison. The page never loads it as visible content.
- Story-source URLs are retained in the data. Film stills illustrate a tree
  based on the novel; they are not independent evidence for its events. Henry
  Gatz retains the `H` placeholder.
- `assets/manifest.json` records the 14 recovered local photographs, their
  source URLs, dimensions, hashes, and inspection notes. The browser loads
  local files under `assets/portraits/` and `assets/scenes/`; source-page links
  remain available in the page's collapsible credits.
- `reference/rendering-contract.md` preserves the historical rendering and
  interaction record. The complete execution plan is retained at
  [`docs/CODEX_IMPLEMENTATION_PLAN.md`](../../docs/CODEX_IMPLEMENTATION_PLAN.md).

## Reconstruction and validation boundary

This is a reconstruction based on the supplied rendering record. The original
complete HTML, original embedded image bytes, host style snapshot, and visual
reference screenshot were not available. Functional checks and new screenshots
cannot demonstrate fidelity to that missing original. **Visual consistency with
the original remains pending acceptance** until an original export or screenshot
can be compared at matching widths and themes. The data describes a candidate
event schema; actual story-time Temporal Compactness is not claimed as verified.

## Publication and future maintenance

Use the existing GitHub Pages publication from `main` at the repository root.
This subdirectory does not need a second site, a new publishing workflow, or a
change to the homepage. Push through the repository's normal permissions and
check the actual Pages deployment and live resource responses before calling a
change published.

All page resources use relative paths. If the homepage later moves to a static
framework, copy this entire directory into that framework's public/static
assets or build output. The final output must still contain
`projects/elt/index.html` and its sibling assets, preserving the public
`/projects/elt/` URL and independence from homepage styles and scripts.
