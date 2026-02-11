import { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';

export default function WritingPractice({ hanzi, onSuccess }) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);
  const [quizActive, setQuizActive] = useState(false);
  const [feedback, setFeedback] = useState('Prends le stylet puis appuie sur Tracer.');

  useEffect(() => {
    if (!containerRef.current || !hanzi) {
      return;
    }

    containerRef.current.innerHTML = '';
    const writer = HanziWriter.create(containerRef.current, hanzi, {
      width: 260,
      height: 260,
      padding: 18,
      showOutline: true,
      showCharacter: false,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 180,
      drawingColor: '#ff6f3c',
      strokeColor: '#1f2a5a',
      outlineColor: '#c8d2ff',
      highlightOnComplete: true,
      leniency: 1,
    });

    writerRef.current = writer;
    setQuizActive(false);
    setFeedback('Prends le stylet puis appuie sur Tracer.');

    return () => {
      writerRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [hanzi]);

  const showStrokeOrder = async () => {
    if (!writerRef.current) {
      return;
    }

    setQuizActive(false);
    setFeedback('Observe bien les traits, puis essaie de tracer.');
    await writerRef.current.animateCharacter();
  };

  const startQuiz = () => {
    if (!writerRef.current || quizActive) {
      return;
    }

    setQuizActive(true);
    setFeedback('A toi de tracer dans le bon ordre.');

    writerRef.current.quiz({
      leniency: 1,
      showHintAfterMisses: 2,
      onMistake: () => {
        setFeedback('Continue, tu es presque.');
      },
      onComplete: ({ totalMistakes = 0 } = {}) => {
        setQuizActive(false);
        if (totalMistakes <= 2) {
          setFeedback('Bravo ! Etoile gagnee.');
          onSuccess?.(totalMistakes);
        } else {
          setFeedback('Bon effort. Reessaie pour gagner une etoile.');
        }
      },
    });
  };

  return (
    <section className="writing-practice" aria-label="Atelier d ecriture">
      <h3>Atelier d'ecriture</h3>
      <div className="writer-box" ref={containerRef} />
      <div className="writing-actions">
        <button type="button" className="button secondary" onClick={showStrokeOrder}>
          Voir les traits
        </button>
        <button type="button" className="button" onClick={startQuiz} disabled={quizActive}>
          {quizActive ? 'Trace en cours...' : 'Tracer'}
        </button>
      </div>
      <p className="writing-feedback">{feedback}</p>
    </section>
  );
}
