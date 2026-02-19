import { useEffect, useMemo, useState } from 'react';
import AudioStandaloneUI from './components/AudioStandaloneUI.jsx';
import AvatarEditor from './components/AvatarEditor.jsx';
import BigSmileTester from './components/BigSmileTester.jsx';
import CoachMark from './components/CoachMark.jsx';
import DailyRituelFlow from './components/DailyRituelFlow.jsx';
import EmotionalDuoSystem from './components/EmotionalDuoSystem.jsx';
import AudioOnlyPage from './components/AudioOnlyPage.jsx';
import FlashcardOnlyPage from './components/FlashcardOnlyPage.jsx';
import FlashcardStandaloneUI from './components/FlashcardStandaloneUI.jsx';
import FTUEFlow from './components/FTUEFlow.jsx';
import LandingPage from './components/LandingPage.jsx';
import LessonEditor from './components/LessonEditor.jsx';
import ModeAvatar from './components/ModeAvatar.jsx';
import ParentModeDashboard from './components/ParentModeDashboard.jsx';
import ToonHeadTester from './components/ToonHeadTester.jsx';
import UnifiedLearningFlow from './components/UnifiedLearningFlow.jsx';
import WritingPractice from './components/WritingPractice.jsx';
import WritingOnlyPage from './components/WritingOnlyPage.jsx';
import { useAvatar } from './context/AvatarContext.jsx';
import { useLessons } from './context/LessonsContext.jsx';
import { useMode } from './context/ModeContext.jsx';
import {
  readFtueState,
  resetAllWiseMamaData,
  saveFtueState,
} from './lib/ftueStorage.js';

const appTitle = 'WiseMama - Apprendre le chinois';
const progressStorageKey = 'wisemama-progress-v1';
const tutorialStorageKey = 'wisemama-tutorial-v1';

const MODULES = {
  PARENT_HOME: 'parent-home',
  LESSONS: 'lessons',
  FLASHCARDS: 'flashcards',
  AUDIO: 'audio',
  WRITING: 'writing',
  LEARNING_FLOW: 'learning-flow',
  EMOTIONAL_DUO: 'emotional-duo',
  BIG_SMILE: 'big-smile',
  TOON_HEAD: 'toon-head',
};

function getCardKey(lessonId, cardId) {
  return `${lessonId}:${cardId}`;
}

