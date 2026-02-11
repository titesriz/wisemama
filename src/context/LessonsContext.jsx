import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import defaultLessons from '../data/lessons.json';

const lessonsStorageKey = 'wisemama-lessons-v1';
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
    title: safeString(lesson?.title, `Lecon ${index + 1}`),
    cards,
  };
}

function normalizeLessons(input) {
  if (!Array.isArray(input)) return [];
  return input.map((lesson, index) => normalizeLesson(lesson, index));
}

function makeLessonId() {
  return `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeCardId() {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
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
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const normalized = normalizeLessons(parsed);
      if (normalized.length > 0) {
        setLessons(normalized);
      }
    } catch {
      setLessons(normalizeLessons(defaultLessons));
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(lessonsStorageKey, JSON.stringify(lessons));
    } catch {
      // no-op
    }
  }, [lessons]);

  const addLesson = () => {
    const newLesson = {
      id: makeLessonId(),
      title: 'Nouvelle lecon',
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
      prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, title } : lesson)),
    );
  };

  const addCard = (lessonId) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, cards: [...lesson.cards, defaultCard()] } : lesson,
      ),
    );
  };

  const removeCard = (lessonId, cardId) => {
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== lessonId) return lesson;
        return { ...lesson, cards: lesson.cards.filter((card) => card.id !== cardId) };
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
        return { ...lesson, cards: nextCards };
      }),
    );
  };

  const updateCard = (lessonId, cardId, patch) => {
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== lessonId) return lesson;
        return {
          ...lesson,
          cards: lesson.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card)),
        };
      }),
    );
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
      removeLesson,
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
