import { useEffect, useMemo, useState } from 'react';
import AudioStandaloneUI from './components/AudioStandaloneUI.jsx';
import AvatarEditor from './components/AvatarEditor.jsx';
import BigSmileTester from './components/BigSmileTester.jsx';
import CoachMark from './components/CoachMark.jsx';
import ChineseFontTestPage from './components/ChineseFontTestPage.jsx';
import DailyRituelFlow from './components/DailyRituelFlow.jsx';
import EmotionalDuoSystem from './components/EmotionalDuoSystem.jsx';
import AudioOnlyPage from './components/AudioOnlyPage.jsx';
import FlashcardOnlyPage from './components/FlashcardOnlyPage.jsx';
import FlashcardStandaloneUI from './components/FlashcardStandaloneUI.jsx';
import FTUEFlow from './components/FTUEFlow.jsx';
import LandingPage from './components/LandingPage.jsx';
import LessonEditorBeta from './components/LessonEditorBeta.jsx';
import LessonSelectionPage from './components/LessonSelectionPage.jsx';
import LessonTextView from './components/LessonTextView.jsx';
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
import { applyHanziFontPreference, getHanziFontPreference } from './lib/hanziFont.js';

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

const STANDALONE_VIEW = {
  NONE: 'none',
  WRITING: 'writing',
  FLASHCARDS: 'flashcards',
  AUDIO: 'audio',
  LEARNING_FLOW: 'learning-flow',
  LESSON_BETA: 'lesson-beta',
  LESSON_SELECT: 'lesson-select',
  FONT_TEST: 'font-test',
};

function getCardKey(lessonId, cardId) {
  return `${lessonId}:${cardId}`;
}

