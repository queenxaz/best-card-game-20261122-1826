// main.js — bootstrap, input and the turn loop of EMBERCLASH.
// ?demo=title | play | win | loss renders a fixed scene for screenshots;
// every demo scene is the game's own code rendering its own state.

import { createGame, playCard, combatPhase, startTurn, checkWinner } from './game.js';
import { aiPlayCards } from './ai.js';
import { renderAll, logEvents, flashCard, showScreen, showEndScreen } from './render.js';
import { findCard, STARTING_LIFE } from './cards.js';
import * as audio from './audio.js';

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

// Deterministic random for demo scenes.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let state = null;
let busy = false;
const ui = { selectedUid: null, onCardClick };

function newGame(random) {
  state = createGame(random);
  ui.selectedUid = null;
  $('combat-log').textContent = 'The duel begins. Your move, Keeper.';
  renderAll(state, ui);
}

function finishDuel() {
  renderAll(state, ui);
  if (state.winner === 'you') audio.playWin();
  else audio.playLoss();
  window.setTimeout(() => showEndScreen(state), 900);
}

function onCardClick(index) {
  if (busy || !state || state.phase !== 'player') return;
  const card = state.you.hand[index];
  if (!card) return;
  if (state.you.mana < card.cost) {
    audio.playClick();
    $('combat-log').innerHTML = `Not enough mana for <b>${card.name}</b> — it costs ${card.cost}.`;
    return;
  }
  const result = playCard(state, 'you', index);
  if (!result.ok) {
    $('combat-log').textContent = result.reason;
    return;
  }
  ui.selectedUid = null;
  audio.playCard();
  logEvents(state, result.events);
  renderAll(state, ui);
  const summon = result.events.find((e) => e.kind === 'summon');
  if (summon) flashCard(summon.uid, 'just-played', 500);
  if (state.winner) finishDuel();
}

// Animate one combat phase attack by attack so the table reads like a fight.
async function animateCombat(attackerKey) {
  const events = combatPhase(state, attackerKey);
  let i = 0;
  while (i < events.length) {
    const event = events[i];
    i += 1;
    if (event.kind === 'attack') {
      renderAll(state, ui);
      flashCard(event.uid, 'attacking', 420);
      audio.playAttack();
      await sleep(430);
    } else if (event.kind === 'hit') {
      flashCard(event.uid, 'taking-hit', 380);
      audio.playDamage();
      await sleep(200);
    } else if (event.kind === 'death') {
      renderAll(state, ui);
      flashCard(event.uid, 'dying', 480);
      await sleep(300);
    } else if (event.kind === 'log') {
      logEvents(state, [event]);
      renderAll(state, ui);
    } else if (event.kind === 'damage') {
      renderAll(state, ui);
    }
    if (state.winner) break;
  }
  renderAll(state, ui);
  return events;
}

async function endTurn() {
  if (busy || !state || state.phase !== 'player') return;
  busy = true;
  ui.selectedUid = null;
  audio.playTurn();
  $('combat-log').textContent = 'Your guardians strike!';
  state.phase = 'enemy';
  renderAll(state, ui);
  await sleep(500);

  await animateCombat('you');
  if (state.winner) {
    busy = false;
    finishDuel();
    return;
  }

  // Rook's turn: mana, draw, play, then his guardians strike.
  startTurn(state, 'foe');
  renderAll(state, ui);
  $('combat-log').textContent = 'Rook plays his cards…';
  await sleep(600);
  await aiPlayCards(state, async (events) => {
    logEvents(state, events);
    renderAll(state, ui);
    const summon = events.find((e) => e.kind === 'summon');
    if (summon) flashCard(summon.uid, 'just-played', 500);
    audio.playCard();
    await sleep(650);
  });
  if (state.winner) {
    busy = false;
    finishDuel();
    return;
  }
  $('combat-log').textContent = 'Rook’s guardians strike!';
  await sleep(400);
  await animateCombat('foe');
  if (state.winner) {
    busy = false;
    finishDuel();
    return;
  }

  state.round += 1;
  state.stats.turns += 1;
  startTurn(state, 'you');
  state.phase = 'player';
  audio.playTurn();
  $('combat-log').textContent = `Round ${state.round} — your move, Keeper.`;
  renderAll(state, ui);
  busy = false;
}

