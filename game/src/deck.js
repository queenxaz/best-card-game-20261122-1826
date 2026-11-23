// deck.js — shuffling, drawing and reshuffling a keeper's deck.

import { buildDeckList, findCard } from './cards.js';

export function shuffleDeck(ids, random) {
  const deck = ids.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function newDeck(random) {
  return shuffleDeck(buildDeckList(), random);
}

// Draw n cards from a deck into a hand, reshuffling the discard pile when empty.
// Returns the drawn card objects. Mutates deck, discard and hand arrays.
export function drawCards(deck, discard, hand, n, maxHand, random) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (hand.length >= maxHand) break;
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck.push(...shuffleDeck(discard.splice(0), random));
    }
    const id = deck.pop();
    const card = findCard(id);
    if (!card) continue;
    hand.push({ ...card, uid: `${card.id}-${Math.random().toString(36).slice(2, 8)}` });
    drawn.push(card);
  }
  return drawn;
}
