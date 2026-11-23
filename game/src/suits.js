// suits.js — the four original suits of EMBERCLASH, each told apart by colour AND shape.
// Flame (red, flame), Tide (blue, wave), Leaf (green, leaf), Stone (amber, mountain).
// Glyphs are inline SVG drawn by this file, so the game needs no image files or network.

export const SUITS = {
  flame: { name: 'Flame', color: '#ff6b35', deep: '#d94f1e' },
  tide: { name: 'Tide', color: '#2ec4e6', deep: '#0e7fa8' },
  leaf: { name: 'Leaf', color: '#7bc96f', deep: '#3f8f3a' },
  stone: { name: 'Stone', color: '#e0a458', deep: '#8a5a2b' },
};

const GLYPHS = {
  flame:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4 C30 14 38 18 38 30 A14 14 0 1 1 10 30 C10 22 16 18 18 10 C20 16 22 17 24 18 C23 12 22 8 24 4 Z" fill="#ff6b35" stroke="#b23a12" stroke-width="2"/><path d="M24 24 C27 28 30 30 30 34 A6 6 0 1 1 18 34 C18 30 21 28 24 24 Z" fill="#ffd166"/></svg>',
  tide:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 20 C12 12 18 12 24 20 C30 28 36 28 42 20 L42 28 C36 36 30 36 24 28 C18 20 12 20 6 28 Z" fill="#2ec4e6" stroke="#0e7fa8" stroke-width="2"/><path d="M6 32 C12 26 18 26 24 32 C30 38 36 38 42 32 L42 38 C36 44 30 44 24 38 C18 32 12 32 6 38 Z" fill="#2ec4e6" opacity="0.65"/></svg>',
  leaf:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M40 6 C18 8 8 20 8 40 C28 40 40 28 40 6 Z" fill="#7bc96f" stroke="#3f8f3a" stroke-width="2"/><path d="M12 36 C18 26 26 18 36 12" fill="none" stroke="#3f8f3a" stroke-width="2.5" stroke-linecap="round"/></svg>',
  stone:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 40 L18 12 L28 28 L34 18 L44 40 Z" fill="#e0a458" stroke="#8a5a2b" stroke-width="2" stroke-linejoin="round"/><path d="M18 12 L22 20 L18 22 L14 20 Z" fill="#fff3d6"/><path d="M4 40 L44 40 L44 44 L4 44 Z" fill="#8a5a2b"/></svg>',
};

export function suitGlyph(suit) {
  return GLYPHS[suit] || '';
}

export function suitLabel(suit) {
  return SUITS[suit] ? SUITS[suit].name : suit;
}
