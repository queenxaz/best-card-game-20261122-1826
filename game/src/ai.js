// ai.js — Rook, Warden of the Last Lantern, plays by a simple readable heuristic:
// finish the duel when he can, heal when hurt, sweep a crowded table, and otherwise
// summon his strongest guardians. He never sees your hand.

import { isGuardian, isSpell } from './cards.js';
import { canPlayCard, playCard } from './game.js';

// Score a card in Rook's hand. Higher is better; below 0 means "do not play now".
function scoreCard(state, card) {
  const me = state.foe;
  const you = state.you;
  if (isGuardian(card)) {
    let score = card.attack * 2 + card.health;
    if (card.suit === 'flame' && you.life <= 10) score += 3;
    if (card.suit === 'tide' && me.life <= 18) score += 3;
    if (card.suit === 'leaf' && me.hand.length <= 3) score += 2;
    if (card.suit === 'stone' && me.life <= 14) score += 3;
    if (me.field.length >= 4) score -= 2; // save room for later
    return score;
  }
  if (isSpell(card)) {
    if (card.effect === 'damage') {
      if (you.life - you.shield <= card.value) return 100; // lethal
      if (you.life <= 10) return 12;
      return 4;
    }
    if (card.effect === 'heal') {
      if (me.life <= 14) return 11;
      if (me.life <= 22) return 3;
      return -1;
    }
    if (card.effect === 'sweep') {
      if (you.field.length >= 3) return 12;
      if (you.field.length === 2) return 6;
      return -1;
    }
    if (card.effect === 'shield') {
      if (me.life <= 12) return 10;
      if (you.field.length >= 3) return 4;
      return -1;
    }
    if (card.effect === 'draw') {
      if (me.hand.length <= 2) return 8;
      return 2;
    }
  }
  return 0;
}

// Play Rook's cards one at a time. `onPlay` is called after each card with its events
// so the UI can show it; it returns a promise the AI awaits between plays.
export async function aiPlayCards(state, onPlay) {
  for (;;) {
    if (state.winner) return;
    let bestIndex = -1;
    let bestScore = 0;
    state.foe.hand.forEach((card, i) => {
      if (!canPlayCard(state, 'foe', i).ok) return;
      const score = scoreCard(state, card) - card.cost;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    });
    if (bestIndex < 0) return;
    const result = playCard(state, 'foe', bestIndex);
    if (!result.ok) return;
    await onPlay(result.events);
  }
}
