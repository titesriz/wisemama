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
import '../styles/hsk-quiz.css';

const DECK_ID = 'hsk1-deck';
// 500 words means repeats within one session are near-impossible even at 20
// draws, so (unlike the Colors deck) there's no need to shrink the session
// to guarantee every word is distinct - 5 questions per type instead.
const TARGET_ROUNDS = 20;

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

function buildWordSequence(words, totalRounds) {
  return Array.from({ length: totalRounds }, () => words[Math.floor(Math.random() * words.length)]);
}

// Exactly 5 of each of the 4 types (20 / 4 divides evenly).
function buildTypeSequence(totalRounds) {
  const perType = totalRounds / QUESTION_TYPES.length;
  return shuffle(QUESTION_TYPES.flatMap((type) => Array.from({ length: perType }, () => type)));
}

// Orders items so no two adjacent items share the same key - practically a
// no-op at this vocabulary size, but kept as a cheap safety net consistent
// with the Colors deck's quiz.
function arrangeNoAdjacentRepeats(items, keyFn) {
  const groups = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  groups.forEach((group) => shuffle(group));
  const groupList = shuffle([...groups.values()]).sort((a, b) => b.length - a.length);

  const result = new Array(items.length);
  let index = 0;
  groupList.forEach((group) => {
    group.forEach((item) => {
      if (index >= items.length) index = 1;
      result[index] = item;
      index += 2;
    });
  });
  return result;
}

function buildSessionRounds(words) {
  const wordSequence = buildWordSequence(words, TARGET_ROUNDS);
  const typeSequence = buildTypeSequence(TARGET_ROUNDS);
  const rounds = wordSequence.map((word, i) => buildRound(word, typeSequence[i], words));
  return arrangeNoAdjacentRepeats(rounds, (round) => round.correctWord.id);
}

function buildSession(words) {
  return { id: createSessionId(), rounds: buildSessionRounds(words) };
}

export default function HskQuizPage({ profile, words = [], onBack, onSwitchModule }) {
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
      deckId: DECK_ID,
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

  if (!words.length) {
    return <p className="empty">Aucun mot disponible.</p>;
  }

  if (isSessionComplete) {
    const sessionEvents = filterBySession(getDeckEvents(profile?.id, DECK_ID), session.id);
    const byType = summarizeByType(sessionEvents, QUESTION_TYPES);
    const byCompetency = summarizeByCompetency(sessionEvents);

    return (
      <section className="writing-screen module-screen hsk-quiz-screen" aria-label="Resultat quiz HSK1">
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
          <div className="hsk-quiz-score">Resultat</div>
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

        <div className="hsk-quiz-results">
          <p className="hsk-quiz-results-score">{score.correct}/{score.total}</p>

          <div className="hsk-quiz-results-breakdown">
            {QUESTION_TYPES.map((type) => (
              <div key={type} className="hsk-quiz-results-row">
                <span>{TYPE_SHORT_LABELS[type]}</span>
                <span>{byType[type]?.correct ?? 0}/{byType[type]?.total ?? 0}</span>
              </div>
            ))}
          </div>

          <div className="hsk-quiz-results-breakdown">
            {Object.entries(COMPETENCY_LABELS).map(([key, label]) => (
              <div key={key} className="hsk-quiz-results-row">
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
    <section className="writing-screen module-screen hsk-quiz-screen" aria-label="Quiz HSK1">
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
        <div className="hsk-quiz-score">Q{roundIndex + 1}/{totalRounds} · {score.correct}/{score.total}</div>
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

      <div className="hsk-quiz-body">
        <p className="hsk-quiz-prompt-label">{promptLabel}</p>

        {round.questionType === 'translation-to-char' ? (
          <div className="hsk-quiz-translation-prompt">{round.correctWord.french}</div>
        ) : null}

        {round.questionType === 'char-to-translation' ? (
          <div className="hsk-quiz-hanzi-prompt">{round.correctWord.hanzi}</div>
        ) : null}

        {isSoundPrompt ? (
          <button
            type="button"
            className="hsk-quiz-sound-prompt-btn ui-pressable"
            onClick={playWordSound}
            aria-label="Ecouter le mot"
          >
            🔊
          </button>
        ) : null}

        {(round.questionType === 'char-to-translation' || round.questionType === 'translation-to-char' || isSoundPrompt) && hintActive ? (
          <>
            {round.questionType === 'sound-to-translation' ? (
              <div className="hsk-quiz-hint-hanzi">{round.correctWord.hanzi}</div>
            ) : null}
            <p className="hsk-quiz-option-pinyin hsk-quiz-prompt-pinyin">
              {formatPinyinDisplay(round.correctWord.pinyin)}
            </p>
          </>
        ) : null}

        <div className="hsk-quiz-options">
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
                  className={`hsk-quiz-option hsk-quiz-option-hanzi ui-pressable ${showAsCorrect ? 'correct' : ''} ${showAsWrong ? 'wrong' : ''}`}
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
                className={`hsk-quiz-option hsk-quiz-option-text ui-pressable ${showAsCorrect ? 'correct' : ''} ${showAsWrong ? 'wrong' : ''}`}
                onClick={() => handleSelect(option.id)}
                disabled={answered}
              >
                {option.french}
              </button>
            );
          })}
        </div>

        {!answered ? (
          <div className="hsk-quiz-hint-row">
            <button type="button" className="hsk-quiz-hint-btn ui-pressable" onClick={showHint} disabled={hintActive}>
              💡 Indice
            </button>
            <button
              type="button"
              className="hsk-quiz-sound-btn ui-pressable"
              onClick={playWordSound}
              aria-label="Ecouter le mot"
            >
              🔊
            </button>
          </div>
        ) : null}

        {answered ? (
          <div className="hsk-quiz-feedback">
            <p className={isCorrectSelection ? 'hsk-quiz-feedback-ok' : 'hsk-quiz-feedback-ko'}>
              {isCorrectSelection ? 'Bravo !' : 'Pas tout a fait.'}
            </p>
            <p className="hsk-quiz-feedback-detail">
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
