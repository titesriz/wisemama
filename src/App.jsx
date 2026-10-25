import { useEffect, useMemo, useRef, useState } from 'react';
import AudioStandaloneUI from './components/AudioStandaloneUI.jsx';
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
import RadicalDiscoveryPage from './components/RadicalDiscoveryPage.jsx';
import RadicalOnlyPage from './components/RadicalOnlyPage.jsx';
import WritingPractice from './components/WritingPractice.jsx';
import WritingOnlyPage from './components/WritingOnlyPage.jsx';
import HskWordPage from './components/HskWordPage.jsx';
import HskWritingPage from './components/HskWritingPage.jsx';
import HskWordSelectionPage from './components/HskWordSelectionPage.jsx';
import ColorsWordPage from './components/ColorsWordPage.jsx';
import ColorsWritingPage from './components/ColorsWritingPage.jsx';
import ColorsQuizPage from './components/ColorsQuizPage.jsx';
import ColorsWritingTest from './components/ColorsWritingTest.jsx';
import ClothingWordPage from './components/ClothingWordPage.jsx';
import ClothingWritingPage from './components/ClothingWritingPage.jsx';
import ClothingQuizPage from './components/ClothingQuizPage.jsx';
import RadicalWordPage from './components/RadicalWordPage.jsx';
import RadicalWritingPage from './components/RadicalWritingPage.jsx';
import RadicalQuizPage from './components/RadicalQuizPage.jsx';
import HskQuizPage from './components/HskQuizPage.jsx';
import LessonQuizPage from './components/LessonQuizPage.jsx';
import LessonVocabWordPage from './components/LessonVocabWordPage.jsx';
import LessonVocabWritingPage from './components/LessonVocabWritingPage.jsx';
import ChoiceHubPage from './components/ChoiceHubPage.jsx';
import LessonWritingSetupPage from './components/LessonWritingSetupPage.jsx';
import hskWords from './data/hsk1-words.json';
import colorsWords from './data/colors-words.json';
import clothingWords from './data/clothing-words.json';
import radicalsWords from './data/radicals-words.json';
import { useAvatar } from './context/AvatarContext.jsx';
import { useLessons } from './context/LessonsContext.jsx';
import { useMode } from './context/ModeContext.jsx';
import {
  readFtueState,
  resetAllWiseMamaData,
  saveFtueState,
} from './lib/ftueStorage.js';
import { applyHanziFontPreference, getHanziFontPreference } from './lib/hanziFont.js';
import { isDevMode } from './config.js';
import { SCREEN } from './lib/screens.js';
import AppShell, { AvatarEditorModal } from './components/AppShell.jsx';
import ParentSpacePage from './components/ParentSpacePage.jsx';

const appTitle = 'WiseMama - Apprendre le chinois';
const progressStorageKey = 'wisemama-progress-v1';
const tutorialStorageKey = 'wisemama-tutorial-v1';

const MODULES = {
  PARENT_HOME: 'parent-home',
  LESSONS: 'lessons',
  FLASHCARDS: 'flashcards',
  AUDIO: 'audio',
  WRITING: 'writing',
  QUIZ: 'quiz',
  RADICAL: 'radical',
  LEARNING_FLOW: 'learning-flow',
  EMOTIONAL_DUO: 'emotional-duo',
  BIG_SMILE: 'big-smile',
  TOON_HEAD: 'toon-head',
};

const STANDALONE_VIEW = {
  NONE: 'none',
  WRITING: 'writing',
  RADICAL: 'radical',
  FLASHCARDS: 'flashcards',
  AUDIO: 'audio',
  LEARNING_FLOW: 'learning-flow',
  LESSON_BETA: 'lesson-beta',
  LESSON_SELECT: 'lesson-select',
  FONT_TEST: 'font-test',
  RADICAL_DISCOVERY: 'radical-discovery',
  HSK_WORDS: 'hsk-words',
  HSK_WRITING: 'hsk-writing',
  HSK_SELECT: 'hsk-select',
  HSK_QUIZ: 'hsk-quiz',
  LESSON_QUIZ: 'lesson-quiz',
  LESSON_VOCAB_WORDS: 'lesson-vocab-words',
  LESSON_VOCAB_WRITING: 'lesson-vocab-writing',
  LESSON_WORD_SELECT: 'lesson-word-select',
  COLORS_WORDS: 'colors-words',
  COLORS_WRITING: 'colors-writing',
  COLORS_QUIZ: 'colors-quiz',
  COLORS_WRITING_TEST: 'colors-writing-test',
  CLOTHING_WORDS: 'clothing-words',
  CLOTHING_WRITING: 'clothing-writing',
  CLOTHING_QUIZ: 'clothing-quiz',
  RADICAL_WORDS: 'radical-words',
  RADICAL_WRITING: 'radical-writing',
  RADICAL_QUIZ: 'radical-quiz',
  LESSON_PICKER: 'lesson-picker',
  VOCAB_HUB: 'vocab-hub',
  THEME_SELECT: 'theme-select',
  WRITING_HUB: 'writing-hub',
  WRITING_THEME_SELECT: 'writing-theme-select',
  DICTEE_HUB: 'dictee-hub',
  DICTEE_THEME_SELECT: 'dictee-theme-select',
  LESSON_WRITING_SETUP: 'lesson-writing-setup',
  TEST_HUB: 'test-hub',
  LESSON_EDITOR: 'lesson-editor',
};

const hskProgressStorageKey = 'wisemama-hsk1-progress-v1';

function readHskProgress() {
  try {
    const raw = localStorage.getItem(hskProgressStorageKey);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const index = Number(parsed?.wordIndex);
    if (Number.isInteger(index) && index >= 0 && index < hskWords.length) return index;
  } catch {
    // no-op
  }
  return 0;
}

function getCardKey(lessonId, cardId) {
  return `${lessonId}:${cardId}`;
}

