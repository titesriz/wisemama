const STORAGE_KEY = 'wisemama-writing-saved-selection';

function readAll() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getSavedWritingSelection(lessonId) {
  const ids = readAll()[lessonId];
  return Array.isArray(ids) ? ids : [];
}

export function saveWritingSelection(lessonId, cardIds) {
  if (typeof localStorage === 'undefined' || !lessonId) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readAll(), [lessonId]: [...cardIds] }));
  } catch {
    // storage full or blocked: the saved selection is a convenience only
  }
}
