// cards.js — every card in EMBERCLASH. Original names, art and rules.
// Guardians stay on the table and fight. Spells resolve at once and are gone.
// Each suit has a summon gift: Flame burns the enemy, Tide heals you,
// Leaf draws you a card, Stone raises a shield that soaks damage.

export const CARD_TYPES = { GUARDIAN: 'guardian', SPELL: 'spell' };

// Summon gifts, keyed by suit. value = strength of the gift.
export const SUIT_GIFTS = {
  flame: { text: 'Burn 1', describe: (n) => `deals ${n} damage to the enemy keeper` },
  tide: { text: 'Heal 2', describe: (n) => `heals you for ${n}` },
  leaf: { text: 'Draw 1', describe: (n) => `draws you ${n} card` },
  stone: { text: 'Shield 2', describe: (n) => `raises a shield of ${n}` },
};

// Guardian catalogue: id, name, suit, cost, attack, health, flavour text.
export const GUARDIANS = [
  { id: 'ember-imp', name: 'Ember Imp', suit: 'flame', cost: 1, attack: 2, health: 1, text: 'A spark with teeth.' },
  { id: 'cinder-wolf', name: 'Cinder Wolf', suit: 'flame', cost: 2, attack: 3, health: 2, text: 'It hunts by the glow of its own fur.' },
  { id: 'flame-drake', name: 'Flame Drake', suit: 'flame', cost: 4, attack: 5, health: 4, text: 'The lantern’s firstborn flame.' },
  { id: 'tide-sprite', name: 'Tide Sprite', suit: 'tide', cost: 1, attack: 1, health: 2, text: 'A giggle riding a wave.' },
  { id: 'coral-knight', name: 'Coral Knight', suit: 'tide', cost: 3, attack: 3, health: 4, text: 'Armour grown, never forged.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', suit: 'tide', cost: 5, attack: 6, health: 6, text: 'The tide itself, given teeth.' },
  { id: 'thorn-sprout', name: 'Thorn Sprout', suit: 'leaf', cost: 1, attack: 1, health: 3, text: 'Small. Sharp. Everywhere.' },
  { id: 'grove-stag', name: 'Grove Stag', suit: 'leaf', cost: 2, attack: 2, health: 3, text: 'Its antlers bloom in spring.' },
  { id: 'ancient-oak', name: 'Ancient Oak', suit: 'leaf', cost: 4, attack: 4, health: 6, text: 'Older than the lantern. Patient.' },
  { id: 'pebble-golem', name: 'Pebble Golem', suit: 'stone', cost: 2, attack: 2, health: 4, text: 'It was a mountain once. It remembers.' },
  { id: 'mountain-troll', name: 'Mountain Troll', suit: 'stone', cost: 3, attack: 4, health: 5, text: 'It charges rent to the wind.' },
  { id: 'granite-colossus', name: 'Granite Colossus', suit: 'stone', cost: 5, attack: 7, health: 7, text: 'When it walks, the table shakes.' },
];

// Spell catalogue: id, name, suit, cost, effect key, effect value, text.
export const SPELLS = [
  { id: 'ember-burst', name: 'Ember Burst', suit: 'flame', cost: 2, effect: 'damage', value: 4, text: 'Deal 4 damage to the enemy keeper.' },
  { id: 'healing-rain', name: 'Healing Rain', suit: 'tide', cost: 2, effect: 'heal', value: 7, text: 'Restore 7 of your Ember.' },
  { id: 'thorn-volley', name: 'Thorn Volley', suit: 'leaf', cost: 3, effect: 'sweep', value: 2, text: 'Deal 2 damage to every enemy guardian.' },
  { id: 'stonewall', name: 'Stonewall', suit: 'stone', cost: 1, effect: 'shield', value: 6, text: 'Raise a shield of 6.' },
  { id: 'lanterns-gift', name: 'Lantern’s Gift', suit: 'flame', cost: 1, effect: 'draw', value: 2, text: 'Draw 2 cards.' },
];

export const ALL_CARDS = [
  ...GUARDIANS.map((c) => ({ ...c, type: CARD_TYPES.GUARDIAN })),
  ...SPELLS.map((c) => ({ ...c, type: CARD_TYPES.SPELL })),
];

export function findCard(id) {
  return ALL_CARDS.find((c) => c.id === id);
}

export function isGuardian(card) {
  return card.type === CARD_TYPES.GUARDIAN;
}

export function isSpell(card) {
  return card.type === CARD_TYPES.SPELL;
}

// The 30-card deck every keeper brings: two of each guardian, plus a spell kit.
export function buildDeckList() {
  const list = [];
  for (const g of GUARDIANS) list.push(g.id, g.id);
  list.push('ember-burst', 'ember-burst', 'healing-rain', 'thorn-volley', 'stonewall', 'lanterns-gift');
  return list; // 24 guardians + 6 spells = 30
}

export const STARTING_LIFE = 30;
export const STARTING_HAND = 3;
export const MAX_HAND = 7;
export const MAX_MANA = 10;