// Combine a lesson's characters and vocabulary into one browsing order,
// weaving each vocabulary word in right after the last of its component
// characters instead of appending all vocabulary after every character -
// otherwise a lesson with many characters buries its vocabulary at the very
// end of the deck, several clicks past where a reader would stop looking.
function buildLessonWordSet(lesson) {
  const cards = lesson?.cards || [];
  const vocabulary = lesson?.vocabulary || [];
  const cardOrderIndex = new Map(cards.map((card, index) => [card.hanzi, index]));
  const vocabByLastCharIndex = new Map();
  const unplacedVocab = [];

  vocabulary.forEach((word) => {
    const charIndices = Array.from(word?.hanzi || '')
      .map((char) => cardOrderIndex.get(char))
      .filter((index) => index !== undefined);
    if (!charIndices.length) {
      unplacedVocab.push(word);
      return;
    }
    const lastIndex = Math.max(...charIndices);
    if (!vocabByLastCharIndex.has(lastIndex)) vocabByLastCharIndex.set(lastIndex, []);
    vocabByLastCharIndex.get(lastIndex).push(word);
  });

  const result = [];
  cards.forEach((card, index) => {
    result.push(card);
    if (vocabByLastCharIndex.has(index)) {
      result.push(...vocabByLastCharIndex.get(index));
    }
  });
  result.push(...unplacedVocab);
  return result;
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

const WRITING_MODE_DIFFICULTY = { facile: 1, moyen: 2, difficile: 3, dictee: 3 };
const WRITING_MODE_LABEL = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile', dictee: 'Dictée' };
const WRITING_MODES = ['facile', 'moyen', 'difficile', 'dictee'];

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
    refreshBundledLessons,
    createLesson,
    updateLesson,
    removeLesson,
    duplicateLesson,
    getPacks,
    setPackEnabled,
    getPackLessons,
  } = useLessons();
  const activeLesson = lessonOptions.find((lesson) => lesson.id === activeLessonId) || null;
  const [cardIndex, setCardIndex] = useState(0);
  const [starsByProfile, setStarsByProfile] = useState({});
  const [enteredApp, setEnteredApp] = useState(false);
  // What "Reprendre" on the landing page resumes - { contentLabel,
  // modeLabel, resume } where resume() replays the exact navigation that
  // was used to reach that screen. Set at each landing-rooted entry point
  // right before the navigation itself happens.
  const [lastActivity, setLastActivity] = useState(null);
  // Every screen reached from the landing page (enteredApp === false) is
  // child-facing - parent mode only exists behind enteredApp === true and
  // isDevMode. Several landing/hub entry points added this session don't
  // explicitly switch the active profile to the child (unlike the older
  // ones), which let a stale "parent" active profile leak into shared
  // chrome like the sticky header avatar. Enforcing it here, once, covers
  // every current and future landing-rooted screen instead of patching
  // each entry function individually.
  useEffect(() => {
    if (enteredApp) return;
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (childProfile && activeProfileId !== childProfile.id) {
      setActiveProfileId(childProfile.id);
    }
  }, [enteredApp, profiles, activeProfileId, setActiveProfileId]);
  const [standaloneView, setStandaloneView] = useState(STANDALONE_VIEW.NONE);
  const [showParentSpace, setShowParentSpace] = useState(false);
  const [lessonTextLessonId, setLessonTextLessonId] = useState(() => getLessonTextRouteId(window.location.pathname));
  // Lifted out of LessonTextView so the AppShell header's folder icon
  // (outside LessonTextView's own DOM subtree) can toggle the same picker.
  const [showLessonTextPicker, setShowLessonTextPicker] = useState(false);
  const [returnToLessonText, setReturnToLessonText] = useState(false);
  const [lessonJourneyQueue, setLessonJourneyQueue] = useState([]);
  const [lessonJourneyPosition, setLessonJourneyPosition] = useState(0);
  const [unifiedFlowStepIndex, setUnifiedFlowStepIndex] = useState(0);
  const [writingDifficulty, setWritingDifficulty] = useState(1);
  // Mode picked on the writing setup screen; drives the breadcrumb label.
  // Dictée and difficile both run at writingDifficulty 3.
  const [lessonWritingMode, setLessonWritingMode] = useState('facile');
  // Inline mode switcher opened from the breadcrumb's icon next to the
  // current mode label (e.g. "Facile") - lets you change mode without
  // leaving the writing screen or losing the current character/position.
  const [showWritingModeSwitcher, setShowWritingModeSwitcher] = useState(false);
  const [hskWordIndex, setHskWordIndex] = useState(() => readHskProgress());
  const [colorsWordIndex, setColorsWordIndex] = useState(0);
  const [clothingWordIndex, setClothingWordIndex] = useState(0);
  const [radicalWordIndex, setRadicalWordIndex] = useState(0);
  // What the shared lesson picker (reached from the Lecons/Vocabulaire/
  // Test hub buttons) does once a lesson is chosen, and which hub screen
  // "Retour" should land back on.
  const [lessonPickerIntent, setLessonPickerIntent] = useState('text');
  const [lessonPickerReturnTo, setLessonPickerReturnTo] = useState(STANDALONE_VIEW.NONE);
  // null = the full question-type mix (every other quiz entry point); set
  // only by the Test hub's Comprehension/Ecouter picks, and reset to null
  // by every other path into LESSON_QUIZ so it never leaks across sessions.
  const [quizAllowedTypes, setQuizAllowedTypes] = useState(null);
  // Difficulty passed to the deck writing screens (Colors/Clothing/
  // Radicals/HSK1/lesson-vocab) - 1 (easy, character shown) for normal
  // Ecriture entries, 3 (hard, character hidden) for Dictee entries. Reset
  // to 1 by every non-Dictee path into these screens so it never leaks.
  const [deckWritingDifficulty, setDeckWritingDifficulty] = useState(1);
  const [vocabWordIndex, setVocabWordIndex] = useState(0);
  // Set only when a vocab word is opened by tapping it in the lesson text -
  // a narrow [word, ...its component characters] deck instead of browsing
  // the full lesson. Null everywhere else (normal full-lesson browsing).
  const [vocabWordSubset, setVocabWordSubset] = useState(null);
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
    if (standaloneView !== STANDALONE_VIEW.NONE) return;
    const exists = lessonOptions.some((lesson) => lesson.id === lessonTextLessonId);
    if (exists && activeLessonId !== lessonTextLessonId) {
      setActiveLesson(lessonTextLessonId);
      setCardIndex(0);
    }
  }, [activeLessonId, lessonOptions, lessonTextLessonId, setActiveLesson, standaloneView]);

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
    if (![1, 2, 3].includes(writingDifficulty)) {
      setWritingDifficulty(1);
    }
  }, [writingDifficulty]);

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

  const handleWritingSessionComplete = () => {
    const currentIndex = lessonOptions.findIndex((l) => l.id === activeLessonId);
    const nextLesson = lessonOptions[currentIndex + 1];
    if (nextLesson) {
      setActiveLesson(nextLesson.id);
      setCardIndex(0);
    }
    setStandaloneView(STANDALONE_VIEW.NONE);
    setLessonJourneyQueue([]);
    setLessonJourneyPosition(0);
    setReturnToLessonText(false);
    setLessonTextLessonId('');
    setEnteredApp(false);
    window.history.pushState({}, '', '/');
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

  const handleHskWritingSuccess = (mistakes) => {
    const hskWord = hskWords[hskWordIndex];
    if (!hskWord || !currentProfileKey) return;

    const cardKey = getCardKey('hsk1-deck', hskWord.id);
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

  const goToNextHskWord = () => setHskWordIndex((prev) => (prev + 1) % hskWords.length);
  const goToPrevHskWord = () => setHskWordIndex((prev) => (prev - 1 + hskWords.length) % hskWords.length);

  const handleColorsWritingSuccess = (mistakes) => {
    const colorsWord = colorsWords[colorsWordIndex];
    if (!colorsWord || !currentProfileKey) return;

    const cardKey = getCardKey('colors-deck', colorsWord.id);
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

  const goToNextColorsWord = () => setColorsWordIndex((prev) => (prev + 1) % colorsWords.length);
  const goToPrevColorsWord = () => setColorsWordIndex((prev) => (prev - 1 + colorsWords.length) % colorsWords.length);

  const handleClothingWritingSuccess = (mistakes) => {
    const clothingWord = clothingWords[clothingWordIndex];
    if (!clothingWord || !currentProfileKey) return;

    const cardKey = getCardKey('clothing-deck', clothingWord.id);
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

  const goToNextClothingWord = () => setClothingWordIndex((prev) => (prev + 1) % clothingWords.length);
  const goToPrevClothingWord = () => setClothingWordIndex((prev) => (prev - 1 + clothingWords.length) % clothingWords.length);

  const handleRadicalWritingSuccess = (mistakes) => {
    const radicalWord = radicalsWords[radicalWordIndex];
    if (!radicalWord || !currentProfileKey) return;

    const cardKey = getCardKey('radical-deck', radicalWord.id);
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

  const goToNextRadicalWord = () => setRadicalWordIndex((prev) => (prev + 1) % radicalsWords.length);
  const goToPrevRadicalWord = () => setRadicalWordIndex((prev) => (prev - 1 + radicalsWords.length) % radicalsWords.length);

  // The lesson's full learnable set for browse-through flashcards: every
  // new character (characterRefs) plus every multi-char vocabulary word
  // (vocabularyRefs), woven together via buildLessonWordSet - vocabulary is
  // additive, not a subset of characters, so both must be shown.
  const lessonAllWords = activeLesson ? buildLessonWordSet(activeLesson) : [];
  // What the vocab flashcard/writing flow actually browses right now -
  // the subset from tapping a word in the lesson text, or the full lesson
  // set otherwise. vocabWordIndex is always an index into this, never into
  // lessonAllWords directly, once a subset is active.
  const vocabWordsActive = vocabWordSubset || lessonAllWords;
  const currentAllWordsCard = lessonAllWords[vocabWordIndex] || null;
  const currentAllWordsCardKey = currentAllWordsCard && activeLesson
    ? getCardKey(activeLesson.id, currentAllWordsCard.id)
    : '';
  const earnedAllWordsStars = currentAllWordsCardKey ? currentStarsMap[currentAllWordsCardKey] ?? 0 : 0;

  const handleLessonVocabWritingSuccess = (mistakes) => {
    const vocabWord = vocabWordsActive[vocabWordIndex];
    if (!vocabWord || !activeLesson || !currentProfileKey) return;

    const cardKey = getCardKey(activeLesson.id, vocabWord.id);
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

  const goToNextVocabWord = () => {
    const total = vocabWordsActive.length;
    if (!total) return;
    setVocabWordIndex((prev) => (prev + 1) % total);
  };
  const goToPrevVocabWord = () => {
    const total = vocabWordsActive.length;
    if (!total) return;
    setVocabWordIndex((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    try {
      localStorage.setItem(hskProgressStorageKey, JSON.stringify({ wordIndex: hskWordIndex }));
    } catch {
      // no-op
    }
  }, [hskWordIndex]);

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
    // Without clearing these, STANDALONE_VIEW.NONE + enteredApp=false can
    // still resolve to the lesson text view (its own render guard checks
    // exactly this), not the true landing page - e.g. after opening a
    // lesson's vocabulary/writing/test and tapping the header logo.
    setLessonTextLessonId('');
    setReturnToLessonText(false);
    setLessonJourneyQueue([]);
    setLessonJourneyPosition(0);
    pushScreen(SCREEN.LANDING);
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

  // Pushes a history entry carrying a `screen` discriminator in
  // history.state while reusing one of only two URL shapes ("/" for
  // landing/hubs, "/lesson/:id/text" for a lesson and everything reached
  // from it) - the address bar never grows new paths, but back/forward
  // still gets a real per-screen stack via state.screen instead of guessing
  // from the URL (which can't tell a hub apart from landing, or a lesson's
  // quiz apart from its writing setup - they all share one of the two URLs).
  const pushScreen = (screen, lessonId = '') => {
    const url = lessonId ? `/lesson/${encodeURIComponent(lessonId)}/text` : '/';
    window.history.pushState({ screen, lessonId }, '', url);
  };

  // Mirrors what each navigation action already sets, so popstate (browser
  // back/forward) can restore the same screen without re-deriving it from
  // the URL alone. Deliberately separate from the action handlers below
  // (openLessonsHubFromLanding, openVocabPracticeFromLessonText, etc.) rather than
  // sharing one implementation - those also handle things restoration
  // shouldn't redo (setLastActivity, etc.), and keeping them independent
  // means a browser back press can never accidentally push a new history
  // entry of its own.
  const applyScreenState = (screen, lessonId = '') => {
    switch (screen) {
      case SCREEN.HUB_LESSONS:
        setLessonPickerIntent('text');
        setLessonPickerReturnTo(STANDALONE_VIEW.NONE);
        setShowDailyRituel(false);
        setStandaloneView(STANDALONE_VIEW.LESSON_PICKER);
        setEnteredApp(false);
        break;
      case SCREEN.HUB_VOCAB:
        setShowDailyRituel(false);
        setStandaloneView(STANDALONE_VIEW.VOCAB_HUB);
        setEnteredApp(false);
        break;
      case SCREEN.HUB_WRITING:
        setShowDailyRituel(false);
        setStandaloneView(STANDALONE_VIEW.WRITING_HUB);
        setEnteredApp(false);
        break;
      case SCREEN.HUB_TEST:
        setShowDailyRituel(false);
        setStandaloneView(STANDALONE_VIEW.TEST_HUB);
        setEnteredApp(false);
        break;
      case SCREEN.LESSON_TEXT:
        if (lessonId) {
          setActiveLesson(lessonId);
          setLessonTextLessonId(lessonId);
        }
        setReturnToLessonText(false);
        setLessonJourneyQueue([]);
        setLessonJourneyPosition(0);
        setStandaloneView(STANDALONE_VIEW.NONE);
        setShowDailyRituel(false);
        setEnteredApp(false);
        break;
      case SCREEN.LESSON_VOCAB:
        if (lessonId) {
          setActiveLesson(lessonId);
          setLessonTextLessonId(lessonId);
        }
        setVocabWordSubset(null);
        setVocabWordIndex(0);
        setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WORDS);
        setShowDailyRituel(false);
        setEnteredApp(false);
        break;
      case SCREEN.LESSON_WRITING_SETUP:
        if (lessonId) {
          setActiveLesson(lessonId);
          setLessonTextLessonId(lessonId);
        }
        setStandaloneView(STANDALONE_VIEW.LESSON_WRITING_SETUP);
        setShowDailyRituel(false);
        setEnteredApp(false);
        break;
      case SCREEN.LESSON_WRITING_PRACTICE: {
        const targetLesson = lessonOptions.find((lesson) => lesson.id === lessonId);
        if (targetLesson) {
          const queue = targetLesson.cards.map((_, index) => index);
          setActiveLesson(targetLesson.id);
          setLessonTextLessonId(targetLesson.id);
          setLessonJourneyQueue(queue);
          setLessonJourneyPosition(0);
          setCardIndex(queue[0] ?? 0);
          setReturnToLessonText(true);
          setActiveModule(MODULES.WRITING);
        }
        setStandaloneView(STANDALONE_VIEW.WRITING);
        setShowDailyRituel(false);
        setEnteredApp(false);
        break;
      }
      case SCREEN.LESSON_QUIZ:
        if (lessonId) {
          setActiveLesson(lessonId);
          setLessonTextLessonId(lessonId);
        }
        setQuizAllowedTypes(null);
        setStandaloneView(STANDALONE_VIEW.LESSON_QUIZ);
        setShowDailyRituel(false);
        setEnteredApp(false);
        break;
      case SCREEN.LANDING:
      default:
        setShowDailyRituel(false);
        setStandaloneView(STANDALONE_VIEW.NONE);
        setEnteredApp(false);
        setLessonTextLessonId('');
        setReturnToLessonText(false);
        setLessonJourneyQueue([]);
        setLessonJourneyPosition(0);
        break;
    }
  };

  const applyScreenStateRef = useRef(null);
  applyScreenStateRef.current = applyScreenState;

  useEffect(() => {
    // Tag the very first history entry so a direct load (fresh "/" or a
    // shared "/lesson/:id/text" link) has a well-defined base for the stack
    // - without this, history.state is null until the first navigation.
    if (!window.history.state) {
      const initialLessonId = getLessonTextRouteId(window.location.pathname);
      window.history.replaceState(
        { screen: initialLessonId ? SCREEN.LESSON_TEXT : SCREEN.LANDING, lessonId: initialLessonId },
        '',
        window.location.pathname,
      );
    }

    const onPopState = (event) => {
      const state = event.state;
      if (state?.screen) {
        applyScreenStateRef.current(state.screen, state.lessonId || '');
        return;
      }
      // No state (history predating this tagging scheme) - fall back to
      // the URL, the only signal available.
      const routeLessonId = getLessonTextRouteId(window.location.pathname);
      applyScreenStateRef.current(routeLessonId ? SCREEN.LESSON_TEXT : SCREEN.LANDING, routeLessonId);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Every screen change should open at the top, not wherever the previous
  // screen had been scrolled to - this app is a single window-scrolling
  // document (no inner scroll container per screen), so a plain
  // window.scrollTo covers every page the if-chain below can render.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [standaloneView, lessonTextLessonId, showParentSpace, showFtue, enteredApp, showDailyRituel, isParentMode]);

  const navigateTo = (screen, lessonId = '') => {
    pushScreen(screen, lessonId);
    applyScreenState(screen, lessonId);
  };

  const shellProfile = profiles.find((profile) => profile.role === 'child') || profiles[0] || null;

  const withShell = (children, shell) => (
    <AppShell
      {...shell}
      onNavigate={navigateTo}
      onGoHome={goToLanding}
      profile={shellProfile}
      onOpenAvatarEditor={openAvatarEditorForChildFromLanding}
      avatarOpen={showAvatarEditorModal}
      onCloseAvatarEditor={() => setShowAvatarEditorModal(false)}
    >
      {children}
    </AppShell>
  );

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
    pushScreen(SCREEN.LESSON_TEXT, targetLessonId);
    const targetLesson = lessonOptions.find((lesson) => lesson.id === targetLessonId);
    setLastActivity({
      contentLabel: targetLesson?.title || 'Leçon',
      modeLabel: 'Leçon',
      resume: () => openLessonTextView(targetLessonId),
    });
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

  // DEPRECATED - unreachable (not wired to any tap handler in
  // LessonTextView). See openWritingFromLanding's comment above.
  const openCharacterPracticeFromLessonText = (char) => {
    const targetLesson = lessonOptions.find((lesson) => lesson.id === lessonTextLessonId);
    if (!targetLesson || !char) return;
    const targetCardIndex = targetLesson.cards.findIndex((card) => (card?.hanzi || '').includes(char));
    if (targetCardIndex < 0) return;
    setActiveLesson(targetLesson.id);
    setCardIndex(targetCardIndex);
    setReturnToLessonText(false);
    openStandaloneModule(STANDALONE_VIEW.WRITING, MODULES.WRITING);
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

  const startJourneyFromLessonText = (selection = [], mode = 'facile') => {
    const targetLesson = lessonOptions.find((lesson) => lesson.id === lessonTextLessonId);
    if (!targetLesson) return;
    const selectedIds = Array.isArray(selection) ? selection.filter(Boolean) : [];
    // Walk `selectedIds` in the order it was given (not targetLesson.cards'
    // own order) so a shuffled selection - dictée's "random" mode - actually
    // plays back shuffled, instead of silently snapping back to card order.
    const queue = selectedIds.length
      ? selectedIds
          .map((id) => targetLesson.cards.findIndex((card) => card?.id === id))
          .filter((index) => index !== -1)
      : targetLesson.cards.map((_, index) => index);
    const startIndex = queue[0] ?? 0;
    setLessonWritingMode(mode);
    setWritingDifficulty(WRITING_MODE_DIFFICULTY[mode] || 1);
    pushScreen(SCREEN.LESSON_WRITING_PRACTICE, targetLesson.id);
    setActiveLesson(targetLesson.id);
    setLessonJourneyQueue(queue);
    setLessonJourneyPosition(0);
    setCardIndex(startIndex);
    setReturnToLessonText(true);
    setStandaloneView(STANDALONE_VIEW.WRITING);
    setShowDailyRituel(false);
    setEnteredApp(false);
    setActiveModule(MODULES.WRITING);
  };

  // Switches mode in place - same character/position, just a different
  // difficulty - unlike startJourneyFromLessonText above, which also resets
  // the queue/position for a fresh run from the setup screen.
  const switchLessonWritingMode = (mode) => {
    setLessonWritingMode(mode);
    setWritingDifficulty(WRITING_MODE_DIFFICULTY[mode] || 1);
    setShowWritingModeSwitcher(false);
  };

  // Tapping a vocab word in the lesson text opens a narrow sub-selection -
  // just that word plus the individual characters it's made of - rather
  // than dropping into the full lesson's combined browse-through deck.
  const openVocabPracticeFromLessonText = (wordId) => {
    const targetLesson = lessonOptions.find((lesson) => lesson.id === lessonTextLessonId);
    if (!targetLesson || !wordId) return;
    const combined = buildLessonWordSet(targetLesson);
    const word = combined.find((item) => item.id === wordId);
    if (!word) return;

    const cardByHanzi = new Map();
    (targetLesson.cards || []).forEach((card) => {
      if (!card?.hanzi) return;
      if (!cardByHanzi.has(card.hanzi)) cardByHanzi.set(card.hanzi, card);
      Array.from(card.hanzi).forEach((char) => {
        if (!cardByHanzi.has(char)) cardByHanzi.set(char, card);
      });
    });

    const characters = Array.from(word.hanzi || '');
    const isCompound = characters.length > 1;
    const seenHanzi = new Set([word.hanzi]);
    const componentCards = isCompound
      ? characters
          .map((char) => cardByHanzi.get(char))
          .filter((card) => {
            if (!card || seenHanzi.has(card.hanzi)) return false;
            seenHanzi.add(card.hanzi);
            return true;
          })
      : [];

    setActiveLesson(targetLesson.id);
    setVocabWordSubset([word, ...componentCards]);
    setVocabWordIndex(0);
    setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WORDS);
    setShowDailyRituel(false);
    setEnteredApp(false);
  };

  const openAllFlashcardsFromLessonText = () => {
    const targetLesson = lessonOptions.find((lesson) => lesson.id === lessonTextLessonId);
    if (!targetLesson) return;
    const combined = buildLessonWordSet(targetLesson);
    if (!combined.length) return;
    setActiveLesson(targetLesson.id);
    setVocabWordSubset(null);
    setVocabWordIndex(0);
    setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WORDS);
    setShowDailyRituel(false);
    setEnteredApp(false);
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

  // DEPRECATED - confirmed unreachable (header-consistency audit, 2026):
  // not called from any button/handler anywhere in this file. FLASHCARDS,
  // AUDIO and LEARNING_FLOW only cross-link to each other and back to these
  // three, so the whole loop is dead. Safe to delete along with the
  // FLASHCARDS/AUDIO/LEARNING_FLOW render branches and their components.
  const openFlashcardsFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    openStandaloneModule(STANDALONE_VIEW.FLASHCARDS, MODULES.FLASHCARDS);
  };

  // DEPRECATED - unreachable, same as openFlashcardsFromLanding above.
  const openAudioFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    openStandaloneModule(STANDALONE_VIEW.AUDIO, MODULES.AUDIO);
  };

  // DEPRECATED - unreachable. Unlike the two above, STANDALONE_VIEW.WRITING
  // itself is very much alive via startJourneyFromLessonText (the real
  // "Ecriture" entry point) - only this specific unused function, and the
  // non-journey render sub-case it would have led to, are dead.
  // openCharacterPracticeFromLessonText (character-tap-to-practice) is
  // also unreferenced - same situation.
  const openWritingFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    switchToChild();
    openStandaloneModule(STANDALONE_VIEW.WRITING, MODULES.WRITING);
  };

  const openLessonEditorFromLanding = () => {
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.LESSON_EDITOR);
    setEnteredApp(false);
  };

  const openHskDeckFromLanding = () => {
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.HSK_WORDS);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'HSK1', modeLabel: 'Fiche', resume: openHskDeckFromLanding });
  };

  const openHskWordSelectFromLanding = () => {
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.HSK_SELECT);
    setEnteredApp(false);
  };

  const openColorsDeckFromLanding = () => {
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.COLORS_WORDS);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'Couleurs', modeLabel: 'Fiche', resume: openColorsDeckFromLanding });
  };

  const openClothingDeckFromLanding = () => {
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.CLOTHING_WORDS);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'Vêtements', modeLabel: 'Fiche', resume: openClothingDeckFromLanding });
  };

  const openRadicalDeckFromLanding = () => {
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.RADICAL_WORDS);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'Radicaux', modeLabel: 'Fiche', resume: openRadicalDeckFromLanding });
  };

  // Shared lesson picker used by the Lecons/Ecriture, Vocabulaire ("Par
  // lecon") and Test ("Comprehension"/"Ecouter") hub buttons - `intent`
  // decides what happens once a lesson is picked, `returnTo` decides what
  // "Retour" on the picker itself goes back to.
  const openLessonPicker = (intent, returnTo = STANDALONE_VIEW.NONE) => {
    setLessonPickerIntent(intent);
    setLessonPickerReturnTo(returnTo);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.LESSON_PICKER);
    setEnteredApp(false);
  };

  const openLessonsHubFromLanding = () => {
    pushScreen(SCREEN.HUB_LESSONS);
    openLessonPicker('text', STANDALONE_VIEW.NONE);
  };

  const openAvatarEditorForChildFromLanding = () => {
    const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0];
    if (!childProfile) return;
    setActiveProfileId(childProfile.id);
    setShowAvatarEditorModal(true);
  };

  const openVocabularyHubFromLanding = () => {
    pushScreen(SCREEN.HUB_VOCAB);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.VOCAB_HUB);
    setEnteredApp(false);
  };

  const openThemeSelectFromHub = () => {
    setStandaloneView(STANDALONE_VIEW.THEME_SELECT);
  };

  const openWritingHubFromLanding = () => {
    pushScreen(SCREEN.HUB_WRITING);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.WRITING_HUB);
    setEnteredApp(false);
  };

  const openWritingThemeSelectFromHub = () => {
    setStandaloneView(STANDALONE_VIEW.WRITING_THEME_SELECT);
  };

  const openColorsWritingFromLanding = () => {
    setColorsWordIndex(0);
    setDeckWritingDifficulty(1);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.COLORS_WRITING);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'Couleurs', modeLabel: 'Écriture', resume: openColorsWritingFromLanding });
  };

  const openClothingWritingFromLanding = () => {
    setClothingWordIndex(0);
    setDeckWritingDifficulty(1);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.CLOTHING_WRITING);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'Vêtements', modeLabel: 'Écriture', resume: openClothingWritingFromLanding });
  };

  const openRadicalWritingFromLanding = () => {
    setRadicalWordIndex(0);
    setDeckWritingDifficulty(1);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.RADICAL_WRITING);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'Radicaux', modeLabel: 'Écriture', resume: openRadicalWritingFromLanding });
  };

  const openHskWritingFromLanding = () => {
    setDeckWritingDifficulty(1);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.HSK_WRITING);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'HSK1', modeLabel: 'Écriture', resume: openHskWritingFromLanding });
  };

  // Dictee: same writing screens as Ecriture, but with the character
  // hidden by default (writingDifficulty 3) instead of shown (1).
  const openColorsDicteeFromLanding = () => {
    setColorsWordIndex(0);
    setDeckWritingDifficulty(3);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.COLORS_WRITING);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'Couleurs', modeLabel: 'Évaluation · Dictée', resume: openColorsDicteeFromLanding });
  };

  const openClothingDicteeFromLanding = () => {
    setClothingWordIndex(0);
    setDeckWritingDifficulty(3);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.CLOTHING_WRITING);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'Vêtements', modeLabel: 'Évaluation · Dictée', resume: openClothingDicteeFromLanding });
  };

  const openRadicalDicteeFromLanding = () => {
    setRadicalWordIndex(0);
    setDeckWritingDifficulty(3);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.RADICAL_WRITING);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'Radicaux', modeLabel: 'Évaluation · Dictée', resume: openRadicalDicteeFromLanding });
  };

  const openHskDicteeFromLanding = () => {
    setDeckWritingDifficulty(3);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.HSK_WRITING);
    setEnteredApp(false);
    setLastActivity({ contentLabel: 'HSK1', modeLabel: 'Évaluation · Dictée', resume: openHskDicteeFromLanding });
  };

  const openLessonDicteeFromLanding = () => {
    openLessonPicker('dictee', STANDALONE_VIEW.DICTEE_HUB);
  };

  const openDicteeHubFromLanding = () => {
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.DICTEE_HUB);
    setEnteredApp(false);
  };

  const openDicteeThemeSelectFromHub = () => {
    setStandaloneView(STANDALONE_VIEW.DICTEE_THEME_SELECT);
  };

  const openTestHubFromLanding = () => {
    pushScreen(SCREEN.HUB_TEST);
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.TEST_HUB);
    setEnteredApp(false);
  };

  // DEPRECATED - confirmed unreachable (header-consistency audit, 2026):
  // not called from any button/handler anywhere in this file.
  const openFontTestFromLanding = () => {
    setShowDailyRituel(false);
    setStandaloneView(STANDALONE_VIEW.FONT_TEST);
    setEnteredApp(false);
  };

  const createAndSwitchProfile = () => {
    const newId = createProfile({ role: 'child', name: 'Nouveau profil' });
    switchProfile(newId);
  };

  const handleFtueComplete = ({ childName, parentName }) => {
    const child = profiles.find((profile) => profile.role === 'child');
    const parent = profiles.find((profile) => profile.role === 'parent');
    if (child) {
      setProfileName(child.id, childName || 'Enfant');
      setActiveProfileId(child.id);
    }
    if (parent) {
      setProfileName(parent.id, parentName || 'Maman');
    }
    const nextFtue = saveFtueState({ completed: true, childName });
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

  const exportPack = (packId) => {
    const pack = getPacks().find((item) => item.id === packId);
    if (!pack) return;
    const payload = {
      packId: pack.id,
      name: pack.name,
      description: pack.description,
      lessons: getPackLessons(packId),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `wisemama-pack-${pack.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (showParentSpace) {
    return (
      <ParentSpacePage
        profiles={profiles}
        lessons={lessonOptions}
        progressMap={childMap}
        onClose={() => setShowParentSpace(false)}
        onCreateLesson={createLesson}
        onUpdateLesson={updateLesson}
        onDeleteLesson={removeLesson}
        onDuplicateLesson={duplicateLesson}
        onSelectLesson={(id) => {
          if (!id) return;
          setActiveLesson(id);
          setCardIndex(0);
        }}
        packs={getPacks()}
        onSetPackEnabled={setPackEnabled}
        onExportPack={exportPack}
      />
    );
  }

  if (!showFtue && lessonTextLessonId && standaloneView === STANDALONE_VIEW.NONE) {
    const lessonForText = lessonOptions.find((lesson) => lesson.id === lessonTextLessonId);
    if (lessonForText) {
      return withShell(
        <LessonTextView
          shellHeader
          lesson={lessonForText}
          lessons={lessonOptions}
          profile={activeProfile}
          progressMap={currentStarsMap}
          showLessonPicker={showLessonTextPicker}
          onToggleLessonPicker={() => setShowLessonTextPicker((prev) => !prev)}
          onSelectLesson={(lessonId) => {
            if (!lessonId) return;
            setShowLessonTextPicker(false);
            setActiveLesson(lessonId);
            setCardIndex(0);
            openLessonTextView(lessonId);
          }}
          onPracticeVocabulary={openVocabPracticeFromLessonText}
          onGoHome={goToLanding}
          onOpenAvatarEditor={openAvatarEditorForChildFromLanding}
        />,
        {
          crumbs: [{ label: 'Leçons', onClick: () => navigateTo(SCREEN.HUB_LESSONS) }, { label: lessonForText.title || 'Leçon' }],
          scope: { type: 'lesson', lessonId: lessonForText.id },
          activeHub: 'lessons',
          headerAction: {
            icon: '🗂️',
            label: 'Changer de leçon',
            onClick: () => setShowLessonTextPicker((prev) => !prev),
          },
        },
      );
    }
  }

  // DEPRECATED - confirmed unreachable (header-consistency audit, 2026):
  // no setter for this view anywhere in the file besides this render guard.
  // Safe to delete along with RadicalDiscoveryPage.jsx.
  if (standaloneView === STANDALONE_VIEW.RADICAL_DISCOVERY) {
    const lessonForDiscovery = lessonOptions.find((l) => l.id === (lessonTextLessonId || activeLessonId)) || activeLesson;
    return (
      <RadicalDiscoveryPage
        lesson={lessonForDiscovery}
        onBack={() => setStandaloneView(STANDALONE_VIEW.NONE)}
      />
    );
  }

  if (standaloneView === STANDALONE_VIEW.WRITING) {
    const parentProfile = profiles.find((profile) => profile.role === 'parent') || null;
    const writingPage = (
      <WritingOnlyPage
        shellHeader={returnToLessonText}
        profile={activeProfile}
        parentProfile={parentProfile}
        activeLesson={activeLesson}
        lessons={lessonOptions}
        cardIndex={cardIndex}
        writingDifficulty={writingDifficulty}
        writingMode={returnToLessonText ? lessonWritingMode : null}
        journeyMode={returnToLessonText}
        journeyQueue={lessonJourneyQueue}
        journeyPosition={lessonJourneyPosition}
        onBack={() => {
          if (returnToLessonText && lessonTextLessonId) {
            setStandaloneView(STANDALONE_VIEW.NONE);
            return;
          }
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onGoHome={goToLanding}
        onOpenAvatarEditor={openAvatarEditorForChildFromLanding}
        onOpenLessonText={(lessonId) => {
          const targetId = lessonId || activeLesson?.id;
          if (targetId) openLessonTextView(targetId);
        }}
        onOpenRadical={() => {
          setStandaloneView(STANDALONE_VIEW.RADICAL);
          setEnteredApp(false);
        }}
        onSelectLesson={(lessonId) => {
          if (!lessonId) return;
          setActiveLesson(lessonId);
          setLessonJourneyQueue([]);
          setLessonJourneyPosition(0);
          setReturnToLessonText(false);
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
        onPrev={returnToLessonText ? goPrevInLessonJourney : goPrev}
        onNext={returnToLessonText ? goNextInLessonJourney : goNext}
        onSuccess={handleWritingSuccess}
        onSessionComplete={handleWritingSessionComplete}
        onJourneyRestart={() => {
          setLessonJourneyPosition(0);
          setCardIndex(lessonJourneyQueue[0] ?? 0);
        }}
      />
    );
    if (returnToLessonText) {
      const writingLabel = WRITING_MODE_LABEL[lessonWritingMode] || 'Écriture';
      const writingPageWithModeSwitcher = (
        <>
          {writingPage}
          {showWritingModeSwitcher ? (
            <div className="writing-mode-switcher-dropdown" role="menu" aria-label="Changer de mode">
              {WRITING_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="menuitemradio"
                  aria-checked={mode === lessonWritingMode}
                  className={`writing-mode-switcher-item ui-pressable ${mode === lessonWritingMode ? 'active' : ''}`}
                  onClick={() => switchLessonWritingMode(mode)}
                >
                  {WRITING_MODE_LABEL[mode]}
                </button>
              ))}
            </div>
          ) : null}
        </>
      );
      return withShell(writingPageWithModeSwitcher, {
        crumbs: [
          { label: 'Leçons', onClick: () => navigateTo(SCREEN.HUB_LESSONS) },
          { label: activeLesson?.title || 'Leçon', onClick: () => navigateTo(SCREEN.LESSON_TEXT, activeLesson?.id) },
          { label: 'Écriture', onClick: () => navigateTo(SCREEN.LESSON_WRITING_SETUP, activeLesson?.id) },
          {
            label: writingLabel,
            icon: '🔀',
            iconLabel: 'Changer de mode',
            onIconClick: () => setShowWritingModeSwitcher((prev) => !prev),
          },
        ],
        scope: { type: 'lesson', lessonId: activeLesson?.id || '' },
        activeHub: 'writing',
      });
    }
    return (
      <>
        {writingPage}
        {showAvatarEditorModal ? <AvatarEditorModal onClose={() => setShowAvatarEditorModal(false)} /> : null}
      </>
    );
  }

  if (standaloneView === STANDALONE_VIEW.RADICAL) {
    const parentProfile = profiles.find((profile) => profile.role === 'parent') || null;
    return (
      <RadicalOnlyPage
        profile={activeProfile}
        parentProfile={parentProfile}
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
        onOpenWriting={() => {
          setStandaloneView(STANDALONE_VIEW.WRITING);
          setEnteredApp(false);
        }}
        onSelectLesson={(lessonId) => {
          if (!lessonId) return;
          setActiveLesson(lessonId);
          setCardIndex(0);
        }}
        onSuccess={handleWritingSuccess}
      />
    );
  }

  if (standaloneView === STANDALONE_VIEW.HSK_WORDS) {
    return withShell(
      <HskWordPage
        shellHeader
        profile={activeProfile}
        words={hskWords}
        word={hskWords[hskWordIndex] || null}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'writing') {
            setDeckWritingDifficulty(1);
            setStandaloneView(STANDALONE_VIEW.HSK_WRITING);
          } else if (module === 'quiz') {
            setStandaloneView(STANDALONE_VIEW.HSK_QUIZ);
          }
        }}
        onOpenPicker={() => setStandaloneView(STANDALONE_VIEW.HSK_SELECT)}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'HSK1' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.HSK_SELECT) {
    return withShell(
      <HskWordSelectionPage
        shellHeader
        words={hskWords}
        activeWordId={hskWords[hskWordIndex]?.id || ''}
        onSelectWord={(index) => {
          setHskWordIndex(index);
          setStandaloneView(STANDALONE_VIEW.HSK_WORDS);
        }}
        onBack={() => setStandaloneView(STANDALONE_VIEW.HSK_WORDS)}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'HSK1', onClick: () => setStandaloneView(STANDALONE_VIEW.HSK_WORDS) },
          { label: 'Choisir' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.HSK_WRITING) {
    return withShell(
      <HskWritingPage
        shellHeader
        profile={activeProfile}
        word={hskWords[hskWordIndex] || null}
        writingDifficulty={deckWritingDifficulty}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'flashcards') {
            setDeckWritingDifficulty(1);
            setStandaloneView(STANDALONE_VIEW.HSK_WORDS);
          }
        }}
        onSuccess={handleHskWritingSuccess}
        onPrevWord={goToPrevHskWord}
        onNextWord={goToNextHskWord}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'HSK1', onClick: () => setStandaloneView(STANDALONE_VIEW.HSK_WORDS) },
          { label: deckWritingDifficulty === 3 ? 'Dictée' : 'Écriture' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.HSK_QUIZ) {
    return withShell(
      <HskQuizPage
        shellHeader
        profile={activeProfile}
        words={hskWords}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'flashcards') {
            setStandaloneView(STANDALONE_VIEW.HSK_WORDS);
          }
        }}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'HSK1', onClick: () => setStandaloneView(STANDALONE_VIEW.HSK_WORDS) },
          { label: 'Évaluation' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.LESSON_EDITOR) {
    return (
      <section className="module-pane">
        <LessonEditorBeta
          onBack={() => {
            setStandaloneView(STANDALONE_VIEW.NONE);
            setEnteredApp(false);
          }}
          onSelectLesson={(id) => {
            if (!id) return;
            setActiveLesson(id);
            setCardIndex(0);
          }}
        />
      </section>
    );
  }

  if (standaloneView === STANDALONE_VIEW.LESSON_QUIZ) {
    const quizPage = (
      <LessonQuizPage
        shellHeader
        profile={activeProfile}
        lessonId={activeLesson?.id}
        lessonTitle={activeLesson?.title}
        words={lessonAllWords}
        allowedTypes={quizAllowedTypes || undefined}
        onBack={() => {
          setStandaloneView(quizAllowedTypes ? lessonPickerReturnTo : STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'flashcards' && activeLesson?.id) {
            openLessonTextView(activeLesson.id);
          }
        }}
      />
    );
    if (!quizAllowedTypes && lessonTextLessonId) {
      return withShell(quizPage, {
        crumbs: [
          { label: 'Leçons', onClick: () => navigateTo(SCREEN.HUB_LESSONS) },
          { label: activeLesson?.title || 'Leçon', onClick: () => navigateTo(SCREEN.LESSON_TEXT, activeLesson?.id) },
          { label: 'Évaluation' },
        ],
        scope: { type: 'lesson', lessonId: activeLesson?.id || '' },
        activeHub: 'test',
      });
    }
    if (quizAllowedTypes) {
      const isListening = quizAllowedTypes.includes('sound-to-char');
      return withShell(quizPage, {
        crumbs: [
          { label: 'Évaluation', onClick: () => navigateTo(SCREEN.HUB_TEST) },
          { label: isListening ? 'Écouter' : 'Compréhension' },
        ],
        scope: { type: 'global' },
        activeHub: 'test',
      });
    }
    return withShell(quizPage, { crumbs: [{ label: 'Évaluation' }], scope: { type: 'global' }, activeHub: 'test' });
  }

  if (standaloneView === STANDALONE_VIEW.LESSON_VOCAB_WORDS) {
    const vocabWords = vocabWordsActive;
    return withShell(
      <LessonVocabWordPage
        shellHeader
        profile={activeProfile}
        lessonId={activeLesson?.id}
        lessonTitle={activeLesson?.title}
        words={vocabWords}
        word={vocabWords[vocabWordIndex] || null}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onGoHome={goToLanding}
        onOpenAvatarEditor={openAvatarEditorForChildFromLanding}
        onSwitchModule={(module) => {
          if (module === 'writing') {
            setDeckWritingDifficulty(1);
            setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WRITING);
          } else if (module === 'quiz') {
            setQuizAllowedTypes(null);
            setStandaloneView(STANDALONE_VIEW.LESSON_QUIZ);
          }
        }}
        onOpenPicker={() => setStandaloneView(STANDALONE_VIEW.LESSON_WORD_SELECT)}
      />,
      {
        crumbs: [
          { label: 'Leçons', onClick: () => navigateTo(SCREEN.HUB_LESSONS) },
          { label: activeLesson?.title || 'Leçon', onClick: () => navigateTo(SCREEN.LESSON_TEXT, activeLesson?.id) },
          { label: 'Fiche' },
        ],
        scope: { type: 'lesson', lessonId: activeLesson?.id || '' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.LESSON_WORD_SELECT) {
    return withShell(
      <HskWordSelectionPage
        shellHeader
        words={vocabWordsActive}
        activeWordId={vocabWordsActive[vocabWordIndex]?.id || ''}
        onSelectWord={(index) => {
          setVocabWordIndex(index);
          setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WORDS);
        }}
        onBack={() => setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WORDS)}
      />,
      {
        crumbs: [
          { label: 'Leçons', onClick: () => navigateTo(SCREEN.HUB_LESSONS) },
          { label: activeLesson?.title || 'Leçon', onClick: () => navigateTo(SCREEN.LESSON_TEXT, activeLesson?.id) },
          { label: 'Fiche', onClick: () => setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WORDS) },
          { label: 'Choisir' },
        ],
        scope: { type: 'lesson', lessonId: activeLesson?.id || '' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.LESSON_VOCAB_WRITING) {
    const vocabWords = vocabWordsActive;
    const isDictee = deckWritingDifficulty === 3;
    return withShell(
      <LessonVocabWritingPage
        shellHeader
        profile={activeProfile}
        lessonId={activeLesson?.id}
        lessonTitle={activeLesson?.title}
        word={vocabWords[vocabWordIndex] || null}
        writingDifficulty={deckWritingDifficulty}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onGoHome={goToLanding}
        onOpenAvatarEditor={openAvatarEditorForChildFromLanding}
        onSwitchModule={(module) => {
          if (module === 'flashcards') {
            setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WORDS);
          }
        }}
        onSuccess={handleLessonVocabWritingSuccess}
        onPrevWord={goToPrevVocabWord}
        onNextWord={goToNextVocabWord}
      />,
      isDictee
        ? {
            crumbs: [
              { label: 'Évaluation', onClick: () => navigateTo(SCREEN.HUB_TEST) },
              { label: 'Dictée', onClick: () => setStandaloneView(STANDALONE_VIEW.DICTEE_HUB) },
              { label: activeLesson?.title || 'Leçon' },
            ],
            scope: { type: 'global' },
            activeHub: 'test',
          }
        : {
            crumbs: [
              { label: 'Leçons', onClick: () => navigateTo(SCREEN.HUB_LESSONS) },
              { label: activeLesson?.title || 'Leçon', onClick: () => navigateTo(SCREEN.LESSON_TEXT, activeLesson?.id) },
              { label: 'Fiche', onClick: () => setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WORDS) },
              { label: 'Écriture' },
            ],
            scope: { type: 'lesson', lessonId: activeLesson?.id || '' },
            activeHub: 'vocab',
          },
    );
  }

  if (standaloneView === STANDALONE_VIEW.COLORS_WORDS) {
    return withShell(
      <ColorsWordPage
        shellHeader
        profile={activeProfile}
        words={colorsWords}
        word={colorsWords[colorsWordIndex] || null}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'writing') {
            setDeckWritingDifficulty(1);
            setStandaloneView(STANDALONE_VIEW.COLORS_WRITING);
          } else if (module === 'dictée') {
            setStandaloneView(STANDALONE_VIEW.COLORS_WRITING_TEST);
          } else if (module === 'quiz') {
            setStandaloneView(STANDALONE_VIEW.COLORS_QUIZ);
          }
        }}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Couleurs' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.COLORS_WRITING_TEST) {
    return withShell(
      <ColorsWritingTest
        shellHeader
        profile={activeProfile}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onComplete={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Couleurs', onClick: () => setStandaloneView(STANDALONE_VIEW.COLORS_WORDS) },
          { label: 'Dictée' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.COLORS_WRITING) {
    return withShell(
      <ColorsWritingPage
        shellHeader
        profile={activeProfile}
        word={colorsWords[colorsWordIndex] || null}
        writingDifficulty={deckWritingDifficulty}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'flashcards') {
            setStandaloneView(STANDALONE_VIEW.COLORS_WORDS);
          }
        }}
        onSuccess={handleColorsWritingSuccess}
        onPrevWord={goToPrevColorsWord}
        onNextWord={goToNextColorsWord}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Couleurs', onClick: () => setStandaloneView(STANDALONE_VIEW.COLORS_WORDS) },
          { label: deckWritingDifficulty === 3 ? 'Dictée' : 'Écriture' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.COLORS_QUIZ) {
    return withShell(
      <ColorsQuizPage
        shellHeader
        profile={activeProfile}
        words={colorsWords}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'flashcards') {
            setStandaloneView(STANDALONE_VIEW.COLORS_WORDS);
          }
        }}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Couleurs', onClick: () => setStandaloneView(STANDALONE_VIEW.COLORS_WORDS) },
          { label: 'Évaluation' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.CLOTHING_WORDS) {
    return withShell(
      <ClothingWordPage
        shellHeader
        profile={activeProfile}
        words={clothingWords}
        word={clothingWords[clothingWordIndex] || null}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'writing') {
            setDeckWritingDifficulty(1);
            setStandaloneView(STANDALONE_VIEW.CLOTHING_WRITING);
          } else if (module === 'quiz') {
            setStandaloneView(STANDALONE_VIEW.CLOTHING_QUIZ);
          }
        }}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Vêtements' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.CLOTHING_WRITING) {
    return withShell(
      <ClothingWritingPage
        shellHeader
        profile={activeProfile}
        word={clothingWords[clothingWordIndex] || null}
        writingDifficulty={deckWritingDifficulty}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'flashcards') {
            setStandaloneView(STANDALONE_VIEW.CLOTHING_WORDS);
          }
        }}
        onSuccess={handleClothingWritingSuccess}
        onPrevWord={goToPrevClothingWord}
        onNextWord={goToNextClothingWord}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Vêtements', onClick: () => setStandaloneView(STANDALONE_VIEW.CLOTHING_WORDS) },
          { label: deckWritingDifficulty === 3 ? 'Dictée' : 'Écriture' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.CLOTHING_QUIZ) {
    return withShell(
      <ClothingQuizPage
        shellHeader
        profile={activeProfile}
        words={clothingWords}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'flashcards') {
            setStandaloneView(STANDALONE_VIEW.CLOTHING_WORDS);
          }
        }}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Vêtements', onClick: () => setStandaloneView(STANDALONE_VIEW.CLOTHING_WORDS) },
          { label: 'Évaluation' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.RADICAL_WORDS) {
    return withShell(
      <RadicalWordPage
        shellHeader
        profile={activeProfile}
        words={radicalsWords}
        word={radicalsWords[radicalWordIndex] || null}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'writing') {
            setDeckWritingDifficulty(1);
            setStandaloneView(STANDALONE_VIEW.RADICAL_WRITING);
          } else if (module === 'quiz') {
            setStandaloneView(STANDALONE_VIEW.RADICAL_QUIZ);
          }
        }}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Radicaux' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.RADICAL_WRITING) {
    return withShell(
      <RadicalWritingPage
        shellHeader
        profile={activeProfile}
        word={radicalsWords[radicalWordIndex] || null}
        writingDifficulty={deckWritingDifficulty}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'flashcards') {
            setStandaloneView(STANDALONE_VIEW.RADICAL_WORDS);
          }
        }}
        onSuccess={handleRadicalWritingSuccess}
        onPrevWord={goToPrevRadicalWord}
        onNextWord={goToNextRadicalWord}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Radicaux', onClick: () => setStandaloneView(STANDALONE_VIEW.RADICAL_WORDS) },
          { label: deckWritingDifficulty === 3 ? 'Dictée' : 'Écriture' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.RADICAL_QUIZ) {
    return withShell(
      <RadicalQuizPage
        shellHeader
        profile={activeProfile}
        words={radicalsWords}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onSwitchModule={(module) => {
          if (module === 'flashcards') {
            setStandaloneView(STANDALONE_VIEW.RADICAL_WORDS);
          }
        }}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Radicaux', onClick: () => setStandaloneView(STANDALONE_VIEW.RADICAL_WORDS) },
          { label: 'Évaluation' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.LESSON_PICKER) {
    const handlePickLesson = (id) => {
      if (!id) return;
      const pickedTitle = lessonOptions.find((lesson) => lesson.id === id)?.title || 'Leçon';
      if (lessonPickerIntent === 'vocab') {
        setActiveLesson(id);
        setVocabWordSubset(null);
        setVocabWordIndex(0);
        setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WORDS);
        setLastActivity({
          contentLabel: pickedTitle,
          modeLabel: 'Fiche',
          resume: () => {
            setActiveLesson(id);
            setVocabWordSubset(null);
            setVocabWordIndex(0);
            setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WORDS);
            setEnteredApp(false);
          },
        });
        return;
      }
      if (lessonPickerIntent === 'quiz-comprehension') {
        setActiveLesson(id);
        setQuizAllowedTypes(['char-to-translation', 'translation-to-char']);
        setStandaloneView(STANDALONE_VIEW.LESSON_QUIZ);
        setLastActivity({
          contentLabel: pickedTitle,
          modeLabel: 'Évaluation · Compréhension',
          resume: () => {
            setActiveLesson(id);
            setQuizAllowedTypes(['char-to-translation', 'translation-to-char']);
            setStandaloneView(STANDALONE_VIEW.LESSON_QUIZ);
            setEnteredApp(false);
          },
        });
        return;
      }
      if (lessonPickerIntent === 'quiz-listening') {
        setActiveLesson(id);
        setQuizAllowedTypes(['sound-to-char', 'sound-to-translation']);
        setStandaloneView(STANDALONE_VIEW.LESSON_QUIZ);
        setLastActivity({
          contentLabel: pickedTitle,
          modeLabel: 'Évaluation · Écouter',
          resume: () => {
            setActiveLesson(id);
            setQuizAllowedTypes(['sound-to-char', 'sound-to-translation']);
            setStandaloneView(STANDALONE_VIEW.LESSON_QUIZ);
            setEnteredApp(false);
          },
        });
        return;
      }
      if (lessonPickerIntent === 'dictee') {
        setActiveLesson(id);
        setVocabWordIndex(0);
        setDeckWritingDifficulty(3);
        setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WRITING);
        setLastActivity({
          contentLabel: pickedTitle,
          modeLabel: 'Évaluation · Dictée',
          resume: () => {
            setActiveLesson(id);
            setVocabWordIndex(0);
            setDeckWritingDifficulty(3);
            setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WRITING);
            setEnteredApp(false);
          },
        });
        return;
      }
      if (lessonPickerIntent === 'writing-setup') {
        setActiveLesson(id);
        setLessonTextLessonId(id);
        setStandaloneView(STANDALONE_VIEW.LESSON_WRITING_SETUP);
        setLastActivity({
          contentLabel: pickedTitle,
          modeLabel: 'Écriture',
          resume: () => {
            setActiveLesson(id);
            setLessonTextLessonId(id);
            setStandaloneView(STANDALONE_VIEW.LESSON_WRITING_SETUP);
            setEnteredApp(false);
          },
        });
        return;
      }
      openLessonTextView(id);
    };
    const pickerPage = (
      <LessonSelectionPage
        shellHeader
        lessons={lessonOptions}
        packs={getPacks()}
        activeLessonId={activeLessonId || ''}
        onSelectLesson={handlePickLesson}
        onBack={() => setStandaloneView(lessonPickerReturnTo)}
      />
    );
    const pickerShellByIntent = {
      text: { crumbs: [{ label: 'Leçons' }], activeHub: 'lessons' },
      vocab: {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Par leçon' },
        ],
        activeHub: 'vocab',
      },
      'quiz-comprehension': {
        crumbs: [
          { label: 'Évaluation', onClick: () => navigateTo(SCREEN.HUB_TEST) },
          { label: 'Compréhension' },
        ],
        activeHub: 'test',
      },
      'quiz-listening': {
        crumbs: [
          { label: 'Évaluation', onClick: () => navigateTo(SCREEN.HUB_TEST) },
          { label: 'Écouter' },
        ],
        activeHub: 'test',
      },
      dictee: {
        crumbs: [
          { label: 'Évaluation', onClick: () => navigateTo(SCREEN.HUB_TEST) },
          { label: 'Dictée', onClick: () => setStandaloneView(STANDALONE_VIEW.DICTEE_HUB) },
          { label: 'Par leçon' },
        ],
        activeHub: 'test',
      },
      'writing-setup': {
        crumbs: [
          { label: 'Écriture', onClick: () => navigateTo(SCREEN.HUB_WRITING) },
          { label: 'Par leçon' },
        ],
        activeHub: 'writing',
      },
    };
    const pickerShell = pickerShellByIntent[lessonPickerIntent] || pickerShellByIntent.text;
    return withShell(pickerPage, { ...pickerShell, scope: { type: 'global' } });
  }

  if (standaloneView === STANDALONE_VIEW.LESSON_WRITING_SETUP) {
    const targetLesson = lessonOptions.find((l) => l.id === lessonTextLessonId) || activeLesson;
    return withShell(
      <LessonWritingSetupPage
        shellHeader
        profile={activeProfile}
        lesson={targetLesson}
        lessons={lessonOptions}
        progressMap={childMap}
        onStartPractice={startJourneyFromLessonText}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
        onGoHome={goToLanding}
        onOpenAvatarEditor={openAvatarEditorForChildFromLanding}
        onSelectLesson={(id) => {
          if (!id) return;
          setActiveLesson(id);
          setLessonTextLessonId(id);
        }}
      />,
      {
        crumbs: [
          { label: 'Leçons', onClick: () => navigateTo(SCREEN.HUB_LESSONS) },
          { label: targetLesson?.title || 'Leçon', onClick: () => navigateTo(SCREEN.LESSON_TEXT, targetLesson?.id) },
          { label: 'Écriture' },
        ],
        scope: { type: 'lesson', lessonId: targetLesson?.id || '' },
        activeHub: 'writing',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.VOCAB_HUB) {
    return withShell(
      <ChoiceHubPage
        shellHeader
        title="Fiche"
        choices={[
          {
            key: 'by-lesson',
            label: 'Par leçon',
            description: 'Ordre guidé : caractères et vocabulaire de la leçon',
            onSelect: () => openLessonPicker('vocab', STANDALONE_VIEW.VOCAB_HUB),
          },
          {
            key: 'by-theme',
            label: 'Par thème',
            description: 'Révision libre : HSK1, Couleurs, Vêtements, Radicaux',
            onSelect: openThemeSelectFromHub,
          },
        ]}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
      />,
      { crumbs: [{ label: 'Fiche' }], scope: { type: 'global' }, activeHub: 'vocab' },
    );
  }

  if (standaloneView === STANDALONE_VIEW.THEME_SELECT) {
    return withShell(
      <ChoiceHubPage
        shellHeader
        title="Par thème"
        subtitle="Chaque carte propose Lire, Écrire et Quiz"
        choices={[
          {
            key: 'hsk',
            label: 'HSK1',
            description: '500 mots du référentiel HSK 3.0',
            onSelect: openHskDeckFromLanding,
          },
          { key: 'colors', label: 'Couleurs', onSelect: openColorsDeckFromLanding },
          { key: 'clothing', label: 'Vêtements', onSelect: openClothingDeckFromLanding },
          { key: 'radicals', label: 'Radicaux', onSelect: openRadicalDeckFromLanding },
        ]}
        onBack={() => setStandaloneView(STANDALONE_VIEW.VOCAB_HUB)}
      />,
      {
        crumbs: [
          { label: 'Fiche', onClick: () => navigateTo(SCREEN.HUB_VOCAB) },
          { label: 'Par thème' },
        ],
        scope: { type: 'global' },
        activeHub: 'vocab',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.WRITING_HUB) {
    return withShell(
      <ChoiceHubPage
        shellHeader
        title="Écriture"
        choices={[
          {
            key: 'by-lesson',
            label: 'Par leçon',
            description: 'Sélection des caractères, mode facile / difficile',
            onSelect: () => openLessonPicker('writing-setup', STANDALONE_VIEW.WRITING_HUB),
          },
          {
            key: 'by-theme',
            label: 'Par thème',
            description: 'HSK1, Couleurs, Vêtements, Radicaux',
            onSelect: openWritingThemeSelectFromHub,
          },
        ]}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
      />,
      { crumbs: [{ label: 'Écriture' }], scope: { type: 'global' }, activeHub: 'writing' },
    );
  }

  if (standaloneView === STANDALONE_VIEW.WRITING_THEME_SELECT) {
    return withShell(
      <ChoiceHubPage
        shellHeader
        title="Écriture par thème"
        choices={[
          { key: 'hsk', label: 'HSK1', onSelect: openHskWritingFromLanding },
          { key: 'colors', label: 'Couleurs', onSelect: openColorsWritingFromLanding },
          { key: 'clothing', label: 'Vêtements', onSelect: openClothingWritingFromLanding },
          { key: 'radicals', label: 'Radicaux', onSelect: openRadicalWritingFromLanding },
        ]}
        onBack={() => setStandaloneView(STANDALONE_VIEW.WRITING_HUB)}
      />,
      {
        crumbs: [
          { label: 'Écriture', onClick: () => navigateTo(SCREEN.HUB_WRITING) },
          { label: 'Par thème' },
        ],
        scope: { type: 'global' },
        activeHub: 'writing',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.TEST_HUB) {
    return withShell(
      <ChoiceHubPage
        shellHeader
        title="Évaluation"
        choices={[
          {
            key: 'comprehension',
            label: 'Compréhension',
            description: 'Français ↔ chinois, par leçon',
            onSelect: () => openLessonPicker('quiz-comprehension', STANDALONE_VIEW.TEST_HUB),
          },
          {
            key: 'listening',
            label: 'Écouter',
            description: 'Son → caractère ou traduction, par leçon',
            onSelect: () => openLessonPicker('quiz-listening', STANDALONE_VIEW.TEST_HUB),
          },
          {
            key: 'dictee',
            label: 'Dictée',
            description: 'Écris le mot de mémoire - caractère caché, par leçon ou par thème',
            onSelect: openDicteeHubFromLanding,
          },
        ]}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.NONE);
          setEnteredApp(false);
        }}
      />,
      { crumbs: [{ label: 'Évaluation' }], scope: { type: 'global' }, activeHub: 'test' },
    );
  }

  if (standaloneView === STANDALONE_VIEW.DICTEE_HUB) {
    return withShell(
      <ChoiceHubPage
        shellHeader
        title="Dictée"
        subtitle="Le caractère reste caché - seuls le pinyin et la traduction sont affichés"
        choices={[
          {
            key: 'by-lesson',
            label: 'Par leçon',
            description: 'Caractères et vocabulaire de la leçon',
            onSelect: openLessonDicteeFromLanding,
          },
          {
            key: 'by-theme',
            label: 'Par thème',
            description: 'HSK1, Couleurs, Vêtements, Radicaux',
            onSelect: openDicteeThemeSelectFromHub,
          },
        ]}
        onBack={() => {
          setStandaloneView(STANDALONE_VIEW.TEST_HUB);
        }}
      />,
      {
        crumbs: [
          { label: 'Évaluation', onClick: () => navigateTo(SCREEN.HUB_TEST) },
          { label: 'Dictée' },
        ],
        scope: { type: 'global' },
        activeHub: 'test',
      },
    );
  }

  if (standaloneView === STANDALONE_VIEW.DICTEE_THEME_SELECT) {
    return withShell(
      <ChoiceHubPage
        shellHeader
        title="Dictée par thème"
        choices={[
          { key: 'hsk', label: 'HSK1', onSelect: openHskDicteeFromLanding },
          { key: 'colors', label: 'Couleurs', onSelect: openColorsDicteeFromLanding },
          { key: 'clothing', label: 'Vêtements', onSelect: openClothingDicteeFromLanding },
          { key: 'radicals', label: 'Radicaux', onSelect: openRadicalDicteeFromLanding },
        ]}
        onBack={() => setStandaloneView(STANDALONE_VIEW.DICTEE_HUB)}
      />,
      {
        crumbs: [
          { label: 'Évaluation', onClick: () => navigateTo(SCREEN.HUB_TEST) },
          { label: 'Dictée', onClick: () => setStandaloneView(STANDALONE_VIEW.DICTEE_HUB) },
          { label: 'Par thème' },
        ],
        scope: { type: 'global' },
        activeHub: 'test',
      },
    );
  }

  // DEPRECATED - confirmed unreachable (header-consistency audit, 2026):
  // see openFlashcardsFromLanding's comment above. Safe to delete along
  // with FlashcardOnlyPage.jsx.
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

  // DEPRECATED - confirmed unreachable (header-consistency audit, 2026):
  // see openAudioFromLanding's comment above. Safe to delete along with
  // AudioOnlyPage.jsx.
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

  // DEPRECATED - confirmed unreachable (header-consistency audit, 2026):
  // only reached from FLASHCARDS'/AUDIO's own onSwitchModule cross-links,
  // which are themselves unreachable. Safe to delete along with
  // UnifiedLearningFlow.jsx.
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

  // DEPRECATED - confirmed unreachable (header-consistency audit, 2026):
  // no setter for this view anywhere in the file besides this render guard.
  if (standaloneView === STANDALONE_VIEW.LESSON_BETA) {
    if (!isDevMode) {
      setStandaloneView(STANDALONE_VIEW.NONE);
      return null;
    }
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
        packs={getPacks()}
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

  // DEPRECATED - confirmed unreachable (header-consistency audit, 2026):
  // see openFontTestFromLanding's comment above. Safe to delete along with
  // ChineseFontTestPage.jsx.
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
        onComplete={handleFtueComplete}
      />
    );
  }

  if (!enteredApp) {
    return (
      <>
        <LandingPage
          profiles={profiles}
          onOpenLessonEditorUi={openLessonEditorFromLanding}
          onOpenLessonsHubUi={openLessonsHubFromLanding}
          onOpenVocabularyHubUi={openVocabularyHubFromLanding}
          onOpenWritingHubUi={openWritingHubFromLanding}
          onOpenTestHubUi={openTestHubFromLanding}
          onResumeLastLesson={lastActivity?.resume || openLessonTextFromLanding}
          lastActivity={lastActivity}
          onOpenAvatarEditor={openAvatarEditorForChildFromLanding}
          onOpenParentSpace={() => setShowParentSpace(true)}
          onStartProfile={startWithProfile}
          onRefreshLessons={refreshBundledLessons}
        />
        {showAvatarEditorModal ? <AvatarEditorModal onClose={() => setShowAvatarEditorModal(false)} /> : null}
      </>
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

  if (enteredApp && isParentMode && isDevMode) {
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
      {showAvatarEditorModal ? <AvatarEditorModal onClose={() => setShowAvatarEditorModal(false)} /> : null}

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
                  {profiles
                    .filter((profile) => isDevMode || profile.role !== 'parent')
                    .map((profile) => (
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
                {isDevMode ? (
                  <button type="button" className="button secondary button-sm" onClick={createAndSwitchProfile}>
                    Nouveau profil
                  </button>
                ) : null}
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

          {activeModule === MODULES.PARENT_HOME && isParentMode && isDevMode ? (
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

          {activeModule === MODULES.FLASHCARDS && currentAllWordsCard ? (
            <section className="module-pane">
              <FlashcardStandaloneUI
                profile={activeProfile}
                lessonId={activeLesson?.id}
                lessonTitle={activeLesson?.title}
                lessons={lessonOptions}
                card={currentAllWordsCard}
                cardIndex={vocabWordIndex}
                totalCards={lessonAllWords.length}
                earnedStars={earnedAllWordsStars}
                onPrev={goToPrevVocabWord}
                onNext={goToNextVocabWord}
                onOpenLessonText={(lessonId) => {
                  const targetId = lessonId || activeLesson?.id;
                  if (targetId) openLessonTextView(targetId);
                }}
                onSelectLesson={(lessonId) => {
                  if (!lessonId) return;
                  setActiveLesson(lessonId);
                  setVocabWordIndex(0);
                }}
                onSwitchModule={(module) => {
                  if (module === 'writing') {
                    setDeckWritingDifficulty(1);
                    setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WRITING);
                  } else if (module === 'quiz') {
                    setQuizAllowedTypes(null);
                    setStandaloneView(STANDALONE_VIEW.LESSON_QUIZ);
                  } else {
                    setActiveModule(module);
                  }
                }}
                onOpenPicker={() => setStandaloneView(STANDALONE_VIEW.LESSON_WORD_SELECT)}
                onBack={goToLanding}
              />
            </section>
          ) : null}

          {activeModule === MODULES.AUDIO && currentAllWordsCard ? (
            <section className="module-pane">
              <AudioStandaloneUI
                profile={activeProfile}
                lessonId={activeLesson?.id}
                lessonTitle={activeLesson?.title}
                lessons={lessonOptions}
                card={currentAllWordsCard}
                cardIndex={vocabWordIndex}
                totalCards={lessonAllWords.length}
                mode={mode}
                cardKey={currentAllWordsCardKey}
                onPrev={goToPrevVocabWord}
                onNext={goToNextVocabWord}
                onOpenLessonText={(lessonId) => {
                  const targetId = lessonId || activeLesson?.id;
                  if (targetId) openLessonTextView(targetId);
                }}
                onSelectLesson={(lessonId) => {
                  if (!lessonId) return;
                  setActiveLesson(lessonId);
                  setVocabWordIndex(0);
                }}
                onSwitchModule={(module) => {
                  if (module === 'writing') {
                    setDeckWritingDifficulty(1);
                    setStandaloneView(STANDALONE_VIEW.LESSON_VOCAB_WRITING);
                  } else if (module === 'quiz') {
                    setQuizAllowedTypes(null);
                    setStandaloneView(STANDALONE_VIEW.LESSON_QUIZ);
                  } else {
                    setActiveModule(module);
                  }
                }}
                onOpenPicker={() => setStandaloneView(STANDALONE_VIEW.LESSON_WORD_SELECT)}
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
                parentProfile={profiles.find((profile) => profile.role === 'parent') || null}
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

          {activeModule === MODULES.QUIZ && activeLesson ? (
            <section className="module-pane">
              <LessonQuizPage
                profile={activeProfile}
                lessonId={activeLesson.id}
                lessonTitle={activeLesson.title}
                words={lessonAllWords}
                onBack={goToLanding}
                onSwitchModule={setActiveModule}
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
          activeModule !== MODULES.QUIZ &&
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
