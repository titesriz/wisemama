const STORAGE_KEY = 'wisemama-script-mode';

export function getScriptMode() {
  if (typeof localStorage === 'undefined') return 'simplified';
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'traditional' ? 'traditional' : 'simplified';
}

export function setScriptMode(mode) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, mode === 'traditional' ? 'traditional' : 'simplified');
}

// Lesson cards don't carry their own `traditional` field (only
// character-database.json does) - this looks a single character up there
// directly, for callers that only have a lesson card, not a full character
// record, on hand.
export function getTraditionalChar(char) {
  if (!char) return '';
  const entry = getCharacterDb()[char];
  return entry?.traditional && entry.traditional.trim() ? entry.traditional : '';
}

function getCharacterDb() {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('character-database') || '{}');
  } catch {
    return {};
  }
}

// Character-by-character, not word-lookup, so it works on anything - a
// single card, a compound vocabulary word, or a full sourceText sentence -
// without needing every multi-char string to have its own database entry.
// A character missing a `traditional` field means it's identical in both
// scripts (the documented convention in character-database.json), so
// falling back to the character itself is correct, not a gap.
export function toTraditionalText(text) {
  if (!text) return text;
  const db = getCharacterDb();
  return Array.from(String(text))
    .map((char) => {
      const entry = db[char];
      return entry?.traditional && entry.traditional.trim() ? entry.traditional : char;
    })
    .join('');
}
