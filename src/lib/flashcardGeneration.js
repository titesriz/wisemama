import { parseChineseTextToCards } from './chineseImport.js';
import { findDictionaryEntryByHanzi } from './dictionarySearch.js';

function charsSet(input) {
  return new Set(Array.from(String(input || '')).filter((c) => /[\u3400-\u9fff\uf900-\ufaff]/u.test(c)));
}

function overlapScore(a, b) {
  const sa = charsSet(a);
  const sb = charsSet(b);
  let count = 0;
  for (const c of sa) {
    if (sb.has(c)) count += 1;
  }
  return count;
}

function makeCardId(index = 0) {
  return `card-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`;
}

function toCsv(items) {
  return items.join(', ');
}

function buildRelatedVocabulary(tokens, currentToken, max = 6) {
  const ranked = tokens
    .filter((token) => token !== currentToken)
    .map((token) => ({ token, score: overlapScore(currentToken, token) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.token.length - b.token.length)
    .slice(0, max)
    .map((item) => item.token);
  return ranked;
}

function dictionaryToCardBase(token, pinyinToggles = {}) {
  const entry = findDictionaryEntryByHanzi(token);
  const pinyinEnabled = pinyinToggles[token] !== false;
  return {
    hanzi: token,
    pinyinEnabled,
    pinyin: pinyinEnabled ? (entry?.pinyin || '') : '',
    meaning: entry?.french || entry?.english || '',
    french: entry?.french || '',
    english: entry?.english || '',
    exampleSentence: '',
  };
}

function applyManualOverrides(baseCard, previousCard) {
  if (!previousCard) return baseCard;
  const manual = previousCard.manualOverrides || {};
  return {
    ...baseCard,
    pinyin: manual.pinyin ? (previousCard.pinyin || '') : baseCard.pinyin,
    meaning: manual.meaning ? (previousCard.meaning || '') : baseCard.meaning,
    french: manual.french ? (previousCard.french || '') : baseCard.french,
    english: manual.english ? (previousCard.english || '') : baseCard.english,
    exampleSentence: manual.exampleSentence
      ? (previousCard.exampleSentence || '')
      : baseCard.exampleSentence,
    relatedVocabulary: manual.relatedVocabulary
      ? (Array.isArray(previousCard.relatedVocabulary) ? previousCard.relatedVocabulary : [])
      : baseCard.relatedVocabulary,
    manualOverrides: {
      pinyin: Boolean(manual.pinyin),
      meaning: Boolean(manual.meaning),
      french: Boolean(manual.french),
      english: Boolean(manual.english),
      exampleSentence: Boolean(manual.exampleSentence),
      relatedVocabulary: Boolean(manual.relatedVocabulary),
    },
  };
}

export function generateLessonFlashcards({
  lessonId = '',
  sourceText = '',
  pinyinToggles = {},
  previousCards = [],
} = {}) {
  const parsedTokens = parseChineseTextToCards(sourceText);
  const tokens = parsedTokens.map((card) => card.hanzi).filter(Boolean);
  const byToken = new Map(previousCards.map((card) => [card.hanzi, card]));

  return tokens.map((token, index) => {
    const base = dictionaryToCardBase(token, pinyinToggles);
    const relatedVocabulary = buildRelatedVocabulary(tokens, token);
    const generated = {
      id: makeCardId(index),
      lessonId,
      hanzi: base.hanzi,
      pinyinEnabled: base.pinyinEnabled,
      pinyin: base.pinyin,
      meaning: base.meaning,
      french: base.french,
      english: base.english,
      exampleSentence: base.exampleSentence,
      relatedVocabulary,
      relatedVocabularyText: toCsv(relatedVocabulary),
      imageUrl: null,
      audioUrl: null,
      manualOverrides: {
        pinyin: false,
        meaning: false,
        french: false,
        english: false,
        exampleSentence: false,
        relatedVocabulary: false,
      },
    };
    const previous = byToken.get(token);
    const merged = applyManualOverrides(generated, previous);
    return {
      ...merged,
      id: previous?.id || generated.id,
      lessonId: lessonId || previous?.lessonId || '',
      imageUrl: previous?.imageUrl ?? null,
      audioUrl: previous?.audioUrl ?? null,
      relatedVocabularyText: toCsv(
        Array.isArray(merged.relatedVocabulary) ? merged.relatedVocabulary : [],
      ),
    };
  });
}
