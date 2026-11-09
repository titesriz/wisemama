import { useMemo, useState } from 'react';
import { getAllCharacters, updateCharacter, deleteCharacter } from '../utils/database/characterDB.js';
import {
  getAllWords as getAllVocabWords,
  updateWord as updateVocabWord,
  deleteWord as deleteVocabWord,
  wordExists as vocabWordExists,
  upsertWord as upsertVocabWord,
} from '../utils/database/vocabularyDB.js';
import { getLessonsByOrder } from '../utils/lessons/lessonOrder.js';

const EMPTY_NEW_WORD = { hanzi: '', pinyin: '', french: '', english: '', supplementary: false };

const FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'character', label: 'Caractères' },
  { id: 'vocabulary', label: 'Mots' },
];

// Characters are single-hanzi "words" in their own right (every new
// character already shows up as a flashcard just like a vocabulary word -
// see buildLessonWordSet), so this browser lists both together by default
// instead of only the multi-character vocabulary-database entries.
function buildEntries() {
  const characters = Object.values(getAllCharacters()).map((char) => ({
    hanzi: char.hanzi,
    pinyin: char.pinyin || '',
    french: char.french || '',
    english: char.english || '',
    appearsInLessons: char.appearsInLessons || [],
    type: 'character',
  }));
  const words = getAllVocabWords().map((word) => ({
    hanzi: word.hanzi,
    pinyin: word.pinyin || '',
    french: word.french || '',
    english: word.english || '',
    appearsInLessons: word.appearsInLessons || [],
    type: 'vocabulary',
  }));
  return [...characters, ...words].sort((a, b) => a.hanzi.localeCompare(b.hanzi, 'zh-Hans-CN'));
}

