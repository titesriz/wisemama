import entries from '../data/cedict-mini.json';

function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toComparablePinyin(pinyin) {
  return normalize(pinyin).replace(/\s+/g, ' ');
}

function scoreEntry(entry, query) {
  const q = normalize(query);
  if (!q) return 0;

  const hanzi = normalize(entry.hanzi);
  const pinyin = toComparablePinyin(entry.pinyin);
  const english = normalize(entry.english);
  const french = normalize(entry.french);

  if (hanzi === q) return 120;
  if (pinyin === q) return 110;
  if (french === q || english === q) return 100;

  let score = 0;
  if (hanzi.includes(q)) score = Math.max(score, 80);
  if (pinyin.includes(q)) score = Math.max(score, 70);
  if (french.includes(q)) score = Math.max(score, 65);
  if (english.includes(q)) score = Math.max(score, 60);

  return score;
}

function filterByHsk(entry, hskLevel) {
  if (!hskLevel || hskLevel === 'all') return true;
  const level = Number(hskLevel);
  if (!Number.isFinite(level)) return true;
  return Number(entry.hsk) === level;
}

export function searchDictionary(query, options = {}) {
  const limit = options.limit ?? 8;
  const hskLevel = options.hskLevel ?? 'all';
  const q = String(query || '').trim();
  if (!q) return [];

  return entries
    .filter((entry) => filterByHsk(entry, hskLevel))
    .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry);
}

export function getDictionarySize() {
  return entries.length;
}

export function getDictionaryHskLevels() {
  const levels = new Set();
  entries.forEach((entry) => {
    const level = Number(entry.hsk);
    if (Number.isFinite(level)) {
      levels.add(level);
    }
  });
  return Array.from(levels).sort((a, b) => a - b);
}
