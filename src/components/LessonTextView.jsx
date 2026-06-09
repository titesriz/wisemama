import { useEffect, useMemo, useRef, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import '../styles/radical-discovery.css';
import { formatPinyinDisplay, extractToneAccent } from '../lib/pinyinDisplay.js';
import { segmentLessonText } from '../lib/lessonTextSegmentation.js';
import { getAllSeenCharsBefore, getLessonsByOrder } from '../utils/lessons/lessonOrder.js';

function isChineseChar(char) {
  return /[\u3400-\u9fff]/.test(char);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function playAudioUrl(url) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
    };
    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      resolve();
    };
    audio.play().catch(() => {
      cleanup();
      resolve();
    });
  });
}

function speakText(text) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    synth.speak(utterance);
  });
}

function getCardProgressStars(lessonId, cardId, progressMap) {
  const key = `${lessonId}:${cardId}`;
  return Number(progressMap?.[key] || 0);
}

function getCharacterStatus(lessonId, card, progressMap, seenCharsBeforeSet = new Set()) {
  const stars = getCardProgressStars(lessonId, card.id, progressMap);
  if (stars >= 2) return 'learned';
  if (stars >= 1) return 'learning';
  const hasSeenBefore = Array.from(String(card?.hanzi || '')).some((char) => seenCharsBeforeSet.has(char));
  if (hasSeenBefore) return 'learning';
  return 'new';
}