function bindButtons() {
  $('play-button').addEventListener('click', () => {
    audio.playClick();
    newGame();
    showScreen('table');
  });
  $('how-button').addEventListener('click', () => {
    const panel = $('how-panel');
    panel.hidden = !panel.hidden;
    audio.playClick();
  });
  $('end-turn-button').addEventListener('click', endTurn);
  $('restart-button').addEventListener('click', () => {
    audio.playClick();
    newGame();
  });
  $('play-again-button').addEventListener('click', () => {
    audio.playClick();
    newGame();
    showScreen('table');
  });
  $('title-button').addEventListener('click', () => {
    audio.playClick();
    showScreen('title');
  });
  $('mute-button').addEventListener('click', () => {
    audio.setMuted(!audio.isMuted());
    $('mute-button').textContent = audio.isMuted() ? '🔇 Muted' : '🔊 Sound on';
  });
}

function bindKeyboard() {
  document.addEventListener('keydown', (event) => {
    if (!state || $('table-screen').hidden) return;
    if (event.key >= '1' && event.key <= '7') {
      onCardClick(Number(event.key) - 1);
    } else if (event.key === 'Enter') {
      endTurn();
    } else if (event.key === 'Escape') {
      ui.selectedUid = null;
      renderAll(state, ui);
    } else if (event.key === 'm' || event.key === 'M') {
      $('mute-button').click();
    }
  });
}

// ---------- demo scenes (for screenshots): the game's own code, fixed states ----------

function demoCard(id, hp) {
  const card = findCard(id);
  const instance = { ...card, uid: `${card.id}-demo-${Math.random().toString(36).slice(2, 7)}` };
  if (hp !== undefined) {
    instance.hp = hp;
    instance.maxHp = card.health;
  }
  return instance;
}

function demoMidGame() {
  newGame(mulberry32(20261122));
  // A lively round-4 table: both sides have guardians, hands are full, mana is spent.
  state.round = 4;
  state.you.life = 26;
  state.foe.life = 21;
  state.you.shield = 3;
  state.you.mana = 5;
  state.you.manaMax = 6;
  state.foe.mana = 4;
  state.foe.manaMax = 6;
  state.you.field = [
    demoCard('flame-drake', 4),
    demoCard('coral-knight', 3),
    demoCard('ancient-oak', 6),
  ];
  state.foe.field = [demoCard('cinder-wolf', 2), demoCard('mountain-troll', 4)];
  state.you.hand = [
    demoCard('ember-burst'),
    demoCard('cinder-wolf'),
    demoCard('tide-sprite'),
    demoCard('stonewall'),
    demoCard('granite-colossus'),
  ];
  state.foe.hand = [demoCard('ember-imp'), demoCard('thorn-sprout'), demoCard('pebble-golem')];
  state.log = [
    'Rook summons <b>Mountain Troll</b> (4⚔ / 5♥).',
    'Your <b>Flame Drake</b> burns Rook for 1.',
    'Round 4 — your move, Keeper.',
  ];
  $('combat-log').innerHTML = state.log[state.log.length - 1];
  renderAll(state, ui);
  showScreen('table');
}

function demoEnd(won) {
  newGame(mulberry32(7));
  state.round = won ? 8 : 7;
  state.stats = {
    turns: won ? 8 : 7,
    damageDealt: won ? 34 : 21,
    damageTaken: won ? 12 : 30,
    cardsPlayed: won ? 19 : 15,
    guardiansSummoned: won ? 11 : 9,
  };
  state.you.life = won ? 14 : 0;
  state.foe.life = won ? 0 : 9;
  state.winner = won ? 'you' : 'foe';
  state.phase = 'over';
  showEndScreen(state);
}

function boot() {
  bindButtons();
  bindKeyboard();
  const demo = new URLSearchParams(window.location.search).get('demo');
  if (demo === 'play') demoMidGame();
  else if (demo === 'win') demoEnd(true);
  else if (demo === 'loss') demoEnd(false);
  else {
    newGame();
    showScreen('title');
  }
  // Exposed for play-testing in the browser console.
  window.__emberclash = { get state() { return state; }, newGame, endTurn };
}

boot();
