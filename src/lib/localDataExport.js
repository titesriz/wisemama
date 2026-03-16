const AUDIO_DB_NAME = 'wisemama-audio-v1';
const AUDIO_DB_VERSION = 1;
const AUDIO_PARENT_STORE = 'cardAudioModels';
const AUDIO_CHILD_STORE = 'childAudioAttempts';

function isWiseMamaLocalKey(key) {
  return String(key || '').startsWith('wisemama-') || key === 'character-database' || key === 'lessons-v2';
}

function maybeJsonParse(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    if (!(blob instanceof Blob)) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

async function serializeRecord(record) {
  const next = { ...record };
  if (record?.blob instanceof Blob) {
    next.blobDataUrl = await blobToDataUrl(record.blob);
    next.blobType = record.blob.type || 'application/octet-stream';
    next.blobSize = record.blob.size;
    delete next.blob;
  }
  if (record?.audioBlob instanceof Blob) {
    next.audioBlobDataUrl = await blobToDataUrl(record.audioBlob);
    next.audioBlobType = record.audioBlob.type || 'application/octet-stream';
    next.audioBlobSize = record.audioBlob.size;
    delete next.audioBlob;
  }
  return next;
}

function openAudioDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }

    const request = indexedDB.open(AUDIO_DB_NAME, AUDIO_DB_VERSION);
    request.onerror = () => reject(request.error || new Error('Failed to open audio DB'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_PARENT_STORE)) {
        db.createObjectStore(AUDIO_PARENT_STORE, { keyPath: 'cardKey' });
      }
      if (!db.objectStoreNames.contains(AUDIO_CHILD_STORE)) {
        const store = db.createObjectStore(AUDIO_CHILD_STORE, { keyPath: 'id' });
        store.createIndex('cardKey', 'cardKey', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      resolve([]);
      return;
    }
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error || new Error(`Failed reading store: ${storeName}`));
    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
  });
}

async function readAudioData() {
  const db = await openAudioDb();
  if (!db) return { parentModels: [], childAttempts: [] };
  try {
    const [parentModelsRaw, childAttemptsRaw] = await Promise.all([
      getAllFromStore(db, AUDIO_PARENT_STORE),
      getAllFromStore(db, AUDIO_CHILD_STORE),
    ]);
    const parentModels = await Promise.all(parentModelsRaw.map((record) => serializeRecord(record)));
    const childAttempts = await Promise.all(childAttemptsRaw.map((record) => serializeRecord(record)));
    return { parentModels, childAttempts };
  } finally {
    db.close();
  }
}

function readLocalStorageData() {
  const payload = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!isWiseMamaLocalKey(key)) continue;
    const raw = localStorage.getItem(key);
    payload[key] = maybeJsonParse(raw);
  }
  return payload;
}

export async function buildWiseMamaLocalExportPayload() {
  const [audioData] = await Promise.all([readAudioData()]);

  return {
    schema: 'wisemama.local-export.v2',
    exportedAt: new Date().toISOString(),
    app: {
      name: 'WiseMama',
      formatVersion: 2,
    },
    localStorage: readLocalStorageData(),
    indexedDb: {
      [AUDIO_DB_NAME]: audioData,
    },
  };
}

export function downloadJsonFile(payload, fileName = 'wisemama-local-export.json') {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
