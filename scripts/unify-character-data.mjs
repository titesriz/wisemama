import fs from 'node:fs/promises';
import path from 'node:path';

// One-time migration: folds cedict-mini.json and hsk1-words.json into
// character-database.json (single characters) and a new
// vocabulary-database.json (multi-character words), plus the pilot lesson's
// inline vocabulary. Same spirit as build-hsk1-deck.mjs's 22-sept merge,
// generalized to all three sources at once.
//
// Priority when the SAME hanzi/word has conflicting content across sources
// (french/english/pinyin): lesson-authored > HSK1 > cedict-mini. Every
// conflict is logged, never silently dropped - see the printed report and
// unify-conflicts-report.json.
//
// hsk1-words.json and cedict-mini.json are NOT deleted by this script -
// they become regenerated/unused artifacts respectively, kept until the
// new schema is verified end-to-end.

const ROOT = path.resolve(import.meta.dirname, '..');
const CHARACTER_DB_PATH = path.join(ROOT, 'src/data/character-database.json');
const CEDICT_PATH = path.join(ROOT, 'src/data/cedict-mini.json');
const HSK_WORDS_PATH = path.join(ROOT, 'src/data/hsk1-words.json');
const LESSONS_PATH = path.join(ROOT, 'src/data/lessons-v2.json');
const VOCAB_DB_PATH = path.join(ROOT, 'src/data/vocabulary-database.json');
const REPORT_PATH = path.join(ROOT, 'scripts/unify-conflicts-report.json');
const HSK_SOURCE_URL = 'https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/inclusive/new/1.json';

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf-8'));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.json();
}

function isSingleChar(hanzi) {
  return Array.from(hanzi || '').length === 1;
}

