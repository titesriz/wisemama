import { findDictionaryEntryByHanzi, getDictionaryEntries } from './dictionarySearch.js';

const cjkRunRegex = /[\u3400-\u9FFF]+/g;

function makeCardId(index) {
  return `card-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 5)}`;
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

export function parseChineseTextToCards(rawText) {
  const text = String(rawText || '');
  const runs = text.match(cjkRunRegex) || [];
  if (runs.length === 0) {
    return [];
  }

  const dictionaryWords = Array.from(
    new Set(
      getDictionaryEntries()
        .map((entry) => entry.hanzi)
        .filter(Boolean),
    ),
  ).sort((a, b) => b.length - a.length);

  const seen = new Set();
  const orderedTokens = [];

  runs.forEach((run) => {
    tokenizeRunByLongestMatch(run, dictionaryWords).forEach((token) => {
      if (!seen.has(token)) {
        seen.add(token);
        orderedTokens.push(token);
      }
    });
  });

  return orderedTokens.map((hanzi, index) => {
    const match = findDictionaryEntryByHanzi(hanzi);
    return {
      id: makeCardId(index),
      hanzi,
      pinyin: match?.pinyin || '',
      french: match?.french || '',
      english: match?.english || '',
      imageUrl: null,
      audioUrl: null,
    };
  });
}

export function buildLessonFromChineseText(rawText, title = '') {
  const cards = parseChineseTextToCards(rawText);
  if (cards.length === 0) {
    return null;
  }

  const cleanedTitle = String(title || '').trim();
  const preview = cards.map((c) => c.hanzi).join('').slice(0, 10);

  return {
    id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: cleanedTitle || `Lecon importee ${preview}`,
    cards,
  };
}
