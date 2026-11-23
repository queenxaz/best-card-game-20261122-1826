// audio.js — all sound is synthesised live with WebAudio. No audio files, no network.
// A tiny synth: clicks, thuds, chimes and two short jingles (win / loss).

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
}

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, duration, type, volume, when = 0, slideTo = null) {
  if (muted) return;
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function playClick() {
  tone(620, 0.07, 'triangle', 0.12);
}

export function playCard() {
  tone(320, 0.12, 'triangle', 0.16, 0, 520);
  tone(880, 0.1, 'sine', 0.1, 0.05);
}

export function playAttack() {
  tone(160, 0.18, 'sawtooth', 0.16, 0, 70);
}

export function playDamage() {
  tone(220, 0.16, 'square', 0.1, 0, 110);
}

export function playHeal() {
  tone(660, 0.14, 'sine', 0.12);
  tone(990, 0.2, 'sine', 0.1, 0.09);
}

export function playDraw() {
  tone(520, 0.06, 'triangle', 0.08, 0, 760);
}

export function playTurn() {
  tone(440, 0.1, 'triangle', 0.1);
  tone(660, 0.12, 'triangle', 0.1, 0.08);
}

export function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.16, i * 0.13));
  tone(1319, 0.5, 'sine', 0.12, 0.52);
}

export function playLoss() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.16));
}
