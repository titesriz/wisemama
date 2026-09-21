import { useRef } from 'react';

const SWIPE_THRESHOLD_PX = 50;
const MAX_VERTICAL_DRIFT_PX = 60;

// Shared swipe-left/right = next/prev gesture, for the card-style screens
// (flashcards, audio, writing, HSK). `excludeSelector` lets a screen opt a
// region out (e.g. the hanzi-writer drawing canvas, which already owns touch
// events for stroke tracing - a horizontal stroke there must never also be
// read as a page swipe).
export function useSwipeNav(onPrev, onNext, { excludeSelector } = {}) {
  const startRef = useRef(null);

  const onTouchStart = (event) => {
    if (excludeSelector && event.target?.closest?.(excludeSelector)) {
      startRef.current = null;
      return;
    }
    const touch = event.touches[0];
    if (!touch) return;
    startRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dy) > MAX_VERTICAL_DRIFT_PX) return;

    if (dx <= -SWIPE_THRESHOLD_PX) onNext?.();
    else if (dx >= SWIPE_THRESHOLD_PX) onPrev?.();
  };

  const onTouchCancel = () => {
    startRef.current = null;
  };

  return { onTouchStart, onTouchEnd, onTouchCancel };
}
