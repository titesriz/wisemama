/**
 * Lesson Links Database
 * Liens generes caractere/vocabulaire <-> lecon : separes de character-database
 * et vocabulary-database (qui restent le contenu edite par l'auteur), pour que
 * ces bases ne portent pas de donnees derivees. Un lien porte assez d'info
 * (pack + lecon + ordre de la lecon) pour retrouver, a la lecture, dans quelle
 * lecon un caractere/mot apparait pour la premiere fois (= nouveau a assimiler)
 * sans jamais stocker ce statut en dur.
 * localStorage key: 'lesson-links'
 */

/**
 * @typedef {Object} LessonLink
 * @property {string} id - `${entityType}:${hanzi}:${lessonId}` (cle primaire, dedupe)
 * @property {'character'|'vocabulary'} entityType
 * @property {string} hanzi
 * @property {string} packId - '' pour une lecon utilisateur (hors pack)
 * @property {string} lessonId
 * @property {number} lessonOrder
 * @property {string} createdDate
 */

function makeLinkId(entityType, hanzi, lessonId) {
  return `${entityType}:${hanzi}:${lessonId}`;
}

export function getAllLinks() {
  try {
    const raw = localStorage.getItem('lesson-links');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllLinks(links) {
  localStorage.setItem('lesson-links', JSON.stringify(links));
}

export function getLinksForEntity(entityType, hanzi) {
  if (!entityType || !hanzi) return [];
  return getAllLinks().filter((link) => link.entityType === entityType && link.hanzi === hanzi);
}

export function getLinksForLesson(lessonId) {
  if (!lessonId) return [];
  return getAllLinks().filter((link) => link.lessonId === lessonId);
}

/**
 * Ajoute (ou met a jour) un lien. Idempotent : refaire le meme lien
 * (meme entityType+hanzi+lessonId) met juste a jour packId/lessonOrder au
 * lieu de dupliquer.
 */
export function addLink({ entityType, hanzi, packId = '', lessonId, lessonOrder = 0 }) {
  if (!entityType || !hanzi || !lessonId) return null;
  const id = makeLinkId(entityType, hanzi, lessonId);
  const links = getAllLinks();
  const index = links.findIndex((link) => link.id === id);
  const link = {
    id,
    entityType,
    hanzi,
    packId: packId || '',
    lessonId,
    lessonOrder: Number.isFinite(lessonOrder) ? lessonOrder : 0,
    createdDate: index === -1 ? new Date().toISOString() : links[index].createdDate,
  };
  if (index === -1) links.push(link);
  else links[index] = link;
  saveAllLinks(links);
  return link;
}

export function removeLinksForLesson(lessonId) {
  if (!lessonId) return;
  const links = getAllLinks().filter((link) => link.lessonId !== lessonId);
  saveAllLinks(links);
}

/**
 * Lecon ou ce caractere/mot apparait en premier dans un pack donne (le plus
 * petit lessonOrder parmi ses liens) - c'est elle qui l'introduit comme
 * nouveau a assimiler ; les lecons suivantes ne font que le reutiliser.
 * Derive a chaque appel, jamais stocke.
 */
export function getFirstLessonForEntity(entityType, hanzi, packId = '') {
  const links = getLinksForEntity(entityType, hanzi).filter((link) => (link.packId || '') === (packId || ''));
  if (!links.length) return null;
  return links.reduce((earliest, link) => (link.lessonOrder < earliest.lessonOrder ? link : earliest));
}

export function isNewInLesson(entityType, hanzi, packId, lessonId) {
  const first = getFirstLessonForEntity(entityType, hanzi, packId);
  return !first || first.lessonId === lessonId;
}

/**
 * Exporter la base complete (backup / pour suivre un pack publie)
 */
export function exportLessonLinksDB() {
  const links = getAllLinks();
  const blob = new Blob([JSON.stringify(links, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `lesson-links-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

export function importLessonLinksDB(jsonString) {
  try {
    const links = JSON.parse(jsonString);
    if (!Array.isArray(links)) throw new Error('Expected an array of links');
    saveAllLinks(links);
    return { success: true, count: links.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