export default function LessonTextView({
  lesson,
  lessons = [],
  profile,
  parentProfile,
  progressMap = {},
  writingDifficulty = 1,
  onChangeWritingDifficulty,
  onSelectLesson,
  onPracticeCharacter,
  onBack,
  onStartPractice,
  onOpenRadicalDiscovery,
}) {
  const [pinyinMode, setPinyinMode] = useState('all');
  const [manuallyToggledIds, setManuallyToggledIds] = useState(() => new Set());
  const [playingSentenceIndex, setPlayingSentenceIndex] = useState(-1);
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState(() => new Set((lesson?.cards || []).map((card) => card.id)));
  const lessonPickerRef = useRef(null);
  const availableLessons = useMemo(() => {
    if (lessons.length) return getLessonsByOrder(lessons);
    return lesson ? [lesson] : [];
  }, [lesson, lessons]);
  const seenCharsBeforeSet = useMemo(
    () => new Set(getAllSeenCharsBefore(lesson?.id, lessons)),
    [lesson?.id, lessons],
  );

  useEffect(() => {
    if (pinyinMode === 'all' || pinyinMode === 'tone') {
      setManuallyToggledIds(new Set());
    }
  }, [pinyinMode]);

  useEffect(() => {
    setSelectedCardIds(new Set((lesson?.cards || []).map((card) => card.id)));
  }, [lesson?.id, lesson?.cards]);

  useEffect(() => {
    if (!showLessonPicker) return undefined;

    const handlePointerDown = (event) => {
      if (!lessonPickerRef.current?.contains(event.target)) {
        setShowLessonPicker(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [showLessonPicker]);

  const cardByHanzi = useMemo(() => {
    const map = new Map();
    (lesson?.cards || []).forEach((card, index) => {
      if (!card?.hanzi) return;
      map.set(card.hanzi, { card, index });
      Array.from(card.hanzi).forEach((char) => {
        if (!map.has(char)) map.set(char, { card, index });
      });
    });
    return map;
  }, [lesson?.cards]);

  const sentences = useMemo(() => {
    const fallback = (lesson?.cards || []).map((card) => card.hanzi).join('。');
    const baseText = lesson?.sourceText || fallback;
    return segmentLessonText(baseText);
  }, [lesson?.cards, lesson?.sourceText]);

  const vocabulary = useMemo(() => {
    return (lesson?.cards || []).filter((card) => card?.hanzi).map((card, index) => ({
      id: card.id,
      index,
      hanzi: card.hanzi,
      pinyin: card.pinyin || '',
      french: card.french || '',
      english: card.english || '',
      status: getCharacterStatus(lesson.id, card, progressMap, seenCharsBeforeSet),
      stars: getCardProgressStars(lesson.id, card.id, progressMap),
    }));
  }, [lesson?.cards, lesson?.id, progressMap, seenCharsBeforeSet]);

  const selectedVocabulary = useMemo(
    () => vocabulary.filter((item) => selectedCardIds.has(item.id)),
    [selectedCardIds, vocabulary],
  );

  const journeyStartIndex = useMemo(() => {
    const firstNew = selectedVocabulary.find((item) => item.status !== 'learned');
    return firstNew ? firstNew.index : 0;
  }, [selectedVocabulary]);

  const journeyStartCard = lesson?.cards?.[journeyStartIndex] || null;
  const allSelected = vocabulary.length > 0 && selectedCardIds.size === vocabulary.length;

  const toggleVocabularySelection = (cardId) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const setAllVocabularySelection = (shouldSelect) => {
    setSelectedCardIds(shouldSelect ? new Set(vocabulary.map((item) => item.id)) : new Set());
  };

  const playSentence = async (sentence, sentenceIndex) => {
    if (!sentence || playingSentenceIndex >= 0) return;
    setPlayingSentenceIndex(sentenceIndex);
    const chars = Array.from(sentence).filter((char) => isChineseChar(char));

    for (const char of chars) {
      const entry = cardByHanzi.get(char);
      const card = entry?.card;
      if (card?.audioUrl) {
        await playAudioUrl(card.audioUrl);
      } else {
        await speakText(char);
      }
      await wait(120);
    }

    setPlayingSentenceIndex(-1);
  };

  const toggleCharPinyin = (cardId) => {
    setManuallyToggledIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const shouldShowPinyin = (card, status) => {
    if (!card || card.pinyinEnabled === false) return false;
    if (manuallyToggledIds.has(card.id)) return true;
    if (pinyinMode === 'all') return true;
    return false;
  };

  return (
    <section className="lesson-text-page">
      <div className="landing-new-shell lesson-text-shell">
        <article ref={lessonPickerRef} className="profile-card-kid lesson-text-frame">
          <div className="current-lesson-card lesson-text-current-card">
            <div className="lesson-header lesson-header-with-avatar lesson-text-topbar">
              <button type="button" className="lesson-home-logo app-logo ui-pressable" onClick={onBack} aria-label="Retour landing">
                文
              </button>
              <div className="lesson-avatar lesson-avatar-single" aria-label="Profil enfant">
                <AvatarRenderer
                  config={profile?.avatar}
                  size={56}
                  className="landing-avatar-circle"
                  alt={`Avatar ${profile?.name || 'Enfant'}`}
                  loading="eager"
                />
              </div>
              <div className="lesson-avatar lesson-avatar-single lesson-parent-avatar" aria-label="Profil parent">
                <AvatarRenderer
                  config={parentProfile?.avatar}
                  size={56}
                  className="landing-avatar-circle"
                  alt={`Avatar ${parentProfile?.name || 'Parent'}`}
                  loading="eager"
                />
              </div>
              <div className="lesson-info lesson-text-title-block">
                <h3 className="lesson-title lesson-text-card-title">{lesson?.title || 'Lecon'}</h3>
                {lesson?.description ? <p className="lesson-description lesson-text-card-description">{lesson.description}</p> : null}
              </div>
              <div className="lesson-actions lesson-text-topbar-actions">
                <button
                  type="button"
                  className="change-lesson-btn icon-only ui-pressable"
                  onClick={() => setShowLessonPicker((prev) => !prev)}
                  aria-label="Changer de lecon"
                >
                  🗂️
                </button>
              </div>
            </div>
          </div>

          {showLessonPicker ? (
            <div
              className="lesson-picker-dropdown"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {availableLessons.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`lesson-option ui-pressable ${item.id === lesson?.id ? 'active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowLessonPicker(false);
                    onSelectLesson?.(item.id);
                  }}
                >
                  <div className="option-preview">
                    {item.coverImage ? <img src={item.coverImage} alt="" /> : <span>📘</span>}
                  </div>
                  <div className="option-info">
                    <strong>{item.order ? `${item.order}. ` : ''}{item.title || 'Lecon'}</strong>
                    <span className="option-meta">{item.cards?.length || 0} cartes</span>
                  </div>
                  {item.id === lesson?.id ? <span className="checkmark">✓</span> : null}
                </button>
              ))}
            </div>
          ) : null}

          <div className="lesson-text-content">
          <section className="text-source-section">
            <div className="lesson-text-top-row">
              <span className="lesson-section-marker">① Lis la leçon</span>
              <div className="pinyin-toggle" role="radiogroup" aria-label="Mode pinyin">
                <label className="toggle-option">
                  <input type="radio" name="pinyinMode" value="all" checked={pinyinMode === 'all'} onChange={() => setPinyinMode('all')} />
                  <span className="radio-label"><span className="radio-icon">🟢</span>Tous les pinyin</span>
                </label>
                <label className="toggle-option">
                  <input type="radio" name="pinyinMode" value="tone" checked={pinyinMode === 'tone'} onChange={() => setPinyinMode('tone')} />
                  <span className="radio-label"><span className="radio-icon">🎵</span>Aide tonalité</span>
                </label>
                <label className="toggle-option">
                  <input type="radio" name="pinyinMode" value="none" checked={pinyinMode === 'none'} onChange={() => setPinyinMode('none')} />
                  <span className="radio-label"><span className="radio-icon">⚪</span>Aucun pinyin</span>
                </label>
              </div>
            </div>
            <div className="text-display">
              {sentences.map((sentence, sentenceIndex) => (
                <div key={`${sentence}-${sentenceIndex}`} className="sentence-line">
                  <div className="sentence-content">
                    {Array.from(sentence).map((char, charIndex) => {
                      const key = `${sentenceIndex}-${charIndex}`;
                      if (!isChineseChar(char)) {
                        return (
                          <span key={key} className="punctuation">
                            {char}
                          </span>
                        );
                      }

                      const entry = cardByHanzi.get(char);
                      const card = entry?.card;
                      if (!card) {
                        return <span key={key}>{char}</span>;
                      }

                      const status = getCharacterStatus(lesson.id, card, progressMap, seenCharsBeforeSet);
                      const showPinyin = shouldShowPinyin(card, status);
                      const tooltip = [card?.french, card?.english].filter(Boolean).join(' · ');

                      let pinyinSlot = '\u00A0';
                      let toneClass = '';
                      if (showPinyin) {
                        pinyinSlot = formatPinyinDisplay(card.pinyin || '');
                      } else if (pinyinMode === 'tone' && !manuallyToggledIds.has(card.id) && card.pinyinEnabled !== false) {
                        const { accent, tone } = extractToneAccent(card.pinyin || '');
                        pinyinSlot = accent;
                        toneClass = ` char-tone-only char-tone-${tone}`;
                      }

                      return (
                        <span
                          key={key}
                          className={`char ${status}`}
                          title={tooltip || 'Traduction non disponible'}
                          onClick={() => toggleCharPinyin(card.id)}
                        >
                          <span className={`char-pinyin-slot${toneClass}`}>
                            {pinyinSlot}
                          </span>
                          <span className="char-hanzi">{char}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="vocabulary-section lesson-text-vocab">
            <div className="vocab-section-header">
              <span className="lesson-section-marker">② Entraîne-toi à écrire</span>
              <span className="vocab-count">
                {selectedVocabulary.length === 0
                  ? 'Sélectionne au moins 1 caractère'
                  : `${selectedVocabulary.length} caractère${selectedVocabulary.length !== 1 ? 's' : ''} sélectionné${selectedVocabulary.length !== 1 ? 's' : ''}`}
              </span>
              <div className="vocab-difficulty-btns">
                <button
                  type="button"
                  className={`lesson-difficulty-star ui-pressable ${writingDifficulty === 1 ? 'active' : ''}`}
                  onClick={() => {
                    onChangeWritingDifficulty?.(1);
                    onStartPractice?.(selectedVocabulary.map((item) => item.id));
                  }}
                  aria-label="Difficulte 1"
                  disabled={!journeyStartCard || selectedVocabulary.length === 0}
                >
                  Facile
                </button>
                <button
                  type="button"
                  className={`lesson-difficulty-star ui-pressable ${writingDifficulty === 3 ? 'active' : ''}`}
                  onClick={() => {
                    onChangeWritingDifficulty?.(3);
                    onStartPractice?.(selectedVocabulary.map((item) => item.id));
                  }}
                  aria-label="Difficulte 3"
                  disabled={!journeyStartCard || selectedVocabulary.length === 0}
                >
                  Difficile
                </button>
              </div>
            </div>
            <div className="vocab-grid-with-controls">
              <div className="vocab-select-btns">
                <button
                  type="button"
                  className="vocab-select-btn ui-pressable"
                  onClick={() => setAllVocabularySelection(true)}
                >
                  Tous
                </button>
                <button
                  type="button"
                  className="vocab-select-btn ui-pressable"
                  onClick={() => setAllVocabularySelection(false)}
                >
                  Aucun
                </button>
              </div>
              <div className="vocabulary-grid">
                {vocabulary.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`vocab-card ${item.status} ${selectedCardIds.has(item.id) ? 'selected' : 'unselected'}`}
                    title={`${item.hanzi} (${formatPinyinDisplay(item.pinyin)}) - ${item.french || item.english || ''}`}
                    onClick={() => toggleVocabularySelection(item.id)}
                  >
                    <div className="vocab-hanzi">{item.hanzi}</div>
                    <div className="vocab-status">{selectedCardIds.has(item.id) ? '✓' : '○'}</div>
                    <div className="vocab-pinyin-hint">{formatPinyinDisplay(item.pinyin)}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>
          </div>
        </article>
      </div>
    </section>
  );
}
