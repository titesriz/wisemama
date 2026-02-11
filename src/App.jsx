import { useEffect, useState } from 'react';
import AvatarEditor from './components/AvatarEditor.jsx';
import Flashcard from './components/Flashcard.jsx';
import LandingPage from './components/LandingPage.jsx';
import LessonEditor from './components/LessonEditor.jsx';
import ModeAvatar from './components/ModeAvatar.jsx';
import { useAvatar } from './context/AvatarContext.jsx';
import { useLessons } from './context/LessonsContext.jsx';
import { useMode } from './context/ModeContext.jsx';

const appTitle = 'WiseMama - Apprendre le chinois';
const progressStorageKey = 'wisemama-progress-v1';

function getCardKey(lessonId, cardId) {
  return `${lessonId}:${cardId}`;
}

export default function App() {
  const { mode, isParentMode, switchToChild, switchToParent } = useMode();
  const { avatarsByMode } = useAvatar();
  const { lessons: lessonOptions } = useLessons();
  const [lessonId, setLessonId] = useState(lessonOptions[0]?.id ?? '');
  const activeLesson = lessonOptions.find((lesson) => lesson.id === lessonId);
  const [cardIndex, setCardIndex] = useState(0);
  const [starsByProfile, setStarsByProfile] = useState({ child: {}, parent: {} });
  const [enteredApp, setEnteredApp] = useState(false);
  const [showLandingAvatarEditor, setShowLandingAvatarEditor] = useState(false);

  useEffect(() => {
    if (lessonOptions.length === 0) {
      setLessonId('');
      setCardIndex(0);
      return;
    }

    const exists = lessonOptions.some((lesson) => lesson.id === lessonId);
    if (!exists) {
      setLessonId(lessonOptions[0].id);
      setCardIndex(0);
    }
  }, [lessonId, lessonOptions]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(progressStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return;

      if (parsed.starsByProfile && typeof parsed.starsByProfile === 'object') {
        setStarsByProfile({
          child: parsed.starsByProfile.child || {},
          parent: parsed.starsByProfile.parent || {},
        });
        return;
      }

      if (parsed.starsByCard && typeof parsed.starsByCard === 'object') {
        setStarsByProfile({
          child: parsed.starsByCard,
          parent: {},
        });
      }
    } catch {
      setStarsByProfile({ child: {}, parent: {} });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(progressStorageKey, JSON.stringify({ starsByProfile }));
  }, [starsByProfile]);

  const currentProfile = mode;
  const currentStarsMap = starsByProfile[currentProfile] || {};

  const currentCard = activeLesson?.cards?.[cardIndex];
  const totalCards = activeLesson?.cards?.length ?? 0;

  const goNext = () => {
    if (!totalCards) return;
    setCardIndex((prev) => (prev + 1) % totalCards);
  };

  const goPrev = () => {
    if (!totalCards) return;
    setCardIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  const handleLessonChange = (event) => {
    setLessonId(event.target.value);
    setCardIndex(0);
  };

  const handleWritingSuccess = (mistakes) => {
    if (!activeLesson || !currentCard) return;

    const cardKey = getCardKey(activeLesson.id, currentCard.id);
    const earned = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;

    setStarsByProfile((prev) => {
      const map = prev[currentProfile] || {};
      const current = map[cardKey] ?? 0;
      return {
        ...prev,
        [currentProfile]: {
          ...map,
          [cardKey]: Math.max(current, earned),
        },
      };
    });
  };

  const currentCardKey = currentCard ? getCardKey(activeLesson.id, currentCard.id) : '';
  const earnedStars = currentCard ? currentStarsMap[currentCardKey] ?? 0 : 0;

  const lessonCompletion = activeLesson
    ? activeLesson.cards.filter((card) => (currentStarsMap[getCardKey(activeLesson.id, card.id)] ?? 0) > 0).length
    : 0;

  const lessonComplete = activeLesson ? lessonCompletion === activeLesson.cards.length : false;
  const childMap = starsByProfile.child || {};
  const childLessonCompletion = activeLesson
    ? activeLesson.cards.filter((card) => (childMap[getCardKey(activeLesson.id, card.id)] ?? 0) > 0).length
    : 0;

  const resetChildLesson = () => {
    if (!activeLesson) return;
    setStarsByProfile((prev) => {
      const nextChild = { ...(prev.child || {}) };
      activeLesson.cards.forEach((card) => {
        delete nextChild[getCardKey(activeLesson.id, card.id)];
      });
      return { ...prev, child: nextChild };
    });
  };

  if (!enteredApp) {
    return (
      <LandingPage
        childAvatar={avatarsByMode?.child}
        parentAvatar={avatarsByMode?.parent}
        showAvatarEditor={showLandingAvatarEditor}
        onToggleAvatarEditor={() => setShowLandingAvatarEditor((prev) => !prev)}
        avatarEditorContent={<AvatarEditor />}
        onStartChild={() => {
          switchToChild();
          setShowLandingAvatarEditor(false);
          setEnteredApp(true);
        }}
        onStartParent={() => {
          switchToParent();
          setShowLandingAvatarEditor(false);
          setEnteredApp(true);
        }}
      />
    );
  }

  return (
    <div className="app">
      <ModeAvatar />

      <header className="app-header">
        <div>
          <h1>{appTitle}</h1>
          <p className="subtitle">
            {isParentMode ? 'Mode parent: gestion et suivi' : 'Mode enfant: apprentissage'}
          </p>
        </div>

        {isParentMode ? (
          <div className="header-controls">
            <div className="lesson-picker">
              <label htmlFor="lesson">Lecon :</label>
              <select id="lesson" value={lessonId} onChange={handleLessonChange}>
                {lessonOptions.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </header>

      <main className="content">
        {activeLesson && isParentMode ? (
          <div className="progress-strip" aria-live="polite">
            <span>
              Progression ({currentProfile}): {lessonCompletion}/{activeLesson.cards.length}
            </span>
            <span>Enfant: {childLessonCompletion}/{activeLesson.cards.length}</span>
            <span className={lessonComplete ? 'badge done' : 'badge'}>
              {lessonComplete ? 'Lecon terminee' : 'En cours'}
            </span>
          </div>
        ) : null}

        {isParentMode ? (
          <section className="parent-panel">
            <h3>Controle parent</h3>
            <div className="parent-actions">
              <button
                type="button"
                className="button secondary"
                onClick={resetChildLesson}
                disabled={!activeLesson}
              >
                Reinitialiser progression enfant (lecon)
              </button>
            </div>
            <LessonEditor
              activeLessonId={activeLesson?.id || ''}
              onSelectLesson={(id) => {
                setLessonId(id);
                setCardIndex(0);
              }}
            />
            <AvatarEditor />
          </section>
        ) : null}

        {currentCard ? (
          <>
            <Flashcard
              card={currentCard}
              cardKey={currentCardKey}
              mode={mode}
              onWritingSuccess={handleWritingSuccess}
              earnedStars={earnedStars}
            />
            <div className="card-controls">
              <button className="button secondary" type="button" onClick={goPrev}>
                Precedent
              </button>
              <span className="card-counter">
                Carte {cardIndex + 1} / {totalCards}
              </span>
              <button className="button" type="button" onClick={goNext}>
                Suivant
              </button>
            </div>
          </>
        ) : (
          <p className="empty">Aucune carte disponible pour cette lecon.</p>
        )}
      </main>
    </div>
  );
}
