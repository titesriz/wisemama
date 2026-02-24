const TONE_MARKS = {
  a: ['a', 'a', 'á', 'ǎ', 'à'],
  e: ['e', 'e', 'é', 'ě', 'è'],
  i: ['i', 'i', 'í', 'ǐ', 'ì'],
  o: ['o', 'o', 'ó', 'ǒ', 'ò'],
  u: ['u', 'u', 'ú', 'ǔ', 'ù'],
  ü: ['ü', 'ü', 'ǘ', 'ǚ', 'ǜ'],
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

  let marked = markSet[toneNumber - 1];
  if (target === target.toUpperCase()) marked = marked.toUpperCase();
  chars[targetIndex] = marked;
  return chars.join('');
}

export function formatPinyinDisplay(value = '') {
  if (!value) return '';
  if (hasToneMark(value)) return value;
  return value.replace(/([A-Za-züÜvV:]+)([1-5])/g, (_, syllable, tone) => applyToneToSyllable(syllable, tone));
}

