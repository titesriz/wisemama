import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE_URL = 'https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt';
const OUTPUT_PATH = path.resolve('src/data/character-structure.json');
const IDC_CHARS = new Set(['⿰', '⿱', '⿲', '⿳', '⿴', '⿵', '⿶', '⿷', '⿸', '⿹', '⿺', '⿻']);
const UNKNOWN_PARTS = new Set(['？', '?', '□']);

function extractComponents(decomposition = '') {
  const ordered = [];
  for (const char of Array.from(String(decomposition || ''))) {
    if (IDC_CHARS.has(char) || UNKNOWN_PARTS.has(char) || /\s/.test(char)) continue;
    if (!ordered.includes(char)) ordered.push(char);
  }
  return ordered;
}

function normalizeEtymology(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const next = {};
  if (typeof raw.type === 'string' && raw.type.trim()) next.type = raw.type.trim();
  if (typeof raw.semantic === 'string' && raw.semantic.trim()) next.semantic = raw.semantic.trim();
  if (typeof raw.phonetic === 'string' && raw.phonetic.trim()) next.phonetic = raw.phonetic.trim();
  if (typeof raw.hint === 'string' && raw.hint.trim()) next.hint = raw.hint.trim();
  return Object.keys(next).length ? next : null;
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

async function main() {
  const raw = await fetchText(SOURCE_URL);
  const lines = raw.split('\n').filter(Boolean);
  const output = {};

  lines.forEach((line) => {
    const item = JSON.parse(line);
    if (!item?.character) return;
    output[item.character] = {
      radical: typeof item.radical === 'string' ? item.radical : '',
      decomposition: typeof item.decomposition === 'string' ? item.decomposition : '',
      components: extractComponents(item.decomposition),
      matches: Array.isArray(item.matches) ? item.matches : [],
      etymology: normalizeEtymology(item.etymology),
    };
  });

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output));
  console.log(`Wrote ${Object.keys(output).length} entries to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
