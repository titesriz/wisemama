import { findCharacterStructure } from './characterStructure.js';
import { getTopLevelComponents } from './characterDecomposition.js';
import { getCharacter } from '../utils/database/characterDB.js';

const IDC_POSITION = {
  '⿰': ['À gauche', 'À droite'],
  '⿱': ['En haut', 'En bas'],
  '⿲': ['À gauche', 'Au centre', 'À droite'],
  '⿳': ['En haut', 'Au centre', 'En bas'],
  '⿴': ['Autour', 'Au centre'],
  '⿵': ['En haut', 'Au centre'],
  '⿶': ['En bas', 'Au centre'],
  '⿷': ['À gauche', 'Au centre'],
  '⿸': ['En haut à gauche', 'Au centre'],
  '⿹': ['En haut à droite', 'Au centre'],
  '⿺': ['En bas à gauche', 'Au centre'],
  '⿻': ['Derrière', 'Devant'],
};

function getRadicalPosition(decomposition, radical) {
  if (!decomposition || decomposition === '？') return '';
  const op = decomposition[0];
  const positions = IDC_POSITION[op];
  if (!positions) return '';
  const components = getTopLevelComponents(decomposition);
  const idx = components.findIndex(
    (c) => c.label === radical || c.label.includes(radical),
  );
  if (idx === -1 || idx >= positions.length) return '';
  return positions[idx];
}

/**
 * Extract unique radicals from a lesson's cards, grouped with:
 * - radical hanzi
 * - pinyin / french from character-database (if available)
 * - etymology hint
 * - position in characters
 * - stroke count (approx from structure matches)
 * - cards from this lesson that contain this radical
 */
export function buildLessonRadicals(lesson) {
  if (!lesson?.cards?.length) return [];

  const radicalMap = new Map(); // radical hanzi → data

  for (const card of lesson.cards) {
    if (!card?.hanzi) continue;
    const structure = findCharacterStructure(card.hanzi);
    if (!structure?.radical) continue;

    const radical = structure.radical;

    if (!radicalMap.has(radical)) {
      // Look up radical itself in character-database for pinyin/french
      const radicalRecord = getCharacter(radical);

      // Stroke count from structure of the radical itself
      const radicalStructure = findCharacterStructure(radical);
      const strokeCount = radicalStructure?.matches
        ? radicalStructure.matches.filter(Boolean).length || null
        : null;

      radicalMap.set(radical, {
        hanzi: radical,
        pinyin: radicalRecord?.pinyin || '',
        french: radicalRecord?.french || '',
        english: radicalRecord?.english || '',
        etymologyHint: structure.etymology?.hint || radicalStructure?.etymology?.hint || '',
        etymologyType: structure.etymology?.type || radicalStructure?.etymology?.type || '',
        strokeCount,
        cards: [],
        positions: new Set(),
      });
    }

    const entry = radicalMap.get(radical);
    entry.cards.push(card);

    const pos = getRadicalPosition(structure.decomposition, radical);
    if (pos) entry.positions.add(pos);
  }

  return Array.from(radicalMap.values()).map((entry) => ({
    ...entry,
    positions: Array.from(entry.positions),
  }));
}
