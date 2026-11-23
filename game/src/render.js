// render.js — turns game state into DOM: the table, the hands, the cards.
// Cards are plain DOM so they stay crisp and readable even at thumbnail size.

import { isGuardian, SUIT_GIFTS } from './cards.js';
import { suitGlyph, suitLabel } from './suits.js';

const $ = (id) => document.getElementById(id);

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

// Build one card's DOM. `opts`: { playable, selected, onClick, inHand }.
export function cardElement(card, opts = {}) {
  const node = el('article', `card suit-${card.suit}`);
  node.dataset.uid = card.uid;
  node.dataset.cardId = card.id;

  const cost = el('span', 'cost', String(card.cost));
  node.appendChild(cost);

  const name = el('div', 'card-name', card.name);
  node.appendChild(name);

  const art = el('div', 'card-art');
  art.innerHTML = suitGlyph(card.suit);
  node.appendChild(art);

  const text = el('div', 'card-text');
  if (isGuardian(card)) {
    text.textContent = `${suitLabel(card.suit)} · ${SUIT_GIFTS[card.suit].text}`;
  } else {
    text.textContent = card.text;
  }
  node.appendChild(text);

  if (isGuardian(card)) {
    const stats = el('div', 'card-stats');
    const atk = el('span', 'atk', String(card.attack));
    atk.title = 'Attack';
    const hp = el('span', 'hp', String(card.hp ?? card.health));
    hp.title = 'Health';
    stats.appendChild(atk);
    stats.appendChild(hp);
    node.appendChild(stats);
  } else {
    node.appendChild(el('div', 'spell-tag', '✦ SPELL ✦'));
  }

  if (opts.playable) node.classList.add('playable');
  if (opts.selected) node.classList.add('selected');
  if (opts.unaffordable) node.classList.add('unaffordable');
  if (opts.onClick) node.addEventListener('click', () => opts.onClick(card));
  return node;
}

function renderHandBacks(container, count) {
  container.replaceChildren();
  for (let i = 0; i < count; i++) {
    const back = el('div', 'card-back');
    back.appendChild(el('span', null, '🔥'));
    container.appendChild(back);
  }
}

function renderField(container, field, emptyText) {
  container.replaceChildren();
  if (field.length === 0) {
    container.appendChild(el('div', 'field-empty', emptyText));
    return;
  }
  for (const guardian of field) container.appendChild(cardElement(guardian));
}

function renderLife(state) {
  const setLife = (key, id) => {
    const node = $(id);
    node.textContent = String(state[key].life);
    node.classList.toggle('low', state[key].life <= 10);
  };
  setLife('you', 'you-life');
  setLife('foe', 'opponent-life');

  const setShield = (key, wrapId, numId) => {
    const keeper = state[key];
    $(wrapId).hidden = keeper.shield <= 0;
    $(numId).textContent = String(keeper.shield);
  };
  setShield('you', 'you-shield', 'you-shield-num');
  setShield('foe', 'opponent-shield', 'opponent-shield-num');

  $('you-mana').textContent = String(state.you.mana);
  $('you-mana-max').textContent = String(state.you.manaMax);
  $('opponent-mana').textContent = String(state.foe.mana);
  $('you-deck').textContent = String(state.you.deck.length);
  $('opponent-deck').textContent = String(state.foe.deck.length);
  $('round-num').textContent = String(state.round);
}

// Full re-render of the table from state. `selectedUid` marks the chosen hand card.
export function renderAll(state, ui) {
  renderLife(state);
  renderHandBacks($('opponent-hand'), state.foe.hand.length);
  renderField($('opponent-field'), state.foe.field, 'Rook has no guardians — the way is open.');
  renderField($('you-field'), state.you.field, 'Your side is empty — summon a guardian!');
  const hand = $('you-hand');
  hand.replaceChildren();
  state.you.hand.forEach((card, index) => {
    const affordable = state.phase === 'player' && state.you.mana >= card.cost;
    const node = cardElement(card, {
      playable: affordable,
      unaffordable: state.phase === 'player' && !affordable,
      selected: ui.selectedUid === card.uid,
      onClick: () => ui.onCardClick(index),
    });
    hand.appendChild(node);
  });

  const banner = $('turn-banner');
  if (state.phase === 'player') {
    banner.textContent = 'Your turn';
    banner.classList.remove('enemy');
  } else if (state.phase === 'enemy') {
    banner.textContent = 'Rook’s turn…';
    banner.classList.add('enemy');
  } else {
    banner.textContent = state.winner === 'you' ? 'Victory!' : 'Defeat';
    banner.classList.toggle('enemy', state.winner !== 'you');
  }
  $('end-turn-button').disabled = state.phase !== 'player';
}

// Append event log lines to the combat log strip (keeps the latest line visible).
export function logEvents(state, events) {
  const log = $('combat-log');
  for (const event of events) {
    if (event.kind !== 'log') continue;
    state.log.push(event.text);
    if (state.log.length > 40) state.log.shift();
  }
  log.innerHTML = state.log.length ? state.log[state.log.length - 1] : '';
}

// Flash a card element by uid with a CSS animation class, then remove it.
export function flashCard(uid, cls, ms = 450) {
  if (!uid) return;
  const node = document.querySelector(`[data-uid="${uid}"]`);
  if (!node) return;
  node.classList.add(cls);
  window.setTimeout(() => node.classList.remove(cls), ms);
}

export function showScreen(name) {
  for (const id of ['title-screen', 'table-screen', 'end-screen']) {
    $(id).hidden = id !== `${name}-screen`;
  }
}

export function showEndScreen(state) {
  const screen = $('end-screen');
  const won = state.winner === 'you';
  screen.classList.toggle('loss', !won);
  $('end-title').textContent = won ? 'VICTORY' : 'DEFEAT';
  $('end-flavor').textContent = won
    ? 'The last lantern is yours. Rook bows, his ember spent — the table is quiet, and the light is warm again.'
    : 'Your ember fades to a coal. Rook tends the last lantern alone… until the next duel.';
  const stats = $('end-stats');
  stats.replaceChildren();
  const entries = [
    [String(state.round), 'ROUNDS'],
    [String(state.stats.damageDealt), 'DAMAGE DEALT'],
    [String(state.stats.cardsPlayed), 'CARDS PLAYED'],
    [String(state.stats.guardiansSummoned), 'GUARDIANS SUMMONED'],
  ];
  for (const [value, label] of entries) {
    const stat = el('div', 'stat');
    stat.appendChild(el('b', null, value));
    stat.appendChild(el('span', null, label));
    stats.appendChild(stat);
  }
  showScreen('end');
}
