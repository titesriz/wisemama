import { useEffect, useRef, useState } from 'react';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import '../styles/character-gloss.css';

const TAP_REVEAL_MS = 2500;

// Shared "character -> definition" popover, used by both the HSK deck (tap to
// reveal a component character's meaning inside a multi-character word) and
// the lesson text view (tap/hover to reveal a character's meaning while
// reading, layered on top of the existing tap-to-toggle-pinyin interaction).
// `entry` is a plain { pinyin, french, english } lookup already resolved by
// the caller - this component doesn't know about lessons or HSK data itself.
//
// Not every character has its own entry (e.g. 边 has no standalone HSK1 word,
// only compounds like 北边 do) - those render dimmed and inert rather than
// silently doing nothing, so it's clear at a glance which characters have a
// definition to show.
export default function CharacterGlossChar({ char, entry, trigger = 'click', className = '' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Closes this popover the moment anything outside it is pressed - including
  // another character's gloss span. Without this, each instance only ever
  // closed itself (via its own outside-click check or, in hover mode, its own
  // timeout), so tapping a second character left the first one's popover
  // open until its timer separately ran out.
  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (trigger !== 'hover' || !open) return undefined;
    const timeout = window.setTimeout(() => setOpen(false), TAP_REVEAL_MS);
    return () => window.clearTimeout(timeout);
  }, [trigger, open]);

  if (!entry) {
    return <span className={`char-gloss-inert ${className}`}>{char}</span>;
  }

  const popover = (
    <span className="char-gloss-popover" role="tooltip">
      <strong>{formatPinyinDisplay(entry.pinyin || '')}</strong>
      <span>{entry.french || entry.english || 'Traduction non disponible'}</span>
    </span>
  );

  if (trigger === 'hover') {
    return (
      <span
        ref={rootRef}
        className={`char-gloss char-gloss-hover ${open ? 'char-gloss-tapped' : ''} ${className}`}
        tabIndex={0}
        // Deliberately no stopPropagation: a tap here should still bubble up
        // to whatever the caller's own onClick does (e.g. toggling pinyin in
        // the lesson text view) - this just also briefly reveals the gloss.
        onClick={() => setOpen(true)}
      >
        {char}
        {popover}
      </span>
    );
  }

  return (
    <span
      ref={rootRef}
      className={`char-gloss ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        setOpen((prev) => !prev);
      }}
    >
      {char}
      {open ? popover : null}
    </span>
  );
}
