import { useEffect, useMemo, useRef, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import { getAllSeenCharsBefore, getLessonsByOrder } from '../utils/lessons/lessonOrder.js';

function getCardProgressStars(lessonId, cardId, progressMap) {
  const key = `${lessonId}:${cardId}`;
  return Number(progressMap?.[key] || 0);
}

function getCharacterStatus(lessonId, card, progressMap, seenCharsBeforeSet) {
  const stars = getCardProgressStars(lessonId, card.id, progressMap);
  if (stars >= 2) return 'learned';
  if (stars >= 1) return 'learning';
  const hasSeenBefore = Array.from(String(card?.hanzi || '')).some((char) => seenCharsBeforeSet.has(char));
  if (hasSeenBefore) return 'learning';
  return 'new';
}

export default function LessonWritingSetupPage({
  profile,
  lesson,
  lessons = [],
  progressMap = {},
  writingDifficulty = 1,
  onChangeWritingDifficulty,
  onStartPractice,
  onBack,
  onGoHome,
  onSelectLesson,
  onOpenAvatarEditor,
}) {
  const [selectedCardIds, setSelectedCardIds] = useState(() => new Set((lesson?.cards || []).map((card) => card.id)));
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const lessonPickerRef = useRef(null);

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

  const availableLessons = useMemo(() => {
    if (lessons.length) return getLessonsByOrder(lessons);
    return lesson ? [lesson] : [];
  }, [lesson, lessons]);

  const seenCharsBeforeSet = useMemo(
    () => new Set(getAllSeenCharsBefore(lesson?.id, lessons)),
    [lesson?.id, lessons],
  );

  const vocabulary = useMemo(() => {
    return (lesson?.cards || []).filter((card) => card?.hanzi).map((card, index) => ({
      id: card.id,
      index,
      hanzi: card.hanzi,
      pinyin: card.pinyin || '',
      french: card.french || '',
      english: card.english || '',
      status: getCharacterStatus(lesson.id, card, progressMap, seenCharsBeforeSet),
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

  if (!lesson) {
    return (
      <section className="writing-setup-page">
        <p className="empty">Aucune leçon sélectionnée.</p>
        <button type="button" className="button secondary" onClick={onBack}>
          Retour
        </button>
      </section>
    );
  }

  return (
    <section className="lesson-text-page">
      <div className="landing-new-shell lesson-text-shell">
        <article ref={lessonPickerRef} className="profile-card-kid lesson-text-frame">
          <div className="current-lesson-card lesson-text-current-card lesson-text-sticky-header">
            <div className="lesson-header lesson-header-with-avatar lesson-text-topbar">
              <button type="button" className="lesson-home-logo app-logo ui-pressable" onClick={onGoHome} aria-label="Retour landing">
                文
              </button>
              <div className="lesson-info lesson-text-title-block">
                <span className="lesson-text-mode-label">Écriture</span>
                <h3 className="lesson-title lesson-text-card-title">{lesson.title || 'Lecon'}</h3>
              </div>
              <button
                type="button"
                className="change-lesson-btn icon-only ui-pressable"
                onClick={() => setShowLessonPicker((prev) => !prev)}
                aria-label="Changer de lecon"
              >
                🗂️
              </button>
              <button
                type="button"
                className="lesson-avatar lesson-avatar-single lesson-avatar-btn ui-pressable"
                aria-label="Modifier l'avatar de l'enfant"
                onClick={() => onOpenAvatarEditor?.()}
              >
                <AvatarRenderer
                  config={profile?.avatar}
                  size={48}
                  className="landing-avatar-circle"
                  alt={`Avatar ${profile?.name || 'Enfant'}`}
                  loading="eager"
                />
              </button>
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
          </div>

      <div className="vocabulary-section lesson-text-vocab writing-setup-section">
        <div className="vocab-section-header">
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
            <button type="button" className="vocab-select-btn ui-pressable" onClick={() => setAllVocabularySelection(true)}>
              Tous
            </button>
            <button type="button" className="vocab-select-btn ui-pressable" onClick={() => setAllVocabularySelection(false)}>
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
      </div>
        </article>
      </div>
    </section>
  );
}
