const dbName = 'wisemama-audio-v1';
const dbVersion = 1;
const parentStore = 'cardAudioModels';
const childStore = 'childAudioAttempts';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(parentStore)) {
        db.createObjectStore(parentStore, { keyPath: 'cardKey' });
      }

      if (!db.objectStoreNames.contains(childStore)) {
        const store = db.createObjectStore(childStore, { keyPath: 'id' });
        store.createIndex('cardKey', 'cardKey', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

function runTransaction(storeName, mode, handler) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error || new Error('IndexedDB transaction failed'));
        };

        handler(store, resolve, reject);
      }),
  );
}

export function makeAttemptId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function saveParentModel(record) {
  const payload = {
    ...record,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return runTransaction(parentStore, 'readwrite', (store) => {
    store.put(payload);
  });
}

export function getParentModel(cardKey) {
  return runTransaction(parentStore, 'readonly', (store, resolve, reject) => {
    const request = store.get(cardKey);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Failed to read parent model'));
  });
}

export function addChildAttempt(record) {
  const payload = {
    id: makeAttemptId(),
    kept: false,
    score: null,
    note: '',
    ...record,
    createdAt: record.createdAt || new Date().toISOString(),
  };

  return runTransaction(childStore, 'readwrite', (store, resolve, reject) => {
    const request = store.add(payload);
    request.onsuccess = () => resolve(payload);
    request.onerror = () => reject(request.error || new Error('Failed to store child attempt'));
  });
}

export function updateAttemptKept(id, kept) {
  return runTransaction(childStore, 'readwrite', (store, resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onerror = () => reject(getRequest.error || new Error('Attempt not found'));
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (!existing) {
        resolve();
        return;
      }
      const putRequest = store.put({ ...existing, kept });
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error || new Error('Failed to update kept flag'));
    };
  });
}

export function listChildAttempts(cardKey) {
  return runTransaction(childStore, 'readonly', (store, resolve, reject) => {
    const index = store.index('cardKey');
    const request = index.getAll(cardKey);
    request.onsuccess = () => {
      const sorted = (request.result || []).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      resolve(sorted);
    };
    request.onerror = () => reject(request.error || new Error('Failed to list attempts'));
  });
}

export function listAllChildAttempts() {
  return runTransaction(childStore, 'readonly', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const sorted = (request.result || []).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      resolve(sorted);
    };
    request.onerror = () => reject(request.error || new Error('Failed to list all attempts'));
  });
}
