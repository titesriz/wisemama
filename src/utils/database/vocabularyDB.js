/**
 * Vocabulary Database (multi-character words)
 * Sibling collection to characterDB.js's character-database: single hanzi
 * live there, words of 2+ characters live here. Same localStorage-seeded-
 * from-bundled-JSON pattern, same "appears in" tagging shape
 * (appearsInLessons / hskLevel / hskOrder / decks / sources).
 * localStorage key: 'vocabulary-database'
 */

/**
 * @typedef {Object} VocabWord
 * @property {string} id - = hanzi (primary key)
 * @property {string} hanzi
 * @property {string} pinyin
 * @property {string} traditional - only set when it differs from hanzi
 * @property {string} french
 * @property {string} english
 * @property {string[]} appearsInLessons
 * @property {number|null} hskLevel
 * @property {number|null} hskOrder
 * @property {string[]} decks
 * @property {string[]} sources
 */

export function getAllWords() {
  try {
    const raw = localStorage.getItem('vocabulary-database');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getWord(hanzi) {
  if (!hanzi) return null;
  return getAllWords().find((word) => word.hanzi === hanzi) || null;
}

export function getWordsByLesson(lessonId) {
  if (!lessonId) return [];
  return getAllWords().filter((word) => (word.appearsInLessons || []).includes(lessonId));
}

export function getWordsByHskLevel(level) {
  return getAllWords()
    .filter((word) => word.hskLevel === level && word.hskOrder !== null)
    .sort((a, b) => (a.hskOrder ?? 0) - (b.hskOrder ?? 0));
}

function saveAllWords(words) {
  localStorage.setItem('vocabulary-database', JSON.stringify(words));
}

export function wordExists(hanzi) {
  return getWord(hanzi) !== null;
}

export function createWord(hanzi, data = {}) {
  const words = getAllWords();
  if (words.some((word) => word.hanzi === hanzi)) {
    console.warn(`Word ${hanzi} already exists. Use updateWord instead.`);
    return getWord(hanzi);
  }

  const newWord = {
    id: hanzi,
    hanzi,
    pinyin: data.pinyin || '',
    traditional: data.traditional || '',
    french: data.french || '',
    english: data.english || '',
    appearsInLessons: data.appearsInLessons || [],
    hskLevel: data.hskLevel ?? null,
    hskOrder: data.hskOrder ?? null,
    decks: data.decks || [],
    sources: data.sources || ['manual'],
  };

  words.push(newWord);
  saveAllWords(words);
  return newWord;
}

export function updateWord(hanzi, updates) {
  const words = getAllWords();
  const index = words.findIndex((word) => word.hanzi === hanzi);
  if (index === -1) {
    console.error(`Word ${hanzi} does not exist. Use createWord first.`);
    return null;
  }

  words[index] = { ...words[index], ...updates, hanzi, id: hanzi };
  saveAllWords(words);
  return words[index];
}

export function upsertWord(hanzi, data) {
  if (wordExists(hanzi)) return updateWord(hanzi, data);
  return createWord(hanzi, data);
}

export function deleteWord(hanzi) {
  const words = getAllWords();
  const next = words.filter((word) => word.hanzi !== hanzi);
  if (next.length === words.length) return false;
  saveAllWords(next);
  return true;
}

export function addWordToLesson(hanzi, lessonId) {
  const word = getWord(hanzi);
  if (!word) return null;
  if ((word.appearsInLessons || []).includes(lessonId)) return word;
  return updateWord(hanzi, { appearsInLessons: [...(word.appearsInLessons || []), lessonId] });
}
