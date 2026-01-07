import { storage } from './storage';

let context: AudioContext | null = null;

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const C = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    try {
      context = new C();
    } catch (e) {
      return null;
    }
  }
  return context;
}

function playTone(frequency: number, duration = 0.08, type: OscillatorType = 'sine') {
  try {
    const enabled = storage.getData().settings.soundEnabled;
    if (!enabled) return;

    const ctx = ensureContext();
    if (!ctx) return;

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = frequency;

    o.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.stop(now + duration + 0.02);
  } catch (e) {
    // Audio may not be available in test env; silently ignore
  }
}

export function playClick() {
  playTone(560, 0.05, 'square');
}

export function playSuccess() {
  playTone(880, 0.12, 'sine');
}

export function playFail() {
  playTone(220, 0.18, 'sawtooth');
}
