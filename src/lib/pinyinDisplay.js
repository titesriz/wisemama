const TONE_MARKS = {
  a: ['a', 'ā', 'á', 'ǎ', 'à'],
  e: ['e', 'ē', 'é', 'ě', 'è'],
  i: ['i', 'ī', 'í', 'ǐ', 'ì'],
  o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
  u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
  ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

function hasToneMark(text = '') {
  return /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i.test(text);
}

function normalizeUmlaut(value = '') {
  return value
    .replace(/u:/gi, (match) => (match[0] === 'U' ? 'Ü' : 'ü'))
    .replace(/v/gi, (match) => (match === 'V' ? 'Ü' : 'ü'));
}

function applyToneToSyllable(syllableRaw, toneNumberRaw) {
  const toneNumber = Number(toneNumberRaw);
  if (!toneNumber || toneNumber < 1 || toneNumber > 5) return `${syllableRaw}${toneNumberRaw}`;
  if (hasToneMark(syllableRaw)) return syllableRaw;

  const syllable = normalizeUmlaut(syllableRaw);
  if (toneNumber === 5) return syllable;

  const lower = syllable.toLowerCase();
  const vowels = ['a', 'e', 'i', 'o', 'u', 'ü'];
  let targetIndex = -1;

  if (lower.includes('a')) targetIndex = lower.indexOf('a');
  else if (lower.includes('e')) targetIndex = lower.indexOf('e');
  else if (lower.includes('ou')) targetIndex = lower.indexOf('o');
  else {
    for (let i = lower.length - 1; i >= 0; i -= 1) {
      if (vowels.includes(lower[i])) {
        targetIndex = i;
        break;
      }
    }
  }

  if (targetIndex < 0) return syllable;

  const chars = Array.from(syllable);
  const target = chars[targetIndex];
  const markSet = TONE_MARKS[target.toLowerCase()];
  if (!markSet) return syllable;

  let marked = markSet[toneNumber];
  if (target === target.toUpperCase()) marked = marked.toUpperCase();
  chars[targetIndex] = marked;
  return chars.join('');
}

const TONE_ACCENTS = ['¯', '´', 'ˇ', '`'];

const TONE_MARK_TO_NUMBER = {
  ā: 1, á: 2, ǎ: 3, à: 4,
  ē: 1, é: 2, ě: 3, è: 4,
  ī: 1, í: 2, ǐ: 3, ì: 4,
  ō: 1, ó: 2, ǒ: 3, ò: 4,
  ū: 1, ú: 2, ǔ: 3, ù: 4,
  ǖ: 1, ǘ: 2, ǚ: 3, ǜ: 4,
};

export function extractToneAccent(value = '') {
  if (!value) return { accent: '', tone: 0 };
  const numbered = value.match(/[1-5]/);
  if (numbered) {
    const n = Number(numbered[0]);
    return n >= 1 && n <= 4 ? { accent: TONE_ACCENTS[n - 1], tone: n } : { accent: '·', tone: 0 };
  }
  for (const char of value) {
    const tone = TONE_MARK_TO_NUMBER[char.toLowerCase()];
    if (tone !== undefined) return { accent: TONE_ACCENTS[tone - 1], tone };
  }
  return { accent: '·', tone: 0 };
}

export function formatPinyinDisplay(value = '') {
  if (!value) return '';
  if (hasToneMark(value)) return value;
  return value.replace(/([A-Za-züÜvV:]+)([1-5])/g, (_, syllable, tone) => applyToneToSyllable(syllable, tone));
}
