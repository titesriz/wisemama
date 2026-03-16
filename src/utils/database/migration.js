/**
 * Migration helpers for DB v2
 */

import {
  getAllCharacters,
  resetCharacterDB,
  upsertCharacter,
} from './characterDB.js';
import {
  getAllLessons,
  createLesson,
} from './lessonDB.js';

const CJK_CHAR_RE = /[\u3400-\u9fff\uf900-\ufaff]/u;

function extractUniqueChars(text = '') {
  const seen = new Set();
  const ordered = [];
  for (const char of Array.from(String(text || ''))) {
    if (!CJK_CHAR_RE.test(char)) continue;
    if (seen.has(char)) continue;
    seen.add(char);
    ordered.push(char);
  }
  return ordered;
}

function normalizeOrder(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return fallback;
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Migrate v1 lessons into v2 character DB and lessons-v2.
 * This does NOT touch the existing app flow.
 */
export function migrateLessonsV1ToV2(lessonsV1 = [], options = {}) {
  const {
    reset = false,
    lessonIdPrefix = 'lesson',
    markProgress = false,
  } = options;

  if (!Array.isArray(lessonsV1) || lessonsV1.length === 0) {
    return { ok: false, error: 'no_lessons' };
  }

  if (reset) {
    resetCharacterDB();
    localStorage.removeItem('lessons-v2');
  }

  const existingChars = getAllCharacters();
  const createdLessons = [];
  const seenChars = new Set(Object.keys(existingChars));

  lessonsV1.forEach((lesson, index) => {
    const order = normalizeOrder(lesson?.order, index + 1);
    const title = String(lesson?.title || `Lecon ${order}`);
    const description = String(lesson?.description || '');
    const sourceText = String(lesson?.sourceText || '');
    const notes = String(lesson?.notes || '');
    const cards = Array.isArray(lesson?.cards) ? lesson.cards : [];

    const cardChars = cards.flatMap((card) => extractUniqueChars(card?.hanzi || ''));
    const sourceChars = extractUniqueChars(sourceText);
    const characterRefs = Array.from(new Set([...cardChars, ...sourceChars]));

    characterRefs.forEach((hanzi) => {
      const card = cards.find((c) => String(c?.hanzi || '').includes(hanzi)) || null;
      const pinyin = String(card?.pinyin || '');
      const french = String(card?.french || card?.translation?.fr || '');
      const english = String(card?.english || card?.translation?.en || '');
      const audioUrl = card?.audioUrl || null;
      const imageUrl = card?.imageUrl || null;

      const audioRecordings = audioUrl
        ? [
            {
              id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              url: audioUrl,
              recordedBy: 'import',
              recordedByProfile: '',
              recordedDate: nowIso(),
              duration: 0,
              isPrimary: true,
              quality: 'good',
            },
          ]
        : [];

      const images = imageUrl
        ? [
            {
              id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              url: imageUrl,
              source: 'upload',
              uploadedDate: nowIso(),
            },
          ]
        : [];

      upsertCharacter(hanzi, {
        pinyin,
        pinyinNumbered: pinyin,
        french,
        english,
        audioRecordings,
        images,
        firstSeenLesson: lesson?.id || null,
        firstSeenDate: nowIso(),
        appearsInLessons: [lesson?.id || `${lessonIdPrefix}-${order}`],
        relatedWords: Array.isArray(card?.relatedWords)
          ? card.relatedWords.map((item) => ({
              word: item?.hanzi || '',
              pinyin: item?.pinyin || '',
              definition: item?.en || '',
            }))
          : [],
        progress: markProgress
          ? {
              status: 'learning',
              confidence: 0.25,
              totalPractices: 1,
              modules: {
                read: { completed: false, stars: 0, lastDate: null },
                speak: { completed: false, stars: 0, lastDate: null },
                write: { completed: false, stars: 0, lastDate: null },
              },
            }
          : undefined,
      });

      seenChars.add(hanzi);
    });

    const newLesson = createLesson({
      order,
      title,
      description,
      sourceText,
      characterRefs,
      notes,
      sentenceAudios: [],
    });
    createdLessons.push(newLesson);
  });

  return {
    ok: true,
    lessons: createdLessons.length,
    characters: Array.from(seenChars).length,
  };
}

/**
 * Convenience helper to migrate from current v1 localStorage payload.
 */
export function migrateFromLocalStorageV1(options = {}) {
  const raw = localStorage.getItem('wisemama-lessons-v1');
  if (!raw) return { ok: false, error: 'no_localstorage' };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'parse_error' };
  }

  const lessons = Array.isArray(parsed) ? parsed : parsed?.lessons;
  return migrateLessonsV1ToV2(lessons || [], options);
}

/**
 * Inspect v2 DB stats quickly.
 */
export function getV2Stats() {
  return {
    lessons: getAllLessons().length,
    characters: Object.keys(getAllCharacters()).length,
  };
}
