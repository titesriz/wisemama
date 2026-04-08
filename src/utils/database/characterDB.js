/**
 * Character Database v2
 * Source de verite unique pour tous les caracteres
 * localStorage key: 'character-database'
 */

// ============================================
// SCHEMA
// ============================================

/**
 * Structure complete d'un caractere
 * @typedef {Object} Character
 * @property {string} hanzi - Caractere chinois (cle primaire)
 * @property {string} pinyin - Pinyin avec tons (mao)
 * @property {string} pinyinNumbered - Pinyin avec chiffres (mao1)
 * @property {string} french - Traduction francaise
 * @property {string} english - Traduction anglaise
 * @property {AudioRecording[]} audioRecordings - Enregistrements audio
 * @property {Image[]} images - Images associees
 * @property {string} firstSeenLesson - ID premiere lecon
 * @property {string} firstSeenDate - Date ISO premiere apparition
 * @property {string[]} appearsInLessons - IDs lecons contenant ce caractere
 * @property {RelatedWord[]} relatedWords - Vocabulaire lie
 * @property {string} [radical] - Radical principal
 * @property {string} [decomposition] - Decomposition ideographique
 * @property {string[]} [components] - Composants extraits
 * @property {Array<number[] | null>} [componentMatches] - Mapping traits/composants
 * @property {Object|null} [etymology] - Indices etymologiques
 * @property {Progress} progress - Progression apprentissage
 * @property {string} createdDate - Date ISO creation
 * @property {string} lastUpdated - Date ISO derniere modification
 */

/**
 * @typedef {Object} AudioRecording
 * @property {string} id - ID unique
 * @property {string} url - URL (indexeddb:// ou blob://)
 * @property {string} recordedBy - Nom enregistreur (maman, papa, etc.)
 * @property {string} recordedByProfile - ID profil parent
 * @property {string} recordedDate - Date ISO
 * @property {number} duration - Duree en secondes
 * @property {boolean} isPrimary - Audio par defaut
 * @property {string} [quality] - good | fair | poor (optionnel)
 */

/**
 * @typedef {Object} Image
 * @property {string} id - ID unique
 * @property {string} url - Data URL ou blob URL
 * @property {string} source - upload | ai-generated | drawing
 * @property {string} uploadedDate - Date ISO
 */

/**
 * @typedef {Object} RelatedWord
 * @property {string} word - Mot chinois (ex: ???)
 * @property {string} pinyin - Pinyin du mot
 * @property {string} definition - Definition FR ou EN
 */

/**
 * @typedef {Object} Progress
 * @property {string} status - new | learning | learned
 * @property {number} confidence - Score 0-1
 * @property {number} totalPractices - Nombre total pratiques
 * @property {Object} modules - Progression par module
 * @property {ModuleProgress} modules.read
 * @property {ModuleProgress} modules.speak
 * @property {ModuleProgress} modules.write
 */

/**
 * @typedef {Object} ModuleProgress
 * @property {boolean} completed - Module valide
 * @property {number} stars - Etoiles obtenues (0-3)
 * @property {string} lastDate - Date ISO derniere pratique
 */

// ============================================
// FONCTIONS API
// ============================================

/**
 * Recuperer toute la base
 */
export function getAllCharacters() {
  const db = JSON.parse(localStorage.getItem('character-database') || '{}');
  return db;
}

/**
 * Recuperer un caractere
 */
export function getCharacter(hanzi) {
  const db = getAllCharacters();
  return db[hanzi] || null;
}

/**
 * Verifier si caractere existe
 */
export function characterExists(hanzi) {
  return getCharacter(hanzi) !== null;
}

/**
 * Creer nouveau caractere
 */
