import { useMemo, useState } from 'react';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import { useUiSounds } from '../hooks/useUiSounds.js';
import '../styles/colors-deck.css';

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function pickRound(words) {
  const correctWord = words[Math.floor(Math.random() * words.length)];
  const questionType = Math.random() < 0.5 ? 'swatch-to-char' : 'char-to-swatch';
  const distractors = shuffle(words.filter((word) => word.id !== correctWord.id)).slice(0, 3);
  const options = shuffle([...distractors, correctWord]);
  return { correctWord, questionType, options };
}

export default function ColorsQuizPage({ profile, words = [], onBack, onSwitchModule }) {
  const sounds = useUiSounds();
  const [round, setRound] = useState(() => pickRound(words));
  const [selectedId, setSelectedId] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [hintActive, setHintActive] = useState(false);

  const answered = selectedId !== null;
  const isCorrectSelection = selectedId === round.correctWord.id;

  const handleSelect = (optionId) => {
    if (answered) return;
    setSelectedId(optionId);
    const isCorrect = optionId === round.correctWord.id;
    setScore((prev) => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
    if (isCorrect) sounds.playSuccess();
    else sounds.playError();
  };

  const showHint = () => {
    sounds.playTap();
    setHintActive(true);
  };

  const nextRound = () => {
    sounds.playTap();
    setRound(pickRound(words));
    setSelectedId(null);
    setHintActive(false);
  };

  const promptLabel = round.questionType === 'swatch-to-char'
    ? 'Quel caractere correspond a cette couleur ?'
    : 'Quelle couleur correspond a ce caractere ?';

  if (!words.length) {
    return <p className="empty">Aucune couleur disponible.</p>;
  }

  return (
    <section className="writing-screen module-screen colors-quiz-screen" aria-label="Quiz couleurs">
      <div className="writing-top-banner">
        <button
          type="button"
          className="writing-logo ui-pressable"
          onClick={() => {
            sounds.playTap();
            onBack?.();
          }}
        >
          文
        </button>
        <div className="colors-quiz-score">Score: {score.correct}/{score.total}</div>
        <button
          type="button"
          className="writing-lesson-selector ui-pressable"
          onClick={() => {
            sounds.playTap();
            onSwitchModule?.('flashcards');
          }}
        >
          Lire
        </button>
      </div>

      <div className="colors-quiz-body">
        <p className="colors-quiz-prompt-label">{promptLabel}</p>

        {round.questionType === 'swatch-to-char' ? (
          <div className="color-swatch color-swatch-large" style={{ background: round.correctWord.colorHex }} aria-hidden="true" />
        ) : (
          <>
            <div className="colors-quiz-hanzi-prompt">{round.correctWord.hanzi}</div>
            {hintActive ? (
              <p className="colors-quiz-option-pinyin colors-quiz-prompt-pinyin">
                {formatPinyinDisplay(round.correctWord.pinyin)}
              </p>
            ) : null}
          </>
        )}

        <div className="colors-quiz-options">
          {round.options.map((option) => {
            const isSelected = option.id === selectedId;
            const isTheCorrectOne = option.id === round.correctWord.id;
            const showAsCorrect = answered && isTheCorrectOne;
            const showAsWrong = answered && isSelected && !isTheCorrectOne;

            if (round.questionType === 'swatch-to-char') {
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`colors-quiz-option colors-quiz-option-hanzi ui-pressable ${showAsCorrect ? 'correct' : ''} ${showAsWrong ? 'wrong' : ''}`}
                  onClick={() => handleSelect(option.id)}
                  disabled={answered}
                >
                  {option.hanzi}
                  {hintActive ? (
                    <small className="colors-quiz-option-pinyin">{formatPinyinDisplay(option.pinyin)}</small>
                  ) : null}
                </button>
              );
            }

            return (
              <button
                key={option.id}
                type="button"
                className={`colors-quiz-option colors-quiz-option-swatch ui-pressable ${showAsCorrect ? 'correct' : ''} ${showAsWrong ? 'wrong' : ''}`}
                style={{ background: option.colorHex }}
                onClick={() => handleSelect(option.id)}
                disabled={answered}
                aria-label={option.french}
              />
            );
          })}
        </div>

        {!answered ? (
          <button type="button" className="colors-quiz-hint-btn ui-pressable" onClick={showHint} disabled={hintActive}>
            💡 Indice
          </button>
        ) : null}

        {answered ? (
          <div className="colors-quiz-feedback">
            <p className={isCorrectSelection ? 'colors-quiz-feedback-ok' : 'colors-quiz-feedback-ko'}>
              {isCorrectSelection ? 'Bravo !' : 'Pas tout a fait.'}
            </p>
            <p className="colors-quiz-feedback-detail">
              {round.correctWord.hanzi} · {formatPinyinDisplay(round.correctWord.pinyin)} · {round.correctWord.french} / {round.correctWord.english}
            </p>
            <button type="button" className="button" onClick={nextRound}>
              Suivant ►
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
