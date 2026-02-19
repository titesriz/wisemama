import { useCallback, useRef } from 'react';

function playTone(context, { frequency, durationMs, type = 'sine', gain = 0.045, startAt = 0 }) {
  const now = context.currentTime + startAt;
  const osc = context.createOscillator();
  const amp = context.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);

  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

  osc.connect(amp);
  amp.connect(context.destination);

  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}

export function useUiSounds({ enabled = true } = {}) {
  const audioContextRef = useRef(null);

  const getContext = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AC();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    return ctx;
  }, [enabled]);

  const playTap = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, { frequency: 520, durationMs: 65, type: 'triangle', gain: 0.03 });
  }, [getContext]);

  const playSuccess = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, { frequency: 523.25, durationMs: 120, type: 'sine', gain: 0.04 });
    playTone(ctx, { frequency: 659.25, durationMs: 130, type: 'sine', gain: 0.04, startAt: 0.09 });
    playTone(ctx, { frequency: 783.99, durationMs: 150, type: 'sine', gain: 0.035, startAt: 0.18 });
  }, [getContext]);

  const playError = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, { frequency: 220, durationMs: 110, type: 'square', gain: 0.03 });
    playTone(ctx, { frequency: 185, durationMs: 120, type: 'square', gain: 0.025, startAt: 0.1 });
  }, [getContext]);

  return {
    playTap,
    playSuccess,
    playError,
  };
}
