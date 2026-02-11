import { useEffect, useMemo, useState } from 'react';
import AudioPracticePanel from './components/AudioPracticePanel.jsx';
import AvatarEditor from './components/AvatarEditor.jsx';
import Flashcard from './components/Flashcard.jsx';
import LandingPage from './components/LandingPage.jsx';
import LessonEditor from './components/LessonEditor.jsx';
import ModeAvatar from './components/ModeAvatar.jsx';
import WritingPractice from './components/WritingPractice.jsx';
import { useAvatar } from './context/AvatarContext.jsx';
import { useLessons } from './context/LessonsContext.jsx';
import { useMode } from './context/ModeContext.jsx';

const appTitle = 'WiseMama - Apprendre le chinois';
const progressStorageKey = 'wisemama-progress-v1';

const MODULES = {
  LESSONS: 'lessons',
  FLASHCARDS: 'flashcards',
  AUDIO: 'audio',
  WRITING: 'writing',
};

function getCardKey(lessonId, cardId) {
  return `${lessonId}:${cardId}`;
}

function getDefaultModuleByRole(role) {
  return role === 'parent' ? MODULES.LESSONS : MODULES.FLASHCARDS;
}

export default function App() {
  const { mode, isParentMode, switchToChild, switchToParent } = useMode();
  const {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    getProfileById,
    createProfile,
  } = useAvatar();
  const { lessons: lessonOptions } = useLessons();
  const [lessonId, setLessonId] = useState(lessonOptions[0]?.id ?? '');
  const activeLesson = lessonOptions.find((lesson) => lesson.id === lessonId);
  const [cardIndex, setCardIndex] = useState(0);
  const [starsByProfile, setStarsByProfile] = useState({});
  const [enteredApp, setEnteredApp] = useState(false);
  const [showLandingAvatarEditor, setShowLandingAvatarEditor] = useState(false);
  const [activeModule, setActiveModule] = useState(MODULES.LESSONS);
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [showAvatarEditorModal, setShowAvatarEditorModal] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(false);

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
        setStarsByProfile(parsed.starsByProfile);
        return;
      }

      if (parsed.starsByCard && typeof parsed.starsByCard === 'object') {
        setStarsByProfile({
          'child-default': parsed.starsByCard,
        });
      }
    } catch {
      setStarsByProfile({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(progressStorageKey, JSON.stringify({ starsByProfile }));
  }, [starsByProfile]);

  useEffect(() => {
    if (!activeProfile) return;
    if (activeProfile.role === 'parent') switchToParent();
    else switchToChild();
  }, [activeProfile, switchToChild, switchToParent]);

  useEffect(() => {
    if (!isParentMode && activeModule === MODULES.LESSONS) {
      setActiveModule(MODULES.FLASHCARDS);
    }
  }, [activeModule, isParentMode]);

  const currentProfileKey = activeProfileId || mode;
  const currentStarsMap = starsByProfile[currentProfileKey] || {};

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
    if (!activeLesson || !currentCard || !currentProfileKey) return;

    const cardKey = getCardKey(activeLesson.id, currentCard.id);
    const earned = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;

    setStarsByProfile((prev) => {
      const map = prev[currentProfileKey] || {};
      const current = map[cardKey] ?? 0;
      return {
        ...prev,
        [currentProfileKey]: {
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

  const firstChildProfile = useMemo(
    () => profiles.find((profile) => profile.role === 'child') || null,
    [profiles],
  );

  const childMap =
    (firstChildProfile && starsByProfile[firstChildProfile.id]) ||
    starsByProfile['child-default'] ||
    starsByProfile.child ||
    {};

  const childLessonCompletion = activeLesson
    ? activeLesson.cards.filter((card) => (childMap[getCardKey(activeLesson.id, card.id)] ?? 0) > 0).length
    : 0;

  const resetChildLesson = () => {
    if (!activeLesson || !firstChildProfile) return;
    setStarsByProfile((prev) => {
      const key = firstChildProfile.id;
      const nextChild = { ...(prev[key] || {}) };
      activeLesson.cards.forEach((card) => {
        delete nextChild[getCardKey(activeLesson.id, card.id)];
      });
      return { ...prev, [key]: nextChild };
    });
  };

  const goToLanding = () => {
    setShowLandingAvatarEditor(false);
    setEnteredApp(false);
  };

  const openLessonPanel = () => {
    setShowLessonPicker((prev) => !prev);
  };

  const startWithProfile = (profileId) => {
    const profile = getProfileById(profileId);
    if (!profile) return;

    setActiveProfileId(profile.id);
    if (profile.role === 'parent') switchToParent();
    else switchToChild();

    setActiveModule(getDefaultModuleByRole(profile.role));
    setShowLandingAvatarEditor(false);
    setEnteredApp(true);
  };

  const switchProfile = (profileId) => {
    const profile = getProfileById(profileId);
    if (!profile) return;
    setActiveProfileId(profile.id);
    if (profile.role === 'parent') switchToParent();
    else switchToChild();
    setActiveModule((prev) => (profile.role === 'parent' ? prev : prev === MODULES.LESSONS ? MODULES.FLASHCARDS : prev));
    setShowProfilePicker(false);
  };

  const createAndSwitchProfile = () => {
    const newId = createProfile({ role: 'child', name: 'Nouveau profil' });
    switchProfile(newId);
  };

  if (!enteredApp) {
    return (
      <LandingPage
        profiles={profiles}
        showAvatarEditor={showLandingAvatarEditor}
        onToggleAvatarEditor={() => setShowLandingAvatarEditor((prev) => !prev)}
        avatarEditorContent={<AvatarEditor />}
        onStartProfile={startWithProfile}
      />
    );
  }

  return (
    <div className="app">
      {showAvatarEditorModal ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Editeur avatar"
          onClick={() => setShowAvatarEditorModal(false)}
        >
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <strong>Editeur Avatar</strong>
              <button
                type="button"
                className="button secondary button-sm"
                onClick={() => setShowAvatarEditorModal(false)}
              >
                Fermer
              </button>
            </div>
            <AvatarEditor />
          </div>
        </div>
      ) : null}

      <header className="app-header">
        <div className="header-brand">
          <button
            type="button"
            className="home-hanzi-btn"
            onClick={goToLanding}
            aria-label="Retour a la landing page"
            title="Retour accueil"
          >
            文
          </button>
          <div>
            <h1>{appTitle}</h1>
            <p className="subtitle">
              {isParentMode ? 'Mode parent: gestion et suivi' : 'Mode enfant: apprentissage'}
              {activeProfile ? ` · Profil: ${activeProfile.name}` : ''}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="button secondary button-sm" onClick={goToLanding}>
            Back
          </button>

          <div className="header-action-pop">
            <button
              type="button"
              className="button secondary button-sm"
              onClick={() => setShowProfilePicker((prev) => !prev)}
            >
              Profil: {activeProfile?.name || 'Aucun'}
            </button>
            {showProfilePicker ? (
              <div className="floating-profile-popover">
                <strong>Changer de profil</strong>
                <div className="floating-profile-list">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      className={`pill ${activeProfileId === profile.id ? 'active' : ''}`}
                      onClick={() => switchProfile(profile.id)}
                    >
                      {profile.name} ({profile.role === 'parent' ? 'Parent' : 'Kid'})
                    </button>
                  ))}
                </div>
                <button type="button" className="button secondary button-sm" onClick={createAndSwitchProfile}>
                  Nouveau profil
                </button>
              </div>
            ) : null}
          </div>

          <div className="header-action-pop">
            <button
              type="button"
              className="button secondary button-sm"
              onClick={openLessonPanel}
            >
              Lecon: {activeLesson?.title || 'Aucune'}
            </button>
            {showLessonPicker ? (
              <div className="floating-lesson-popover">
                <label htmlFor="header-lesson-select">Choisir une lecon</label>
                <select
                  id="header-lesson-select"
                  value={lessonId}
                  onChange={(event) => {
                    handleLessonChange(event);
                    setShowLessonPicker(false);
                  }}
                >
                  {lessonOptions.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

        </div>
      </header>

      <main className="content app-workspace">
        <aside className="profile-sidebar">
          <section className="profile-card">
            <div className="profile-avatar-wrap">
              <ModeAvatar onClick={() => setShowAvatarEditorModal(true)} />
            </div>
            <h3>{activeProfile?.name || 'Profil'}</h3>
            <p>{isParentMode ? 'Type: Parent' : 'Type: Kid'}</p>
          </section>

          <nav className="module-nav module-nav-vertical" aria-label="Navigation modules">
            {[
              { id: MODULES.LESSONS, label: 'Editeur de lecon', key: 'L', parentOnly: true },
              { id: MODULES.FLASHCARDS, label: 'Flashcard', key: 'F', parentOnly: false },
              { id: MODULES.AUDIO, label: 'Sound', key: 'S', parentOnly: false },
              { id: MODULES.WRITING, label: 'Ecriture', key: 'E', parentOnly: false },
            ]
              .filter((item) => !item.parentOnly || isParentMode)
              .map((item) => {
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`pill module-pill module-pill-row ${activeModule === item.id ? 'active' : ''}`}
                  onClick={() => setActiveModule(item.id)}
                >
                  <span className="module-icon" aria-hidden="true">
                    {item.key}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="module-content">
          {activeLesson && isParentMode && activeModule !== MODULES.LESSONS ? (
            <div className="progress-strip" aria-live="polite">
              <span>
                Progression ({activeProfile?.name || currentProfileKey}): {lessonCompletion}/{activeLesson.cards.length}
              </span>
              <span>Enfant: {childLessonCompletion}/{activeLesson.cards.length}</span>
              <span className={lessonComplete ? 'badge done' : 'badge'}>
                {lessonComplete ? 'Lecon terminee' : 'En cours'}
              </span>
            </div>
          ) : null}

          {activeModule === MODULES.LESSONS ? (
            <section className="parent-panel module-pane">
            <h3>Creation de lecon (Parent)</h3>
            <div className="parent-actions">
              <button
                type="button"
                className="button secondary"
                onClick={resetChildLesson}
                disabled={!activeLesson || !firstChildProfile}
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
          </section>
        ) : null}

          {activeModule === MODULES.FLASHCARDS && currentCard ? (
            <section className="module-pane">
              <Flashcard card={currentCard} earnedStars={earnedStars} />
            </section>
          ) : null}

          {activeModule === MODULES.AUDIO && currentCard ? (
            <section className="module-pane">
              <AudioPracticePanel cardKey={currentCardKey} mode={mode} />
            </section>
          ) : null}

          {activeModule === MODULES.WRITING && currentCard ? (
            <section className="module-pane">
              <WritingPractice hanzi={currentCard.hanzi} onSuccess={handleWritingSuccess} />
            </section>
          ) : null}

          {activeModule !== MODULES.LESSONS ? (
            currentCard ? (
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
            ) : (
              <p className="empty">Aucune carte disponible pour cette lecon.</p>
            )
          ) : null}
        </section>
      </main>
    </div>
  );
}
