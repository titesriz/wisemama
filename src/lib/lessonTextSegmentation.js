export function normalizeLessonText(sourceText = '', mode = 'structured') {
  const raw = String(sourceText || '').replace(/\r\n?/g, '\n');
  if (!raw.trim()) return '';

  if (mode === 'structured') {
    const chunks = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => line.match(/[^。！？!?]+[。！？!?]?/g) || [line])
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => (/[。！？!?]$/.test(line) ? line : `${line}。`));

    return chunks.join('\n');
  }

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

export function segmentLessonText(sourceText = '') {
  const text = String(sourceText || '').replace(/\r\n?/g, '\n').trim();
  if (!text) return [];

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1) {
    return lines.map((line) => (/[。！？!?]$/.test(line) ? line : `${line}。`));
  }

  const parts = text.split(/([。！？!?])/);
  const out = [];
  for (let i = 0; i < parts.length; i += 2) {
    const body = (parts[i] || '').trim();
    if (!body) continue;
    const punctuation = parts[i + 1] || '';
    out.push(`${body}${punctuation}`);
  }
  return out;
}

