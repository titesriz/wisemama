/**
 * Lessons Database v2
 * Lecons avec references vers Character Database
 * localStorage key: 'lessons-v2'
 */

// ============================================
// SCHEMA
// ============================================

/**
 * @typedef {Object} LessonV2
 * @property {string} id - ID unique
 * @property {string} globalLessonId - UUID global
 * @property {number} order - Ordre sequentiel (1, 2, 3...)
 * @property {string} title - Titre lecon
 * @property {string} description - Description
 * @property {string} sourceText - Texte source (avec \n)
 * @property {string[]} characterRefs - References hanzi (pas donnees completes)
 * @property {SentenceAudio[]} sentenceAudios - Audio phrases completes (optionnel)
 * @property {string} notes - Notes parent
 * @property {string} createdDate - Date ISO creation
 * @property {string} lastUpdated - Date ISO modification
 */

/**
 * @typedef {Object} SentenceAudio
 * @property {string} sentence - Phrase chinoise
 * @property {string} audioUrl - URL audio phrase
 * @property {string} recordedBy - Enregistreur
 * @property {string} recordedDate - Date ISO
 */

import { getCharacter, markCharacterInLesson } from './characterDB.js';

// ============================================
// FONCTIONS API
// ============================================

/**
 * Recuperer toutes les lecons
 */
export function getAllLessons() {
  const lessons = JSON.parse(localStorage.getItem('lessons-v2') || '[]');
  return lessons;
}

/**
 * Recuperer lecon par ID
 */
export function getLesson(lessonId) {
  const lessons = getAllLessons();
  return lessons.find((l) => l.id === lessonId) || null;
}

/**
 * Creer nouvelle lecon
 */
export function createLesson(data = {}) {
  const lessons = getAllLessons();

  const providedId = typeof data.id === 'string' && data.id ? data.id : '';
  const providedGlobalId =
    typeof data.globalLessonId === 'string' && data.globalLessonId ? data.globalLessonId : '';

  const newLesson = {
    id: providedId || `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    globalLessonId: providedGlobalId || crypto.randomUUID(),
    order: data.order || lessons.length + 1,
    title: data.title || 'Nouvelle lecon',
    description: data.description || '',
    sourceText: data.sourceText || '',
    characterRefs: data.characterRefs || [],
    sentenceAudios: data.sentenceAudios || [],
    notes: data.notes || '',
    cardMap: data.cardMap || {},
    createdDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  lessons.push(newLesson);
  saveLessons(lessons);

  newLesson.characterRefs.forEach((hanzi) => {
    markCharacterInLesson(hanzi, newLesson.id);
  });

  return newLesson;
}

/**
 * Mettre a jour lecon
 */
export function updateLesson(lessonId, updates) {
  const lessons = getAllLessons();
  const index = lessons.findIndex((l) => l.id === lessonId);

  if (index === -1) {
    console.error(`Lesson ${lessonId} not found`);
    return null;
  }

  const oldRefs = lessons[index].characterRefs || [];
  const newRefs = updates.characterRefs || oldRefs;

  lessons[index] = {
    ...lessons[index],
    ...updates,
    id: lessonId,
    lastUpdated: new Date().toISOString(),
  };

  saveLessons(lessons);

  if (JSON.stringify(oldRefs) !== JSON.stringify(newRefs)) {
    syncCharacterRefs(lessonId, oldRefs, newRefs);
  }

  return lessons[index];
}

/**
 * Supprimer lecon
 */
export function deleteLesson(lessonId) {
  const lessons = getAllLessons();
  const filtered = lessons.filter((l) => l.id !== lessonId);

  saveLessons(filtered);

  return true;
}

/**
 * Dupliquer lecon
 */
export function duplicateLesson(lessonId) {
  const original = getLesson(lessonId);
  if (!original) return null;

  return createLesson({
    ...original,
    id: '',
    globalLessonId: '',
    title: `${original.title} (copie)`,
    order: getAllLessons().length + 1,
  });
}

/**
 * Sauvegarder toutes lecons
 */
function saveLessons(lessons) {
  localStorage.setItem('lessons-v2', JSON.stringify(lessons));
}

export function setAllLessons(lessons) {
  if (!Array.isArray(lessons)) return;
  saveLessons(lessons);
}

/**
 * Synchroniser refs caracteres avec Character DB
 */
function syncCharacterRefs(lessonId, oldRefs, newRefs) {
  void lessonId;
  void oldRefs;
  void newRefs;
}

/**
 * Trier lecons par ordre
 */
export function getLessonsByOrder() {
  const lessons = getAllLessons();
  return lessons.sort((a, b) => (a.order || 999) - (b.order || 999));
}

/**
 * Obtenir lecons precedentes
 */
export function getPreviousLessons(lessonId) {
  const sorted = getLessonsByOrder();
  const currentIndex = sorted.findIndex((l) => l.id === lessonId);
  return sorted.slice(0, currentIndex);
}

/**
 * Obtenir caracteres avec donnees completes pour une lecon
 */
export function getLessonCharactersExpanded(lessonId) {
  const lesson = getLesson(lessonId);
  if (!lesson) return [];

  return lesson.characterRefs.map((hanzi) => {
    const char = getCharacter(hanzi);
    return char || { hanzi, error: 'Character not found in DB' };
  });
}
