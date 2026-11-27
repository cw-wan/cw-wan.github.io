import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.env.ELT_BASE_URL || 'http://127.0.0.1:8765/projects/elt/';
const output = path.resolve(process.env.ELT_QA_OUTPUT || 'elt-qa');
await mkdir(output, { recursive: true });
const data = JSON.parse(await readFile(new URL('../data/gatsby-elt.en.json', import.meta.url), 'utf8'));
const nodes = new Map(); const parent = new Map(); const counts = new Map();
function index(node, ancestor) {
  nodes.set(node.id, node); if (ancestor) parent.set(node.id, ancestor.id);
  (node.children || []).forEach(child => index(child, node));
  counts.set(node.id, node.kind === 'primitive' ? 1 : node.children.reduce((sum, child) => sum + counts.get(child.id), 0));
}
index(data.root);
const errors = [];
const browser = await chromium.launch({ channel: process.env.ELT_BROWSER || 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, colorScheme: 'light' });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
const report = { base, browser: '', visitedPrimitives: [], compositeFocuses: [], layouts: [], screenshots: [], errors };
const settle = async () => {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})));
  });
  await page.waitForTimeout(50);
};
async function focused(id) {
  await page.waitForFunction(value => document.querySelector('#tree-stage').dataset.focus === value, id);
  await settle();
}
async function geometry(label) {
  const result = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.tree-node')].map(el => {
      const rect = el.getBoundingClientRect();
      return { id: el.dataset.nodeId, x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height,
        overflow: el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1 };
    });
    const stage = document.querySelector('#tree-stage').getBoundingClientRect();
    const problems = [];
    for (let i = 0; i < cards.length; i++) {
      const a = cards[i];
      if (a.x < stage.x - 1 || a.right > stage.right + 1 || a.overflow) problems.push(`overflow: ${a.id}`);
      for (const b of cards.slice(i + 1)) {
        if (a.x < b.right - 1 && b.x < a.right - 1 && a.y < b.bottom - 1 && b.y < a.bottom - 1) problems.push(`overlap: ${a.id} / ${b.id}`);
      }
    }
    const edges = [...document.querySelectorAll('#tree-edges path')];
    for (const edge of edges) {
      const a = cards.find(card => card.id === edge.dataset.parent);
      const b = cards.find(card => card.id === edge.dataset.child);
      if (Math.abs(b.y - a.bottom - 44) > 1) problems.push(`parent gap: ${b.id}`);
      // Sample the real SVG curve; endpoints may touch a card, interiors must not cross one.
      const length = edge.getTotalLength();
      for (let t = 1; t < 40; t++) {
        const point = edge.getPointAtLength(length * t / 40);
        if (cards.some(card => point.x + stage.x > card.x + 1 && point.x + stage.x < card.right - 1 && point.y + stage.y > card.y + 1 && point.y + stage.y < card.bottom - 1)) {
          problems.push(`edge crosses card: ${b.id}`); break;
        }
      }
    }
    if (document.documentElement.scrollWidth > innerWidth) problems.push('page horizontal overflow');
    if ([...document.images].some(img => !img.complete || !img.naturalWidth)) problems.push('failed image');
    if (/[\u3400-\u9fff]/u.test(document.body.innerText)) problems.push('non-English visible text');
    return { problems, width: stage.width, nodes: cards.length, edges: edges.length };
  });
  assert.deepEqual(result.problems, [], `${label}: ${result.problems.join(', ')}`);
  report.layouts.push({ label, ...result });
}
async function screenshot(name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true }); report.screenshots.push(`${name}.png`);
}
async function visit(node) {
  assert.equal(await page.locator('#tree-stage').getAttribute('data-focus'), node.id);
  await geometry(`traversal ${node.id}`);
  if (node.kind === 'primitive') {
    assert.equal(await page.locator('.is-focus .predicate').textContent(), node.predicate);
    assert.equal(await page.locator('.is-focus .node-id').textContent(), node.id);
    assert.equal(await page.locator('.is-focus .story-source').getAttribute('href'), data.sources[node.evidence_source]);
    report.visitedPrimitives.push(node.id);
    return;
  }
  report.compositeFocuses.push(node.id);
  for (const child of node.children) {
    const action = page.locator(`.node-action[data-focus="${child.id}"]`);
    assert.equal(await action.textContent(), child.kind === 'primitive' ? 'View primitive' : `Expand · ${counts.get(child.id)}`);
    await action.click(); await focused(child.id); await visit(child);
    await page.locator(`#breadcrumbs button[data-focus="${node.id}"]`).click(); await focused(node.id);
  }
}
try {
  report.browser = browser.version();
  const response = await page.goto(base); assert.equal(response.status(), 200);
  await focused('Root');
  assert.equal(await page.locator('.tree-node').count(), 9);
  assert.equal(await page.locator('#tree-edges path').count(), 8);
  assert.deepEqual(await page.locator('.tree-node.is-terminal').evaluateAll(els => els.map(el => el.dataset.nodeId)), ['Entry', 'Reunion', 'Confrontation', 'Tragedy', 'Aftermath']);
  await visit(data.root);
  assert.equal(new Set(report.visitedPrimitives).size, 37); assert.equal(new Set(report.compositeFocuses).size, 36);
  // Real CSS background images are requested and decoded, including the special Wilson crop.
  assert.equal(await page.locator('.cast .portrait').count(), 8);
  for (const width of [320, 390, 736, 1280, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: theme });
      for (const id of ['Root', 'Reunion', 'Plaza', 'FatalReturn', 'Shooting', 'Funeral', 'J_backstory']) {
        await page.goto(`${base}#${id}`); await focused(id); await geometry(`${width} ${theme} ${id}`);
        if ((width === 1280 && theme === 'light') || (width === 320 && ['Root','J_backstory'].includes(id)) || (width === 390 && theme === 'dark' && ['Root','FatalReturn'].includes(id))) await screenshot(`${width}-${theme}-${id}`);
        if (id === 'Root') assert.equal(await page.locator('.tree-node').count(), width - 24 >= 620 ? 9 : 3);
        if (id === 'FatalReturn') {
          assert.equal(await page.locator('.edge-label[data-child="M_collision"]').textContent(), 'Inner');
          assert.equal(await page.locator('.edge-label[data-child="D_driving"]').textContent(), 'Outer');
        }
      }
    }
  }
  // Exact container thresholds, including both sides of the boundary.
  for (const width of [583, 584, 643, 644]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(base); await focused('Root');
    assert.equal(await page.locator('.tree-node').count(), width >= 644 ? 9 : 3);
    const columns = await page.locator('#cast').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert.equal(columns, width >= 584 ? 8 : 4); await geometry(`threshold ${width}`);
  }
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto(`${base}#J_backstory`); await focused('J_backstory');
  await page.locator('.skip-link').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#tree-stage').getAttribute('data-focus'), 'J_backstory');
  await page.locator('.legend-item').first().focus();
  assert.equal(await page.locator('#tooltip').isVisible(), true);
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#tooltip').isVisible(), false);
  const overflow = page.locator('.breadcrumb-overflow');
  await overflow.locator('summary').focus(); await page.keyboard.press('Enter');
  assert.equal(await overflow.getAttribute('open'), '');
  await overflow.locator('button').first().focus(); await page.keyboard.press('Enter'); await settle();
  assert.notEqual(await page.locator('#tree-stage').getAttribute('data-focus'), 'J_backstory');
  await page.goBack(); await focused('J_backstory');
  await page.reload(); await focused('J_backstory');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.tree-node').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s');
  await page.locator('#sources summary').click();
  assert.equal(await page.locator('#source-content').isVisible(), true);
  await geometry('sources expanded');
  const noSlash = await page.goto(base.replace(/\/$/, ''));
  assert.equal(noSlash.status(), 200); assert.equal(new URL(page.url()).pathname.endsWith('/'), true);
  await focused('Root');
  assert.deepEqual(errors, []);
  report.result = 'PASS';
  console.log(`PASS: Chrome ${report.browser}; 37 primitives / 36 composite focuses via UI; ${report.layouts.length} layouts; ${report.screenshots.length} screenshots; keyboard, tooltips, breadcrumbs, history, deep links, themes, reduced motion, resources.`);
} catch (error) {
  report.result = 'FAIL'; report.failure = error.stack; throw error;
} finally {
  await writeFile(path.join(output, 'browser-report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
