import { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { useUiSounds } from '../hooks/useUiSounds.js';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import { findCharacterStructure } from '../lib/characterStructure.js';
import {
  createSessionId,
  logQuizEvent,
} from '../lib/quizLog.js';
import colorsData from '../data/colors-words.json';
import '../styles/colors-deck.css';

const DECK_ID = 'colors-writing-test';

function createStaticCharDataLoader(data) {
  return (_char, onLoad) => {
    onLoad(data);
  };
}

export default function ColorsWritingTest({
  profile,
  onComplete,
  onBack,
}) {
  const containerRef = useRef(null);
  const ghostContainerRef = useRef(null);
  const writerRef = useRef(null);
  const sounds = useUiSounds();

  const [sessionId] = useState(() => createSessionId());
  const [colorIndex, setColorIndex] = useState(0);
  const [canvasSize, setCanvasSize] = useState(500);
  const [fullCharData, setFullCharData] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [radical, setRadical] = useState(null);
  const [quizActive, setQuizActive] = useState(false);
  const [completedColors, setCompletedColors] = useState(new Set());

  const currentColor = colorsData[colorIndex];
  const targetChar = currentColor?.hanzi || '';
  const isComplete = colorIndex >= colorsData.length;

  // Load radical data and character structure
  useEffect(() => {
    if (!targetChar) return;
    const structure = findCharacterStructure(targetChar);
    if (structure?.radical) {
      // Basic radical info from structure
      const radicalChar = structure.radical;
      const radicalStructure = findCharacterStructure(radicalChar);
      setRadical({
        hanzi: radicalChar,
        meaning: structure.etymology?.hint || radicalStructure?.etymology?.hint || 'radical',
      });
    } else {
      setRadical(null);
    }
  }, [targetChar]);

  // Canvas size management
  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const next = Math.max(220, Math.floor(Math.min(rect.width, rect.height || rect.width)));
      setCanvasSize((prev) => (prev === next ? prev : next));
    };

    updateSize();
    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateSize);
      observer.observe(element);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  // Load character data
  useEffect(() => {
    if (!targetChar) {
      setFullCharData(null);
      return;
    }

    let isMounted = true;
    HanziWriter.loadCharacterData(targetChar)
      .then((data) => {
        if (isMounted) setFullCharData(data || null);
      })
      .catch(() => {
        if (isMounted) setFullCharData(null);
      });

    return () => {
      isMounted = false;
    };
  }, [targetChar]);

  // Initialize hanzi-writer
  useEffect(() => {
    if (!containerRef.current || !ghostContainerRef.current || !targetChar || !canvasSize || !fullCharData) {
      return;
    }

    containerRef.current.innerHTML = '';
    ghostContainerRef.current.innerHTML = '';

    const dynamicPadding = Math.max(24, Math.min(60, Math.round(canvasSize * 0.12)));

    const ghostWriter = HanziWriter.create(ghostContainerRef.current, targetChar, {
      width: canvasSize,
      height: canvasSize,
      padding: dynamicPadding,
      showOutline: false,
      showCharacter: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 180,
      drawingColor: 'rgba(0, 0, 0, 0)',
      strokeColor: 'rgba(0, 0, 0, 0.07)',
      outlineColor: 'rgba(0, 0, 0, 0)',
      highlightOnComplete: false,
      leniency: 1,
      charDataLoader: createStaticCharDataLoader(fullCharData),
    });

    const writer = HanziWriter.create(containerRef.current, targetChar, {
      width: canvasSize,
      height: canvasSize,
      padding: dynamicPadding,
      showOutline: false,
      showCharacter: false,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 180,
      drawingColor: '#ff6f3c',
      strokeColor: '#1f2a5a',
      outlineColor: '#e0e0e0',
      highlightOnComplete: true,
      leniency: 1,
      charDataLoader: createStaticCharDataLoader(fullCharData),
    });

    writerRef.current = writer;
    setMistakeCount(0);
    setHintUsed(false);
    setShowHint(false);
    setFeedback(`Écris: ${currentColor.french} (${currentColor.english})`);

    let attemptMistakes = 0;

    // Named so a failed attempt (>2 mistakes) can restart the same quiz by
    // calling this again, rather than relying on arguments.callee (throws
    // in strict mode - which ES modules always are - and even where it
    // doesn't throw, it resolves to the enclosing component function here,
    // not this callback, since arrow functions have no arguments of their
    // own).
    const runQuiz = () => {
      writer.quiz({
        leniency: 1,
        showHintAfterMisses: 3,
        onMistake: () => {
          attemptMistakes += 1;
          setMistakeCount(attemptMistakes);
          setFeedback('Continue, tu es presque.');
          sounds.playError();
        },
        onComplete: () => {
          setQuizActive(false);

          // Log the attempt
          logQuizEvent({
            profileId: profile?.id,
            deckId: DECK_ID,
            sessionId,
            charId: targetChar,
            questionType: 'dictee-writing',
            correct: attemptMistakes <= 2,
            hintUsed,
            soundReplays: 0,
          });

          setCompletedColors((prev) => new Set([...prev, colorIndex]));

          if (attemptMistakes <= 2) {
            sounds.playSuccess();
            setFeedback('Bravo! Caractère réussi.');
            window.setTimeout(() => {
              handleNext();
            }, 1000);
          } else {
            sounds.playError();
            setFeedback('Bon effort. Recommence ce caractère.');
            // Keep quiz active to allow retry
            setMistakeCount(0);
            attemptMistakes = 0;
            runQuiz();
          }
        },
      });
    };

    runQuiz();
    setQuizActive(true);

    return () => {
      writerRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
      if (ghostContainerRef.current) ghostContainerRef.current.innerHTML = '';
    };
  }, [targetChar, canvasSize, fullCharData, currentColor, profile?.id, hintUsed]);

  const handleShowHint = () => {
    if (showHint) return;
    sounds.playTap();
    setShowHint(true);
    setHintUsed(true);
    // Hint auto-hides after 2 seconds
    window.setTimeout(() => {
      setShowHint(false);
    }, 2000);
  };

  const handleNext = () => {
    setColorIndex((prev) => prev + 1);
  };

  const handleSkip = () => {
    sounds.playTap();
    logQuizEvent({
      profileId: profile?.id,
      deckId: DECK_ID,
      sessionId,
      charId: targetChar,
      questionType: 'dictee-writing',
      correct: false,
      hintUsed,
      soundReplays: 0,
    });
    handleNext();
  };

  if (isComplete) {
    return (
      <div style={styles.container}>
        <div style={styles.completionCard}>
          <h2>Dictée terminée!</h2>
          <p>
            Vous avez réussi {completedColors.size} sur {colorsData.length} couleurs.
          </p>
          <button style={styles.button} onClick={() => onComplete?.()}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.progress}>
          {colorIndex + 1} / {colorsData.length}
        </h3>
        <button style={styles.closeButton} onClick={onBack}>
          ✕
        </button>
      </div>

      <div style={styles.prompt}>
        <p style={styles.promptText}>
          {currentColor.french} ({currentColor.english})
        </p>
        <p style={styles.pinyinText}>
          {formatPinyinDisplay(currentColor.pinyin)}
        </p>
      </div>

      <div className="writing-canvas-container">
        <div className="writing-guide-grid" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="writer-ghost-layer" style={{ display: 'none' }} ref={ghostContainerRef} />
        <div className="writer-box writer-box-large" ref={containerRef} />
      </div>

      <div style={styles.feedback}>{feedback}</div>

      {mistakeCount > 0 && (
        <div style={styles.mistakeBadge}>
          Erreurs: {mistakeCount}
        </div>
      )}

      <div style={styles.controls}>
        <button
          style={{...styles.button, ...styles.hintButton}}
          onClick={handleShowHint}
          disabled={hintUsed}
        >
          Indice (Radical)
        </button>
        <button style={{...styles.button, ...styles.skipButton}} onClick={handleSkip}>
          Passer
        </button>
      </div>

      {showHint && radical && (
        <div style={styles.hintBox}>
          <p style={styles.hintRadical}>{radical.hanzi}</p>
          <p style={styles.hintMeaning}>{radical.meaning}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progress: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
  },
  prompt: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  promptText: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 4px 0',
    color: '#333',
  },
  pinyinText: {
    fontSize: '14px',
    margin: 0,
    color: '#666',
  },
  feedback: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#ff6f3c',
    minHeight: '20px',
  },
  mistakeBadge: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  hintButton: {
    background: '#ffd60a',
    color: '#333',
  },
  skipButton: {
    background: '#ccc',
    color: '#333',
  },
  hintBox: {
    padding: '16px',
    background: '#fffacd',
    border: '2px solid #ffd60a',
    borderRadius: '8px',
    textAlign: 'center',
  },
  hintRadical: {
    fontSize: '48px',
    margin: '0 0 8px 0',
  },
  hintMeaning: {
    fontSize: '14px',
    margin: 0,
    color: '#666',
  },
  completionCard: {
    textAlign: 'center',
    padding: '40px 20px',
  },
};