function getDefaultModuleByRole(role) {
  return role === 'parent' ? MODULES.PARENT_HOME : MODULES.FLASHCARDS;
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
    setProfileName,
    setProfileAvatar,
  } = useAvatar();
  const {
    lessons: lessonOptions,
    createLesson,
    updateLesson,
    removeLesson,
    duplicateLesson,
  } = useLessons();
  const [lessonId, setLessonId] = useState(lessonOptions[0]?.id ?? '');
  const activeLesson = lessonOptions.find((lesson) => lesson.id === lessonId);
  const [cardIndex, setCardIndex] = useState(0);
  const [starsByProfile, setStarsByProfile] = useState({});
  const [enteredApp, setEnteredApp] = useState(false);
  const [showWritingOnlyPage, setShowWritingOnlyPage] = useState(false);
  const [showFlashcardOnlyPage, setShowFlashcardOnlyPage] = useState(false);
  const [showAudioOnlyPage, setShowAudioOnlyPage] = useState(false);
  const [showUnifiedFlowOnlyPage, setShowUnifiedFlowOnlyPage] = useState(false);
  const [unifiedFlowStepIndex, setUnifiedFlowStepIndex] = useState(0);
  const [showLandingAvatarEditor, setShowLandingAvatarEditor] = useState(false);
  const [activeModule, setActiveModule] = useState(MODULES.LESSONS);
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [showAvatarEditorModal, setShowAvatarEditorModal] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [ftueState, setFtueState] = useState(() => readFtueState());
  const [showFtue, setShowFtue] = useState(() => !readFtueState().completed);
  const [showDailyRituel, setShowDailyRituel] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(tutorialStorageKey) || '{}');
      return !parsed.completed;
    } catch {
      return true;
    }
  });
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialSteps = useMemo(
    () => [
      {
        id: 'listen',
        module: MODULES.FLASHCARDS,
        selector: '[data-coach="listen"]',
        title: 'Ecoute',
        description: 'Appuie sur Ecouter pour entendre la prononciation.',
      },
      {
        id: 'speak',
        module: MODULES.AUDIO,
        selector: '[data-coach="speak"]',
        title: 'Parle',
        description: 'Enregistre ta voix pour comparer avec le modele.',
      },
      {
        id: 'write',
        module: MODULES.WRITING,
        selector: '[data-coach="write"]',
        title: 'Ecris',
        description: 'Trace le caractere puis verifie ton geste.',
      },
      {
        id: 'continue',
        module: MODULES.FLASHCARDS,
        selector: '[data-coach="continue"]',
        title: 'Continue',
        description: 'Passe a la carte suivante pour continuer la lecon.',
      },
    ],
    [],
  );

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
    if (
      !isParentMode &&
      (activeModule === MODULES.LESSONS || activeModule === MODULES.PARENT_HOME)
    ) {
      setActiveModule(MODULES.FLASHCARDS);
    }
  }, [activeModule, isParentMode]);

  useEffect(() => {
    if (!enteredApp || showFtue || isParentMode || showWritingOnlyPage) return;
    if (!showTutorial) return;
    const firstLessonId = lessonOptions[0]?.id;
    if (!firstLessonId || activeLesson?.id !== firstLessonId) return;
    const step = tutorialSteps[tutorialStep];
    if (step && activeModule !== step.module) {
      setActiveModule(step.module);
    }
  }, [
    enteredApp,
    showFtue,
    isParentMode,
    showWritingOnlyPage,
    showTutorial,
    activeLesson?.id,
    activeModule,
    tutorialStep,
    tutorialSteps,
    lessonOptions,
  ]);

  useEffect(() => {
    if (showFtue) {
      setEnteredApp(false);
    }
  }, [showFtue]);

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
    setShowDailyRituel(false);
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
    setShowDailyRituel(false);
    setEnteredApp(true);
  };

  const switchProfile = (profileId) => {
    const profile = getProfileById(profileId);
    if (!profile) return;
    setActiveProfileId(profile.id);
    if (profile.role === 'parent') switchToParent();
    else switchToChild();
    setShowDailyRituel(false);
    setActiveModule(getDefaultModuleByRole(profile.role));
    setShowProfilePicker(false);
  };

  const openDailyRituelFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    setShowLandingAvatarEditor(false);
    setShowFlashcardOnlyPage(false);
    setShowAudioOnlyPage(false);
    setShowUnifiedFlowOnlyPage(false);
    setShowWritingOnlyPage(false);
    setShowDailyRituel(true);
    setEnteredApp(true);
  };

  const openStandaloneModule = (moduleId) => {
    setShowWritingOnlyPage(moduleId === MODULES.WRITING);
    setShowFlashcardOnlyPage(moduleId === MODULES.FLASHCARDS);
    setShowAudioOnlyPage(moduleId === MODULES.AUDIO);
    setShowUnifiedFlowOnlyPage(moduleId === MODULES.LEARNING_FLOW);
    setShowDailyRituel(false);
    setShowLandingAvatarEditor(false);
    setEnteredApp(false);
    setActiveModule(moduleId);
  };

  const openUnifiedFlowFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    openStandaloneModule(MODULES.LEARNING_FLOW);
  };

  const openFlashcardsFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    openStandaloneModule(MODULES.FLASHCARDS);
  };

  const openAudioFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    openStandaloneModule(MODULES.AUDIO);
  };

  const openWritingFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    openStandaloneModule(MODULES.WRITING);
  };

  const createAndSwitchProfile = () => {
    const newId = createProfile({ role: 'child', name: 'Nouveau profil' });
    switchProfile(newId);
  };

  const handleFtueComplete = ({ childName, childAvatarPlaceholder, companionPlaceholder }) => {
    const child = profiles.find((profile) => profile.role === 'child');
    const parent = profiles.find((profile) => profile.role === 'parent');
    if (child) {
      setProfileName(child.id, childName || 'Enfant');
      setActiveProfileId(child.id);
      setProfileAvatar(child.id, {
        ...child.avatar,
        seed: `child-${(childName || 'kid').toLowerCase().replace(/\s+/g, '-')}`,
      });
    }
    if (parent) {
      setProfileAvatar(parent.id, {
        ...parent.avatar,
        seed: `parent-${companionPlaceholder || 'guide'}`,
      });
    }
    const nextFtue = saveFtueState({
      completed: true,
      childName,
      childAvatarPlaceholder,
      companionPlaceholder,
    });
    setFtueState(nextFtue);
    setShowFtue(false);
    switchToChild();
  };

  const handleResetAllData = async () => {
    const ok = window.confirm('Toutes les données seront effacées. Continuer ?');
    if (!ok) return;
    setIsResetting(true);
    try {
      await resetAllWiseMamaData();
      setShowSettingsPanel(false);
      window.location.reload();
    } finally {
      setIsResetting(false);
    }
  };

  const completeTutorial = () => {
    localStorage.setItem(tutorialStorageKey, JSON.stringify({ completed: true }));
    setShowTutorial(false);
  };

  const restartTutorial = () => {
    localStorage.setItem(tutorialStorageKey, JSON.stringify({ completed: false }));
    setTutorialStep(0);
    setShowTutorial(true);
    setActiveModule(MODULES.FLASHCARDS);
    setShowSettingsPanel(false);
  };

  const handleResetFtueAndTutorial = () => {
    const ok = window.confirm('Reinitialiser FTUE et tutoriel ?');
    if (!ok) return;

    const resetFtue = saveFtueState({
      completed: false,
      childName: '',
      childAvatarPlaceholder: '🦊',
      companionPlaceholder: '🐼',
    });
    setFtueState(resetFtue);

    localStorage.setItem(tutorialStorageKey, JSON.stringify({ completed: false }));
    setTutorialStep(0);
    setShowTutorial(true);

    setShowLandingAvatarEditor(false);
    setShowDailyRituel(false);
    setShowWritingOnlyPage(false);
    setShowFlashcardOnlyPage(false);
    setShowAudioOnlyPage(false);
    setShowUnifiedFlowOnlyPage(false);
    setEnteredApp(false);
    setShowFtue(true);
  };

  const handleTutorialNext = () => {
    if (tutorialStep >= tutorialSteps.length - 1) {
      completeTutorial();
      return;
    }
    setTutorialStep((prev) => prev + 1);
  };

  if (showWritingOnlyPage) {
    return (
      <WritingOnlyPage
        profile={activeProfile}
        lessons={lessonOptions}
        lessonId={lessonId}
        onLessonChange={(id) => {
          setLessonId(id);
          setCardIndex(0);
        }}
        cardIndex={cardIndex}
        totalCards={totalCards}
        onPrev={goPrev}
        onNext={goNext}
        onBack={() => {
          setShowWritingOnlyPage(false);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === MODULES.FLASHCARDS) {
            openStandaloneModule(MODULES.FLASHCARDS);
            return;
          }
          if (module === MODULES.AUDIO) {
            openStandaloneModule(MODULES.AUDIO);
            return;
          }
          if (module === MODULES.LEARNING_FLOW) {
            openStandaloneModule(MODULES.LEARNING_FLOW);
            return;
          }
          setActiveModule(MODULES.WRITING);
        }}
        onSuccess={handleWritingSuccess}
      />
    );
  }

  if (showFlashcardOnlyPage) {
    return (
      <FlashcardOnlyPage
        profile={activeProfile}
        lessons={lessonOptions}
        lessonId={lessonId}
        onLessonChange={(id) => {
          setLessonId(id);
          setCardIndex(0);
        }}
        cardIndex={cardIndex}
        totalCards={totalCards}
        earnedStars={earnedStars}
        onPrev={goPrev}
        onNext={goNext}
        onBack={() => {
          setShowFlashcardOnlyPage(false);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === MODULES.WRITING) {
            openStandaloneModule(MODULES.WRITING);
            return;
          }
          if (module === MODULES.AUDIO) {
            openStandaloneModule(MODULES.AUDIO);
            return;
          }
          if (module === MODULES.LEARNING_FLOW) {
            openStandaloneModule(MODULES.LEARNING_FLOW);
            return;
          }
          setActiveModule(MODULES.FLASHCARDS);
        }}
      />
    );
  }

  if (showAudioOnlyPage) {
    return (
      <AudioOnlyPage
        profile={activeProfile}
        mode={mode}
        lessons={lessonOptions}
        lessonId={lessonId}
        onLessonChange={(id) => {
          setLessonId(id);
          setCardIndex(0);
        }}
        cardIndex={cardIndex}
        totalCards={totalCards}
        cardKey={currentCardKey}
        onPrev={goPrev}
        onNext={goNext}
        onBack={() => {
          setShowAudioOnlyPage(false);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === MODULES.WRITING) {
            openStandaloneModule(MODULES.WRITING);
            return;
          }
          if (module === MODULES.FLASHCARDS) {
            openStandaloneModule(MODULES.FLASHCARDS);
            return;
          }
          if (module === MODULES.LEARNING_FLOW) {
            openStandaloneModule(MODULES.LEARNING_FLOW);
            return;
          }
          setActiveModule(MODULES.AUDIO);
        }}
      />
    );
  }

  if (showUnifiedFlowOnlyPage) {
    if (!activeLesson || !currentCard) {
      return (
        <section className="writing-only-page">
          <p className="empty">Aucune carte disponible.</p>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setShowUnifiedFlowOnlyPage(false);
              setEnteredApp(false);
            }}
          >
            Retour
          </button>
        </section>
      );
    }

    return (
      <section className="module-pane">
        <UnifiedLearningFlow
          profile={activeProfile}
          lesson={activeLesson}
          cardIndex={cardIndex}
          initialStepIndex={unifiedFlowStepIndex}
          onStepIndexChange={setUnifiedFlowStepIndex}
          onPrevCard={goPrev}
          onNextCard={goNext}
          onBackHome={() => {
            setShowUnifiedFlowOnlyPage(false);
            setEnteredApp(false);
          }}
          onSwitchModule={(module) => {
            if (module === MODULES.FLASHCARDS) {
              openStandaloneModule(MODULES.FLASHCARDS);
              return;
            }
            if (module === MODULES.AUDIO) {
              openStandaloneModule(MODULES.AUDIO);
              return;
            }
            if (module === MODULES.WRITING) {
              openStandaloneModule(MODULES.WRITING);
            }
          }}
          onWritingSuccess={handleWritingSuccess}
        />
      </section>
    );
  }

  if (showFtue) {
    return (
      <FTUEFlow
        initialName={ftueState.childName}
        initialChildAvatar={ftueState.childAvatarPlaceholder}
        initialCompanion={ftueState.companionPlaceholder}
        onComplete={handleFtueComplete}
      />
    );
  }

  if (!enteredApp) {
    return (
      <LandingPage
        profiles={profiles}
        onOpenDailyRituel={openDailyRituelFromLanding}
        onOpenUnifiedFlow={openUnifiedFlowFromLanding}
        onOpenFlashcardsUi={openFlashcardsFromLanding}
        onOpenAudioUi={openAudioFromLanding}
        onOpenWritingUi={openWritingFromLanding}
        onResetOnboarding={handleResetFtueAndTutorial}
        showAvatarEditor={showLandingAvatarEditor}
        onToggleAvatarEditor={() => setShowLandingAvatarEditor((prev) => !prev)}
        avatarEditorContent={<AvatarEditor />}
        onStartProfile={startWithProfile}
      />
    );
  }

  if (enteredApp && !isParentMode && showDailyRituel) {
    return (
      <DailyRituelFlow
        childName={activeProfile?.name || 'Enfant'}
        childAvatar="🦊"
        parentAvatar="🧑"
        onBackHome={goToLanding}
        onStartLesson={() => {
          setShowDailyRituel(false);
          setActiveModule(MODULES.FLASHCARDS);
          setCardIndex(0);
        }}
      />
    );
  }

  if (enteredApp && isParentMode) {
    return (
      <section className="module-pane">
        <ParentModeDashboard
          lessons={lessonOptions}
          profiles={profiles}
          onBack={goToLanding}
          onSave={() => setShowSettingsPanel(false)}
          onCreateLesson={createLesson}
          onUpdateLesson={updateLesson}
          onDeleteLesson={removeLesson}
          onDuplicateLesson={duplicateLesson}
        />
      </section>
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

          {isParentMode ? (
            <div className="header-action-pop">
              <button
                type="button"
                className="button secondary button-sm"
                onClick={() => setShowSettingsPanel((prev) => !prev)}
              >
                Settings
              </button>
              {showSettingsPanel ? (
                <div className="floating-profile-popover">
                  <strong>Parametres parent</strong>
                  <p className="settings-note">Tu peux relancer l onboarding enfant a tout moment.</p>
                  <button
                    type="button"
                    className="button"
                    onClick={handleResetAllData}
                    disabled={isResetting}
                  >
                    {isResetting ? 'Reinitialisation...' : 'Reinitialiser donnees + FTUE'}
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={restartTutorial}
                  >
                    Relancer tutoriel lecon 1
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

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
              { id: MODULES.PARENT_HOME, label: 'Espace parent', key: 'P', parentOnly: true },
              { id: MODULES.LESSONS, label: 'Editeur de lecon', key: 'L', parentOnly: true },
              { id: MODULES.FLASHCARDS, label: 'Flashcard', key: 'F', parentOnly: false },
              { id: MODULES.AUDIO, label: 'Sound', key: 'S', parentOnly: false },
              { id: MODULES.WRITING, label: 'Ecriture', key: 'E', parentOnly: false },
              { id: MODULES.LEARNING_FLOW, label: 'Parcours complet', key: 'U', parentOnly: false },
              { id: MODULES.EMOTIONAL_DUO, label: 'Duo emotions', key: 'D', parentOnly: false },
              { id: MODULES.BIG_SMILE, label: 'Big Smile test', key: 'B', parentOnly: true },
              { id: MODULES.TOON_HEAD, label: 'Toon Head test', key: 'T', parentOnly: true },
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

          {activeModule === MODULES.PARENT_HOME && isParentMode ? (
            <section className="module-pane">
              <ParentModeDashboard
                lessons={lessonOptions}
                profiles={profiles}
                onBack={goToLanding}
                onSave={() => setShowSettingsPanel(false)}
                onCreateLesson={createLesson}
                onUpdateLesson={updateLesson}
                onDeleteLesson={removeLesson}
                onDuplicateLesson={duplicateLesson}
              />
            </section>
          ) : null}

          {activeModule === MODULES.FLASHCARDS && currentCard ? (
            <section className="module-pane">
              <FlashcardStandaloneUI
                profile={activeProfile}
                lessonTitle={activeLesson?.title}
                card={currentCard}
                cardIndex={cardIndex}
                totalCards={totalCards}
                earnedStars={earnedStars}
                onPrev={goPrev}
                onNext={goNext}
                onOpenLessonPicker={() => setShowLessonPicker(true)}
                onSwitchModule={setActiveModule}
                onBack={goToLanding}
              />
            </section>
          ) : null}

          {activeModule === MODULES.AUDIO && currentCard ? (
            <section className="module-pane">
              <AudioStandaloneUI
                profile={activeProfile}
                lessonTitle={activeLesson?.title}
                card={currentCard}
                cardIndex={cardIndex}
                totalCards={totalCards}
                mode={mode}
                cardKey={currentCardKey}
                onPrev={goPrev}
                onNext={goNext}
                onOpenLessonPicker={() => setShowLessonPicker(true)}
                onSwitchModule={setActiveModule}
                onBack={goToLanding}
              />
            </section>
          ) : null}

          {activeModule === MODULES.WRITING && currentCard ? (
            <section className="module-pane">
              <WritingPractice
                hanzi={currentCard.hanzi}
                card={currentCard}
                lessonTitle={activeLesson?.title}
                profile={activeProfile}
                cardIndex={cardIndex}
                totalCards={totalCards}
                onPrev={goPrev}
                onNext={goNext}
                onOpenLessonPicker={() => setShowLessonPicker(true)}
                onSwitchModule={setActiveModule}
                onSuccess={handleWritingSuccess}
              />
            </section>
          ) : null}

          {activeModule === MODULES.LEARNING_FLOW && activeLesson ? (
            <section className="module-pane">
              <UnifiedLearningFlow
                profile={activeProfile}
                lesson={activeLesson}
                cardIndex={cardIndex}
                initialStepIndex={unifiedFlowStepIndex}
                onStepIndexChange={setUnifiedFlowStepIndex}
                onPrevCard={goPrev}
                onNextCard={goNext}
                onBackHome={goToLanding}
                onSwitchModule={setActiveModule}
                onWritingSuccess={handleWritingSuccess}
              />
            </section>
          ) : null}

          {activeModule === MODULES.EMOTIONAL_DUO ? (
            <section className="module-pane">
              <EmotionalDuoSystem
                childProfile={profiles.find((profile) => profile.role === 'child') || activeProfile}
                parentProfile={profiles.find((profile) => profile.role === 'parent') || activeProfile}
                lessonProgress={
                  activeLesson?.cards?.length
                    ? Math.round((childLessonCompletion / activeLesson.cards.length) * 100)
                    : 0
                }
                weeklyStreak={Math.max(1, Math.ceil((childLessonCompletion || 0) / 2))}
              />
            </section>
          ) : null}

          {activeModule === MODULES.BIG_SMILE ? <BigSmileTester /> : null}

          {activeModule === MODULES.TOON_HEAD ? <ToonHeadTester /> : null}

          {activeModule !== MODULES.LESSONS &&
          activeModule !== MODULES.FLASHCARDS &&
          activeModule !== MODULES.AUDIO &&
          activeModule !== MODULES.WRITING &&
          activeModule !== MODULES.LEARNING_FLOW &&
          activeModule !== MODULES.EMOTIONAL_DUO &&
          activeModule !== MODULES.PARENT_HOME ? (
            currentCard ? (
              <div className="card-controls">
                <button className="button secondary" type="button" onClick={goPrev}>
                  Precedent
                </button>
                <span className="card-counter">
                  Carte {cardIndex + 1} / {totalCards}
                </span>
                <button className="button" type="button" onClick={goNext} data-coach="continue">
                  Suivant
                </button>
              </div>
            ) : (
              <p className="empty">Aucune carte disponible pour cette lecon.</p>
            )
          ) : null}
        </section>
      </main>

      <CoachMark
        open={
          enteredApp &&
          !showFtue &&
          !isParentMode &&
          !showDailyRituel &&
          !showWritingOnlyPage &&
          showTutorial &&
          activeLesson?.id === lessonOptions[0]?.id
        }
        stepIndex={tutorialStep}
        totalSteps={tutorialSteps.length}
        title={tutorialSteps[tutorialStep]?.title || ''}
        description={tutorialSteps[tutorialStep]?.description || ''}
        selector={tutorialSteps[tutorialStep]?.selector || ''}
        onPrev={() => setTutorialStep((prev) => Math.max(0, prev - 1))}
        onNext={handleTutorialNext}
        onSkip={completeTutorial}
      />
    </div>
  );
}
