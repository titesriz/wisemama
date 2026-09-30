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

const DECK_ID = 'clothing-deck';
const TARGET_ROUNDS = 9;

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

// Icon-based question types are added once real icons are provided for
// each word (word.iconUrl) - until then the quiz sticks to sound and
// meaning prompts, which need no artwork.
function questionTypesFor(words) {
  const hasIcons = words.every((w) => w.iconUrl);
  const base = ['sound-to-char', 'meaning-to-char'];
  return hasIcons ? [...base, 'icon-to-char', 'char-to-icon'] : base;
}

const PROMPT_LABELS = {
  'sound-to-char': 'Quel caractere correspond a ce son ?',
  'meaning-to-char': 'Quel caractere correspond a ce mot ?',
  'icon-to-char': 'Quel caractere correspond a cette image ?',
  'char-to-icon': 'Quelle image correspond a ce caractere ?',
};
const TYPE_SHORT_LABELS = {
  'sound-to-char': 'Son -> caractere',
  'meaning-to-char': 'Sens -> caractere',
  'icon-to-char': 'Image -> caractere',
  'char-to-icon': 'Caractere -> image',
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
  if (totalRounds <= words.length) {
    return shuffle(words).slice(0, totalRounds);
  }
  const guaranteed = shuffle(words);
  const extraCount = totalRounds - guaranteed.length;
  const extras = Array.from({ length: extraCount }, () => words[Math.floor(Math.random() * words.length)]);
  return shuffle([...guaranteed, ...extras]);
}

function buildTypeSequence(totalRounds, questionTypes) {
  const typeOrder = shuffle(questionTypes);
  const sequence = Array.from({ length: totalRounds }, (_, i) => typeOrder[i % typeOrder.length]);
  return shuffle(sequence);
}

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
  const questionTypes = questionTypesFor(words);
  const totalRounds = Math.min(TARGET_ROUNDS, words.length);
  const wordSequence = buildWordSequence(words, totalRounds);
  const typeSequence = buildTypeSequence(totalRounds, questionTypes);
  const rounds = wordSequence.map((word, i) => buildRound(word, typeSequence[i], words));
  return arrangeNoAdjacentRepeats(rounds, (round) => round.correctWord.id);
}

function buildSession(words) {
  return { id: createSessionId(), rounds: buildSessionRounds(words) };
}

export default function ClothingQuizPage({ profile, words = [], onBack, onSwitchModule }) {
  const sounds = useUiSounds();
  const [session, setSession] = useState(() => buildSession(words));
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [hintActive, setHintActive] = useState(false);
  const [soundReplayCount, setSoundReplayCount] = useState(0);

  const questionTypes = questionTypesFor(words);
  const totalRounds = session.rounds.length;
  const isSessionComplete = roundIndex >= totalRounds;
  const round = session.rounds[roundIndex];

  const answered = selectedId !== null;
  const isCorrectSelection = round ? selectedId === round.correctWord.id : false;
  const isSoundPrompt = round ? round.questionType === 'sound-to-char' : false;
  const isMeaningPrompt = round ? round.questionType === 'meaning-to-char' : false;
  const isIconPrompt = round ? (round.questionType === 'icon-to-char' || round.questionType === 'char-to-icon') : false;
  const showCharOptions = round ? round.questionType !== 'char-to-icon' : false;

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
    return <p className="empty">Aucun vetement disponible.</p>;
  }

  if (isSessionComplete) {
    const sessionEvents = filterBySession(getDeckEvents(profile?.id, DECK_ID), session.id);
    const byType = summarizeByType(sessionEvents, questionTypes);
    const byCompetency = summarizeByCompetency(sessionEvents);

    return (
      <section className="writing-screen module-screen colors-quiz-screen" aria-label="Resultat quiz vetements">
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

        <div className="colors-quiz-results">
          <p className="colors-quiz-results-score">{score.correct}/{score.total}</p>

          <div className="colors-quiz-results-breakdown">
            {questionTypes.map((type) => (
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
    <section className="writing-screen module-screen colors-quiz-screen" aria-label="Quiz vetements">
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

      <div className="colors-quiz-body">
        <p className="colors-quiz-prompt-label">{promptLabel}</p>

        {isMeaningPrompt ? (
          <div className="colors-quiz-hanzi-prompt">{round.correctWord.french}</div>
        ) : null}

        {round.questionType === 'char-to-icon' ? (
          <div className="colors-quiz-hanzi-prompt">{round.correctWord.hanzi}</div>
        ) : null}

        {round.questionType === 'icon-to-char' && round.correctWord.iconUrl ? (
          <div className="clothing-icon-wrap clothing-icon-wrap-large">
            <img src={round.correctWord.iconUrl} alt="" />
          </div>
        ) : null}

        {isSoundPrompt ? (
          <button
            type="button"
            className="colors-quiz-sound-prompt-btn ui-pressable"
            onClick={playWordSound}
            aria-label="Ecouter le mot"
          >
            🔊
          </button>
        ) : null}

        {hintActive && (isMeaningPrompt || isIconPrompt || isSoundPrompt) ? (
          <p className="colors-quiz-option-pinyin colors-quiz-prompt-pinyin">
            {formatPinyinDisplay(round.correctWord.pinyin)}
          </p>
        ) : null}

        <div className="colors-quiz-options">
          {round.options.map((option) => {
            const isSelected = option.id === selectedId;
            const isTheCorrectOne = option.id === round.correctWord.id;
            const showAsCorrect = answered && isTheCorrectOne;
            const showAsWrong = answered && isSelected && !isTheCorrectOne;

            if (!showCharOptions) {
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`colors-quiz-option colors-quiz-option-icon ui-pressable ${showAsCorrect ? 'correct' : ''} ${showAsWrong ? 'wrong' : ''}`}
                  onClick={() => handleSelect(option.id)}
                  disabled={answered}
                  aria-label={option.french}
                >
                  {option.iconUrl ? <img src={option.iconUrl} alt={option.french} /> : option.hanzi}
                </button>
              );
            }

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
