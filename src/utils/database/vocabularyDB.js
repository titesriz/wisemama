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
