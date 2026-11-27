import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Resolve from this file so the check works from any working directory.
const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const [original, english, labels] = await Promise.all([
  readJson('./gatsby-elt.original.json'),
  readJson('../data/gatsby-elt.en.json'),
  readJson('../data/labels.en.json'),
]);

// This is the immutable structural baseline recovered in the handoff.
const originalBytes = await readFile(new URL('./gatsby-elt.original.json', import.meta.url));
assert.equal(createHash('sha256').update(originalBytes).digest('hex'),
  'd17869b8e350465dccf0e74e421c416f67bdab94b2ffb5ef03f4301dc17ed943',
  'The recovered original baseline must remain byte-for-byte unchanged');

function inspect(data, description) {
  const nodes = new Map();
  const parents = new Map();
  const ancestors = new Set();
  const operators = { SEQ: 0, GUARD: 0, SYNC: 0 };
  const channels = new Set();
  let primitiveCount = 0;
  let compositeCount = 0;
  function visit(node, parent = null) {
    assert.ok(node && typeof node === 'object', `${description}: invalid node`);
    assert.equal(typeof node.id, 'string', `${description}: node ID must be a string`);
    assert.ok(!ancestors.has(node.id), `${description}: cycle at ${node.id}`);
    assert.ok(!nodes.has(node.id), `${description}: duplicate ID or multiple parents at ${node.id}`);
    nodes.set(node.id, node);
    parents.set(node.id, parent);
    ancestors.add(node.id);
    if (node.kind === 'composite') {
      compositeCount++;
      assert.ok(Object.hasOwn(operators, node.operator), `${node.id}: unsupported operator`);
      operators[node.operator]++;
      assert.ok(Array.isArray(node.children), `${node.id}: missing children`);
      assert.equal(node.children.length, 2, `${node.id}: must be binary`);
      assert.ok(!Object.hasOwn(node, 'channel'), `${node.id}: composite must not create a channel`);
      for (const child of node.children) visit(child, node.id);
    } else {
      assert.equal(node.kind, 'primitive', `${node.id}: invalid kind`);
      primitiveCount++;
      assert.equal(node.children, undefined, `${node.id}: primitive must be a leaf`);
      assert.equal(node.operator, undefined, `${node.id}: primitive must not have an operator`);
      assert.ok(Object.hasOwn(data.channels, node.channel), `${node.id}: unknown channel`);
      channels.add(node.channel);
      assert.ok(typeof node.predicate === 'string' && node.predicate.trim(), `${node.id}: missing predicate`);
      assert.ok(Object.hasOwn(data.sources, node.evidence_source), `${node.id}: unknown evidence source`);
    }
    ancestors.delete(node.id);
  }
  visit(data.root);
  assert.equal(data.root.id, 'Root');
  assert.equal(nodes.size, 73, `${description}: node count`);
  assert.equal(primitiveCount, 37, `${description}: primitive count`);
  assert.equal(compositeCount, 36, `${description}: composite count`);
  assert.deepEqual(operators, { SEQ: 28, GUARD: 5, SYNC: 3 });
  assert.deepEqual([...channels].sort(), ['D', 'G', 'H', 'J', 'M', 'N', 'T', 'W']);
  assert.deepEqual(Object.keys(data.channels).sort(), [...channels].sort());
  for (const [key, url] of Object.entries(data.sources)) {
    assert.equal(new URL(url).protocol, 'https:', `Source ${key}: expected a public HTTPS URL`);
  }
  return { nodes, parents, operators, primitiveCount, compositeCount };
}

const baseline = inspect(original, 'Original');
const translated = inspect(english, 'English');
assert.deepEqual([...translated.nodes.keys()], [...baseline.nodes.keys()], 'IDs and traversal order must match');
assert.deepEqual(translated.parents, baseline.parents, 'Parent relationships must match');
assert.deepEqual(english.sources, original.sources, 'Evidence URLs must not change');

const structuralFields = ['id', 'kind', 'operator', 'channel', 'evidence_source'];
for (const [id, node] of translated.nodes) {
  const originalNode = baseline.nodes.get(id);
  for (const field of structuralFields) {
    assert.deepEqual(node[field], originalNode[field], `${id}: ${field} changed`);
  }
  assert.deepEqual(node.children?.map(child => child.id), originalNode.children?.map(child => child.id),
    `${id}: child ordering changed`);
  assert.ok(typeof labels.labels[id] === 'string' && labels.labels[id].trim(), `${id}: missing short title`);
  if (node.kind === 'primitive') {
    assert.equal(node.predicate, labels.predicates[id], `${id}: predicate differs from supplied translation`);
  }
}
assert.deepEqual(Object.keys(labels.labels).sort(), [...translated.nodes.keys()].sort(), 'Labels must cover exactly 73 nodes');
assert.deepEqual(Object.keys(labels.predicates).sort(),
  [...translated.nodes.values()].filter(node => node.kind === 'primitive').map(node => node.id).sort(),
  'Predicates must cover exactly 37 primitives');
assert.deepEqual(labels.channels, english.channels, 'Character names must agree');

function verifyEnglish(value, path) {
  if (typeof value === 'string') {
    assert.ok(!/\p{Script=Han}/u.test(value), `${path}: untranslated Chinese text`);
    assert.ok(!/(?:sandbox:|file:\/\/|\/workspace\/)/i.test(value), `${path}: temporary or local-only URL`);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) verifyEnglish(child, `${path}.${key}`);
  }
}
verifyEnglish(english, 'data');
verifyEnglish(labels, 'labels');

// Preserve the interpretive boundaries that matter to this migration.
assert.deepEqual(translated.nodes.get('Root').children.map(node => node.id), ['Connection', 'Collapse']);
assert.deepEqual(translated.nodes.get('FatalReturn').children.map(node => node.id), ['M_collision', 'D_driving']);
assert.equal(translated.nodes.get('FatalReturn').operator, 'GUARD');
assert.match(translated.nodes.get('J_backstory').predicate, /1917.*content of this telling/);
assert.match(translated.nodes.get('W_misidentifies').predicate, /mistaken belief/);
assert.equal(english.channels.H, 'Henry Gatz');
assert.match(english.validation.actual_story_time_compactness, /not verified/);
assert.equal(english.validation.confidence_scores, 'not assigned');

console.log('PASS: 73 unique nodes; 37 primitives; 36 binary composites; SEQ 28 / GUARD 5 / SYNC 3; 8 channels.');
console.log('PASS: unchanged IDs, kinds, operators, channels, evidence, parents, ordered children and source URLs; no cycles or shared nodes.');
console.log('PASS: English labels and predicates cover every node; interpretation constraints and original baseline preserved.');
