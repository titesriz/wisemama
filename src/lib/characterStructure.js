import structureData from '../data/character-structure.json';

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function hasObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
}

export function findCharacterStructure(hanzi) {
  if (!hanzi) return null;
  return structureData[hanzi] || null;
}

export function enrichCharacterRecord(hanzi, record = {}) {
  const structure = findCharacterStructure(hanzi);
  if (!structure) return { ...record };

  return {
    ...record,
    radical: hasText(record.radical) ? record.radical : structure.radical || '',
    decomposition: hasText(record.decomposition) ? record.decomposition : structure.decomposition || '',
    components: hasItems(record.components) ? record.components : structure.components || [],
    componentMatches: hasItems(record.componentMatches) ? record.componentMatches : structure.matches || [],
    etymology: hasObject(record.etymology) ? record.etymology : structure.etymology || null,
    metadataSource: hasText(record.metadataSource) ? record.metadataSource : 'makemeahanzi',
  };
}

export function enrichCharacterDatabase(database = {}) {
  if (!database || typeof database !== 'object') return {};
  return Object.fromEntries(
    Object.entries(database).map(([hanzi, record]) => [hanzi, enrichCharacterRecord(hanzi, record || {})]),
  );
}
