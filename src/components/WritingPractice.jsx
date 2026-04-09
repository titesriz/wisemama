import { useEffect, useMemo, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import AvatarRenderer from './AvatarRenderer.jsx';
import SuccessBurst from './SuccessBurst.jsx';
import { useUiSounds } from '../hooks/useUiSounds.js';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import { getParentModel } from '../lib/audioStore.js';
import { findCharacterStructure } from '../lib/characterStructure.js';
import { getTopLevelComponents } from '../lib/characterDecomposition.js';

function createStaticCharDataLoader(data) {
  return (_char, onLoad) => {
    onLoad(data);
  };
}

function filterCharacterData(data, strokeIndices = []) {
  if (!data || !Array.isArray(data.strokes) || !Array.isArray(data.medians)) return null;
  const sortedIndices = Array.from(new Set(strokeIndices))
    .filter((index) => Number.isInteger(index) && index >= 0 && index < data.strokes.length)
    .sort((a, b) => a - b);

  if (!sortedIndices.length) return null;

  const indexMap = new Map(sortedIndices.map((strokeIndex, nextIndex) => [strokeIndex, nextIndex]));
  return {
    strokes: sortedIndices.map((strokeIndex) => data.strokes[strokeIndex]),
    medians: sortedIndices.map((strokeIndex) => data.medians[strokeIndex]),
    radStrokes: Array.isArray(data.radStrokes)
      ? data.radStrokes.map((strokeIndex) => indexMap.get(strokeIndex)).filter((value) => Number.isInteger(value))
      : [],
  };
}

function buildComponentExercises(structure, fullCharData) {
  if (!structure || !Array.isArray(structure.matches) || !fullCharData) return [];

  return getTopLevelComponents(structure.decomposition)
    .map((component) => {
      const strokeIndices = structure.matches
        .map((match, strokeIndex) => ({ match, strokeIndex }))
        .filter(({ match }) => Array.isArray(match) && match[0] === component.index)
        .map(({ strokeIndex }) => strokeIndex);
      const charData = filterCharacterData(fullCharData, strokeIndices);
      if (!charData) return null;
      return {
        ...component,
        strokeIndices,
        firstStrokeIndex: strokeIndices[0],
        charData,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.firstStrokeIndex - b.firstStrokeIndex);
}

function formatTypeLabel(type = '') {
  const value = String(type || '').trim();
  if (!value) return 'autre';
  return value;
}

function getComponentRole(componentLabel = '', etymology = {}) {
  const label = String(componentLabel || '');
  const semantic = String(etymology?.semantic || '');
  const phonetic = String(etymology?.phonetic || '');

  if (semantic && (label === semantic || label.includes(semantic))) return 'semantique';
  if (phonetic && (label === phonetic || label.includes(phonetic))) return 'phonetique';

  if (etymology?.type === 'ideographic') return 'idee';
  if (etymology?.type) return 'autre';
  return '';
}

function buildStrokePreviewSteps(fullCharData) {
  if (!fullCharData?.strokes?.length) return [];
  return fullCharData.strokes.map((_, index) => ({
    index,
    strokes: fullCharData.strokes.slice(0, index + 1),
    latestMedian: fullCharData.medians?.[index] || [],
  }));
}

function buildMedianPolyline(median = [], transform) {
  if (!Array.isArray(median) || median.length < 2 || !transform) return '';
  const previewScale = 0.7;
  const centerX = 512;
  const centerY = 388;
  return median
    .map(([x, y]) => {
      const scaledX = centerX + ((x - centerX) * previewScale);
      const scaledY = centerY + ((y - centerY) * previewScale);
      const sx = transform.x + (scaledX * transform.scale);
      const sy = 92 - transform.y - (scaledY * transform.scale);
      return `${sx},${sy}`;
    })
    .join(' ');
}

export default function WritingPractice({
  variant = 'writing',
  hanzi,
  card,
  lessonId = '',
  lessonTitle,
  lessons = [],
  profile,
  parentProfile,
  writingDifficulty = 1,
  cardIndex = 0,
  totalCards = 0,
  onPrev,
  onNext,
  onOpenLessonText,
  onSelectLesson,
  onSwitchModule,
  onOpenRadical,
  onOpenWriting,
  onBack,
  standalone = false,
  embedded = false,
  onSuccess,
}) {
  const containerRef = useRef(null);
  const ghostContainerRef = useRef(null);
  const fullGhostContainerRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const writerRef = useRef(null);
  const ghostWriterRef = useRef(null);
  const fullGhostWriterRef = useRef(null);
  const audioRef = useRef(null);
  const lessonPickerRef = useRef(null);
  const [renderKey, setRenderKey] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [showModel, setShowModel] = useState(writingDifficulty === 1);
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [showCharInfo, setShowCharInfo] = useState(writingDifficulty <= 2);
  const [feedback, setFeedback] = useState('Trace directement sur le modele gris.');
  const [successTick, setSuccessTick] = useState(0);
  const [canvasSize, setCanvasSize] = useState(500);
  const [audioSrc, setAudioSrc] = useState('');
  const [fullCharData, setFullCharData] = useState(null);
  const [componentStepIndex, setComponentStepIndex] = useState(0);
  const [showStrokeArrows, setShowStrokeArrows] = useState(false);
  const sounds = useUiSounds();
  const isRadicalMode = variant === 'radical';
  const targetChar = useMemo(() => {
    const first = Array.from(hanzi || '')[0];
    return first || '';
  }, [hanzi]);
  const structure = useMemo(() => findCharacterStructure(targetChar), [targetChar]);
  const structureComponents = structure?.components || [];
  const etymology = structure?.etymology || {};
  const etymologyType = formatTypeLabel(etymology.type);
  const etymologyHint = structure?.etymology?.hint || '';
  const strokePreviewSteps = useMemo(() => buildStrokePreviewSteps(fullCharData), [fullCharData]);
  const strokePreviewTransform = useMemo(() => HanziWriter.getScalingTransform(92, 92, 10), []);
  const componentExercises = useMemo(
    () => (isRadicalMode ? buildComponentExercises(structure, fullCharData) : []),
    [fullCharData, isRadicalMode, structure],
  );
  const activeComponentExercise = isRadicalMode ? componentExercises[componentStepIndex] || null : null;

  const handleQuizComplete = ({ totalMistakes = 0 } = {}) => {
    setQuizActive(false);
    if (isRadicalMode) {
      if (totalMistakes <= 2) {
        const isLastComponent = componentStepIndex >= componentExercises.length - 1;
        if (isLastComponent) {
          setFeedback('Bravo ! Structure terminee.');
          setSuccessTick((prev) => prev + 1);
          sounds.playSuccess();
          onSuccess?.(totalMistakes);
        } else {
          const nextComponent = componentExercises[componentStepIndex + 1];
          setFeedback(`Bravo ! Passe au composant ${nextComponent?.label || 'suivant'}.`);
          setSuccessTick((prev) => prev + 1);
          sounds.playSuccess();
          setComponentStepIndex((prev) => prev + 1);
        }
      } else {
        setFeedback('Bon effort. Reessaie ce composant.');
        sounds.playError();
      }
      return;
    }

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
    if (!isRadicalMode || !targetChar) {
      setFullCharData(null);
      return undefined;
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
  }, [isRadicalMode, targetChar]);

  useEffect(() => {
    setComponentStepIndex(0);
  }, [lessonId, card?.id, hanzi]);

  useEffect(() => {
    setShowModel(writingDifficulty === 1);
    setShowCharInfo(writingDifficulty <= 2);
  }, [lessonId, card?.id, hanzi, writingDifficulty]);

  useEffect(() => {
    if (!containerRef.current || !ghostContainerRef.current || !targetChar || !canvasSize) {
      return;
    }
    if (isRadicalMode && !activeComponentExercise?.charData) return;

    containerRef.current.innerHTML = '';
    ghostContainerRef.current.innerHTML = '';
    if (fullGhostContainerRef.current) {
      fullGhostContainerRef.current.innerHTML = '';
    }
    const dynamicPadding = Math.max(24, Math.min(60, Math.round(canvasSize * 0.12)));

    if (isRadicalMode && fullGhostContainerRef.current && fullCharData) {
      const fullGhostWriter = HanziWriter.create(fullGhostContainerRef.current, targetChar, {
        width: canvasSize,
        height: canvasSize,
        padding: dynamicPadding,
        showOutline: false,
        showCharacter: true,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 180,
        drawingColor: 'rgba(0, 0, 0, 0)',
        strokeColor: 'rgba(0, 0, 0, 0.05)',
        outlineColor: 'rgba(0, 0, 0, 0)',
        highlightOnComplete: false,
        leniency: 1,
        charDataLoader: createStaticCharDataLoader(fullCharData),
      });
      fullGhostWriterRef.current = fullGhostWriter;
    }

    const ghostWriter = HanziWriter.create(ghostContainerRef.current, targetChar, {
      width: canvasSize,
      height: canvasSize,
      padding: dynamicPadding,
      showOutline: false,
      showCharacter: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 180,
      drawingColor: 'rgba(0, 0, 0, 0)',
      strokeColor: isRadicalMode ? 'rgba(255, 111, 60, 0.28)' : 'rgba(0, 0, 0, 0.07)',
      outlineColor: 'rgba(0, 0, 0, 0)',
      highlightOnComplete: false,
      leniency: 1,
      ...(isRadicalMode && activeComponentExercise?.charData
        ? { charDataLoader: createStaticCharDataLoader(activeComponentExercise.charData) }
        : {}),
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
      ...(isRadicalMode && activeComponentExercise?.charData
        ? { charDataLoader: createStaticCharDataLoader(activeComponentExercise.charData) }
        : {}),
    });

    ghostWriterRef.current = ghostWriter;
    writerRef.current = writer;
    setFeedback(
      isRadicalMode
        ? `Trace le composant ${activeComponentExercise?.label || ''}.`
        : 'Trace directement sur le modele gris.',
    );

    writer.quiz({
      leniency: 1,
      showHintAfterMisses: 2,
      onMistake: () => {
        setFeedback(isRadicalMode ? 'Continue, tu es presque sur ce composant.' : 'Continue, tu es presque.');
      },
      onComplete: handleQuizComplete,
    });
    setQuizActive(true);

    return () => {
      ghostWriterRef.current = null;
      writerRef.current = null;
      fullGhostWriterRef.current = null;
      if (fullGhostContainerRef.current) {
        fullGhostContainerRef.current.innerHTML = '';
      }
      if (ghostContainerRef.current) {
        ghostContainerRef.current.innerHTML = '';
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [targetChar, renderKey, canvasSize, isRadicalMode, activeComponentExercise, fullCharData]);

  const showStrokeOrder = async () => {
    sounds.playTap();
    if (isRadicalMode && fullGhostWriterRef.current) {
      const previousShowModel = showModel;
      setQuizActive(false);
      setShowModel(true);
      setFeedback('Observe l ordre des traits, un trait de plus a chaque etape.');
      await fullGhostWriterRef.current.animateCharacter();
      setShowModel(previousShowModel);
      startQuiz();
      return;
    }

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

  const showHint = () => {
    sounds.playTap();
    setShowModel(true);
    setFeedback('Indice visible quelques instants.');
    window.setTimeout(() => {
      setShowModel(false);
      setFeedback('A toi de tracer sans le modele.');
    }, 1600);
  };

  const startQuiz = () => {
    sounds.playTap();
    if (!writerRef.current || quizActive) {
      return;
    }

    setQuizActive(true);
    setFeedback(isRadicalMode ? `A toi de tracer ${activeComponentExercise?.label || 'ce composant'}.` : 'A toi de tracer dans le bon ordre.');

    writerRef.current.quiz({
      leniency: 1,
      showHintAfterMisses: 2,
      onMistake: () => {
        setFeedback(isRadicalMode ? 'Continue, tu es presque sur ce composant.' : 'Continue, tu es presque.');
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

  useEffect(() => {
    let isMounted = true;
    let objectUrl = '';

    const resolveAudio = async () => {
      if (!lessonId || !card?.id) {
        if (isMounted) setAudioSrc(card?.audioUrl || '');
        return;
      }
      const cardKey = `${lessonId}:${card.id}`;
      try {
        const parentModel = await getParentModel(cardKey);
        if (parentModel?.blob) {
          objectUrl = URL.createObjectURL(parentModel.blob);
          if (isMounted) setAudioSrc(objectUrl);
          return;
        }
      } catch {
        // fallthrough to card audio
      }
      const fallback = card?.audioUrl || '';
      if (isMounted) setAudioSrc(fallback);
    };

    resolveAudio();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [lessonId, card?.id, card?.audioUrl]);

  useEffect(() => {
    setShowCharInfo(false);
  }, [lessonId, card?.id, hanzi]);

  const profileLabel = profile?.role === 'parent' ? 'Parent' : 'Kid';
  const availableLessons = lessons.length ? lessons : [{ id: lessonId || 'current', title: lessonTitle || 'Lecon', cards: [] }];

  useEffect(() => {
    if (!showLessonPicker) return undefined;

    const handlePointerDown = (event) => {
      if (!lessonPickerRef.current?.contains(event.target)) {
        setShowLessonPicker(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [showLessonPicker]);

  return (
    <section className={`writing-screen ${embedded ? 'writing-screen-embedded' : ''}`} aria-label={isRadicalMode ? 'Atelier radical tablette' : 'Atelier d ecriture tablette'}>
      {!embedded ? (
        <section ref={lessonPickerRef} className="writing-header-shell">
          <div className="current-lesson-card writing-header-card">
            <div className="lesson-header lesson-header-with-avatar lesson-text-topbar">
              <button
                type="button"
                className="lesson-home-logo app-logo ui-pressable"
                onClick={() => {
                  if (onBack) onBack();
                  else onSwitchModule?.('flashcards');
                }}
                aria-label="Retour landing"
              >
                文
              </button>
              <div className="lesson-avatar lesson-avatar-single" aria-label="Profil enfant">
                <AvatarRenderer
                  config={profile?.avatar}
                  size={56}
                  className="landing-avatar-circle"
                  alt={`Avatar ${profile?.name || profileLabel}`}
                  loading="eager"
                />
              </div>
              <div className="lesson-avatar lesson-avatar-single lesson-parent-avatar" aria-label="Profil parent">
                <AvatarRenderer
                  config={parentProfile?.avatar}
                  size={56}
                  className="landing-avatar-circle"
                  alt={`Avatar ${parentProfile?.name || 'Parent'}`}
                  loading="eager"
                />
              </div>
              <div className="lesson-info lesson-text-title-block">
                <h3 className="lesson-title lesson-text-card-title">{lessonTitle || 'Lecon'}</h3>
                {onOpenLessonText ? (
                  <p className="lesson-description lesson-text-card-description">
                    {isRadicalMode ? 'Atelier radical' : 'Atelier d ecriture'}
                  </p>
                ) : null}
              </div>
              <div className="lesson-actions lesson-text-topbar-actions">
                <button
                  type="button"
                  className="change-lesson-btn icon-only ui-pressable"
                  onClick={() => {
                    sounds.playTap();
                    setShowLessonPicker((prev) => !prev);
                  }}
                  aria-label="Changer de lecon"
                >
                  🗂️
                </button>
              </div>
            </div>
          </div>

          {showLessonPicker ? (
            <div
              className="lesson-picker-dropdown"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {availableLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  className={`lesson-option ui-pressable ${lesson.id === lessonId ? 'active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    sounds.playTap();
                    setShowLessonPicker(false);
                    onSelectLesson?.(lesson.id);
                  }}
                >
                  <div className="option-preview">{lesson.coverImage ? <img src={lesson.coverImage} alt="" /> : <span>📘</span>}</div>
                  <div className="option-info">
                    <strong>{lesson.order ? `${lesson.order}. ` : ''}{lesson.title || 'Lecon'}</strong>
                    <span className="option-meta">{lesson.cards?.length || 0} cartes</span>
                  </div>
                  {lesson.id === lessonId ? <span className="checkmark">✓</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {!embedded ? (
        <div className="writing-card-info">
          <button
            type="button"
            className="writing-char-reveal ui-pressable"
            onClick={() => {
              sounds.playTap();
              setShowCharInfo((prev) => !prev);
            }}
          >
            <span className="writing-char-reveal-pinyin">
              {card?.pinyinEnabled === false ? '' : formatPinyinDisplay(card?.pinyin || '')}
            </span>
            {showCharInfo ? (
              <>
                <span className="writing-char-reveal-hanzi">{targetChar}</span>
              </>
            ) : (
              <>
                <span className="writing-char-reveal-label">Voir le caractere</span>
              </>
            )}
          </button>
          <div className="writing-translation writing-translation-centered">
            <span>{card?.french || ''}</span>
            <small>{card?.english || ''}</small>
          </div>
          {!isRadicalMode && onOpenRadical ? (
            <button
              type="button"
              className="writing-meta-btn ui-pressable"
              onClick={() => {
                sounds.playTap();
                onOpenRadical();
              }}
            >
              Radicaux
            </button>
          ) : null}
          {isRadicalMode && onOpenWriting ? (
            <button
              type="button"
              className="writing-meta-btn ui-pressable"
              onClick={() => {
                sounds.playTap();
                onOpenWriting();
              }}
            >
              Ecriture
            </button>
          ) : null}
          <button
            type="button"
            className="writing-sound-btn ui-pressable"
            onClick={playCardAudio}
            disabled={!audioSrc}
          >
            Son
          </button>
          {audioSrc ? <audio ref={audioRef} src={audioSrc} preload="auto" /> : null}
        </div>
      ) : null}

      {!embedded && isRadicalMode ? (
        <section className="radical-lesson-panel" aria-label="Informations caractere">
          <div className="radical-panel-block">
            <span className="radical-panel-label">Etape</span>
            <div className="radical-step-chip">
              {componentExercises.length ? `${componentStepIndex + 1}/${componentExercises.length}` : '—'}
            </div>
          </div>
          <div className="radical-panel-block">
            <span className="radical-panel-label">Composant actuel</span>
            <div className="radical-pill-row">
              <span className="radical-pill radical-pill-primary">{activeComponentExercise?.label || '—'}</span>
            </div>
          </div>
          <div className="radical-panel-block">
            <span className="radical-panel-label">Radical</span>
            <div className="radical-pill-row">
              <span className="radical-pill radical-pill-primary">{structure?.radical || '—'}</span>
            </div>
          </div>
          <div className="radical-panel-block">
            <span className="radical-panel-label">Type</span>
            <div className="radical-type-chip">{etymologyType}</div>
          </div>
          <div className="radical-panel-block">
            <span className="radical-panel-label">Structure</span>
            <div className="radical-decomposition">{structure?.decomposition || '—'}</div>
          </div>
          <div className="radical-panel-block">
            <span className="radical-panel-label">Composants a tracer</span>
            <div className="radical-component-grid">
              {componentExercises.length ? componentExercises.map((component, index) => (
                <div
                  key={`${component.label}-${index}`}
                  className={`radical-component-card ${index === componentStepIndex ? 'radical-component-card-active' : ''}`}
                >
                  <span className={`radical-pill ${index === componentStepIndex ? 'radical-pill-active' : ''}`}>
                    {component.label}
                  </span>
                  <span className="radical-component-role">
                    {getComponentRole(component.label, etymology) || 'autre'}
                  </span>
                </div>
              )) : structureComponents.length ? structureComponents.map((component) => (
                <div key={component} className="radical-component-card">
                  <span className="radical-pill">{component}</span>
                  <span className="radical-component-role">
                    {getComponentRole(component, etymology) || 'autre'}
                  </span>
                </div>
              )) : <span className="radical-empty">Aucun composant disponible</span>}
            </div>
          </div>
          {etymologyHint ? (
            <div className="radical-panel-block">
              <span className="radical-panel-label">Indice</span>
              <p className="radical-etymology">{etymologyHint}</p>
            </div>
          ) : null}
          {strokePreviewSteps.length ? (
            <div className="radical-panel-block">
              <div className="radical-stroke-header">
                <span className="radical-panel-label">Ordre des traits</span>
                <button
                  type="button"
                  className={`lesson-text-control-btn ui-pressable ${showStrokeArrows ? 'active' : ''}`}
                  onClick={() => setShowStrokeArrows((prev) => !prev)}
                >
                  Flèches
                </button>
              </div>
              <div className="radical-stroke-sequence">
                {strokePreviewSteps.map((step) => (
                  <div key={step.index} className="radical-stroke-step">
                    <div className="radical-stroke-step-count">{step.index + 1}</div>
                    <svg
                      viewBox="0 0 92 92"
                      className="radical-stroke-step-canvas"
                      aria-label={`Trait ${step.index + 1}`}
                    >
                      <rect x="1" y="1" width="90" height="90" rx="14" fill="#fff" stroke="#e7ebf2" />
                      <line x1="46" y1="8" x2="46" y2="84" stroke="#e7ebf2" strokeDasharray="4 4" />
                      <line x1="8" y1="46" x2="84" y2="46" stroke="#e7ebf2" strokeDasharray="4 4" />
                      <g transform={strokePreviewTransform.transform}>
                        <g transform="translate(512 388) scale(0.7) translate(-512 -388)">
                          {step.strokes.map((strokePath, strokeIndex) => (
                            <path
                              key={`${step.index}-${strokeIndex}`}
                              d={strokePath}
                              fill={strokeIndex === step.index ? '#ff6b6b' : '#111111'}
                              stroke="none"
                            />
                          ))}
                        </g>
                      </g>
                      {showStrokeArrows && step.latestMedian?.length >= 2 ? (
                        <>
                          <defs>
                            <marker
                              id={`stroke-arrow-${step.index}`}
                              viewBox="0 0 10 10"
                              refX="6.5"
                              refY="5"
                              markerWidth="3.2"
                              markerHeight="3.2"
                              orient="auto-start-reverse"
                            >
                              <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a90e2" />
                            </marker>
                          </defs>
                          <polyline
                            points={buildMedianPolyline(step.latestMedian, strokePreviewTransform)}
                            fill="none"
                            stroke="#4a90e2"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            markerEnd={`url(#stroke-arrow-${step.index})`}
                          />
                        </>
                      ) : null}
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="writing-area">
        <div className="writing-canvas-container" ref={canvasWrapRef}>
          <div className="writing-guide-grid" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          {isRadicalMode ? (
            <div
              className="writer-full-layer"
              style={{ display: showModel ? 'block' : 'none' }}
              ref={fullGhostContainerRef}
            />
          ) : null}
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
          {writingDifficulty === 2 ? (
            <button type="button" className="writing-action-btn ui-pressable" onClick={showHint}>
              <span>💡</span>
              <small>Hint</small>
            </button>
          ) : null}
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

      {!embedded ? (
        <>
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
        </>
      ) : null}
    </section>
  );
}
