// Raw quiz-attempt log, per profile + deck. Every answered question is
// logged as one event; scores, competency breakdowns and per-character
// mastery are always recomputed from these events on read (never stored as
// a separate aggregate), so there's a single source of truth to keep in
// sync.

const QUIZ_LOG_KEY = 'wisemama-quiz-log-v1';
// Keeps the store bounded for a long-lived kid profile without needing a
// separate pruning/export step.
const MAX_EVENTS_PER_DECK = 1000;

// Which competency each question type exercises - a type can test more
// than one (e.g. reading a character also tests whether its meaning is
// known). Used to recompute a competency x deck x profile breakdown from
// the raw event log. Shared across decks - 'sound-to-char' means the same
// thing (hear a word, pick its written character) whether it's the Colors
// deck or HSK1, so both decks log the same key rather than duplicating it.
export const QUESTION_TYPE_COMPETENCIES = {
  // Colors deck
  'swatch-to-char': ['caractere', 'signification'],
  'char-to-swatch': ['caractere', 'signification'],
  'sound-to-char': ['ecoute', 'caractere'],
  'sound-to-swatch': ['ecoute', 'signification'],
  // HSK1 deck
  'char-to-translation': ['caractere', 'signification'],
  'translation-to-char': ['signification', 'caractere'],
  'sound-to-translation': ['ecoute', 'signification'],
};

function readStore() {
  try {
    const raw = localStorage.getItem(QUIZ_LOG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(QUIZ_LOG_KEY, JSON.stringify(store));
  } catch {
    // Best-effort logging only - never break the quiz over a storage error.
  }
}

export function createSessionId() {
  return `s${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function logQuizEvent({
  profileId,
  deckId,
  sessionId,
  charId,
  questionType,
  correct,
  hintUsed = false,
  soundReplays = 0,
}) {
  if (!profileId || !deckId) return;
  const store = readStore();
  const profileStore = store[profileId] || {};
  const events = profileStore[deckId] || [];
  events.push({ sessionId, charId, questionType, correct, hintUsed, soundReplays, timestamp: Date.now() });
  if (events.length > MAX_EVENTS_PER_DECK) {
    events.splice(0, events.length - MAX_EVENTS_PER_DECK);
  }
  store[profileId] = { ...profileStore, [deckId]: events };
  writeStore(store);
}

export function getDeckEvents(profileId, deckId) {
  if (!profileId || !deckId) return [];
  const store = readStore();
  return store[profileId]?.[deckId] || [];
}

export function filterBySession(events, sessionId) {
  return events.filter((event) => event.sessionId === sessionId);
}

export function summarizeByType(events, types) {
  return types.reduce((acc, type) => {
    const typeEvents = events.filter((event) => event.questionType === type);
    acc[type] = {
      correct: typeEvents.filter((event) => event.correct).length,
      total: typeEvents.length,
    };
    return acc;
  }, {});
}

export function summarizeByCompetency(events) {
  const stats = {};
  events.forEach((event) => {
    const competencies = QUESTION_TYPE_COMPETENCIES[event.questionType] || [];
    competencies.forEach((competency) => {
      if (!stats[competency]) stats[competency] = { correct: 0, total: 0 };
      stats[competency].total += 1;
      if (event.correct) stats[competency].correct += 1;
    });
  });
  return stats;
}

export function summarizeByCharacter(events) {
  const stats = {};
  events.forEach((event) => {
    if (!stats[event.charId]) stats[event.charId] = { correct: 0, total: 0 };
    stats[event.charId].total += 1;
    if (event.correct) stats[event.charId].correct += 1;
  });
  return stats;
}