function trim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Default record shape for a brand-new character (mirrors
// build-hsk1-deck.mjs's makeCharacterRecord, kept identical on purpose).
function makeCharacterRecord(hanzi, { pinyin, french, english }) {
  return {
    hanzi,
    pinyin,
    pinyinNumbered: pinyin,
    traditional: '',
    french,
    english,
    audioRecordings: [],
    images: [],
    firstSeenLesson: null,
    firstSeenDate: null,
    appearsInLessons: [],
    relatedWords: [],
    radical: '',
    decomposition: '',
    components: [],
    componentMatches: [],
    etymology: null,
    hskLevel: null,
    hskOrder: null,
    decks: [],
    sources: [],
    metadataSource: null,
    progress: {
      status: 'new',
      confidence: 0,
      totalPractices: 0,
      modules: {
        read: { completed: false, stars: 0, lastDate: null },
        speak: { completed: false, stars: 0, lastDate: null },
        write: { completed: false, stars: 0, lastDate: null },
      },
    },
    createdDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

function makeVocabRecord(hanzi, { pinyin, french, english }) {
  return {
    id: hanzi,
    hanzi,
    pinyin,
    traditional: '',
    french,
    english,
    appearsInLessons: [],
    hskLevel: null,
    hskOrder: null,
    decks: [],
    sources: [],
  };
}

const conflicts = [];

function logConflict(collection, hanzi, field, kept, keptSource, rejected, rejectedSource) {
  if (trim(kept) === trim(rejected)) return;
  if (!trim(rejected)) return; // nothing to conflict with
  conflicts.push({ collection, hanzi, field, kept, keptSource, rejected, rejectedSource });
}

// Merges a lower-priority source's content into an existing record WITHOUT
// overwriting french/english/pinyin (lesson/higher-priority wins there),
// but always merges membership tags (hskLevel/hskOrder/appearsInLessons)
// since those are facts about where the word appears, not translations.
function mergeLowerPriority(collection, record, incoming, incomingSource) {
  logConflict(collection, record.hanzi, 'french', record.french, record.sources[0] || 'existing', incoming.french, incomingSource);
  logConflict(collection, record.hanzi, 'english', record.english, record.sources[0] || 'existing', incoming.english, incomingSource);
  if (incoming.pinyin) {
    logConflict(collection, record.hanzi, 'pinyin', record.pinyin, record.sources[0] || 'existing', incoming.pinyin, incomingSource);
  }
  if (incoming.hskLevel && !record.hskLevel) {
    record.hskLevel = incoming.hskLevel;
    record.hskOrder = incoming.hskOrder ?? null;
  }
  if (!record.sources.includes(incomingSource)) record.sources.push(incomingSource);
  return record;
}

async function main() {
  const [charDb, cedict, hskWords, lessons, hskSource] = await Promise.all([
    readJson(CHARACTER_DB_PATH),
    readJson(CEDICT_PATH),
    readJson(HSK_WORDS_PATH),
    readJson(LESSONS_PATH),
    fetchJson(HSK_SOURCE_URL).catch((error) => {
      console.warn(`Could not fetch upstream HSK source for traditional forms: ${error.message}. Continuing without traditional data.`);
      return [];
    }),
  ]);

  // hanzi -> traditional (only kept when it differs from simplified).
  const traditionalByHanzi = new Map();
  hskSource.forEach((entry) => {
    const simplified = entry?.simplified;
    const traditional = entry?.forms?.[0]?.traditional;
    if (simplified && traditional && traditional !== simplified) {
      traditionalByHanzi.set(simplified, traditional);
    }
  });
  console.log(`Traditional forms available from upstream HSK source: ${traditionalByHanzi.size}/${hskSource.length}`);

  // --- Characters collection (single hanzi) ---
  // Start from the existing character-database.json verbatim - this is the
  // most complete source (stroke/radical/audio/progress data) and stays the
  // base every other source merges INTO, never the other way around.
  const characters = { ...charDb };
  Object.keys(characters).forEach((hanzi) => {
    const record = characters[hanzi];
    if (!Array.isArray(record.sources)) record.sources = [record.metadataSource === 'hsk1' ? 'hsk1' : 'character-database'];
    if (record.hskLevel === undefined) record.hskLevel = null;
    if (record.hskOrder === undefined) record.hskOrder = null;
    if (record.decks === undefined) record.decks = [];
    if (record.traditional === undefined) record.traditional = '';
    if (traditionalByHanzi.has(hanzi)) record.traditional = traditionalByHanzi.get(hanzi);
  });

  const vocabulary = new Map();

  // --- Fold in hsk1-words.json (single-char -> characters, multi-char -> vocabulary) ---
  hskWords.forEach((word, index) => {
    const hanzi = word.hanzi;
    const traditional = traditionalByHanzi.get(hanzi) || '';
    if (isSingleChar(hanzi)) {
      const existing = characters[hanzi];
      if (!existing) {
        const record = makeCharacterRecord(hanzi, word);
        record.traditional = traditional;
        record.hskLevel = 1;
        record.hskOrder = index;
        record.sources = ['hsk1'];
        record.metadataSource = 'hsk1';
        characters[hanzi] = record;
      } else if (existing.metadataSource === 'hsk1') {
        // Previously seeded by the old hsk1-only script - safe to fully refresh.
        existing.pinyin = word.pinyin;
        existing.pinyinNumbered = word.pinyin;
        existing.french = word.french;
        existing.english = word.english;
        existing.traditional = traditional;
        existing.hskLevel = 1;
        existing.hskOrder = index;
        if (!existing.sources.includes('hsk1')) existing.sources.push('hsk1');
      } else {
        // Lesson-authored - keep its french/english/pinyin, just tag HSK membership.
        mergeLowerPriority('characters', existing, { pinyin: word.pinyin, french: word.french, english: word.english, hskLevel: 1, hskOrder: index }, 'hsk1');
        if (traditional && !existing.traditional) existing.traditional = traditional;
      }
    } else {
      const existing = vocabulary.get(hanzi);
      if (!existing) {
        const record = makeVocabRecord(hanzi, word);
        record.traditional = traditional;
        record.hskLevel = 1;
        record.hskOrder = index;
        record.sources = ['hsk1'];
        vocabulary.set(hanzi, record);
      } else {
        mergeLowerPriority('vocabulary', existing, { pinyin: word.pinyin, french: word.french, english: word.english, hskLevel: 1, hskOrder: index }, 'hsk1');
      }
    }
  });

  // --- Fold in cedict-mini.json (lowest priority) ---
  cedict.forEach((entry) => {
    const hanzi = entry.hanzi;
    const hskLevel = Number(entry.hsk) || null;
    if (isSingleChar(hanzi)) {
      const existing = characters[hanzi];
      if (!existing) {
        const record = makeCharacterRecord(hanzi, entry);
        record.hskLevel = hskLevel;
        record.sources = ['cedict-mini'];
        characters[hanzi] = record;
      } else {
        mergeLowerPriority('characters', existing, { pinyin: entry.pinyin, french: entry.french, english: entry.english, hskLevel }, 'cedict-mini');
      }
    } else {
      const existing = vocabulary.get(hanzi);
      if (!existing) {
        const record = makeVocabRecord(hanzi, entry);
        record.hskLevel = hskLevel;
        record.sources = ['cedict-mini'];
        vocabulary.set(hanzi, record);
      } else {
        mergeLowerPriority('vocabulary', existing, { pinyin: entry.pinyin, french: entry.french, english: entry.english, hskLevel }, 'cedict-mini');
      }
    }
  });

  // --- Fold in the pilot lesson's inline vocabulary (highest priority) ---
  // These become vocabulary-collection entries with appearsInLessons set,
  // and lessons-v2.json is rewritten to reference them by hanzi instead of
  // carrying full copies inline (mirrors how characterRefs already works).
  let lessonVocabCount = 0;
  lessons.forEach((lesson) => {
    if (!Array.isArray(lesson.vocabulary)) return;
    lesson.vocabulary.forEach((word) => {
      lessonVocabCount += 1;
      const hanzi = word.hanzi;
      const existing = vocabulary.get(hanzi);
      if (!existing) {
        const record = makeVocabRecord(hanzi, word);
        record.appearsInLessons = [lesson.id];
        record.sources = ['lesson:' + lesson.id];
        vocabulary.set(hanzi, record);
      } else {
        // Lesson wins on content; log what it overrides.
        logConflict('vocabulary', hanzi, 'french', word.french, 'lesson:' + lesson.id, existing.french, existing.sources[0]);
        logConflict('vocabulary', hanzi, 'english', word.english, 'lesson:' + lesson.id, existing.english, existing.sources[0]);
        logConflict('vocabulary', hanzi, 'pinyin', word.pinyin, 'lesson:' + lesson.id, existing.pinyin, existing.sources[0]);
        existing.french = word.french;
        existing.english = word.english;
        existing.pinyin = word.pinyin;
        if (!existing.appearsInLessons.includes(lesson.id)) existing.appearsInLessons.push(lesson.id);
        if (!existing.sources.includes('lesson:' + lesson.id)) existing.sources.unshift('lesson:' + lesson.id);
      }
    });
    // Rewrite: inline word objects -> array of hanzi refs (mirrors characterRefs).
    lesson.vocabularyRefs = lesson.vocabulary.map((w) => w.hanzi);
    delete lesson.vocabulary;
  });
  console.log(`Lesson-authored vocabulary words folded in: ${lessonVocabCount}`);

  const vocabularyArray = Array.from(vocabulary.values());

  console.log(`\nCharacters collection: ${Object.keys(characters).length} entries`);
  console.log(`Vocabulary collection: ${vocabularyArray.length} entries`);
  console.log(`Conflicts logged: ${conflicts.length}`);

  await fs.writeFile(CHARACTER_DB_PATH, `${JSON.stringify(characters, null, 2)}\n`, 'utf-8');
  await fs.writeFile(VOCAB_DB_PATH, `${JSON.stringify(vocabularyArray, null, 2)}\n`, 'utf-8');
  await fs.writeFile(LESSONS_PATH, `${JSON.stringify(lessons, null, 2)}\n`, 'utf-8');
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(conflicts, null, 2)}\n`, 'utf-8');

  // Regenerate hsk1-words.json as a derived artifact (deck manifest) from
  // the now-unified collections, so App.jsx/HskWordPage.jsx keep working
  // unchanged while the unified collections become the real source of truth.
  // Filtered by hskOrder (only ever set by the hsk1 merge above), NOT by
  // hskLevel alone - cedict-mini.json tags its own informal "hsk" level on
  // words like 猫/狗/你好 that are NOT part of the official 506-word HSK1
  // list, and letting that silently expand the deck would be a real bug.
  const hskEntries = [
    ...Object.values(characters).filter((c) => c.hskOrder !== null),
    ...vocabularyArray.filter((v) => v.hskOrder !== null),
  ]
    .sort((a, b) => (a.hskOrder ?? 0) - (b.hskOrder ?? 0))
    .map((entry) => ({
      id: entry.hanzi,
      hanzi: entry.hanzi,
      pinyin: entry.pinyin,
      english: entry.english,
      french: entry.french,
      hskLevel: 1,
    }));
  await fs.writeFile(HSK_WORDS_PATH, `${JSON.stringify(hskEntries, null, 2)}\n`, 'utf-8');
  console.log(`Regenerated hsk1-words.json: ${hskEntries.length} entries (was ${hskWords.length})`);

  console.log(`\nFull conflict report written to ${path.relative(ROOT, REPORT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
