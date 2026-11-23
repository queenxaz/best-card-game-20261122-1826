// game.js — the rules of EMBERCLASH: turns, mana, playing cards, combat, winning.
// Pure state logic; rendering and pacing live in render.js / main.js.

import { findCard, isGuardian, isSpell, STARTING_LIFE, STARTING_HAND, MAX_HAND, MAX_MANA } from './cards.js';
import { drawCards, newDeck } from './deck.js';

export const MAX_FIELD = 5;

// Suit summon gifts: what a guardian does the moment it joins the table.
const SUIT_GIFT_VALUE = { flame: 1, tide: 2, leaf: 1, stone: 2 };

function newKeeper(random) {
  return {
    life: STARTING_LIFE,
    shield: 0,
    mana: 0,
    manaMax: 0,
    deck: newDeck(random),
    hand: [],
    field: [],
    discard: [],
  };
}

export function createGame(random = Math.random) {
  const state = {
    round: 1,
    phase: 'player', // 'player' | 'enemy' | 'over'
    winner: null,
    you: newKeeper(random),
    foe: newKeeper(random),
    log: [],
    stats: { turns: 0, damageDealt: 0, damageTaken: 0, cardsPlayed: 0, guardiansSummoned: 0 },
    random,
  };
  drawCards(state.you.deck, state.you.discard, state.you.hand, STARTING_HAND, MAX_HAND, random);
  drawCards(state.foe.deck, state.foe.discard, state.foe.hand, STARTING_HAND, MAX_HAND, random);
  state.you.manaMax = 1;
  state.you.mana = 1;
  state.foe.manaMax = 0;
  state.foe.mana = 0;
  return state;
}

export function otherKey(key) {
  return key === 'you' ? 'foe' : 'you';
}

export function keeperName(key) {
  return key === 'you' ? 'You' : 'Rook';
}

// Damage first eats shield, then life. Returns the life damage actually dealt.
export function damageKeeper(state, key, amount) {
  const keeper = state[key];
  let remaining = amount;
  if (keeper.shield > 0) {
    const absorbed = Math.min(keeper.shield, remaining);
    keeper.shield -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) {
    keeper.life = Math.max(0, keeper.life - remaining);
    if (key === 'foe') state.stats.damageDealt += remaining;
    if (key === 'you') state.stats.damageTaken += remaining;
  }
  return remaining;
}

export function healKeeper(state, key, amount) {
  const keeper = state[key];
  const healed = Math.min(amount, STARTING_LIFE - keeper.life);
  keeper.life += healed;
  return healed;
}

export function checkWinner(state) {
  if (state.foe.life <= 0) state.winner = 'you';
  else if (state.you.life <= 0) state.winner = 'foe';
  if (state.winner) state.phase = 'over';
  return state.winner;
}

// Apply a guardian's suit gift on summon. Returns event objects.
function applySuitGift(state, who, card) {
  const events = [];
  const value = SUIT_GIFT_VALUE[card.suit];
  const foe = otherKey(who);
  if (card.suit === 'flame') {
    const dealt = damageKeeper(state, foe, value);
    events.push({ kind: 'log', text: `${keeperName(who)}’s ${card.name} burns ${keeperName(foe)} for ${dealt}.` });
    events.push({ kind: 'damage', who: foe, amount: dealt });
  } else if (card.suit === 'tide') {
    const healed = healKeeper(state, who, value);
    events.push({ kind: 'log', text: `${keeperName(who)}’s ${card.name} restores ${healed} Ember.` });
    events.push({ kind: 'heal', who, amount: healed });
  } else if (card.suit === 'leaf') {
    const drawn = drawCards(state[who].deck, state[who].discard, state[who].hand, value, MAX_HAND, state.random);
    events.push({ kind: 'log', text: `${keeperName(who)}’s ${card.name} draws ${drawn.length} card${drawn.length === 1 ? '' : 's'}.` });
    events.push({ kind: 'draw', who, count: drawn.length });
  } else if (card.suit === 'stone') {
    state[who].shield += value;
    events.push({ kind: 'log', text: `${keeperName(who)}’s ${card.name} raises a shield of ${value}.` });
    events.push({ kind: 'shield', who, amount: value });
  }
  return events;
}

// Resolve a spell at once. Returns event objects.
function resolveSpell(state, who, card) {
  const events = [];
  const foe = otherKey(who);
  if (card.effect === 'damage') {
    const dealt = damageKeeper(state, foe, card.value);
    events.push({ kind: 'log', text: `<b>${card.name}</b> blasts ${keeperName(foe)} for ${dealt} damage!` });
    events.push({ kind: 'damage', who: foe, amount: dealt });
  } else if (card.effect === 'heal') {
    const healed = healKeeper(state, who, card.value);
    events.push({ kind: 'log', text: `<b>${card.name}</b> restores ${healed} Ember.` });
    events.push({ kind: 'heal', who, amount: healed });
  } else if (card.effect === 'sweep') {
    const targets = state[foe].field.slice();
    for (const target of targets) {
      target.hp -= card.value;
      events.push({ kind: 'hit', who: foe, uid: target.uid, amount: card.value });
      if (target.hp <= 0) killGuardian(state, foe, target, events);
    }
    events.push({ kind: 'log', text: `<b>${card.name}</b> rains thorns on every enemy guardian.` });
  } else if (card.effect === 'shield') {
    state[who].shield += card.value;
    events.push({ kind: 'log', text: `<b>${card.name}</b> raises a shield of ${card.value}.` });
    events.push({ kind: 'shield', who, amount: card.value });
  } else if (card.effect === 'draw') {
    const drawn = drawCards(state[who].deck, state[who].discard, state[who].hand, card.value, MAX_HAND, state.random);
    events.push({ kind: 'log', text: `<b>${card.name}</b> draws ${drawn.length} cards.` });
    events.push({ kind: 'draw', who, count: drawn.length });
  }
  return events;
}

