import { useEffect, useState } from 'react';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import { useUiSounds } from '../hooks/useUiSounds.js';
import { speakHanzi } from '../lib/ttsFallback.js';
import {
  createSessionId,
  filterBySession,
  getDeckEvents,
  logQuizEvent,
  summarizeByCompetency,
  summarizeByType,
} from '../lib/quizLog.js';
import '../styles/lesson-quiz.css';

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

const QUESTION_TYPES = ['sound-to-char', 'char-to-translation', 'translation-to-char', 'sound-to-translation'];
const CHAR_OPTION_TYPES = ['sound-to-char', 'translation-to-char'];
const PROMPT_LABELS = {
  'sound-to-char': 'Quel caractere correspond a ce son ?',
  'char-to-translation': 'Quelle est la signification de ce caractere ?',
  'translation-to-char': 'Quel caractere correspond a cette traduction ?',
  'sound-to-translation': 'Quelle est la signification de ce son ?',
};
const TYPE_SHORT_LABELS = {
  'sound-to-char': 'Son -> caractere',
  'char-to-translation': 'Caractere -> traduction',
  'translation-to-char': 'Traduction -> caractere',
  'sound-to-translation': 'Son -> traduction',
};
const COMPETENCY_LABELS = {
  ecoute: 'Ecoute',
  caractere: 'Caractere',
  signification: 'Signification',
};

function buildRound(word, questionType, words) {
  const distractors = shuffle(words.filter((w) => w.id !== word.id)).slice(0, 3);
  const options = shuffle([...distractors, word]);
  return { correctWord: word, questionType, options };
}

// One question per card - the lesson's own vocabulary size sets the
// session length, so every character in the lesson gets tested exactly
// once (no repeats, no coverage gaps).
function buildWordSequence(words) {
  return shuffle(words);
}

// Spreads the question types as evenly as possible across totalRounds
// (a lesson's card count rarely divides evenly by 4), randomizing which
// types get the extra round(s).
function buildTypeSequence(totalRounds) {
  const typeOrder = shuffle(QUESTION_TYPES);
  const sequence = Array.from({ length: totalRounds }, (_, i) => typeOrder[i % typeOrder.length]);
  return shuffle(sequence);
}

function buildSessionRounds(words) {
  const wordSequence = buildWordSequence(words);
  const typeSequence = buildTypeSequence(wordSequence.length);
  return wordSequence.map((word, i) => buildRound(word, typeSequence[i], words));
}

function buildSession(words) {
  return { id: createSessionId(), rounds: buildSessionRounds(words) };
}

