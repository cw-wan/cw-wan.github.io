const $ = (selector) => document.querySelector(selector);
const stage = $('#tree-stage');
const nodeLayer = $('#tree-nodes');
const edgeLayer = $('#tree-edges');
const status = $('#tree-status');
const castOrder = ['G', 'D', 'N', 'T', 'J', 'M', 'W', 'H'];
const descriptions = {
  SEQ: 'Sequence: the first child precedes the second child.',
  SYNC: 'Temporal alignment: two character projections of the same occurrence, not independent evidence.',
  GUARD: 'Interval containment: child 0 is the inner event; child 1 is the containing outer interval.'
};
const element = (tag, className, text) => {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
};
const read = async (path) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
  return response.json();
};

try {
  const [data, labels, assets] = await Promise.all([
    read('./data/gatsby-elt.en.json'), read('./data/labels.en.json'), read('./assets/manifest.json')
  ]);
  const byId = new Map();
  const parents = new Map();
  const counts = new Map();
  const channels = new Map();
  function index(node, parent) {
    byId.set(node.id, node);
    if (parent) parents.set(node.id, parent.id);
    const children = node.children || [];
    children.forEach(child => index(child, node));
    counts.set(node.id, node.kind === 'primitive' ? 1 : children.reduce((sum, child) => sum + counts.get(child.id), 0));
    channels.set(node.id, node.kind === 'primitive' ? [node.channel] : castOrder.filter(channel => children.some(child => channels.get(child.id).includes(channel))));
  }
  index(data.root);
  let focus = 'Root';
  let visible = [];
  let positions = new Map();
  let desktop = stage.clientWidth >= 620;
  let frame;

  function portrait(channel, size = '') {
    const item = element('span', `portrait ${size}`);
    item.dataset.channel = channel;
    item.setAttribute('role', 'img');
    item.setAttribute('aria-label', channel === 'H' ? labels.ui.henry_note : data.channels[channel]);
    if (channel === 'H') item.textContent = 'H';
    else item.style.backgroundImage = `url("${assets.portraits[channel].local}")`;
    return item;
  }
  for (const channel of castOrder) {
    const member = element('div', 'cast-member');
    member.append(portrait(channel), element('span', 'cast-name', data.channels[channel]));
    $('#cast').append(member);
  }
  function go(id) {
    if (!byId.has(id) || id === focus) return;
    history.pushState(null, '', `#${encodeURIComponent(id)}`);
    render(id, true);
  }
  function breadcrumbButton(id) {
    const button = element('button', 'btn btn-ghost', id === 'Root' ? labels.ui.overview : labels.labels[id]);
    button.type = 'button';
    button.dataset.focus = id;
    button.addEventListener('click', () => go(id));
    return button;
  }
  function breadcrumbs() {
    const path = [focus];
    while (parents.has(path[0])) path.unshift(parents.get(path[0]));
    const list = element('ol', 'breadcrumb-list');
    const append = (id) => {
      const li = element('li');
      if (id === focus) {
        const current = element('span', 'breadcrumb-current', id === 'Root' ? labels.ui.overview : labels.labels[id]);
        current.setAttribute('aria-current', 'page');
        li.append(current);
      } else li.append(breadcrumbButton(id));
      list.append(li);
    };
    if (path.length > 4) {
      append(path[0]);
      const li = element('li');
      const overflow = element('details', 'breadcrumb-overflow');
      const summary = element('summary', 'btn btn-ghost', '…');
      summary.setAttribute('aria-label', 'Show earlier ancestors');
      overflow.append(summary);
      const earlier = element('ul');
      path.slice(1, -3).forEach(id => {
        const row = element('li'); row.append(breadcrumbButton(id)); earlier.append(row);
      });
      overflow.append(earlier); li.append(overflow); list.append(li);
      path.slice(-3).forEach(append);
    } else path.forEach(append);
    $('#breadcrumbs').replaceChildren(list);
  }
  function projection(node, depth = 0) {
    const expand = node.kind === 'composite' && (focus === 'Root' && desktop
      ? ['Root', 'Connection', 'Collapse', 'Consequences'].includes(node.id)
      : depth < (desktop ? 2 : 1));
    const branch = { node, depth, children: expand ? node.children.map(child => projection(child, depth + 1)) : [] };
    branch.weight = branch.children.length ? branch.children.reduce((sum, child) => sum + child.weight, 0) : 1;
    return branch;
  }
  function nodeElement(branch) {
    const node = branch.node;
    const isFocus = node.id === focus;
    const primitive = node.kind === 'primitive';
    const card = element('article', `tree-node${isFocus ? ' is-focus' : ''}${primitive ? ' is-primitive' : ''}${branch.children.length ? '' : ' is-terminal'}`);
    card.dataset.nodeId = node.id;
    card.dataset.kind = node.kind;
    if (node.operator) card.dataset.operator = node.operator;
    card.setAttribute('aria-labelledby', `title-${node.id}`);
    const scene = assets.scene_for_nodes[node.id];
    if (scene) {
      const img = element('img', 'scene');
      img.src = assets.scenes[scene].local;
      img.alt = assets.scenes[scene].alt;
      img.width = assets.scenes[scene].width;
      img.height = assets.scenes[scene].height;
      img.addEventListener('load', scheduleLayout);
      card.append(img);
    }
    const body = element('div', 'node-body');
    const meta = element('div', 'node-meta');
    if (primitive) {
      body.append(portrait(node.channel, isFocus ? 'focused' : 'node-portrait'));
      meta.append(element('span', 'text-small text-muted', data.channels[node.channel]));
    } else {
      const operator = element('button', 'operator', node.operator);
      operator.type = 'button'; operator.dataset.tooltip = descriptions[node.operator];
      operator.setAttribute('aria-label', `${node.operator}: ${labels.ui[`${node.operator.toLowerCase()}_legend`]}`);
      meta.append(operator, element('span', 'text-small text-muted', `${counts.get(node.id)} primitives`));
    }
    body.append(meta);
    const title = element('h2', 'node-title', labels.labels[node.id]);
    title.id = `title-${node.id}`;
    if (isFocus) title.tabIndex = -1;
    body.append(title);
    if (primitive && isFocus) {
      body.append(element('p', 'predicate', node.predicate), element('code', 'node-id', node.id));
      const source = element('a', 'story-source', labels.ui.source);
      source.href = data.sources[node.evidence_source];
      body.append(source);
    } else if (!primitive) {
      const people = element('div', 'participants');
      people.setAttribute('aria-label', 'Character channels in this subtree');
      channels.get(node.id).forEach(channel => people.append(portrait(channel, 'mini')));
      body.append(people);
    }
    if (!isFocus) {
      const action = element('button', 'btn btn-ghost node-action', primitive ? labels.ui.view_primitive : `${labels.ui.expand} · ${counts.get(node.id)}`);
      action.type = 'button'; action.dataset.focus = node.id;
      action.setAttribute('aria-label', `${action.textContent}: ${labels.labels[node.id]}`);
      action.addEventListener('click', () => go(node.id)); body.append(action);
    }
    card.append(body);
    branch.element = card;
    visible.push(branch);
    nodeLayer.append(card);
    branch.children.forEach(nodeElement);
  }
  function scheduleLayout() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(layout);
  }
  function layout() {
    if (!visible.length) return;
    const width = stage.clientWidth;
    const nextDesktop = width >= 620;
    if (nextDesktop !== desktop) { desktop = nextDesktop; render(focus); return; }
    const root = visible[0];
    const nextPositions = new Map();
    const edges = [];
    function size(branch, left, span) {
      const max = branch.depth === 0 ? 310 : branch.children.length ? 210 : 180;
      branch.element.style.width = `${Math.min(max, span - (branch.depth ? 12 : 0))}px`;
      branch.x = left + span / 2;
      let offset = left;
      branch.children.forEach(child => {
        const part = span * child.weight / branch.weight;
        size(child, offset, part); offset += part;
      });
    }
    size(root, 0, width);
    let height = 0;
    function place(branch, y) {
      const box = branch.element.getBoundingClientRect();
      branch.y = y; branch.height = box.height;
      const pos = { x: branch.x - box.width / 2, y };
      nextPositions.set(branch.node.id, pos);
      branch.element.style.transform = `translate(${pos.x}px, ${y}px)`;
      height = Math.max(height, y + box.height);
      branch.children.forEach((child, index) => {
        place(child, y + box.height + 44);
        edges.push({ parent: branch, child, index });
      });
    }
    place(root, 0);
    stage.style.height = `${Math.ceil(height)}px`;
    edgeLayer.setAttribute('viewBox', `0 0 ${width} ${Math.ceil(height)}`);
    edgeLayer.setAttribute('width', width); edgeLayer.setAttribute('height', Math.ceil(height));
    edgeLayer.replaceChildren();
    nodeLayer.querySelectorAll('.edge-label').forEach(item => item.remove());
    for (const { parent, child, index } of edges) {
      const start = parent.y + parent.height;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.dataset.parent = parent.node.id; path.dataset.child = child.node.id;
      path.setAttribute('d', `M ${parent.x} ${start} C ${parent.x} ${start + 22}, ${child.x} ${child.y - 22}, ${child.x} ${child.y}`);
      edgeLayer.append(path);
      const names = parent.node.operator === 'SEQ' ? ['First', 'Then'] : parent.node.operator === 'GUARD' ? ['Inner', 'Outer'] : ['Aligned', 'Aligned'];
      const label = element('span', 'edge-label', names[index]);
      label.dataset.parent = parent.node.id; label.dataset.child = child.node.id;
      label.style.left = `${child.x}px`; label.style.top = `${child.y - 18}px`;
      nodeLayer.append(label);
    }
    positions = nextPositions;
    stage.dataset.focus = focus;
    stage.dataset.visibleNodes = visible.length;
  }
  const observer = new ResizeObserver(scheduleLayout);
  observer.observe(stage);
  function render(id, moveFocus = false) {
    focus = byId.has(id) ? id : 'Root';
    hideTooltip();
    visible.forEach(branch => observer.unobserve(branch.element));
    nodeLayer.replaceChildren(); visible = [];
    breadcrumbs();
    nodeElement(projection(byId.get(focus)));
    visible.forEach(branch => {
      const old = positions.get(branch.node.id);
      if (old) {
        branch.element.style.transform = `translate(${old.x}px, ${old.y}px)`;
        branch.element.getBoundingClientRect();
        branch.element.dataset.positioned = '';
      }
    });
    layout();
    requestAnimationFrame(() => visible.forEach(branch => { branch.element.dataset.positioned = ''; }));
    visible.forEach(branch => observer.observe(branch.element));
    status.textContent = `${focus === 'Root' ? 'Story overview' : labels.labels[focus]}. ${byId.get(focus).kind === 'primitive' ? 'Primitive detail.' : `${counts.get(focus)} primitives in this subtree. ${visible.length} nodes shown.`}`;
    if (moveFocus) {
      const heading = document.getElementById(`title-${focus}`);
      heading.focus({ preventScroll: true });
      $('#breadcrumbs').scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  const sources = $('#source-content');
  sources.append(element('p', '', labels.ui.illustration_note));
  sources.append(element('p', '', 'This candidate tree describes events in the novel. SYNC represents participant views of a shared event. No calendar intervals or confidence scores are assigned; actual story-time Temporal Compactness remains unverified.'));
  function sourceList(title, entries) {
    const heading = element('h3', '', title); const list = element('ul');
    entries.forEach(([name, url]) => { const row = element('li'); const link = element('a', '', name); link.href = url; row.append(link); list.append(row); });
    sources.append(heading, list);
  }
  sourceList('Story and method', [['Plot outline', data.sources.wiki_plot], ['The Great Gatsby — novel', data.sources.novel_ch9], ['Event Logic Tree paper', data.sources.elt_paper]]);
  sourceList('Character portraits', castOrder.filter(channel => channel !== 'H').map(channel => [data.channels[channel], assets.portraits[channel].source_page]));
  sourceList('Film stills', Object.values(assets.scenes).map(scene => [scene.alt, scene.source_page]));
  sources.append(element('p', 'text-muted', 'The photographs belong to their respective rights holders. This visualization is an educational illustration; the images are not evidence for the event predicates.'));

  const tooltip = $('#tooltip');
  let tooltipTarget;
  function hideTooltip() {
    if (tooltipTarget) tooltipTarget.removeAttribute('aria-describedby');
    tooltipTarget = undefined;
    const tip = $('#tooltip'); if (tip) tip.hidden = true;
  }
  function showTooltip(target) {
    hideTooltip(); tooltipTarget = target;
    tooltip.textContent = target.dataset.tooltip; tooltip.hidden = false;
    target.setAttribute('aria-describedby', 'tooltip');
    const rect = target.getBoundingClientRect();
    const box = tooltip.getBoundingClientRect();
    tooltip.style.left = `${Math.max(8, Math.min(window.innerWidth - box.width - 8, rect.left + rect.width / 2 - box.width / 2))}px`;
    tooltip.style.top = `${Math.max(8, rect.top > box.height + 12 ? rect.top - box.height - 8 : rect.bottom + 8)}px`;
  }
  document.addEventListener('pointerover', event => { const target = event.target.closest('[data-tooltip]'); if (target) showTooltip(target); });
  document.addEventListener('pointerout', event => { if (event.target.closest('[data-tooltip]') && !event.target.closest('[data-tooltip]').contains(event.relatedTarget)) hideTooltip(); });
  document.addEventListener('focusin', event => { const target = event.target.closest('[data-tooltip]'); if (target) showTooltip(target); });
  document.addEventListener('focusout', event => { if (event.target.closest('[data-tooltip]')) hideTooltip(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTooltip(); });
  window.addEventListener('scroll', hideTooltip, { passive: true });
  window.addEventListener('resize', hideTooltip);
  const locationFocus = () => {
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { id = 'Root'; }
    render(id || 'Root');
  };
  $('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    $('#breadcrumbs').focus();
    $('#breadcrumbs').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  window.addEventListener('popstate', locationFocus);
  window.addEventListener('hashchange', locationFocus);
  locationFocus();
  document.fonts.ready.then(scheduleLayout);
} catch (error) {
  const message = $('#tree-error');
  message.hidden = false;
  message.textContent = 'The event tree could not be loaded. Please reload the page and try again.';
  status.textContent = message.textContent;
  console.error(error);
}
