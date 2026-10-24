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
import '../styles/colors-deck.css';

const DECK_ID = 'colors-deck';
// One question per color (11 colors) is too many to keep every character
// distinct within a session once you go past ~10 - capped so a session
// never has to repeat a character at all.
const TARGET_ROUNDS = 10;

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

const QUESTION_TYPES = ['swatch-to-char', 'char-to-swatch', 'sound-to-char', 'sound-to-swatch'];
const CHAR_OPTION_TYPES = ['swatch-to-char', 'sound-to-char'];
const PROMPT_LABELS = {
  'swatch-to-char': 'Quel caractere correspond a cette couleur ?',
  'char-to-swatch': 'Quelle couleur correspond a ce caractere ?',
  'sound-to-char': 'Quel caractere correspond a ce son ?',
  'sound-to-swatch': 'Quelle couleur correspond a ce son ?',
};
const TYPE_SHORT_LABELS = {
  'swatch-to-char': 'Couleur -> caractere',
  'char-to-swatch': 'Caractere -> couleur',
  'sound-to-char': 'Son -> caractere',
  'sound-to-swatch': 'Son -> couleur',
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

// One occurrence of every word first (guarantees full coverage of all
// colors in a session), then fills the remaining slots randomly.
function buildWordSequence(words, totalRounds) {
  if (totalRounds <= words.length) {
    return shuffle(words).slice(0, totalRounds);
  }
  const guaranteed = shuffle(words);
  const extraCount = totalRounds - guaranteed.length;
  const extras = Array.from({ length: extraCount }, () => words[Math.floor(Math.random() * words.length)]);
  return shuffle([...guaranteed, ...extras]);
}

// Spreads the question types as evenly as possible across totalRounds
// (e.g. 10 rounds / 4 types -> 3,3,2,2), randomizing which types get the
// extra round.
function buildTypeSequence(totalRounds) {
  const typeOrder = shuffle(QUESTION_TYPES);
  const sequence = Array.from({ length: totalRounds }, (_, i) => typeOrder[i % typeOrder.length]);
  return shuffle(sequence);
}

// Orders items so no two adjacent items share the same key - e.g. the same
// character never comes up twice back-to-back, even across a mode switch.
// Classic "reorganize string" placement: most-frequent keys fill the even
// slots first, then wrap into the odd slots. Guaranteed to succeed as long
// as no single key makes up more than half the items, which always holds
// here (11 colors spread across 20 rounds).
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

// Fixed session, one question per color (never repeats a character),
// question types spread as evenly as possible, arranged so the same
// character never repeats on two consecutive questions (moot once every
// character is distinct, but keeps this safe if the deck ever grows).
function buildSessionRounds(words) {
  const totalRounds = Math.min(TARGET_ROUNDS, words.length);
  const wordSequence = buildWordSequence(words, totalRounds);
  const typeSequence = buildTypeSequence(totalRounds);
  const rounds = wordSequence.map((word, i) => buildRound(word, typeSequence[i], words));
  return arrangeNoAdjacentRepeats(rounds, (round) => round.correctWord.id);
}

function buildSession(words) {
  return { id: createSessionId(), rounds: buildSessionRounds(words) };
}

export default function ColorsQuizPage({ profile, words = [], onBack, onGoHome, onSwitchModule, shellHeader = false }) {
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
  const isSoundPrompt = round ? (round.questionType === 'sound-to-char' || round.questionType === 'sound-to-swatch') : false;

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
    return <p className="empty">Aucune couleur disponible.</p>;
  }

  if (isSessionComplete) {
    const sessionEvents = filterBySession(getDeckEvents(profile?.id, DECK_ID), session.id);
    const byType = summarizeByType(sessionEvents, QUESTION_TYPES);
    const byCompetency = summarizeByCompetency(sessionEvents);

    return (
      <section className="writing-screen module-screen colors-quiz-screen" aria-label="Resultat quiz couleurs">
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
          >
            文
          </button>
          <div className="colors-quiz-score">Resultat</div>
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
        )}

        <div className="colors-quiz-results">
          <p className="colors-quiz-results-score">{score.correct}/{score.total}</p>

          <div className="colors-quiz-results-breakdown">
            {QUESTION_TYPES.map((type) => (
              <div key={type} className="colors-quiz-results-row">
                <span>{TYPE_SHORT_LABELS[type]}</span>
                <span>{byType[type]?.correct ?? 0}/{byType[type]?.total ?? 0}</span>
              </div>
            ))}
          </div>

          <div className="colors-quiz-results-breakdown">
            {Object.entries(COMPETENCY_LABELS).map(([key, label]) => (
              <div key={key} className="colors-quiz-results-row">
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
    <section className="writing-screen module-screen colors-quiz-screen" aria-label="Quiz couleurs">
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
        >
          文
        </button>
        <div className="colors-quiz-score">Q{roundIndex + 1}/{totalRounds} · {score.correct}/{score.total}</div>
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
      )}

      <div className="colors-quiz-body">
        <p className="colors-quiz-prompt-label">{promptLabel}</p>

        {round.questionType === 'swatch-to-char' ? (
          <div className="color-swatch color-swatch-large" style={{ background: round.correctWord.colorHex }} aria-hidden="true" />
        ) : null}

        {round.questionType === 'char-to-swatch' ? (
          <div className="colors-quiz-hanzi-prompt">{round.correctWord.hanzi}</div>
        ) : null}

        {isSoundPrompt ? (
          <button
            type="button"
            className={`colors-quiz-sound-prompt-btn ui-pressable ${round.questionType === 'sound-to-char' && hintActive ? 'colors-quiz-sound-prompt-btn-tinted' : ''}`}
            style={round.questionType === 'sound-to-char' && hintActive ? { background: round.correctWord.colorHex } : undefined}
            onClick={playWordSound}
            aria-label="Ecouter le mot"
          >
            🔊
          </button>
        ) : null}

        {(round.questionType === 'char-to-swatch' || isSoundPrompt) && hintActive ? (
          <>
            {round.questionType === 'sound-to-swatch' ? (
              <div className="colors-quiz-hint-hanzi">{round.correctWord.hanzi}</div>
            ) : null}
            <p className="colors-quiz-option-pinyin colors-quiz-prompt-pinyin">
              {formatPinyinDisplay(round.correctWord.pinyin)}
            </p>
          </>
        ) : null}

        <div className="colors-quiz-options">
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
                  className={`colors-quiz-option colors-quiz-option-hanzi ui-pressable ${showAsCorrect ? 'correct' : ''} ${showAsWrong ? 'wrong' : ''}`}
                  onClick={() => handleSelect(option.id)}
                  disabled={answered}
                >
                  {option.hanzi}
                  {hintActive && round.questionType === 'swatch-to-char' ? (
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
          <div className="colors-quiz-hint-row">
            <button type="button" className="colors-quiz-hint-btn ui-pressable" onClick={showHint} disabled={hintActive}>
              💡 Indice
            </button>
            <button
              type="button"
              className="colors-quiz-sound-btn ui-pressable"
              onClick={playWordSound}
              aria-label="Ecouter le mot"
            >
              🔊
            </button>
          </div>
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
              {roundIndex + 1 >= totalRounds ? 'Voir mon score' : 'Suivant ►'}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