export default function LessonQuizPage({ profile, lessonId, lessonTitle, words = [], onBack, onSwitchModule }) {
  const sounds = useUiSounds();
  const [session, setSession] = useState(() => buildSession(words));
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [hintActive, setHintActive] = useState(false);
  const [soundReplayCount, setSoundReplayCount] = useState(0);

  const totalRounds = session.rounds.length;
  const isSessionComplete = roundIndex >= totalRounds;
  const round = session.rounds[roundIndex];

  const answered = selectedId !== null;
  const isCorrectSelection = round ? selectedId === round.correctWord.id : false;
  const showCharOptions = round ? CHAR_OPTION_TYPES.includes(round.questionType) : false;
  const isSoundPrompt = round ? (round.questionType === 'sound-to-char' || round.questionType === 'sound-to-translation') : false;

  useEffect(() => {
    if (!round) return;
    speakHanzi(round.correctWord.hanzi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const handleSelect = (optionId) => {
    if (answered || !round) return;
    setSelectedId(optionId);
    const isCorrect = optionId === round.correctWord.id;
    setScore((prev) => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
    if (isCorrect) sounds.playSuccess();
    else sounds.playError();
    logQuizEvent({
      profileId: profile?.id,
      deckId: lessonId,
      sessionId: session.id,
      charId: round.correctWord.id,
      questionType: round.questionType,
      correct: isCorrect,
      hintUsed: hintActive,
      soundReplays: soundReplayCount,
    });
  };

  const showHint = () => {
    sounds.playTap();
    setHintActive(true);
  };

  const playWordSound = () => {
    sounds.playTap();
    if (round) speakHanzi(round.correctWord.hanzi);
    setSoundReplayCount((prev) => prev + 1);
  };

  const nextRound = () => {
    sounds.playTap();
    setRoundIndex((prev) => prev + 1);
    setSelectedId(null);
    setHintActive(false);
    setSoundReplayCount(0);
  };

  const restartSession = () => {
    sounds.playTap();
    setSession(buildSession(words));
    setRoundIndex(0);
    setSelectedId(null);
    setScore({ correct: 0, total: 0 });
    setHintActive(false);
    setSoundReplayCount(0);
  };

  if (words.length < 2) {
    return <p className="empty">Pas assez de cartes dans cette lecon pour un quiz.</p>;
  }

  if (isSessionComplete) {
    const sessionEvents = filterBySession(getDeckEvents(profile?.id, lessonId), session.id);
    const byType = summarizeByType(sessionEvents, QUESTION_TYPES);
    const byCompetency = summarizeByCompetency(sessionEvents);

    return (
      <section className="writing-screen module-screen lesson-quiz-screen" aria-label="Resultat quiz lecon">
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
          <div className="lesson-quiz-score">Resultat</div>
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

        <div className="lesson-quiz-results">
          <p className="lesson-quiz-results-score">{score.correct}/{score.total}</p>

          <div className="lesson-quiz-results-breakdown">
            {QUESTION_TYPES.map((type) => (
              <div key={type} className="lesson-quiz-results-row">
                <span>{TYPE_SHORT_LABELS[type]}</span>
                <span>{byType[type]?.correct ?? 0}/{byType[type]?.total ?? 0}</span>
              </div>
            ))}
          </div>

          <div className="lesson-quiz-results-breakdown">
            {Object.entries(COMPETENCY_LABELS).map(([key, label]) => (
              <div key={key} className="lesson-quiz-results-row">
                <span>{label}</span>
                <span>{byCompetency[key]?.correct ?? 0}/{byCompetency[key]?.total ?? 0}</span>
              </div>
            ))}
          </div>

          <button type="button" className="button" onClick={restartSession}>
            Recommencer
          </button>
        </div>
      </section>
    );
  }

  const promptLabel = PROMPT_LABELS[round.questionType];

  return (
    <section className="writing-screen module-screen lesson-quiz-screen" aria-label={`Quiz ${lessonTitle || 'lecon'}`}>
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
        <div className="lesson-quiz-score">Q{roundIndex + 1}/{totalRounds} · {score.correct}/{score.total}</div>
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

      <div className="lesson-quiz-body">
        <p className="lesson-quiz-prompt-label">{promptLabel}</p>

        {round.questionType === 'translation-to-char' ? (
          <div className="lesson-quiz-translation-prompt">{round.correctWord.french}</div>
        ) : null}

        {round.questionType === 'char-to-translation' ? (
          <div className="lesson-quiz-hanzi-prompt">{round.correctWord.hanzi}</div>
        ) : null}

        {isSoundPrompt ? (
          <button
            type="button"
            className="lesson-quiz-sound-prompt-btn ui-pressable"
            onClick={playWordSound}
            aria-label="Ecouter le mot"
          >
            🔊
          </button>
        ) : null}

        {(round.questionType === 'char-to-translation' || round.questionType === 'translation-to-char' || isSoundPrompt) && hintActive ? (
          <>
            {round.questionType === 'sound-to-translation' ? (
              <div className="lesson-quiz-hint-hanzi">{round.correctWord.hanzi}</div>
            ) : null}
            <p className="lesson-quiz-option-pinyin lesson-quiz-prompt-pinyin">
              {formatPinyinDisplay(round.correctWord.pinyin)}
            </p>
          </>
        ) : null}

        <div className="lesson-quiz-options">
          {round.options.map((option) => {
            const isSelected = option.id === selectedId;
            const isTheCorrectOne = option.id === round.correctWord.id;
            const showAsCorrect = answered && isTheCorrectOne;
            const showAsWrong = answered && isSelected && !isTheCorrectOne;

            if (showCharOptions) {
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`lesson-quiz-option lesson-quiz-option-hanzi ui-pressable ${showAsCorrect ? 'correct' : ''} ${showAsWrong ? 'wrong' : ''}`}
                  onClick={() => handleSelect(option.id)}
                  disabled={answered}
                >
                  {option.hanzi}
                </button>
              );
            }

            return (
              <button
                key={option.id}
                type="button"
                className={`lesson-quiz-option lesson-quiz-option-text ui-pressable ${showAsCorrect ? 'correct' : ''} ${showAsWrong ? 'wrong' : ''}`}
                onClick={() => handleSelect(option.id)}
                disabled={answered}
              >
                {option.french}
              </button>
            );
          })}
        </div>

        {!answered ? (
          <div className="lesson-quiz-hint-row">
            <button type="button" className="lesson-quiz-hint-btn ui-pressable" onClick={showHint} disabled={hintActive}>
              💡 Indice
            </button>
            <button
              type="button"
              className="lesson-quiz-sound-btn ui-pressable"
              onClick={playWordSound}
              aria-label="Ecouter le mot"
            >
              🔊
            </button>
          </div>
        ) : null}

        {answered ? (
          <div className="lesson-quiz-feedback">
            <p className={isCorrectSelection ? 'lesson-quiz-feedback-ok' : 'lesson-quiz-feedback-ko'}>
              {isCorrectSelection ? 'Bravo !' : 'Pas tout a fait.'}
            </p>
            <p className="lesson-quiz-feedback-detail">
              {round.correctWord.hanzi} · {formatPinyinDisplay(round.correctWord.pinyin)} · {round.correctWord.french} / {round.correctWord.english}
            </p>
            <button type="button" className="button" onClick={nextRound}>
              {roundIndex + 1 >= totalRounds ? 'Voir mon score' : 'Suivant ►'}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
