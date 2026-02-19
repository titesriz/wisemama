import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import defaultLessons from '../data/lessons.json';

const lessonsStorageKey = 'wisemama-lessons-v1';
const lessonsStorageVersion = '2026-02-19-sync-v1';
const LessonsContext = createContext(null);

function safeString(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value;
}

function normalizeCard(card, index = 0) {
  return {
    id: safeString(card?.id, `card-${Date.now()}-${index}`),
    hanzi: safeString(card?.hanzi),
    pinyin: safeString(card?.pinyin),
    french: safeString(card?.french),
    english: safeString(card?.english),
    imageUrl: card?.imageUrl === null ? null : safeString(card?.imageUrl, null),
    audioUrl: card?.audioUrl === null ? null : safeString(card?.audioUrl, null),
  };
}

function normalizeLesson(lesson, index = 0) {
  const cards = Array.isArray(lesson?.cards) ? lesson.cards.map((c, i) => normalizeCard(c, i)) : [];
  return {
    id: safeString(lesson?.id, `lesson-${Date.now()}-${index}`),
    globalLessonId: safeString(lesson?.globalLessonId, makeGlobalLessonId()),
    title: safeString(lesson?.title, `Lecon ${index + 1}`),
    description: safeString(lesson?.description, ''),
    updatedAt: safeString(lesson?.updatedAt, ''),
    cards,
  };
}

function normalizeLessons(input) {
  if (!Array.isArray(input)) return [];
  return input.map((lesson, index) => normalizeLesson(lesson, index));
}

function mergeBundledLessons(storedLessons, bundledLessons) {
  const normalizedStored = normalizeLessons(storedLessons);
  const normalizedBundled = normalizeLessons(bundledLessons);
  const storedById = new Map(normalizedStored.map((lesson) => [lesson.id, lesson]));
  const merged = [...normalizedStored];

  for (const bundledLesson of normalizedBundled) {
    const current = storedById.get(bundledLesson.id);
    if (!current) {
      merged.push(bundledLesson);
      storedById.set(bundledLesson.id, bundledLesson);
      continue;
    }

    const currentCardIds = new Set(current.cards.map((card) => card.id));
    const missingCards = bundledLesson.cards.filter((card) => !currentCardIds.has(card.id));
    if (missingCards.length === 0) continue;

    const updated = {
      ...current,
      cards: [...current.cards, ...missingCards],
    };
    const index = merged.findIndex((lesson) => lesson.id === current.id);
    if (index >= 0) merged[index] = updated;
    storedById.set(updated.id, updated);
  }

  return merged;
}

function makeLessonId() {
  return `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeGlobalLessonId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `glesson-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeCardId() {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function stampNow() {
  return new Date().toISOString();
}

function defaultCard() {
  return {
    id: makeCardId(),
    hanzi: '',
    pinyin: '',
    french: '',
    english: '',
    imageUrl: null,
    audioUrl: null,
  };
}

export function LessonsProvider({ children }) {
  const [lessons, setLessons] = useState(() => normalizeLessons(defaultLessons));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(lessonsStorageKey);
      if (!stored) {
        setLessons(normalizeLessons(defaultLessons));
        return;
      }
      const parsed = JSON.parse(stored);
      const storedLessons = Array.isArray(parsed) ? parsed : parsed?.lessons;
      const normalizedStored = normalizeLessons(storedLessons);
      const merged = mergeBundledLessons(normalizedStored, defaultLessons);
      if (merged.length > 0) setLessons(merged);
      else setLessons(normalizeLessons(defaultLessons));
    } catch {
      setLessons(normalizeLessons(defaultLessons));
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        lessonsStorageKey,
        JSON.stringify({
          version: lessonsStorageVersion,
          lessons,
        }),
      );
    } catch {
      // no-op
    }
  }, [lessons]);

  const addLesson = () => {
    const newLesson = {
      id: makeLessonId(),
      globalLessonId: makeGlobalLessonId(),
      title: 'Nouvelle lecon',
      description: '',
      updatedAt: stampNow(),
      cards: [defaultCard()],
    };
    setLessons((prev) => [...prev, newLesson]);
    return newLesson.id;
  };

  const removeLesson = (lessonId) => {
    setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
  };

  const updateLessonTitle = (lessonId, title) => {
    setLessons((prev) =>
      prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, title, updatedAt: stampNow() } : lesson)),
    );
  };

  const addCard = (lessonId) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId
          ? { ...lesson, cards: [...lesson.cards, defaultCard()], updatedAt: stampNow() }
          : lesson,
      ),
    );
  };

  const removeCard = (lessonId, cardId) => {
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== lessonId) return lesson;
        return { ...lesson, cards: lesson.cards.filter((card) => card.id !== cardId), updatedAt: stampNow() };
      }),
    );
  };

  const moveCard = (lessonId, cardId, direction) => {
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== lessonId) return lesson;
        const idx = lesson.cards.findIndex((card) => card.id === cardId);
        if (idx < 0) return lesson;
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= lesson.cards.length) return lesson;
        const nextCards = [...lesson.cards];
        const [item] = nextCards.splice(idx, 1);
        nextCards.splice(target, 0, item);
        return { ...lesson, cards: nextCards, updatedAt: stampNow() };
      }),
    );
  };

  const updateCard = (lessonId, cardId, patch) => {
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== lessonId) return lesson;
        return {
          ...lesson,
          updatedAt: stampNow(),
          cards: lesson.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card)),
        };
      }),
    );
  };

  const createLesson = ({ title = 'Nouvelle lecon', description = '', cards = [defaultCard()] } = {}) => {
    const lesson = normalizeLesson(
      {
        id: makeLessonId(),
        globalLessonId: makeGlobalLessonId(),
        title,
        description,
        updatedAt: stampNow(),
        cards,
      },
      0,
    );
    setLessons((prev) => [...prev, lesson]);
    return lesson;
  };

  const updateLesson = (lessonId, patch = {}) => {
    setLessons((prev) =>
      prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, ...patch, updatedAt: stampNow() } : lesson)),
    );
  };

  const duplicateLesson = (lessonId) => {
    let duplicated = null;
    setLessons((prev) => {
      const source = prev.find((lesson) => lesson.id === lessonId);
      if (!source) return prev;
      duplicated = normalizeLesson(
        {
          ...source,
          id: makeLessonId(),
          globalLessonId: makeGlobalLessonId(),
          title: `${source.title} (Copy)`,
          updatedAt: stampNow(),
          cards: source.cards.map((card) => ({
            ...card,
            id: makeCardId(),
          })),
        },
        0,
      );
      return [...prev, duplicated];
    });
    return duplicated;
  };

  const replaceLessons = (payload) => {
    const normalized = normalizeLessons(payload);
    if (normalized.length === 0) {
      throw new Error('invalid_lessons');
    }
    setLessons(normalized);
  };

  const resetLessonsToDefault = () => {
    setLessons(normalizeLessons(defaultLessons));
  };

  const value = useMemo(
    () => ({
      lessons,
      addLesson,
      createLesson,
      removeLesson,
      updateLesson,
      duplicateLesson,
      updateLessonTitle,
      addCard,
      removeCard,
      moveCard,
      updateCard,
      replaceLessons,
      resetLessonsToDefault,
    }),
    [lessons],
  );

  return <LessonsContext.Provider value={value}>{children}</LessonsContext.Provider>;
}

export function useLessons() {
  const ctx = useContext(LessonsContext);
  if (!ctx) {
    throw new Error('useLessons must be used inside LessonsProvider');
  }
  return ctx;
}