function killGuardian(state, key, guardian, events) {
  const field = state[key].field;
  const idx = field.indexOf(guardian);
  if (idx >= 0) field.splice(idx, 1);
  state[key].discard.push(guardian.id);
  events.push({ kind: 'death', who: key, uid: guardian.uid });
  events.push({ kind: 'log', text: `${guardian.name} falls.` });
}

export function canPlayCard(state, who, handIndex) {
  if (state.phase === 'over') return { ok: false, reason: 'The duel is over.' };
  if (who === 'you' && state.phase !== 'player') return { ok: false, reason: 'Wait for your turn.' };
  const keeper = state[who];
  const card = keeper.hand[handIndex];
  if (!card) return { ok: false, reason: 'No card there.' };
  if (keeper.mana < card.cost) return { ok: false, reason: `Needs ${card.cost} mana.` };
  if (isGuardian(card) && keeper.field.length >= MAX_FIELD) {
    return { ok: false, reason: 'Your side of the table is full.' };
  }
  return { ok: true, card };
}

// Play the card at handIndex for `who`. Returns { ok, events }.
export function playCard(state, who, handIndex) {
  const check = canPlayCard(state, who, handIndex);
  if (!check.ok) return { ok: false, reason: check.reason, events: [] };
  const keeper = state[who];
  const card = keeper.hand.splice(handIndex, 1)[0];
  keeper.mana -= card.cost;
  state.stats.cardsPlayed += 1;
  const events = [];
  if (isGuardian(card)) {
    const guardian = { ...card, hp: card.health, maxHp: card.health };
    keeper.field.push(guardian);
    state.stats.guardiansSummoned += 1;
    events.push({ kind: 'summon', who, uid: guardian.uid, card });
    events.push({ kind: 'log', text: `${keeperName(who)} summons <b>${card.name}</b> (${card.attack}⚔ / ${card.health}♥).` });
    events.push(...applySuitGift(state, who, card));
  } else if (isSpell(card)) {
    keeper.discard.push(card.id);
    events.push({ kind: 'spell', who, card });
    events.push(...resolveSpell(state, who, card));
  }
  checkWinner(state);
  return { ok: true, events };
}

// One combat phase: every guardian of `attackerKey` strikes.
// Each strikes the guardian across from it; with no guardian across, it hits the keeper.
// Destroying a guardian spills the excess damage onto the keeper behind it.
export function combatPhase(state, attackerKey) {
  const defenderKey = otherKey(attackerKey);
  const events = [];
  const attackers = state[attackerKey].field.slice();
  for (const attacker of attackers) {
    if (state.winner) break;
    // The attacker may have died earlier in this phase; skip if gone.
    if (!state[attackerKey].field.includes(attacker)) continue;
    const defenders = state[defenderKey].field;
    const targetIndex = state[attackerKey].field.indexOf(attacker);
    const across = defenders[targetIndex] || null;
    events.push({ kind: 'attack', who: attackerKey, uid: attacker.uid, targetUid: across ? across.uid : null });
    if (across) {
      across.hp -= attacker.attack;
      events.push({ kind: 'hit', who: defenderKey, uid: across.uid, amount: attacker.attack });
      events.push({
        kind: 'log',
        text: `${attacker.name} strikes ${across.name} for ${attacker.attack}.`,
      });
      if (across.hp <= 0) {
        const spill = -across.hp;
        killGuardian(state, defenderKey, across, events);
        if (spill > 0) {
          const dealt = damageKeeper(state, defenderKey, spill);
          events.push({ kind: 'damage', who: defenderKey, amount: dealt });
          events.push({ kind: 'log', text: `${spill} damage spills through to ${keeperName(defenderKey)}!` });
        }
      }
    } else {
      const dealt = damageKeeper(state, defenderKey, attacker.attack);
      events.push({ kind: 'damage', who: defenderKey, amount: dealt });
      events.push({
        kind: 'log',
        text: `${attacker.name} hits ${keeperName(defenderKey)} directly for ${dealt}!`,
      });
    }
    checkWinner(state);
  }
  return events;
}

// Start a keeper's turn: +1 mana crystal (to a max of 10), draw a card.
export function startTurn(state, key) {
  const keeper = state[key];
  keeper.manaMax = Math.min(MAX_MANA, keeper.manaMax + 1);
  keeper.mana = keeper.manaMax;
  const drawn = drawCards(keeper.deck, keeper.discard, keeper.hand, 1, MAX_HAND, state.random);
  return drawn;
}

export function findCardById(id) {
  return findCard(id);
}
