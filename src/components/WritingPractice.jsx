import { useEffect, useMemo, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import AvatarRenderer from './AvatarRenderer.jsx';
import SuccessBurst from './SuccessBurst.jsx';
import { useUiSounds } from '../hooks/useUiSounds.js';

export default function WritingPractice({
  hanzi,
  card,
  lessonTitle,
  profile,
  cardIndex = 0,
  totalCards = 0,
  onPrev,
  onNext,
  onOpenLessonPicker,
  onSwitchModule,
  onBack,
  standalone = false,
  onSuccess,
}) {
  const containerRef = useRef(null);
  const ghostContainerRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const writerRef = useRef(null);
  const ghostWriterRef = useRef(null);
  const audioRef = useRef(null);
  const [renderKey, setRenderKey] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [showModel, setShowModel] = useState(true);
  const [feedback, setFeedback] = useState('Trace directement sur le modele gris.');
  const [successTick, setSuccessTick] = useState(0);
  const [canvasSize, setCanvasSize] = useState(500);
  const sounds = useUiSounds();
  const targetChar = useMemo(() => {
    const first = Array.from(hanzi || '')[0];
    return first || '';
  }, [hanzi]);

  const handleQuizComplete = ({ totalMistakes = 0 } = {}) => {
    setQuizActive(false);
    if (totalMistakes <= 2) {
      setFeedback('Bravo ! Etoile gagnee.');
      setSuccessTick((prev) => prev + 1);
      sounds.playSuccess();
      onSuccess?.(totalMistakes);
    } else {
      setFeedback('Bon effort. Reessaie pour gagner une etoile.');
      sounds.playError();
    }
  };

  useEffect(() => {
    if (!canvasWrapRef.current) return undefined;
    const element = canvasWrapRef.current;

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
    } else {
      window.addEventListener('resize', updateSize);
    }

    window.addEventListener('orientationchange', updateSize);

    return () => {
      window.removeEventListener('orientationchange', updateSize);
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !ghostContainerRef.current || !targetChar || !canvasSize) {
      return;
    }

    containerRef.current.innerHTML = '';
    ghostContainerRef.current.innerHTML = '';
    const dynamicPadding = Math.max(16, Math.round(canvasSize * 0.07));

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
    });

    ghostWriterRef.current = ghostWriter;
    writerRef.current = writer;
    setFeedback('Trace directement sur le modele gris.');

    writer.quiz({
      leniency: 1,
      showHintAfterMisses: 2,
      onMistake: () => {
        setFeedback('Continue, tu es presque.');
      },
      onComplete: handleQuizComplete,
    });
    setQuizActive(true);

    return () => {
      ghostWriterRef.current = null;
      writerRef.current = null;
      if (ghostContainerRef.current) {
        ghostContainerRef.current.innerHTML = '';
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [targetChar, renderKey, canvasSize]);

  const showStrokeOrder = async () => {
    sounds.playTap();
    if (!writerRef.current) {
      return;
    }

    setQuizActive(false);
    setFeedback('Observe bien les traits, puis essaie de tracer.');
    await writerRef.current.animateCharacter();
    startQuiz();
  };

  const clearCanvas = () => {
    sounds.playTap();
    setFeedback('Canvas efface. Recommence calmement.');
    setRenderKey((prev) => prev + 1);
  };

  const startQuiz = () => {
    sounds.playTap();
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
      onComplete: handleQuizComplete,
    });
  };

  const playCardAudio = () => {
    sounds.playTap();
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const profileLabel = profile?.role === 'parent' ? 'Parent' : 'Kid';

  return (
    <section className="writing-screen" aria-label="Atelier d ecriture tablette">
      <div className="writing-top-banner">
        <button
          type="button"
          className="writing-logo"
          onClick={() => {
            if (onBack) onBack();
            else onSwitchModule?.('flashcards');
          }}
        >
          文
        </button>

        <div className="writing-profile-section">
          <div className="writing-avatar-tile">
            <AvatarRenderer config={profile?.avatar} size={52} alt="Avatar profil" loading="eager" />
          </div>
          <div className="writing-profile-name">
            <strong>{profile?.name || 'Profil'}</strong>
            <span>{profileLabel}</span>
          </div>
        </div>

        <button type="button" className="writing-lesson-selector" onClick={onOpenLessonPicker}>
          {lessonTitle || 'Lecon'}
        </button>
      </div>

      <div className="writing-card-info">
        <div className="writing-pinyin">{card?.pinyin || ''}</div>
        <div className="writing-char-small">{targetChar}</div>
        <div className="writing-translation">
          <span>{card?.french || ''}</span>
          <small>{card?.english || ''}</small>
        </div>
        <button
          type="button"
          className="writing-sound-btn"
          onClick={playCardAudio}
          disabled={!card?.audioUrl}
        >
          Son
        </button>
        {card?.audioUrl ? <audio ref={audioRef} src={card.audioUrl} preload="auto" /> : null}
      </div>

      <div className="writing-area">
        <div className="writing-canvas-container" ref={canvasWrapRef}>
          <div className="writing-guide-grid" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div
            className="writer-ghost-layer"
            style={{ display: showModel ? 'block' : 'none' }}
            ref={ghostContainerRef}
          />
          <div className="writer-box writer-box-large" ref={containerRef} />
        </div>

        <div className="writing-action-buttons">
          <button
            type="button"
            className={`writing-action-btn ui-pressable ${showModel ? 'model-on' : ''}`}
            onClick={() => setShowModel((prev) => !prev)}
          >
            <span>{showModel ? '🙈' : '👁'}</span>
            <small>{showModel ? 'Cacher' : 'Montrer'}</small>
          </button>
          <button type="button" className="writing-action-btn ui-pressable" onClick={showStrokeOrder}>
            <span>Voir</span>
            <small>Modele</small>
          </button>
          <button type="button" className="writing-action-btn ui-pressable" onClick={clearCanvas}>
            <span>Reset</span>
            <small>Effacer</small>
          </button>
          <button
            type="button"
            className="writing-action-btn primary ui-pressable"
            onClick={startQuiz}
            disabled={quizActive}
            data-coach="write"
          >
            <span>{quizActive ? '...' : 'OK'}</span>
            <small>Verifier</small>
          </button>
        </div>
      </div>

      <p className={`writing-feedback wm-ok-line ${feedback.includes('Bravo') ? 'wm-success-pulse' : ''}`}>
        {feedback}
        <SuccessBurst trigger={successTick} />
      </p>

      <div className="writing-bottom-nav">
        <button type="button" className="writing-nav-btn ui-pressable" onClick={onPrev}>
          ◄ Prec
        </button>
        <div className="writing-counter">
          {Math.max(1, cardIndex + 1)}/{Math.max(1, totalCards)}
        </div>
        <button type="button" className="writing-nav-btn ui-pressable" onClick={onNext}>
          Suiv ►
        </button>
      </div>

      <div className="writing-mode-selector">
        <button
          type="button"
          className="writing-mode-btn ui-pressable"
          onClick={() => onSwitchModule?.('flashcards')}
        >
          Mot
        </button>
        <button
          type="button"
          className="writing-mode-btn ui-pressable"
          onClick={() => onSwitchModule?.('audio')}
        >
          Son
        </button>
        <button type="button" className="writing-mode-btn active" disabled>
          Ecriture
        </button>
        <button
          type="button"
          className="writing-mode-btn ui-pressable"
          onClick={() => onSwitchModule?.('learning-flow')}
        >
          Parcours
        </button>
      </div>
    </section>
  );
}