export function createCharacter(hanzi, data = {}) {
  const db = getAllCharacters();

  if (db[hanzi]) {
    console.warn(`Character ${hanzi} already exists. Use updateCharacter instead.`);
    return db[hanzi];
  }

  const newChar = {
    hanzi,
    pinyin: data.pinyin || '',
    pinyinNumbered: data.pinyinNumbered || data.pinyin || '',
    french: data.french || '',
    english: data.english || '',
    audioRecordings: data.audioRecordings || [],
    images: data.images || [],
    firstSeenLesson: data.firstSeenLesson || null,
    firstSeenDate: data.firstSeenDate || new Date().toISOString(),
    appearsInLessons: data.appearsInLessons || [],
    relatedWords: data.relatedWords || [],
    radical: data.radical || '',
    decomposition: data.decomposition || '',
    components: data.components || [],
    componentMatches: data.componentMatches || [],
    etymology: data.etymology || null,
    metadataSource: data.metadataSource || '',
    progress: data.progress || {
      status: 'new',
      confidence: 0,
      totalPractices: 0,
      modules: {
        read: { completed: false, stars: 0, lastDate: null },
        speak: { completed: false, stars: 0, lastDate: null },
        write: { completed: false, stars: 0, lastDate: null },
      },
    },
    createdDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  db[hanzi] = newChar;
  localStorage.setItem('character-database', JSON.stringify(db));

  return newChar;
}

/**
 * Mettre a jour caractere existant
 */
export function updateCharacter(hanzi, updates) {
  const db = getAllCharacters();

  if (!db[hanzi]) {
    console.error(`Character ${hanzi} does not exist. Use createCharacter first.`);
    return null;
  }

  db[hanzi] = {
    ...db[hanzi],
    ...updates,
    hanzi,
    lastUpdated: new Date().toISOString(),
  };

  localStorage.setItem('character-database', JSON.stringify(db));

  return db[hanzi];
}

/**
 * Upsert (create ou update)
 */
export function upsertCharacter(hanzi, data) {
  if (characterExists(hanzi)) {
    return updateCharacter(hanzi, data);
  }
  return createCharacter(hanzi, data);
}

/**
 * Supprimer caractere (ATTENTION: verifie d'abord qu'il n'est plus dans aucune lecon)
 */
export function deleteCharacter(hanzi) {
  const char = getCharacter(hanzi);
  if (!char) return false;

  if (char.appearsInLessons.length > 0) {
    console.error(`Cannot delete ${hanzi}: still appears in ${char.appearsInLessons.length} lesson(s)`);
    return false;
  }

  const db = getAllCharacters();
  delete db[hanzi];
  localStorage.setItem('character-database', JSON.stringify(db));

  return true;
}

// ============================================
// FONCTIONS AUDIO
// ============================================

/**
 * Ajouter enregistrement audio a un caractere
 */
export function addAudioRecording(hanzi, audioData) {
  const char = getCharacter(hanzi);
  if (!char) {
    console.error(`Character ${hanzi} does not exist`);
    return null;
  }

  const audioRecord = {
    id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    recordedDate: new Date().toISOString(),
    isPrimary: char.audioRecordings.length === 0,
    duration: 0,
    quality: 'good',
    ...audioData,
  };

  const updatedRecordings = [...char.audioRecordings, audioRecord];

  return updateCharacter(hanzi, { audioRecordings: updatedRecordings });
}

/**
 * Definir audio primaire
 */
export function setPrimaryAudio(hanzi, audioId) {
  const char = getCharacter(hanzi);
  if (!char) return null;

  const updatedRecordings = char.audioRecordings.map((a) => ({
    ...a,
    isPrimary: a.id === audioId,
  }));

  return updateCharacter(hanzi, { audioRecordings: updatedRecordings });
}

/**
 * Obtenir audio primaire
 */
export function getPrimaryAudio(hanzi) {
  const char = getCharacter(hanzi);
  if (!char || char.audioRecordings.length === 0) return null;

  const primary = char.audioRecordings.find((a) => a.isPrimary);
  return primary || char.audioRecordings[0];
}

/**
 * Supprimer enregistrement audio
 */
export function deleteAudioRecording(hanzi, audioId) {
  const char = getCharacter(hanzi);
  if (!char) return null;

  const updatedRecordings = char.audioRecordings.filter((a) => a.id !== audioId);

  if (updatedRecordings.length > 0) {
    const hasPrimary = updatedRecordings.some((a) => a.isPrimary);
    if (!hasPrimary) {
      updatedRecordings[0].isPrimary = true;
    }
  }

  return updateCharacter(hanzi, { audioRecordings: updatedRecordings });
}

// ============================================
// FONCTIONS IMAGES
// ============================================

/**
 * Ajouter image a un caractere
 */
export function addImage(hanzi, imageData) {
  const char = getCharacter(hanzi);
  if (!char) return null;

  const imageRecord = {
    id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    uploadedDate: new Date().toISOString(),
    source: 'upload',
    ...imageData,
  };

  const updatedImages = [...char.images, imageRecord];

  return updateCharacter(hanzi, { images: updatedImages });
}

/**
 * Supprimer image
 */
export function deleteImage(hanzi, imageId) {
  const char = getCharacter(hanzi);
  if (!char) return null;

  const updatedImages = char.images.filter((img) => img.id !== imageId);

  return updateCharacter(hanzi, { images: updatedImages });
}

// ============================================
// FONCTIONS LECONS
// ============================================

/**
 * Marquer apparition dans une lecon
 */
export function markCharacterInLesson(hanzi, lessonId) {
  const char = getCharacter(hanzi);
  if (!char) {
    console.error(`Character ${hanzi} does not exist`);
    return null;
  }

  const updates = {};

  if (!char.appearsInLessons.includes(lessonId)) {
    updates.appearsInLessons = [...char.appearsInLessons, lessonId];
  }

  if (!char.firstSeenLesson) {
    updates.firstSeenLesson = lessonId;
    updates.firstSeenDate = new Date().toISOString();
  }

  if (Object.keys(updates).length > 0) {
    return updateCharacter(hanzi, updates);
  }

  return char;
}

/**
 * Retirer d'une lecon (si caractere supprime de la lecon)
 */
export function removeCharacterFromLesson(hanzi, lessonId) {
  const char = getCharacter(hanzi);
  if (!char) return null;

  const updatedAppears = char.appearsInLessons.filter((id) => id !== lessonId);

  const updates = { appearsInLessons: updatedAppears };

  if (char.firstSeenLesson === lessonId && updatedAppears.length > 0) {
    updates.firstSeenLesson = updatedAppears[0];
  }

  return updateCharacter(hanzi, updates);
}

// ============================================
// FONCTIONS PROGRESSION
// ============================================

/**
 * Sauvegarder progression module
 */
export function saveModuleProgress(hanzi, moduleName, stars) {
  const char = getCharacter(hanzi);
  if (!char) return null;

  const updatedProgress = {
    ...char.progress,
    modules: {
      ...char.progress.modules,
      [moduleName]: {
        completed: stars > 0,
        stars,
        lastDate: new Date().toISOString(),
      },
    },
    totalPractices: char.progress.totalPractices + 1,
  };

  updatedProgress.status = calculateStatus(updatedProgress);
  updatedProgress.confidence = calculateConfidence(updatedProgress);

  return updateCharacter(hanzi, { progress: updatedProgress });
}

/**
 * Calculer statut global
 */
function calculateStatus(progress) {
  const { modules } = progress;

  const allMastered = ['read', 'speak', 'write'].every(
    (m) => modules[m]?.completed && modules[m]?.stars >= 2,
  );

  if (allMastered) return 'learned';

  const anyStarted = Object.values(modules).some((m) => m?.completed);

  if (anyStarted) return 'learning';

  return 'new';
}

/**
 * Calculer confiance (0-1)
 */
function calculateConfidence(progress) {
  const { modules, totalPractices } = progress;

  const moduleScores = {
    read: modules.read?.stars || 0,
    speak: modules.speak?.stars || 0,
    write: modules.write?.stars || 0,
  };

  const avgStars = (moduleScores.read + moduleScores.speak + moduleScores.write) / 9;
  const practiceBonus = Math.min(totalPractices / 10, 0.2);

  return Math.min(avgStars + practiceBonus, 1);
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Obtenir tous caracteres d'une lecon (expanded)
 */
export function getCharactersForLesson(characterRefs) {
  return characterRefs.map((hanzi) => {
    const char = getCharacter(hanzi);
    return char || createPlaceholderCharacter(hanzi);
  });
}

/**
 * Creer caractere placeholder (si DB corrompue)
 */
function createPlaceholderCharacter(hanzi) {
  return {
    hanzi,
    pinyin: '?',
    pinyinNumbered: '?',
    french: '(a completer)',
    english: '(to complete)',
    audioRecordings: [],
    images: [],
    firstSeenLesson: null,
    firstSeenDate: null,
    appearsInLessons: [],
    relatedWords: [],
    radical: '',
    decomposition: '',
    components: [],
    componentMatches: [],
    etymology: null,
    metadataSource: '',
    progress: {
      status: 'new',
      confidence: 0,
      totalPractices: 0,
      modules: {},
    },
    createdDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Compter caracteres par statut
 */
export function getCharacterStats() {
  const db = getAllCharacters();
  const chars = Object.values(db);

  return {
    total: chars.length,
    new: chars.filter((c) => c.progress.status === 'new').length,
    learning: chars.filter((c) => c.progress.status === 'learning').length,
    learned: chars.filter((c) => c.progress.status === 'learned').length,
    withAudio: chars.filter((c) => c.audioRecordings.length > 0).length,
    withImage: chars.filter((c) => c.images.length > 0).length,
  };
}

/**
 * Rechercher caracteres
 */
export function searchCharacters(query) {
  const db = getAllCharacters();
  const lowerQuery = query.toLowerCase();

  return Object.values(db).filter(
    (char) =>
      char.hanzi.includes(query) ||
      char.pinyin.toLowerCase().includes(lowerQuery) ||
      char.french.toLowerCase().includes(lowerQuery) ||
      char.english.toLowerCase().includes(lowerQuery),
  );
}

/**
 * Exporter base complete (backup)
 */
export function exportCharacterDB() {
  const db = getAllCharacters();
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `character-database-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Importer base (restore)
 */
export function importCharacterDB(jsonString) {
  try {
    const db = JSON.parse(jsonString);
    localStorage.setItem('character-database', JSON.stringify(db));
    return { success: true, count: Object.keys(db).length };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reinitialiser base (DANGER)
 */
export function resetCharacterDB() {
  if (confirm('ATTENTION: Supprimer toute la base de caracteres ?')) {
    localStorage.removeItem('character-database');
    return true;
  }
  return false;
}
