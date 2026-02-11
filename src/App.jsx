import { useEffect, useMemo, useState } from 'react';
import Flashcard from './components/Flashcard.jsx';
import lessons from './data/lessons.json';

const appTitle = 'WiseMama - Apprendre le chinois';
const progressStorageKey = 'wisemama-progress-v1';
const profiles = ['child', 'parent'];

function getCardKey(lessonId, cardId) {
  return `${lessonId}:${cardId}`;
}

export default function App() {
  const lessonOptions = useMemo(() => lessons, []);
  const [lessonId, setLessonId] = useState(lessonOptions[0]?.id ?? '');
  const activeLesson = lessonOptions.find((lesson) => lesson.id === lessonId);
  const [cardIndex, setCardIndex] = useState(0);
  const [activeProfile, setActiveProfile] = useState('child');
  const [starsByProfile, setStarsByProfile] = useState({ child: {}, parent: {} });

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

      // Backward compatibility for v1 payloads that stored one shared map.
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
      const profileMap = prev[activeProfile] || {};
      const current = profileMap[cardKey] ?? 0;
      return {
        ...prev,
        [activeProfile]: {
          ...profileMap,
          [cardKey]: Math.max(current, earned),
        },
      };
    });
  };

  const currentCardKey = currentCard ? getCardKey(activeLesson.id, currentCard.id) : '';
  const activeStars = starsByProfile[activeProfile] || {};
  const earnedStars = currentCard ? activeStars[currentCardKey] ?? 0 : 0;

  const lessonCompletion = activeLesson
    ? activeLesson.cards.filter((card) => (activeStars[getCardKey(activeLesson.id, card.id)] ?? 0) > 0).length
    : 0;

  const lessonComplete = activeLesson ? lessonCompletion === activeLesson.cards.length : false;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>{appTitle}</h1>
          <p className="subtitle">Apprentissage joyeux pour enfants</p>
        </div>
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
          <div className="profile-toggle" role="tablist" aria-label="Profil actif">
            {profiles.map((profile) => (
              <button
                key={profile}
                type="button"
                className={`pill ${activeProfile === profile ? 'active' : ''}`}
                onClick={() => setActiveProfile(profile)}
              >
                {profile === 'child' ? 'Mode Enfant' : 'Mode Parent'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="content">
        {activeLesson ? (
          <div className="progress-strip" aria-live="polite">
            <span>
              Progression de la lecon: {lessonCompletion}/{activeLesson.cards.length}
            </span>
            <span className="profile-label">
              Profil actif: {activeProfile === 'child' ? 'Enfant' : 'Parent'}
            </span>
            <span className={lessonComplete ? 'badge done' : 'badge'}>
              {lessonComplete ? 'Lecon terminee' : 'Continue'}
            </span>
          </div>
        ) : null}

        {currentCard ? (
          <>
            <Flashcard
              card={currentCard}
              cardKey={currentCardKey}
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
