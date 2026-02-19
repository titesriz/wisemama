import { findDictionaryEntryByHanzi, getDictionaryEntries } from './dictionarySearch.js';
import { pinyin as pinyinFromText } from 'pinyin-pro';

const cjkRunRegex = /[\u3400-\u9FFF]+/g;
const fallbackLexicon = {
  好: { en: 'good; well', fr: 'bon; bien' },
};

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

function toFallbackPinyin(text) {
  return pinyinFromText(text, { type: 'num', toneType: 'num' }) || '';
}

function tokenizeRunByLongestMatch(run, dictionaryWords) {
  const tokens = [];
  let i = 0;

  while (i < run.length) {
    let matched = '';
    for (const word of dictionaryWords) {
      if (run.startsWith(word, i)) {
        matched = word;
        break;
      }
    }
    if (matched) {
      tokens.push(matched);
      i += matched.length;
    } else {
      tokens.push(run[i]);
      i += 1;
    }
  }

  return tokens;
}

function splitMeaningsEnglish(english) {
  const parts = String(english || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
  const classifiers = parts
    .filter((item) => /^cl:/i.test(item))
    .map((item) => item.replace(/^cl:\s*/i, '').trim())
    .filter(Boolean);
  const meanings = parts
    .filter((item) => !/^cl:/i.test(item))
    .slice(0, 2);
  return { meanings, classifiers };
}

function normalizePos(english) {
  const text = String(english || '').toLowerCase();
  if (text.startsWith('to ')) return 'verb';
  if (text.startsWith('a ') || text.startsWith('an ')) return 'noun';
  return '';
}

function resolveDictionaryForToken(token) {
  const exact = findDictionaryEntryByHanzi(token);
  if (exact) return exact;

  const charEntries = Array.from(token)
    .map((char) => findDictionaryEntryByHanzi(char))
    .filter(Boolean);

  if (!charEntries.length) return null;

  return {
    hanzi: token,
    pinyin: charEntries.map((entry) => entry.pinyin).filter(Boolean).join(' '),
    english: charEntries.map((entry) => entry.english).filter(Boolean).join('; '),
    french: charEntries.map((entry) => entry.french).filter(Boolean).join('; '),
  };
}

function dictionaryToCardBase(token, pinyinToggles = {}) {
  const entry = resolveDictionaryForToken(token);
  const fallback = fallbackLexicon[token] || null;
  const dictFound = Boolean(entry);
  const pinyinEnabled = pinyinToggles[token] !== false;
  const resolvedPinyin = entry?.pinyin || toFallbackPinyin(token);
  const { meanings, classifiers } = splitMeaningsEnglish(entry?.english || '');
  const english = meanings[0] || entry?.english || fallback?.en || '';
  const french = entry?.french || fallback?.fr || '';

  return {
    hanzi: token,
    pinyinEnabled,
    pinyin: pinyinEnabled ? resolvedPinyin : '',
    translation: {
      en: english,
      fr: french,
    },
    meanings,
    classifiers,
    partOfSpeech: normalizePos(entry?.english || ''),
    dictFound,
  };
}

function extractUniqueCharacters(rawText = '') {
  const seen = new Set();
  const ordered = [];
  for (const char of Array.from(rawText)) {
    if (!/[\u3400-\u9fff\uf900-\ufaff]/u.test(char)) continue;
    if (seen.has(char)) continue;
    seen.add(char);
    ordered.push(char);
  }
  return ordered;
}

export function normalizeLessonInput(rawText = '') {
  return String(rawText || '')
    .replace(/[，、；：]/g, ' ')
    .replace(/[。！？]/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

function extractWordTokensWithFrequency(rawText = '', options = {}) {
  const dictionaryWords = Array.from(
    new Set(getDictionaryEntries().map((entry) => entry.hanzi).filter(Boolean)),
  ).sort((a, b) => b.length - a.length);

  const runs = String(rawText || '').match(cjkRunRegex) || [];
  const tokens = [];
  runs.forEach((run) => {
    tokenizeRunByLongestMatch(run, dictionaryWords).forEach((token) => {
      if (!token) return;
      tokens.push(token);
    });
  });

  const minWordLen = options.minWordLen ?? 1;
  const filtered = tokens.filter((token) => token.length >= minWordLen);
  const frequency = new Map();
  const firstIndex = new Map();
  filtered.forEach((token, idx) => {
    frequency.set(token, (frequency.get(token) || 0) + 1);
    if (!firstIndex.has(token)) firstIndex.set(token, idx);
  });

  return Array.from(frequency.entries())
    .map(([hanzi, count]) => ({ hanzi, count, firstIndex: firstIndex.get(hanzi) || 0 }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const aPreferred = a.hanzi.length >= 2 && a.hanzi.length <= 3 ? 1 : 0;
      const bPreferred = b.hanzi.length >= 2 && b.hanzi.length <= 3 ? 1 : 0;
      if (bPreferred !== aPreferred) return bPreferred - aPreferred;
      return a.firstIndex - b.firstIndex;
    });
}

function extractTokenList(rawText = '', mode = 'characters') {
  const text = normalizeLessonInput(rawText);
  if (mode === 'words') {
    return extractWordTokensWithFrequency(text, { minWordLen: 2 }).map((item) => item.hanzi);
  }
  return extractUniqueCharacters(text);
}

function buildRelatedWords(allWords, currentToken, max = 5) {
  const ranked = allWords
    .filter((item) => item.hanzi !== currentToken)
    .map((item) => ({
      ...item,
      overlap: overlapScore(currentToken, item.hanzi),
      lenPriority: item.hanzi.length >= 2 && item.hanzi.length <= 3 ? 1 : 0,
    }))
    .filter((item) => item.overlap > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (b.lenPriority !== a.lenPriority) return b.lenPriority - a.lenPriority;
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return a.firstIndex - b.firstIndex;
    })
    .slice(0, max);

  return ranked.map((item) => {
    const entry = resolveDictionaryForToken(item.hanzi);
    const { meanings } = splitMeaningsEnglish(entry?.english || '');
    return {
      hanzi: item.hanzi,
      pinyin: entry?.pinyin || toFallbackPinyin(item.hanzi),
      en: meanings[0] || entry?.english || '',
    };
  });
}

function applyRegenerationRules(baseCard, previousCard) {
  if (!previousCard) return baseCard;

  const prevPinyin = String(previousCard.pinyin || '').trim();
  const prevFrench = String(previousCard.translation?.fr ?? previousCard.french ?? '').trim();
  const prevManual = previousCard.manualOverrides || {};

  return {
    ...baseCard,
    pinyin: prevPinyin || baseCard.pinyin,
    translation: {
      en: baseCard.translation.en,
      fr: prevManual.french && prevFrench ? prevFrench : baseCard.translation.fr,
    },
    french: prevManual.french && prevFrench ? prevFrench : baseCard.french,
    english: baseCard.english,
    manualOverrides: {
      pinyin: Boolean(prevManual.pinyin),
      french: Boolean(prevManual.french),
      english: false,
      exampleSentence: Boolean(prevManual.exampleSentence),
      relatedVocabulary: false,
    },
    exampleSentence: String(previousCard.exampleSentence || '').trim(),
    notes: String(previousCard.notes || '').trim(),
  };
}

export function generateLessonFlashcards({
  lessonId = '',
  sourceText = '',
  pinyinToggles = {},
  previousCards = [],
  generationMode = 'characters',
  timestamp = '',
} = {}) {
  const normalizedText = normalizeLessonInput(sourceText);
  const tokens = extractTokenList(normalizedText, generationMode);
  const allWords = extractWordTokensWithFrequency(normalizedText, {
    minWordLen: generationMode === 'words' ? 2 : 1,
  }).slice(0, 50);
  const byToken = new Map(previousCards.map((card) => [card.hanzi, card]));
  const generatedAt = timestamp || new Date().toISOString();

  return tokens.map((token, index) => {
    const base = dictionaryToCardBase(token, pinyinToggles);
    const relatedWords = buildRelatedWords(allWords, token, 5);
    const generated = {
      id: makeCardId(index),
      lessonId,
      source: 'auto-generated',
      generatedAt,
      hanzi: base.hanzi,
      pinyinEnabled: base.pinyinEnabled,
      pinyin: base.pinyin,
      translation: base.translation,
      french: base.translation.fr,
      english: base.translation.en,
      meanings: base.meanings,
      classifiers: base.classifiers,
      partOfSpeech: base.partOfSpeech,
      exampleSentence: '',
      relatedWords,
      relatedVocabulary: relatedWords.map((item) => item.hanzi),
      relatedVocabularyText: toCsv(relatedWords.map((item) => item.hanzi)),
      meta: {
        dictFound: base.dictFound,
      },
      imageUrl: null,
      audioUrl: null,
      manualOverrides: {
        pinyin: false,
        french: false,
        english: false,
        exampleSentence: false,
        relatedVocabulary: false,
      },
    };
    const previous = byToken.get(token);
    const merged = applyRegenerationRules(generated, previous);
    return {
      ...merged,
      id: previous?.id || generated.id,
      lessonId: lessonId || previous?.lessonId || '',
      source: previous?.source || generated.source,
      generatedAt,
      imageUrl: previous?.imageUrl ?? null,
      audioUrl: previous?.audioUrl ?? null,
      relatedVocabularyText: toCsv(
        Array.isArray(merged.relatedVocabulary) ? merged.relatedVocabulary : [],
      ),
    };
  });
}
