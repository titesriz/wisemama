import { useEffect, useMemo, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';

function splitLessonSentences(sourceText = '') {
  const normalized = String(sourceText || '').trim();
  if (!normalized) return [];
  const lines = normalized.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const merged = [];
  let buffer = '';

  lines.forEach((line) => {
    const compactLine = line.replace(/\s+/g, '');
    if (!compactLine) return;
    buffer += compactLine;
    if (/[。！？!?]$/.test(compactLine)) {
      merged.push(buffer);
      buffer = '';
    }
  });

  if (buffer) merged.push(buffer);

  const out = [];
  merged.forEach((line) => {
    const chunks = line.match(/[^。！？!?]+[。！？!?]?/g);
    if (!chunks) {
      out.push(line);
      return;
    }
    chunks.map((item) => item.trim()).filter(Boolean).forEach((item) => out.push(item));
  });

  return out;
}

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

function getCharacterStatus(lessonId, card, progressMap) {
  const stars = getCardProgressStars(lessonId, card.id, progressMap);
  if (stars >= 2) return 'learned';
  if (stars >= 1) return 'learning';
  return 'new';
}

export default function LessonTextView({
  lesson,
  profile,
  progressMap = {},
  onPracticeCharacter,
  onBack,
  onStartPractice,
}) {
  const [pinyinMode, setPinyinMode] = useState('all');
  const [manuallyToggledIds, setManuallyToggledIds] = useState(() => new Set());
  const [playingSentenceIndex, setPlayingSentenceIndex] = useState(-1);

  useEffect(() => {
    if (pinyinMode !== 'none') {
      setManuallyToggledIds(new Set());
    }
  }, [pinyinMode]);

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
    return splitLessonSentences(baseText);
  }, [lesson?.cards, lesson?.sourceText]);

  const vocabulary = useMemo(() => {
    return (lesson?.cards || []).filter((card) => card?.hanzi).map((card, index) => ({
      id: card.id,
      index,
      hanzi: card.hanzi,
      pinyin: card.pinyin || '',
      french: card.french || '',
      english: card.english || '',
      status: getCharacterStatus(lesson.id, card, progressMap),
      stars: getCardProgressStars(lesson.id, card.id, progressMap),
    }));
  }, [lesson?.cards, lesson?.id, progressMap]);

  const journeyStartIndex = useMemo(() => {
    const firstNew = vocabulary.find((item) => item.status !== 'learned');
    return firstNew ? firstNew.index : 0;
  }, [vocabulary]);

  const journeyStartCard = lesson?.cards?.[journeyStartIndex] || null;

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
    if (pinyinMode === 'new') return status === 'new';
    return false;
  };

  return (
    <section className="lesson-text-page">
      <div className="lesson-text-shell">
        <div className="writing-top-banner">
          <button type="button" className="writing-logo ui-pressable" onClick={onBack}>
            文
          </button>
          <div className="writing-profile-section">
            <div className="writing-avatar-tile">
              <AvatarRenderer config={profile?.avatar} size={52} alt="Avatar profil" loading="eager" />
            </div>
            <div className="writing-profile-name">
              <strong>{profile?.name || 'Profil'}</strong>
              <span>{profile?.role === 'parent' ? 'Parent' : 'Kid'}</span>
            </div>
          </div>
          <button type="button" className="writing-lesson-selector" disabled>
            {lesson?.title || 'Lecon'}
          </button>
        </div>

        <div className="lesson-text-content">
          <div className="lesson-header">
            <h1>{lesson?.title || 'Lecon'}</h1>
            {lesson?.description ? <p>{lesson.description}</p> : null}
          </div>

          <section className="text-source-section">
            <h2>📖 Texte de la lecon</h2>
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

                      const status = getCharacterStatus(lesson.id, card, progressMap);
                      const showPinyin = shouldShowPinyin(card, status);
                      const tooltip = [card?.french, card?.english].filter(Boolean).join(' · ');

                      return (
                        <span
                          key={key}
                          className={`char ${status}`}
                          title={tooltip || 'Traduction non disponible'}
                          onClick={() => toggleCharPinyin(card.id)}
                          onDoubleClick={() => onPracticeCharacter?.(char)}
                        >
                          <span className="char-pinyin-slot">
                            {showPinyin ? formatPinyinDisplay(card.pinyin || '') : '\u00A0'}
                          </span>
                          <span className="char-hanzi">{char}</span>
                        </span>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className={`sentence-audio ui-pressable ${playingSentenceIndex === sentenceIndex ? 'playing' : ''}`}
                    onClick={() => playSentence(sentence, sentenceIndex)}
                    disabled={playingSentenceIndex >= 0}
                    aria-label={`Lire la phrase ${sentenceIndex + 1}`}
                    title="Ecouter cette phrase"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="pinyin-controls">
            <div className="pinyin-toggle" role="radiogroup" aria-label="Mode pinyin">
              <label className="toggle-option">
                <input type="radio" name="pinyinMode" value="none" checked={pinyinMode === 'none'} onChange={() => setPinyinMode('none')} />
                <span className="radio-label"><span className="radio-icon">⚪</span>Aucun pinyin</span>
              </label>
              <label className="toggle-option">
                <input type="radio" name="pinyinMode" value="new" checked={pinyinMode === 'new'} onChange={() => setPinyinMode('new')} />
                <span className="radio-label"><span className="radio-icon">🟡</span>Nouveaux uniquement</span>
              </label>
              <label className="toggle-option">
                <input type="radio" name="pinyinMode" value="all" checked={pinyinMode === 'all'} onChange={() => setPinyinMode('all')} />
                <span className="radio-label"><span className="radio-icon">🟢</span>Tous les pinyin</span>
              </label>
            </div>
          </div>

          <section className="vocabulary-section lesson-text-vocab">
            <h2>📚 Caractères à apprendre ({vocabulary.length} caractères)</h2>
            <div className="vocabulary-grid lesson-text-vocab-list">
              {vocabulary.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`vocab-card ${item.status} ui-pressable`}
                  onClick={() => onPracticeCharacter?.(item.hanzi)}
                  title={`${item.hanzi} (${formatPinyinDisplay(item.pinyin)}) - ${item.french || item.english || ''}`}
                >
                  <div className="vocab-hanzi">{item.hanzi}</div>
                  <div className="vocab-status">{item.status === 'learned' ? '✓' : item.status === 'learning' ? '▶' : '○'}</div>
                  <div className="vocab-pinyin-hint">{formatPinyinDisplay(item.pinyin)}</div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <footer className="lesson-text-footer lesson-action">
          <button
            type="button"
            className="lesson-text-start ui-pressable"
            onClick={() => onStartPractice?.(journeyStartCard?.hanzi || '')}
            disabled={!journeyStartCard}
          >
            {journeyStartCard
              ? `Commencer le parcours ${journeyStartCard.hanzi} (${journeyStartIndex + 1}/${Math.max(1, vocabulary.length)}) →`
              : 'Reviser la lecon →'}
          </button>
        </footer>
      </div>
    </section>
  );
}
