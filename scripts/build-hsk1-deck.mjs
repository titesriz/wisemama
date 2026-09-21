import fs from 'node:fs/promises';
import path from 'node:path';

// Source (MIT-licensed): drkameleon/complete-hsk-vocabulary provides the
// authoritative HSK 3.0 Level 1 word list (506 entries) - hanzi + pinyin +
// English meanings. Its "primary" (meanings[0]) sense is sometimes a rare or
// surname reading rather than the common HSK1 sense (e.g. 白 -> "surname
// Bai" instead of "white"), and it has no French at all.
//
// French translations, and corrected pinyin/English for the entries above,
// come from scripts/hsk1-corrections.json - hand-authored for this project
// (previously sourced from nicolas-jaussaud/hsk-words, which was dropped: no
// LICENSE file and no license declared via the GitHub API, so its reuse
// terms are unknown).
const WORDS_URL = 'https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/inclusive/new/1.json';
const OUTPUT_PATH = path.resolve('src/data/hsk1-words.json');
const CHARACTER_DB_PATH = path.resolve('src/data/character-database.json');
const CORRECTIONS_PATH = path.resolve('scripts/hsk1-corrections.json');
const HSK_SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

function primaryMeaning(meanings = []) {
  if (!Array.isArray(meanings) || !meanings.length) return '';
  return meanings[0];
}

// Reorder so every word appears only after all shorter words it's built from
// (any other word whose hanzi is a contiguous substring of this one) have
// already appeared - e.g. 中, 学 before 中学, before 中学生. The source list's
// own order (roughly alphabetical by pinyin) is otherwise preserved: this is
// a *stable* topological sort, not a full re-ranking.
function buildOrderSort(words) {
  const indexById = new Map(words.map((word, index) => [word.id, index]));
  const dependencies = new Map(
    words.map((word) => [
      word.id,
      words
        .filter((other) => other.id !== word.id && other.hanzi.length < word.hanzi.length && word.hanzi.includes(other.hanzi))
        .map((other) => other.id),
    ]),
  );

  const placed = new Set();
  const output = [];
  const remaining = new Set(words.map((word) => word.id));

  while (remaining.size) {
    let bestId = null;
    let bestIndex = Infinity;
    for (const id of remaining) {
      const deps = dependencies.get(id);
      if (deps.every((depId) => placed.has(depId))) {
        const index = indexById.get(id);
        if (index < bestIndex) {
          bestIndex = index;
          bestId = id;
        }
      }
    }
    // No unresolved dependencies should ever remain unmet (substring-of a
    // strictly shorter string can't cycle), but fall back defensively.
    if (bestId === null) {
      bestId = [...remaining].sort((a, b) => indexById.get(a) - indexById.get(b))[0];
    }
    output.push(words.find((word) => word.id === bestId));
    placed.add(bestId);
    remaining.delete(bestId);
  }

  return output;
}

// Same default shape as createCharacter() in src/utils/database/characterDB.js.
// Radical/decomposition/etymology are left blank on purpose - the app already
// backfills those automatically for any hanzi present in the bundled
// character-structure.json, on every load (see enrichCharacterDatabase in
// src/lib/characterStructure.js).
function makeCharacterRecord(word) {
  return {
    hanzi: word.hanzi,
    pinyin: word.pinyin,
    pinyinNumbered: word.pinyin,
    french: word.french,
    english: word.english,
    audioRecordings: [],
    images: [],
    firstSeenLesson: null,
    firstSeenDate: HSK_SEED_TIMESTAMP,
    appearsInLessons: [],
    relatedWords: [],
    radical: '',
    decomposition: '',
    components: [],
    componentMatches: [],
    etymology: null,
    metadataSource: 'hsk1',
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
    createdDate: HSK_SEED_TIMESTAMP,
    lastUpdated: HSK_SEED_TIMESTAMP,
  };
}

// Never touch a character with real lesson-authored data (audio, appearsInLessons,
// etc). Entries previously seeded by *this script* are tagged metadataSource:
// 'hsk1' and are safe to fully regenerate (no user data to lose) - this is how
// a re-run picks up corrected pinyin/English/French for words seeded earlier.
async function mergeIntoCharacterDatabase(words) {
  const raw = await fs.readFile(CHARACTER_DB_PATH, 'utf-8');
  const db = JSON.parse(raw);

  const singleChars = words.filter((word) => Array.from(word.hanzi).length === 1);
  let added = 0;
  let updated = 0;
  let untouched = 0;

  for (const word of singleChars) {
    const existing = db[word.hanzi];
    if (!existing) {
      db[word.hanzi] = makeCharacterRecord(word);
      added += 1;
    } else if (existing.metadataSource === 'hsk1') {
      db[word.hanzi] = { ...makeCharacterRecord(word), createdDate: existing.createdDate };
      updated += 1;
    } else {
      untouched += 1;
    }
  }

  await fs.writeFile(CHARACTER_DB_PATH, `${JSON.stringify(db, null, 2)}\n`, 'utf-8');
  console.log(`character-database.json: ${added} added, ${updated} updated (hsk1-sourced), ${untouched} left untouched (lesson-authored), ${Object.keys(db).length} total`);
}

async function main() {
  const [words, corrections] = await Promise.all([fetchJson(WORDS_URL), fs.readFile(CORRECTIONS_PATH, 'utf-8').then(JSON.parse)]);
  const { overrides, french: frenchByHanzi } = corrections;

  const merged = words.map((entry) => {
    const hanzi = entry.simplified;
    const primaryForm = Array.isArray(entry.forms) && entry.forms.length ? entry.forms[0] : {};
    const override = overrides[hanzi] || {};
    const sourcePinyin = primaryForm?.transcriptions?.pinyin || '';
    // An overridden English meaning that replaces a surname/proper-noun sense
    // means the source's capitalized pinyin (e.g. "Bái") no longer applies -
    // lowercase it, unless the correction explicitly supplies its own pinyin.
    const pinyin = override.pinyin
      || (override.english && sourcePinyin ? sourcePinyin[0].toLowerCase() + sourcePinyin.slice(1) : sourcePinyin);
    const english = override.english || primaryMeaning(primaryForm?.meanings);
    const french = frenchByHanzi[hanzi] || '';

    return {
      id: hanzi,
      hanzi,
      pinyin,
      english,
      french,
      hskLevel: 1,
    };
  });

  const output = buildOrderSort(merged);

  const missingFrench = output.filter((word) => !word.french).length;
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${output.length} words to ${OUTPUT_PATH}`);
  console.log(`French missing for ${missingFrench}/${output.length} words`);

  await mergeIntoCharacterDatabase(output);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
