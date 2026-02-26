import { useMemo, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';

function splitLessonSentences(sourceText = '') {
  const normalized = (sourceText || '').trim();
  if (!normalized) return [];
  const chunks = normalized.match(/[^。！？!?]+[。！？!?]?/g);
  if (!chunks) return [normalized];
  return chunks.map((item) => item.trim()).filter(Boolean);
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

export default function LessonTextView({
  lesson,
  profile,
  progressMap = {},
  onPracticeCharacter,
  onBack,
  onStartPractice,
}) {
  const [showAllPinyin, setShowAllPinyin] = useState(false);
  const [showNewCharsOnly, setShowNewCharsOnly] = useState(false);
  const [playingSentenceIndex, setPlayingSentenceIndex] = useState(-1);

  const cardByHanzi = useMemo(() => {
    const map = new Map();
    (lesson?.cards || []).forEach((card) => {
      if (!card?.hanzi) return;
      map.set(card.hanzi, card);
      Array.from(card.hanzi).forEach((char) => {
        if (!map.has(char)) map.set(char, card);
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
    return (lesson?.cards || []).filter((card) => card?.hanzi).map((card) => ({
      id: card.id,
      hanzi: card.hanzi,
      pinyin: card.pinyin || '',
      french: card.french || '',
      english: card.english || '',
    }));
  }, [lesson?.cards]);

  const isLearned = (char) => {
    if (!char || !isChineseChar(char)) return false;
    return (lesson?.cards || []).some((card) => {
      if (!card?.id || !card?.hanzi?.includes(char)) return false;
      const key = `${lesson.id}:${card.id}`;
      return (progressMap[key] || 0) > 0;
    });
  };

  const playSentence = async (sentence, sentenceIndex) => {
    if (!sentence || playingSentenceIndex >= 0) return;
    setPlayingSentenceIndex(sentenceIndex);
    const chars = Array.from(sentence).filter((char) => isChineseChar(char));

    for (const char of chars) {
      const card = cardByHanzi.get(char);
      if (card?.audioUrl) {
        await playAudioUrl(card.audioUrl);
      } else {
        await speakText(char);
      }
      await wait(80);
    }

    setPlayingSentenceIndex(-1);
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
          <div className="lesson-text-controls">
            <button
              type="button"
              className={`lesson-text-control-btn ui-pressable ${showAllPinyin ? 'active' : ''}`}
              onClick={() => setShowAllPinyin((prev) => !prev)}
            >
              {showAllPinyin ? 'Masquer pinyin' : 'Tous les pinyin'}
            </button>
            <button
              type="button"
              className={`lesson-text-control-btn ui-pressable ${showNewCharsOnly ? 'active' : ''}`}
              onClick={() => setShowNewCharsOnly((prev) => !prev)}
            >
              {showNewCharsOnly ? 'Tous les caracteres' : 'Nouveaux caracteres'}
            </button>
          </div>

          {sentences.map((sentence, sentenceIndex) => (
            <p key={`${sentence}-${sentenceIndex}`} className="lesson-text-paragraph">
              <button
                type="button"
                className={`lesson-text-audio ui-pressable ${playingSentenceIndex === sentenceIndex ? 'playing' : ''}`}
                onClick={() => playSentence(sentence, sentenceIndex)}
                disabled={playingSentenceIndex >= 0}
                aria-label={`Lire la phrase ${sentenceIndex + 1}`}
              >
                🔊
              </button>

              <span className="lesson-text-line">
                {Array.from(sentence).map((char, charIndex) => {
                    const key = `${sentenceIndex}-${charIndex}`;
                    if (!isChineseChar(char)) {
                      return (
                      <span key={key} className="lesson-text-punctuation">
                        {char}
                      </span>
                    );
                  }

                    const card = cardByHanzi.get(char);
                    const tooltip = [card?.french, card?.english].filter(Boolean).join(' · ');
                    const learned = isLearned(char);
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`lesson-text-char ui-pressable ${learned ? 'learned' : ''} ${showNewCharsOnly && learned ? 'is-muted' : ''}`}
                        title={tooltip || 'Traduction non disponible'}
                        onClick={() => onPracticeCharacter?.(char)}
                      >
                        <span className="lesson-text-pinyin-slot">
                          {showAllPinyin ? formatPinyinDisplay(card?.pinyin || '') : ''}
                        </span>
                        <span className="lesson-text-hanzi">{char}</span>
                      </button>
                    );
                  })}
              </span>
            </p>
          ))}

          <section className="lesson-text-vocab">
            <h2>Vocabulaire ({vocabulary.length} mots)</h2>
            <div className="lesson-text-vocab-list">
              {vocabulary.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="lesson-text-vocab-chip ui-pressable"
                  title={[item.french, item.english].filter(Boolean).join(' · ') || 'Traduction non disponible'}
                  onClick={() => setShowAllPinyin(true)}
                >
                  {item.hanzi}
                </button>
              ))}
            </div>
          </section>
        </div>

        <footer className="lesson-text-footer">
          <button type="button" className="lesson-text-start ui-pressable" onClick={onStartPractice}>
            Commencer la pratique →
          </button>
        </footer>
      </div>
    </section>
  );
}
