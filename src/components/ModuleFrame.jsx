import { useEffect, useMemo, useRef, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import { useUiSounds } from '../hooks/useUiSounds.js';
import { useSwipeNav } from '../hooks/useSwipeNav.js';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import { getParentModel } from '../lib/audioStore.js';
import { speakHanzi } from '../lib/ttsFallback.js';

// Builds the initial study queue from the deck in order. A ref (not state)
// holds the per-session "pas sur" marks so marking a card doesn't itself
// trigger a re-render before the queue-advance logic runs.
function idsOf(words) {
  return words.map((word) => word?.id).filter(Boolean);
}

export default function ModuleFrame({
  profile,
  lessonTitle,
  modeLabel = '',
  lessonId = '',
  lessons = [],
  words = [],
  card,
  selectedId = '',
  singleLabel = '',
  compoundLabel = '',
  beforeHanzi = null,
  hanziContent = null,
  hanziHint = null,
  onBack,
  onGoHome,
  onOpenLessonText,
  onSelectLesson,
  onSwitchModule,
  modes = ['flashcards', 'audio', 'writing'],
  onOpenPicker,
  onOpenAvatarEditor,
  shellHeader = false,
  children,
}) {
  const sounds = useUiSounds();
  const audioRef = useRef(null);
  const [audioSrc, setAudioSrc] = useState('');
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const autoPlayRef = useRef(false);
  const isFirstCardRef = useRef(true);
  const availableLessons = lessons.length ? lessons : [{ id: lessonId || 'current', title: lessonTitle || 'Lecon', cards: [] }];

  // Falls back to the single `card` prop as a one-item deck, so the two
  // still-dead screens that haven't been migrated to `words` (Flashcard/
  // AudioStandaloneUI) keep working rather than rendering an empty frame.
  const deck = words.length ? words : card ? [card] : [];

  // The study queue: which card is "up next" this pass, and which ones got
  // marked "pas sur" and need a second pass once this one is done. Reset
  // whenever the deck itself changes identity (new lesson/theme/word
  // picked), not on every render.
  const [queue, setQueue] = useState(() => idsOf(deck));
  const [position, setPosition] = useState(() => {
    const startIndex = selectedId ? idsOf(deck).indexOf(selectedId) : -1;
    return startIndex === -1 ? 0 : startIndex;
  });
  const [reviewIds, setReviewIds] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const deckKey = deck.map((word) => word?.id).join('|');
  const lastDeckKeyRef = useRef(deckKey);

  useEffect(() => {
    if (lastDeckKeyRef.current === deckKey) return;
    lastDeckKeyRef.current = deckKey;
    setQueue(idsOf(deck));
    setPosition(0);
    setReviewIds([]);
    setIsComplete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckKey]);

  // The deck-change reset above only fires when the deck's own contents
  // change (a new lesson/theme, or tapping a vocab word for its own
  // sub-selection). Picking a specific word from the 🗂️ picker - same
  // deck, different starting point - comes back through `selectedId`
  // instead, so it needs its own jump rather than waiting on deckKey.
  const lastSelectedIdRef = useRef(selectedId);
  useEffect(() => {
    if (!selectedId || selectedId === lastSelectedIdRef.current) return;
    lastSelectedIdRef.current = selectedId;
    const fullIds = idsOf(deck);
    const targetIndex = fullIds.indexOf(selectedId);
    if (targetIndex === -1) return;
    setQueue(fullIds);
    setPosition(targetIndex);
    setReviewIds([]);
    setIsComplete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const wordById = useMemo(() => new Map(deck.map((word) => [word?.id, word])), [deck]);
  const currentId = queue[position];
  const currentWord = wordById.get(currentId) || null;

  // These slots depend on whichever word is actually showing right now -
  // which lives in this component's own queue state, not in whatever the
  // caller's `word` prop pointed at when the deck was first handed over -
  // so callers pass functions, called here with the live currentWord,
  // rather than pre-rendered nodes that would go stale after the first
  // advance.
  const resolvedBeforeHanzi = typeof beforeHanzi === 'function' ? beforeHanzi(currentWord) : null;
  const resolvedHanziContent = typeof hanziContent === 'function' ? hanziContent(currentWord) : null;
  const resolvedHanziHint = typeof hanziHint === 'function' ? hanziHint(currentWord) : null;
  const isCompoundWord = Array.from(currentWord?.hanzi || '').length > 1;
  const resolvedTypeLabel = isCompoundWord ? (compoundLabel || singleLabel) : singleLabel;

  const advance = (markedUnsure) => {
    const updatedReview = markedUnsure && !reviewIds.includes(currentId)
      ? [...reviewIds, currentId]
      : reviewIds;
    const nextPosition = position + 1;
    if (nextPosition < queue.length) {
      setReviewIds(updatedReview);
      setPosition(nextPosition);
      return;
    }
    // End of this pass - if anything got marked "pas sur", go again with
    // just those; otherwise the whole deck came back clean, done.
    if (updatedReview.length) {
      setQueue(updatedReview);
      setPosition(0);
      setReviewIds([]);
    } else {
      setIsComplete(true);
    }
  };

  const markKnown = () => {
    sounds.playSuccess();
    advance(false);
  };

  const markUnsure = () => {
    sounds.playTap();
    advance(true);
  };

  // A swipe past the card either direction counts as "knows it" - there's
  // no "previous" concept left once Prec/Suiv are gone (see markKnown).
  const swipeHandlers = useSwipeNav(markKnown, markKnown);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  const playCardAudio = () => {
    sounds.playTap();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => speakHanzi(currentWord?.hanzi));
      return;
    }
    speakHanzi(currentWord?.hanzi);
  };

  const toggleAutoPlay = () => {
    setAutoPlay((prev) => {
      const next = !prev;
      if (next) {
        // Turning it on plays the card we're already looking at, then every
        // future card we land on auto-plays too.
        playCardAudio();
      } else {
        sounds.playTap();
      }
      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;
    let objectUrl = '';
    // Skip auto-play on this component's very first resolution (arriving on
    // the screen shouldn't itself count as "landing on a card" - only
    // actually advancing after autoPlay is already on should).
    const isFirstCard = isFirstCardRef.current;
    isFirstCardRef.current = false;

    const resolveAudio = async () => {
      let resolvedSrc = '';
      let recordingBlob = null;

      if (lessonId && currentWord?.id) {
        const cardKey = `${lessonId}:${currentWord.id}`;
        try {
          const parentModel = await getParentModel(cardKey);
          if (parentModel?.blob) {
            recordingBlob = parentModel.blob;
            objectUrl = URL.createObjectURL(recordingBlob);
            resolvedSrc = objectUrl;
          }
        } catch {
          // fallthrough to card audio
        }
      }
      if (!recordingBlob) {
        resolvedSrc = currentWord?.audioUrl?.startsWith('indexeddb://') ? '' : currentWord?.audioUrl || '';
      }

      if (!isMounted) return;
      setAudioSrc(resolvedSrc);

      if (autoPlayRef.current && !isFirstCard) {
        if (recordingBlob) {
          const preview = new Audio(objectUrl);
          preview.play().catch(() => speakHanzi(currentWord?.hanzi));
        } else {
          speakHanzi(currentWord?.hanzi);
        }
      }
    };

    resolveAudio();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [lessonId, currentWord?.id, currentWord?.audioUrl]);

  return (
    <section className="writing-screen module-screen" aria-label="Module harmonise" {...(isComplete ? {} : swipeHandlers)}>
      {shellHeader ? null : (
      <div className="writing-top-banner">
        <button
          type="button"
          className="writing-logo ui-pressable"
          onClick={() => {
            sounds.playTap();
            if (onGoHome) {
              onGoHome();
            } else {
              onBack?.();
            }
          }}
          aria-label="Retour a l'accueil"
        >
          文
        </button>

        <div className="writing-title-block">
          {modeLabel ? <span className="writing-mode-label">{modeLabel}</span> : null}
          <strong className="writing-title-text">{lessonTitle || 'Lecon'}</strong>
        </div>

        <button
          type="button"
          className="writing-folder-btn ui-pressable"
          onClick={() => {
            sounds.playTap();
            if (onOpenPicker) {
              onOpenPicker();
            } else {
              setShowLessonPicker((prev) => !prev);
            }
          }}
          aria-label="Changer de theme"
        >
          🗂️
        </button>

        <button
          type="button"
          className="writing-avatar-btn ui-pressable"
          onClick={() => {
            sounds.playTap();
            onOpenAvatarEditor?.();
          }}
          aria-label="Modifier l'avatar"
        >
          <AvatarRenderer config={profile?.avatar} size={44} alt="Avatar profil" loading="eager" />
        </button>

        {onOpenLessonText ? (
          <button
            type="button"
            className="writing-read-lesson-btn ui-pressable"
            onClick={() => {
              sounds.playTap();
              onOpenLessonText(lessonId);
            }}
          >
            Lire la lecon
          </button>
        ) : null}
      </div>
      )}

      {showLessonPicker ? (
        <div className="writing-lesson-picker">
          {availableLessons.map((lesson) => (
            <button
              key={lesson.id}
              type="button"
              className={`writing-lesson-picker-item ui-pressable ${lesson.id === lessonId ? 'active' : ''}`}
              onClick={() => {
                sounds.playTap();
                setShowLessonPicker(false);
                onSelectLesson?.(lesson.id);
              }}
            >
              <strong>{lesson.title || 'Lecon'}</strong>
              <span>{lesson.cards?.length || 0} cartes</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="module-top-row">
        {resolvedTypeLabel ? <div className="module-card-type-badge">{resolvedTypeLabel}</div> : <span />}
        <div className="writing-sound-controls">
          <button
            type="button"
            className={`writing-sound-btn ui-pressable ${autoPlay ? 'active' : ''}`}
            onClick={toggleAutoPlay}
            disabled={!audioSrc && !currentWord?.hanzi}
            aria-pressed={autoPlay}
          >
            Son
            <span className="writing-sound-btn-tick" aria-hidden="true">{autoPlay ? '🔈' : '🔇'}</span>
          </button>
          <button
            type="button"
            className="writing-sound-repeat-btn ui-pressable"
            onClick={playCardAudio}
            disabled={!audioSrc && !currentWord?.hanzi}
            aria-label="Rejouer le son"
          >
            🔊
          </button>
          {shellHeader && (onOpenPicker || availableLessons.length > 1) ? (
            <button
              type="button"
              className="writing-folder-btn ui-pressable"
              onClick={() => {
                sounds.playTap();
                if (onOpenPicker) {
                  onOpenPicker();
                } else {
                  setShowLessonPicker((prev) => !prev);
                }
              }}
              aria-label="Changer de theme"
            >
              🗂️
            </button>
          ) : null}
        </div>
        {audioSrc ? <audio ref={audioRef} src={audioSrc} preload="auto" /> : null}
      </div>

      {isComplete ? (
        <div className="module-complete-screen wm-enter-fade">
          <div className="module-complete-emoji" aria-hidden="true">🎉</div>
          <h2>Bravo !</h2>
          <p>Tu connais tous les mots de cette fiche.</p>
          <div className="module-complete-actions">
            {modes.includes('writing') ? (
              <button
                type="button"
                className="button"
                onClick={() => {
                  sounds.playTap();
                  onSwitchModule?.('writing');
                }}
              >
                Écriture
              </button>
            ) : null}
            {modes.includes('quiz') ? (
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  sounds.playTap();
                  onSwitchModule?.('quiz');
                }}
              >
                Évaluation
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="module-card-center wm-enter-fade">
            {resolvedBeforeHanzi}
            <div className="module-pinyin-large">{formatPinyinDisplay(currentWord?.pinyin || '')}</div>
            <div className="module-hanzi-large">{resolvedHanziContent || currentWord?.hanzi}</div>
            {resolvedHanziHint}

            <div className="module-translation-flags">
              <div className="module-translation-row">
                <span className="module-translation-flag" aria-hidden="true">🇫🇷</span>
                <span className="module-translation-box">{currentWord?.french || 'Traduction a venir'}</span>
              </div>
              <div className="module-translation-row">
                <span className="module-translation-flag" aria-hidden="true">🇬🇧</span>
                <span className="module-translation-box">{currentWord?.english || ''}</span>
              </div>
            </div>
          </div>

          {children ? <div className="module-content-area">{children}</div> : null}

          <div className="module-study-actions">
            <button type="button" className="module-study-btn module-study-btn-known ui-pressable" onClick={markKnown}>
              Je connais
            </button>
            <button type="button" className="module-study-btn module-study-btn-unsure ui-pressable" onClick={markUnsure}>
              Pas sûr
            </button>
          </div>
        </>
      )}
    </section>
  );
}