export default function VocabularyEditorPage({ onBack, lessons = [], onUpdateLesson }) {
  const [entries, setEntries] = useState(buildEntries);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [lessonFilter, setLessonFilter] = useState('');
  const [editingKey, setEditingKey] = useState('');
  const [draft, setDraft] = useState({ pinyin: '', french: '', english: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWord, setNewWord] = useState(EMPTY_NEW_WORD);
  const [createError, setCreateError] = useState('');

  const orderedLessons = useMemo(() => getLessonsByOrder(lessons), [lessons]);
  // "Supplementaire" lives on the lesson's own vocabularyRefs ({hanzi,
  // supplementary}), not on the shared character/vocabulary record - it's a
  // per-(lesson, word) relationship, so editing it only makes sense once a
  // single lesson is selected.
  const filterLesson = lessonFilter ? lessons.find((item) => item.id === lessonFilter) : null;

  const refresh = () => setEntries(buildEntries());

  const toggleSupplementary = (hanzi) => {
    if (!filterLesson) return;
    const nextRefs = (filterLesson.vocabularyRefs || []).map((ref) =>
      ref.hanzi === hanzi ? { ...ref, supplementary: !ref.supplementary } : ref);
    onUpdateLesson?.(filterLesson.id, { vocabularyRefs: nextRefs });
  };

  const createNewWord = () => {
    const hanzi = newWord.hanzi.trim();
    if (!hanzi) {
      setCreateError('Le hanzi est obligatoire.');
      return;
    }
    if (vocabWordExists(hanzi)) {
      setCreateError(`${hanzi} existe déjà - cherche-le pour l'éditer au lieu d'en créer un autre.`);
      return;
    }
    if (!newWord.pinyin.trim() && !newWord.french.trim() && !newWord.english.trim()) {
      setCreateError('Ajoute au moins le pinyin ou une traduction.');
      return;
    }
    upsertVocabWord(hanzi, {
      pinyin: newWord.pinyin.trim(),
      french: newWord.french.trim(),
      english: newWord.english.trim(),
      appearsInLessons: filterLesson ? [filterLesson.id] : [],
      sources: ['manual'],
    });
    if (filterLesson) {
      onUpdateLesson?.(filterLesson.id, {
        vocabularyRefs: [...(filterLesson.vocabularyRefs || []), { hanzi, supplementary: newWord.supplementary }],
      });
    }
    setNewWord(EMPTY_NEW_WORD);
    setCreateError('');
    setShowCreateForm(false);
    refresh();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
      if (lessonFilter && !entry.appearsInLessons.includes(lessonFilter)) return false;
      if (!q) return true;
      return (
        entry.hanzi.includes(q) ||
        entry.pinyin.toLowerCase().includes(q) ||
        entry.french.toLowerCase().includes(q) ||
        entry.english.toLowerCase().includes(q)
      );
    });
  }, [entries, query, typeFilter, lessonFilter]);

  const startEdit = (entry) => {
    setEditingKey(`${entry.type}:${entry.hanzi}`);
    setDraft({ pinyin: entry.pinyin, french: entry.french, english: entry.english });
  };

  const cancelEdit = () => setEditingKey('');

  const saveEdit = (entry) => {
    if (entry.type === 'character') updateCharacter(entry.hanzi, draft);
    else updateVocabWord(entry.hanzi, draft);
    setEditingKey('');
    refresh();
  };

  const removeEntry = (entry) => {
    if (!window.confirm(`Supprimer ${entry.hanzi} ?`)) return;
    const ok = entry.type === 'character' ? deleteCharacter(entry.hanzi) : deleteVocabWord(entry.hanzi);
    if (!ok) {
      window.alert(`${entry.hanzi} est encore utilisé dans ${entry.appearsInLessons.length} leçon(s) - retire-le des leçons avant de le supprimer.`);
      return;
    }
    refresh();
  };

  return (
    <section className="hub-page">
      <header className="hub-header">
        <div className="hub-header-top-row">
          <button type="button" className="hub-logo-btn ui-pressable" onClick={onBack} aria-label="Retour">
            文
          </button>
          <button type="button" className="hub-back-btn ui-pressable" onClick={onBack}>
            ← Retour
          </button>
        </div>
        <div className="hub-header-text">
          <h1>Vocabulaire</h1>
          <p>
            {filtered.length} / {entries.length} entrées - caractères et mots de vocabulaire.
          </p>
        </div>
      </header>

      <section className="parent-panel" aria-label="Recherche vocabulaire">
        <div className="lesson-editor-tabs" role="tablist" aria-label="Filtrer par type">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`lesson-editor-tab ui-pressable ${typeFilter === filter.id ? 'active' : ''}`}
              onClick={() => setTypeFilter(filter.id)}
              role="tab"
              aria-selected={typeFilter === filter.id}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <select
          value={lessonFilter}
          onChange={(event) => setLessonFilter(event.target.value)}
          className="vocab-editor-lesson-filter"
          aria-label="Filtrer par leçon"
        >
          <option value="">Toutes les leçons</option>
          {orderedLessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.order ? `${lesson.order}. ` : ''}{lesson.title || 'Leçon'}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Chercher (hanzi, pinyin, traduction)..."
          className="vocab-editor-search"
        />
        <button
          type="button"
          className="manage-button ui-pressable vocab-editor-new-btn"
          onClick={() => {
            setShowCreateForm((prev) => !prev);
            setCreateError('');
          }}
        >
          {showCreateForm ? 'Annuler' : '+ Nouveau mot de vocabulaire'}
        </button>
        {showCreateForm ? (
          <div className="vocab-editor-create-form">
            <input
              value={newWord.hanzi}
              onChange={(event) => setNewWord((prev) => ({ ...prev, hanzi: event.target.value }))}
              placeholder="Hanzi"
              autoFocus
            />
            <input
              value={newWord.pinyin}
              onChange={(event) => setNewWord((prev) => ({ ...prev, pinyin: event.target.value }))}
              placeholder="Pinyin"
            />
            <input
              value={newWord.french}
              onChange={(event) => setNewWord((prev) => ({ ...prev, french: event.target.value }))}
              placeholder="Français"
            />
            <input
              value={newWord.english}
              onChange={(event) => setNewWord((prev) => ({ ...prev, english: event.target.value }))}
              placeholder="Anglais (optionnel)"
            />
            {filterLesson ? (
              <label className="vocab-editor-supplementary-toggle">
                <input
                  type="checkbox"
                  checked={newWord.supplementary}
                  onChange={(event) => setNewWord((prev) => ({ ...prev, supplementary: event.target.checked }))}
                />
                Vocabulaire supplémentaire (dans {filterLesson.title || 'cette leçon'})
              </label>
            ) : null}
            {createError ? <p className="vocab-editor-create-error">{createError}</p> : null}
            <button type="button" className="button ui-pressable" onClick={createNewWord}>
              Créer{filterLesson ? ` et ajouter à ${filterLesson.title || 'la leçon'}` : ''}
            </button>
          </div>
        ) : null}
      </section>

      <section className="parent-panel" aria-label="Liste vocabulaire">
        <div className="lesson-editor-list-body">
          {filtered.map((entry) => {
            const key = `${entry.type}:${entry.hanzi}`;
            const isEditing = editingKey === key;
            return (
              <div key={key} className="lesson-editor-item vocab-editor-item">
                <div>
                  <strong>{entry.hanzi}</strong>{' '}
                  <span className="vocab-editor-type-tag">{entry.type === 'character' ? 'caractère' : 'mot'}</span>
                  {isEditing ? (
                    <div className="vocab-editor-edit-fields">
                      <input
                        value={draft.pinyin}
                        onChange={(event) => setDraft((prev) => ({ ...prev, pinyin: event.target.value }))}
                        placeholder="Pinyin"
                      />
                      <input
                        value={draft.french}
                        onChange={(event) => setDraft((prev) => ({ ...prev, french: event.target.value }))}
                        placeholder="Français"
                      />
                      <input
                        value={draft.english}
                        onChange={(event) => setDraft((prev) => ({ ...prev, english: event.target.value }))}
                        placeholder="Anglais"
                      />
                    </div>
                  ) : (
                    <small>
                      {entry.pinyin} · {entry.french || entry.english || '(sans traduction)'}
                    </small>
                  )}
                  {filterLesson && entry.type === 'vocabulary' ? (
                    <label className="vocab-editor-supplementary-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(
                          filterLesson.vocabularyRefs?.find((ref) => ref.hanzi === entry.hanzi)?.supplementary,
                        )}
                        onChange={() => toggleSupplementary(entry.hanzi)}
                      />
                      Vocabulaire supplémentaire (dans {filterLesson.title || 'cette leçon'})
                    </label>
                  ) : null}
                </div>
                <div className="lesson-editor-item-actions">
                  {isEditing ? (
                    <>
                      <button type="button" className="wm-btn-compact ui-pressable" onClick={() => saveEdit(entry)}>
                        Enregistrer
                      </button>
                      <button type="button" className="wm-btn-compact ui-pressable" onClick={cancelEdit}>
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button type="button" className="wm-btn-compact ui-pressable" onClick={() => startEdit(entry)}>
                      Éditer
                    </button>
                  )}
                  <button
                    type="button"
                    className="wm-btn-compact parent-danger-btn ui-pressable"
                    onClick={() => removeEntry(entry)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
          {!filtered.length ? <p className="parent-empty">Aucune entrée ne correspond.</p> : null}
        </div>
      </section>
    </section>
  );
}
