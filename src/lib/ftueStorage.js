const FTUE_KEY = 'wisemama-ftue-v1';
const AVATAR_KEY = 'wisemama-avatar-config-v1';
const LESSONS_KEY = 'wisemama-lessons-v1';
const PROGRESS_KEY = 'wisemama-progress-v1';
const MODE_KEY = 'wisemama-active-mode-v1';
const AUDIO_DB = 'wisemama-audio-v1';

const DEFAULT_STATE = {
  completed: false,
  childName: '',
  childAvatarPlaceholder: '🦊',
  companionPlaceholder: '🐼',
  updatedAt: '',
};

export function readFtueState() {
  try {
    const raw = localStorage.getItem(FTUE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_STATE };
    return {
      ...DEFAULT_STATE,
      ...parsed,
      completed: Boolean(parsed.completed),
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveFtueState(next) {
  const safe = {
    ...DEFAULT_STATE,
    ...next,
    completed: Boolean(next?.completed),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(FTUE_KEY, JSON.stringify(safe));
  return safe;
}

function deleteAudioDb() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve();
      return;
    }
    const request = indexedDB.deleteDatabase(AUDIO_DB);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

export async function resetAllWiseMamaData() {
  const keys = [FTUE_KEY, AVATAR_KEY, LESSONS_KEY, PROGRESS_KEY, MODE_KEY];
  keys.forEach((key) => localStorage.removeItem(key));
  await deleteAudioDb();
}