function getLessonTextRouteId(pathname) {
  const match = pathname.match(/^\/lesson\/([^/]+)\/text\/?$/);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
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
    activeLessonId,
    setActiveLesson,
    ensureActiveLesson,
    createLesson,
    updateLesson,
    removeLesson,
    duplicateLesson,
  } = useLessons();
  const activeLesson = lessonOptions.find((lesson) => lesson.id === activeLessonId) || null;
  const [cardIndex, setCardIndex] = useState(0);
  const [starsByProfile, setStarsByProfile] = useState({});
  const [enteredApp, setEnteredApp] = useState(false);
  const [standaloneView, setStandaloneView] = useState(STANDALONE_VIEW.NONE);
  const [lessonTextLessonId, setLessonTextLessonId] = useState(() => getLessonTextRouteId(window.location.pathname));
  const [returnToLessonText, setReturnToLessonText] = useState(false);
  const [lessonJourneyQueue, setLessonJourneyQueue] = useState([]);
  const [lessonJourneyPosition, setLessonJourneyPosition] = useState(0);
  const [unifiedFlowStepIndex, setUnifiedFlowStepIndex] = useState(0);
  const [activeModule, setActiveModule] = useState(MODULES.LESSONS);
  const [showAvatarEditorModal, setShowAvatarEditorModal] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [ftueState, setFtueState] = useState(() => readFtueState());
  const [showFtue, setShowFtue] = useState(() => !readFtueState().completed);
  const [showDailyRituel, setShowDailyRituel] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      const raw = localStorage.getItem(tutorialStorageKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw || '{}');
      return !parsed.completed;
    } catch {
      return false;
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
    applyHanziFontPreference(getHanziFontPreference());
  }, []);

  useEffect(() => {
    try {
      const ftueRaw = localStorage.getItem('wisemama-ftue-v1');
      if (!ftueRaw) {
        localStorage.setItem(
          'wisemama-ftue-v1',
          JSON.stringify({ completed: true, childName: 'Eli', updatedAt: new Date().toISOString() }),
        );
        setFtueState((prev) => ({ ...prev, completed: true, childName: 'Eli' }));
        setShowFtue(false);
      }
      const tutorialRaw = localStorage.getItem(tutorialStorageKey);
      if (!tutorialRaw) {
        localStorage.setItem(tutorialStorageKey, JSON.stringify({ completed: true }));
        setShowTutorial(false);
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    ensureActiveLesson();
  }, [ensureActiveLesson, lessonOptions.length]);

  useEffect(() => {
    if (!lessonTextLessonId) return;
    const exists = lessonOptions.some((lesson) => lesson.id === lessonTextLessonId);
    if (exists && activeLessonId !== lessonTextLessonId) {
      setActiveLesson(lessonTextLessonId);
      setCardIndex(0);
    }
  }, [activeLessonId, lessonOptions, lessonTextLessonId, setActiveLesson]);

  useEffect(() => {
    setCardIndex(0);
  }, [activeLessonId]);

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
    if (!enteredApp || showFtue || isParentMode || standaloneView !== STANDALONE_VIEW.NONE) return;
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
    standaloneView,
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
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.NONE);
    setEnteredApp(false);
  };

  const startWithProfile = (profileId) => {
    const profile = getProfileById(profileId);
    if (!profile) return;

    setActiveProfileId(profile.id);
    if (profile.role === 'parent') switchToParent();
    else switchToChild();

    setActiveModule(getDefaultModuleByRole(profile.role));
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
    setStandaloneView(STANDALONE_VIEW.NONE);
    setShowDailyRituel(true);
    setEnteredApp(true);
  };

  const openStandaloneModule = (viewId, moduleId) => {
    setStandaloneView(viewId);
    setShowDailyRituel(false);
    setEnteredApp(false);
    setReturnToLessonText(false);
    setLessonJourneyQueue([]);
    setLessonJourneyPosition(0);
    setActiveModule(moduleId);
  };

  useEffect(() => {
    const onPopState = () => {
      const routeLessonId = getLessonTextRouteId(window.location.pathname);
      setLessonTextLessonId(routeLessonId);
      if (routeLessonId) {
        setActiveLesson(routeLessonId);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setActiveLesson]);

  const openLessonTextView = (targetLessonId) => {
    if (!targetLessonId) return;
    setShowDailyRituel(false);
    setReturnToLessonText(false);
    setLessonJourneyQueue([]);
    setLessonJourneyPosition(0);
    setStandaloneView(STANDALONE_VIEW.NONE);
    setEnteredApp(false);
    setActiveLesson(targetLessonId);
    setLessonTextLessonId(targetLessonId);
    const nextPath = `/lesson/${encodeURIComponent(targetLessonId)}/text`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  };

  const closeLessonTextView = () => {
    setLessonTextLessonId('');
    setReturnToLessonText(false);
    setLessonJourneyQueue([]);
    setLessonJourneyPosition(0);
    if (getLessonTextRouteId(window.location.pathname)) {
      window.history.pushState({}, '', '/');
    }
  };

  const openCharacterPracticeFromLessonText = (char) => {
    const targetLesson = lessonOptions.find((lesson) => lesson.id === lessonTextLessonId);
    if (!targetLesson || !char) return;
    const queue = targetLesson.cards.map((_, idx) => idx);
    const targetCardIndex = targetLesson.cards.findIndex((card) => (card?.hanzi || '').includes(char));
    if (targetCardIndex < 0) return;
    setActiveLesson(targetLesson.id);
    setCardIndex(targetCardIndex);
    setLessonJourneyQueue(queue);
    setLessonJourneyPosition(targetCardIndex);
    setUnifiedFlowStepIndex(0);
    setReturnToLessonText(true);
    setStandaloneView(STANDALONE_VIEW.LEARNING_FLOW);
  };

  const openLessonTextFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.NONE);
    setEnteredApp(false);
    const targetLessonId = activeLessonId || ensureActiveLesson() || '';
    if (targetLessonId) {
      openLessonTextView(targetLessonId);
    }
  };

  const startJourneyFromLessonText = (char) => {
    const targetLesson = lessonOptions.find((lesson) => lesson.id === lessonTextLessonId);
    if (!targetLesson) return;
    const queue = targetLesson.cards.map((_, idx) => idx);
    let startIndex = 0;
    if (char) {
      const idx = targetLesson.cards.findIndex((card) => (card?.hanzi || '').includes(char));
      if (idx >= 0) startIndex = idx;
    }
    setActiveLesson(targetLesson.id);
    setCardIndex(startIndex);
    setLessonJourneyQueue(queue);
    setLessonJourneyPosition(startIndex);
    setUnifiedFlowStepIndex(0);
    setReturnToLessonText(true);
    setStandaloneView(STANDALONE_VIEW.LEARNING_FLOW);
  };

  const goNextInLessonJourney = () => {
    if (!lessonJourneyQueue.length) {
      goNext();
      return;
    }
    const nextPos = lessonJourneyPosition + 1;
    if (nextPos >= lessonJourneyQueue.length) {
      setStandaloneView(STANDALONE_VIEW.NONE);
      setReturnToLessonText(false);
      return;
    }
    const nextCardIndex = lessonJourneyQueue[nextPos];
    setLessonJourneyPosition(nextPos);
    setCardIndex(nextCardIndex);
  };

  const goPrevInLessonJourney = () => {
    if (!lessonJourneyQueue.length) {
      goPrev();
      return;
    }
    const prevPos = lessonJourneyPosition - 1;
    if (prevPos < 0) return;
    const prevCardIndex = lessonJourneyQueue[prevPos];
    setLessonJourneyPosition(prevPos);
    setCardIndex(prevCardIndex);
  };

  const openLessonSelectionFromLanding = () => {
    setStandaloneView(STANDALONE_VIEW.LESSON_SELECT);
    setShowDailyRituel(false);
    setEnteredApp(false);
  };

  const openFlashcardsFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    openStandaloneModule(STANDALONE_VIEW.FLASHCARDS, MODULES.FLASHCARDS);
  };

  const openAudioFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    openStandaloneModule(STANDALONE_VIEW.AUDIO, MODULES.AUDIO);
  };

  const openWritingFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    openStandaloneModule(STANDALONE_VIEW.WRITING, MODULES.WRITING);
  };

  const openFontTestFromLanding = () => {
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.FONT_TEST);
    setEnteredApp(false);
  };

  const createAndSwitchProfile = () => {
    const newId = createProfile({ role: 'child', name: 'Nouveau profil' });
    switchProfile(newId);
  };

  const handleFtueComplete = ({
    childName,
    childAvatarConfig,
    companionAvatarConfig,
    childAvatarPlaceholder,
    companionPlaceholder,
  }) => {
    const child = profiles.find((profile) => profile.role === 'child');
    const parent = profiles.find((profile) => profile.role === 'parent');
    if (child) {
      setProfileName(child.id, childName || 'Enfant');
      setActiveProfileId(child.id);
      setProfileAvatar(
        child.id,
        childAvatarConfig || {
          ...child.avatar,
          style: 'big-smile',
          seed: `child-${(childName || 'default-kid').toLowerCase().replace(/\s+/g, '-')}`,
        },
      );
    }
    if (parent) {
      setProfileAvatar(
        parent.id,
        companionAvatarConfig || {
          ...parent.avatar,
          style: 'adventurer',
          seed: `parent-${companionPlaceholder || 'default-adult'}`,
        },
      );
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

    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.NONE);
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

  if (!showFtue && lessonTextLessonId && standaloneView === STANDALONE_VIEW.NONE) {
    const lessonForText = lessonOptions.find((lesson) => lesson.id === lessonTextLessonId);
    if (lessonForText) {
      return (
        <LessonTextView
          lesson={lessonForText}
          lessons={lessonOptions}
          profile={activeProfile}
          progressMap={currentStarsMap}
          onSelectLesson={(lessonId) => {
            if (!lessonId) return;
            setActiveLesson(lessonId);
            setCardIndex(0);
            openLessonTextView(lessonId);
          }}
          onPracticeCharacter={openCharacterPracticeFromLessonText}
          onBack={closeLessonTextView}
          onStartPractice={startJourneyFromLessonText}
        />
      );
    }
  }

  if (standaloneView === STANDALONE_VIEW.WRITING) {
    return (
      <WritingOnlyPage
        profile={activeProfile}
        activeLesson={activeLesson}
        lessons={lessonOptions}
        cardIndex={cardIndex}
        onPrev={goPrev}
        onNext={goNext}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onOpenLessonText={(lessonId) => {
          const targetId = lessonId || activeLesson?.id;
          if (targetId) openLessonTextView(targetId);
        }}
        onSelectLesson={(lessonId) => {
          if (!lessonId) return;
          setActiveLesson(lessonId);
          setCardIndex(0);
        }}
        onSwitchModule={(module) => {
          if (module === MODULES.FLASHCARDS) {
            openStandaloneModule(STANDALONE_VIEW.FLASHCARDS, MODULES.FLASHCARDS);
            return;
          }
          if (module === MODULES.AUDIO) {
            openStandaloneModule(STANDALONE_VIEW.AUDIO, MODULES.AUDIO);
            return;
          }
          if (module === MODULES.LEARNING_FLOW) {
            openStandaloneModule(STANDALONE_VIEW.LEARNING_FLOW, MODULES.LEARNING_FLOW);
            return;
          }
          setActiveModule(MODULES.WRITING);
        }}
        onSuccess={handleWritingSuccess}
      />
    );
  }

  if (standaloneView === STANDALONE_VIEW.FLASHCARDS) {
    return (
      <FlashcardOnlyPage
        profile={activeProfile}
        activeLesson={activeLesson}
        lessons={lessonOptions}
        cardIndex={cardIndex}
        earnedStars={earnedStars}
        onPrev={goPrev}
        onNext={goNext}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onOpenLessonText={(lessonId) => {
          const targetId = lessonId || activeLesson?.id;
          if (targetId) openLessonTextView(targetId);
        }}
        onSelectLesson={(lessonId) => {
          if (!lessonId) return;
          setActiveLesson(lessonId);
          setCardIndex(0);
        }}
        onSwitchModule={(module) => {
          if (module === MODULES.WRITING) {
            openStandaloneModule(STANDALONE_VIEW.WRITING, MODULES.WRITING);
            return;
          }
          if (module === MODULES.AUDIO) {
            openStandaloneModule(STANDALONE_VIEW.AUDIO, MODULES.AUDIO);
            return;
          }
          if (module === MODULES.LEARNING_FLOW) {
            openStandaloneModule(STANDALONE_VIEW.LEARNING_FLOW, MODULES.LEARNING_FLOW);
            return;
          }
          setActiveModule(MODULES.FLASHCARDS);
        }}
      />
    );
  }

  if (standaloneView === STANDALONE_VIEW.AUDIO) {
    return (
      <AudioOnlyPage
        profile={activeProfile}
        mode={mode}
        activeLesson={activeLesson}
        lessons={lessonOptions}
        cardIndex={cardIndex}
        cardKey={currentCardKey}
        onPrev={goPrev}
        onNext={goNext}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onOpenLessonText={(lessonId) => {
          const targetId = lessonId || activeLesson?.id;
          if (targetId) openLessonTextView(targetId);
        }}
        onSelectLesson={(lessonId) => {
          if (!lessonId) return;
          setActiveLesson(lessonId);
          setCardIndex(0);
        }}
        onSwitchModule={(module) => {
          if (module === MODULES.WRITING) {
            openStandaloneModule(STANDALONE_VIEW.WRITING, MODULES.WRITING);
            return;
          }
          if (module === MODULES.FLASHCARDS) {
            openStandaloneModule(STANDALONE_VIEW.FLASHCARDS, MODULES.FLASHCARDS);
            return;
          }
          if (module === MODULES.LEARNING_FLOW) {
            openStandaloneModule(STANDALONE_VIEW.LEARNING_FLOW, MODULES.LEARNING_FLOW);
            return;
          }
          setActiveModule(MODULES.AUDIO);
        }}
      />
    );
  }

  if (standaloneView === STANDALONE_VIEW.LEARNING_FLOW) {
    if (!activeLesson || !currentCard) {
      return (
        <section className="writing-only-page">
          <p className="empty">Aucune carte disponible.</p>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setStandaloneView(STANDALONE_VIEW.NONE);
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
          lessons={lessonOptions}
          cardIndex={cardIndex}
          initialStepIndex={unifiedFlowStepIndex}
          onStepIndexChange={setUnifiedFlowStepIndex}
          onPrevCard={returnToLessonText ? goPrevInLessonJourney : goPrev}
          onNextCard={returnToLessonText ? goNextInLessonJourney : goNext}
          journeyMode={returnToLessonText}
          journeyPosition={lessonJourneyPosition}
          journeyTotal={lessonJourneyQueue.length || totalCards}
          onOpenLessonText={(lessonId) => {
            const targetId = lessonId || activeLesson?.id;
            if (targetId) openLessonTextView(targetId);
          }}
          onSelectLesson={(lessonId) => {
            if (!lessonId) return;
            setActiveLesson(lessonId);
            setCardIndex(0);
          }}
          onBackHome={() => {
            if (returnToLessonText && lessonTextLessonId) {
              setStandaloneView(STANDALONE_VIEW.NONE);
              return;
            }
            setStandaloneView(STANDALONE_VIEW.NONE);
            setEnteredApp(false);
          }}
          onSwitchModule={(module) => {
            if (module === MODULES.FLASHCARDS) {
              openStandaloneModule(STANDALONE_VIEW.FLASHCARDS, MODULES.FLASHCARDS);
              return;
            }
            if (module === MODULES.AUDIO) {
              openStandaloneModule(STANDALONE_VIEW.AUDIO, MODULES.AUDIO);
              return;
            }
            if (module === MODULES.WRITING) {
              openStandaloneModule(STANDALONE_VIEW.WRITING, MODULES.WRITING);
            }
          }}
          onWritingSuccess={handleWritingSuccess}
        />
      </section>
    );
  }

  if (standaloneView === STANDALONE_VIEW.LESSON_BETA) {
    return (
      <LessonEditorBeta
        onBack={() => setStandaloneView(STANDALONE_VIEW.NONE)}
        onSelectLesson={(id) => {
          if (!id) return;
          setActiveLesson(id);
          setCardIndex(0);
        }}
      />
    );
  }

  if (standaloneView === STANDALONE_VIEW.LESSON_SELECT) {
    return (
      <LessonSelectionPage
        lessons={lessonOptions}
        activeLessonId={activeLessonId || ''}
        onSelectLesson={(id) => {
          setActiveLesson(id);
          setCardIndex(0);
          setStandaloneView(STANDALONE_VIEW.NONE);
        }}
        onBack={() => setStandaloneView(STANDALONE_VIEW.NONE)}
      />
    );
  }

  if (standaloneView === STANDALONE_VIEW.FONT_TEST) {
    return (
      <ChineseFontTestPage
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
      />
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
        lessons={lessonOptions}
        activeLessonId={activeLessonId || ''}
        activeLesson={activeLesson}
        lessonProgressMap={childMap}
        onOpenDailyRituel={openDailyRituelFromLanding}
        onSelectLesson={(id) => {
          setActiveLesson(id);
          setCardIndex(0);
        }}
        onOpenLessonTextUi={openLessonTextFromLanding}
        onOpenFlashcardsUi={openFlashcardsFromLanding}
        onOpenAudioUi={openAudioFromLanding}
        onOpenWritingUi={openWritingFromLanding}
        onOpenAvatarEditor={() => setShowAvatarEditorModal(true)}
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
          onSelectLesson={(id) => {
            if (!id) return;
            setActiveLesson(id);
            setCardIndex(0);
          }}
          onBack={goToLanding}
          onSave={() => setShowSettingsPanel(false)}
          onCreateLesson={createLesson}
          onUpdateLesson={updateLesson}
          onDeleteLesson={removeLesson}
          onDuplicateLesson={duplicateLesson}
          onResetFtueAndTutorial={handleResetFtueAndTutorial}
          onRestartTutorial={restartTutorial}
          onResetAllData={handleResetAllData}
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

          <button type="button" className="button secondary button-sm" onClick={openLessonSelectionFromLanding}>
            Lecon: {activeLesson?.title || 'Aucune'}
          </button>

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
              { id: MODULES.LEARNING_FLOW, label: 'Parcours complet', key: 'U', parentOnly: false, childHidden: true },
              { id: MODULES.EMOTIONAL_DUO, label: 'Duo emotions', key: 'D', parentOnly: false },
              { id: MODULES.BIG_SMILE, label: 'Big Smile test', key: 'B', parentOnly: true },
              { id: MODULES.TOON_HEAD, label: 'Toon Head test', key: 'T', parentOnly: true },
            ]
              .filter((item) => (!item.parentOnly || isParentMode) && (isParentMode || !item.childHidden))
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
              <LessonEditorBeta
                onSelectLesson={(id) => {
                  if (!id) return;
                  setActiveLesson(id);
                  setCardIndex(0);
                }}
              />
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
            </section>
          ) : null}

          {activeModule === MODULES.PARENT_HOME && isParentMode ? (
            <section className="module-pane">
              <ParentModeDashboard
                lessons={lessonOptions}
                profiles={profiles}
                onSelectLesson={(id) => {
                  if (!id) return;
                  setActiveLesson(id);
                  setCardIndex(0);
                }}
                onBack={goToLanding}
                onSave={() => setShowSettingsPanel(false)}
                onCreateLesson={createLesson}
                onUpdateLesson={updateLesson}
                onDeleteLesson={removeLesson}
                onDuplicateLesson={duplicateLesson}
                onResetFtueAndTutorial={handleResetFtueAndTutorial}
                onRestartTutorial={restartTutorial}
                onResetAllData={handleResetAllData}
              />
            </section>
          ) : null}

          {activeModule === MODULES.FLASHCARDS && currentCard ? (
            <section className="module-pane">
              <FlashcardStandaloneUI
                profile={activeProfile}
                lessonId={activeLesson?.id}
                lessonTitle={activeLesson?.title}
                lessons={lessonOptions}
                card={currentCard}
                cardIndex={cardIndex}
                totalCards={totalCards}
                earnedStars={earnedStars}
                onPrev={goPrev}
                onNext={goNext}
                onOpenLessonText={(lessonId) => {
                  const targetId = lessonId || activeLesson?.id;
                  if (targetId) openLessonTextView(targetId);
                }}
                onSelectLesson={(lessonId) => {
                  if (!lessonId) return;
                  setActiveLesson(lessonId);
                  setCardIndex(0);
                }}
                onSwitchModule={setActiveModule}
                onBack={goToLanding}
              />
            </section>
          ) : null}

          {activeModule === MODULES.AUDIO && currentCard ? (
            <section className="module-pane">
              <AudioStandaloneUI
                profile={activeProfile}
                lessonId={activeLesson?.id}
                lessonTitle={activeLesson?.title}
                lessons={lessonOptions}
                card={currentCard}
                cardIndex={cardIndex}
                totalCards={totalCards}
                mode={mode}
                cardKey={currentCardKey}
                onPrev={goPrev}
                onNext={goNext}
                onOpenLessonText={(lessonId) => {
                  const targetId = lessonId || activeLesson?.id;
                  if (targetId) openLessonTextView(targetId);
                }}
                onSelectLesson={(lessonId) => {
                  if (!lessonId) return;
                  setActiveLesson(lessonId);
                  setCardIndex(0);
                }}
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
                lessonId={activeLesson?.id}
                lessonTitle={activeLesson?.title}
                lessons={lessonOptions}
                profile={activeProfile}
                cardIndex={cardIndex}
                totalCards={totalCards}
                onPrev={goPrev}
                onNext={goNext}
                onOpenLessonText={(lessonId) => {
                  const targetId = lessonId || activeLesson?.id;
                  if (targetId) openLessonTextView(targetId);
                }}
                onSelectLesson={(lessonId) => {
                  if (!lessonId) return;
                  setActiveLesson(lessonId);
                  setCardIndex(0);
                }}
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
                lessons={lessonOptions}
                cardIndex={cardIndex}
                initialStepIndex={unifiedFlowStepIndex}
                onStepIndexChange={setUnifiedFlowStepIndex}
                onPrevCard={goPrev}
                onNextCard={goNext}
                onOpenLessonText={(lessonId) => {
                  const targetId = lessonId || activeLesson?.id;
                  if (targetId) openLessonTextView(targetId);
                }}
                onSelectLesson={(lessonId) => {
                  if (!lessonId) return;
                  setActiveLesson(lessonId);
                  setCardIndex(0);
                }}
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
          standaloneView === STANDALONE_VIEW.NONE &&
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
