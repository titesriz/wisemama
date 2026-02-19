import { useEffect, useRef, useState } from 'react';
import DictionaryLookup from './DictionaryLookup.jsx';
import { buildLessonFromChineseText } from '../lib/chineseImport.js';
import { generateLessonFlashcards } from '../lib/flashcardGeneration.js';
import { buildLessonsSyncEnvelope, extractLessonsFromPayload, isSyncEnvelope } from '../lib/lessonSyncFormat.js';
import { useLessons } from '../context/LessonsContext.jsx';

function CardField({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="lesson-field">
      <span>{label}</span>
      <input value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function cloneLessons(input) {
  return JSON.parse(JSON.stringify(input));
}

function makeCardId() {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function defaultCard() {
  return {
    id: makeCardId(),
    lessonId: '',
    hanzi: '',
    pinyinEnabled: true,
    pinyin: '',
    french: '',
    english: '',
    exampleSentence: '',
    relatedVocabulary: [],
    relatedVocabularyText: '',
    manualOverrides: {
      pinyin: false,
      french: false,
      english: false,
      exampleSentence: false,
      relatedVocabulary: false,
    },
    imageUrl: null,
    audioUrl: null,
  };
}

function csvToList(input) {
  return String(input || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToCsv(input) {
  return Array.isArray(input) ? input.join(', ') : '';
}

export default function LessonEditor({ activeLessonId, activeCardId = '', onSelectLesson }) {
  const { lessons, replaceLessons } = useLessons();

  const [draftLessons, setDraftLessons] = useState(() => cloneLessons(lessons));
  const [selectedLessonId, setSelectedLessonId] = useState(activeLessonId || lessons[0]?.id || '');
  const [status, setStatus] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [lookupCardId, setLookupCardId] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importText, setImportText] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (isDirty) return;
    setDraftLessons(cloneLessons(lessons));
    if (!selectedLessonId || !lessons.some((l) => l.id === selectedLessonId)) {
      setSelectedLessonId(activeLessonId || lessons[0]?.id || '');
    }
  }, [activeLessonId, isDirty, lessons, selectedLessonId]);

  const activeLesson = draftLessons.find((lesson) => lesson.id === selectedLessonId) || draftLessons[0] || null;

  useEffect(() => {
    if (!activeCardId || !activeLesson || activeLesson.id !== selectedLessonId) return;
    const node = document.querySelector(`[data-card-id="${activeCardId}"]`);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    node.classList.add('is-targeted-card');
    window.setTimeout(() => node.classList.remove('is-targeted-card'), 1200);
  }, [activeCardId, activeLesson, selectedLessonId]);

  const setDraft = (updater) => {
    setDraftLessons((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
    setIsDirty(true);
    setStatus('');
  };

  const patchCard = (cardId, patch = {}, manualKey = '') => {
    setDraft((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== activeLesson.id) return lesson;
        return {
          ...lesson,
          cards: lesson.cards.map((c) => {
            if (c.id !== cardId) return c;
            const nextManual = { ...(c.manualOverrides || {}) };
            if (manualKey) nextManual[manualKey] = true;
            return {
              ...c,
              ...patch,
              manualOverrides: nextManual,
            };
          }),
        };
      }),
    );
  };

  const handleAddLesson = () => {
    const newLesson = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: 'Nouvelle lecon',
      cards: [defaultCard()],
    };
    setDraft((prev) => [...prev, newLesson]);
    setSelectedLessonId(newLesson.id);
    setStatus('Nouvelle lecon en brouillon. Sauvegarde pour appliquer.');
  };

  const handleExport = () => {
    const payload = buildLessonsSyncEnvelope(draftLessons);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'wisemama-lessons-sync.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Lecons exportees (format sync v1).');
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const importedLessons = extractLessonsFromPayload(parsed);
      if (!Array.isArray(importedLessons) || importedLessons.length === 0) {
        throw new Error('invalid');
      }
      setDraft(cloneLessons(importedLessons));
      setSelectedLessonId(importedLessons[0]?.id || '');
      setStatus(
        isSyncEnvelope(parsed)
          ? 'Lecons importees (format sync) en brouillon. Sauvegarde pour appliquer.'
          : 'Lecons importees en brouillon. Sauvegarde pour appliquer.',
      );
    } catch {
      setStatus('Import invalide. Verifie le JSON.');
    } finally {
      event.target.value = '';
    }
  };

  const handleCreateFromText = () => {
    const lesson = buildLessonFromChineseText(importText, importTitle);
    if (!lesson) {
      setStatus('Aucun texte chinois detecte. Colle du hanzi puis reessaie.');
      return;
    }

    setDraft((prev) => [...prev, lesson]);
    setSelectedLessonId(lesson.id);
    setImportText('');
    setImportTitle('');
    setStatus(`Lecon creee: ${lesson.cards.length} cartes ajoutees (brouillon).`);
  };

  const saveDraft = () => {
    try {
      replaceLessons(draftLessons);
      setIsDirty(false);
      setStatus('Lecons sauvegardees.');
      if (selectedLessonId) {
        onSelectLesson?.(selectedLessonId);
      }
    } catch {
      setStatus('Sauvegarde impossible. Verifie les donnees.');
    }
  };

  const discardDraft = () => {
    setDraftLessons(cloneLessons(lessons));
    setSelectedLessonId(activeLessonId || lessons[0]?.id || '');
    setIsDirty(false);
    setStatus('Brouillon annule.');
  };

  const regenerateFromLessonText = () => {
    if (!activeLesson?.sourceText) {
      setStatus('Aucun texte source OCR pour regenerer.');
      return;
    }
    const nextCards = generateLessonFlashcards({
      lessonId: activeLesson.id,
      sourceText: activeLesson.sourceText,
      pinyinToggles: activeLesson.pinyinToggles || {},
      previousCards: activeLesson.cards || [],
    });
    if (!nextCards.length) {
      setStatus('Regeneration impossible: aucun token detecte.');
      return;
    }
    setDraft((prev) =>
      prev.map((lesson) =>
        lesson.id === activeLesson.id
          ? { ...lesson, cards: nextCards, autoGenerated: true }
          : lesson,
      ),
    );
    setStatus(`Flashcards regenerees: ${nextCards.length} cartes.`);
  };

  return (
    <section className="lesson-editor">
      <div className="lesson-editor-head">
        <h3>Editeur de lecons</h3>
        <div className="lesson-actions">
          <button type="button" className="button secondary" onClick={handleAddLesson}>
            Ajouter lecon
          </button>
          <button type="button" className="button secondary" onClick={handleExport}>
            Export JSON
          </button>
          <button type="button" className="button secondary" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="save-bar">
        <span className={isDirty ? 'dirty-indicator on' : 'dirty-indicator'}>
          {isDirty ? 'Brouillon non sauvegarde' : 'Tout est sauvegarde'}
        </span>
        <div className="lesson-actions">
          <button type="button" className="button secondary" onClick={discardDraft} disabled={!isDirty}>
            Annuler changements
          </button>
          <button type="button" className="button" onClick={saveDraft} disabled={!isDirty}>
            Sauvegarder lecons
          </button>
        </div>
      </div>

      {status ? <p className="ok-line">{status}</p> : null}

      <div className="paste-import">
        <strong>Import rapide depuis texte chinois</strong>
        <label className="lesson-field">
          <span>Titre de la lecon (optionnel)</span>
          <input
            value={importTitle}
            placeholder="Ex: Lecon manuel chap. 2"
            onChange={(e) => setImportTitle(e.target.value)}
          />
        </label>
        <label className="lesson-field">
          <span>Colle ici le texte chinois</span>
          <textarea
            value={importText}
            placeholder="Colle un paragraphe en chinois, ex: 你好！我是..."
            onChange={(e) => setImportText(e.target.value)}
          />
        </label>
        <div className="lesson-actions">
          <button type="button" className="button" onClick={handleCreateFromText}>
            Creer lecon depuis texte
          </button>
        </div>
      </div>

      <div className="lesson-list">
        {draftLessons.map((lesson) => (
          <button
            key={lesson.id}
            type="button"
            className={`pill ${activeLesson?.id === lesson.id ? 'active' : ''}`}
            onClick={() => setSelectedLessonId(lesson.id)}
          >
            {lesson.title}
          </button>
        ))}
      </div>

      {activeLesson ? (
        <div className="lesson-edit-body">
          <label className="lesson-field">
            <span>Titre de lecon</span>
            <input
              value={activeLesson.title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setDraft((prev) =>
                  prev.map((lesson) =>
                    lesson.id === activeLesson.id ? { ...lesson, title: nextTitle } : lesson,
                  ),
                );
              }}
            />
          </label>

          <div className="lesson-actions">
            <button
              type="button"
              className="button secondary"
              onClick={regenerateFromLessonText}
              disabled={!activeLesson?.sourceText}
            >
              Regenerer depuis texte
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setDraft((prev) =>
                  prev.map((lesson) =>
                    lesson.id === activeLesson.id
                      ? { ...lesson, cards: [...lesson.cards, defaultCard()] }
                      : lesson,
                  ),
                );
              }}
            >
              Ajouter carte
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                setDraft((prev) => prev.filter((lesson) => lesson.id !== activeLesson.id));
                const fallback = draftLessons.find((l) => l.id !== activeLesson.id);
                setSelectedLessonId(fallback?.id || '');
              }}
              disabled={draftLessons.length <= 1}
            >
              Supprimer lecon
            </button>
          </div>

          <div className="cards-edit-list">
            {activeLesson.cards.map((card, index) => (
              <article key={card.id} className="card-edit-item" data-card-id={card.id}>
                <div className="card-edit-head">
                  <strong>Carte {index + 1}</strong>
                  <div className="lesson-actions compact">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        setLookupCardId((prev) => (prev === card.id ? '' : card.id));
                      }}
                    >
                      Remplir dico
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        setDraft((prev) =>
                          prev.map((lesson) => {
                            if (lesson.id !== activeLesson.id) return lesson;
                            const idx = lesson.cards.findIndex((c) => c.id === card.id);
                            if (idx < 0) return lesson;
                            const source = lesson.cards[idx];
                            const duplicate = {
                              ...source,
                              id: makeCardId(),
                            };
                            const nextCards = [...lesson.cards];
                            nextCards.splice(idx + 1, 0, duplicate);
                            return { ...lesson, cards: nextCards };
                          }),
                        );
                      }}
                    >
                      Dupliquer
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        setDraft((prev) =>
                          prev.map((lesson) => {
                            if (lesson.id !== activeLesson.id) return lesson;
                            const idx = lesson.cards.findIndex((c) => c.id === card.id);
                            if (idx <= 0) return lesson;
                            const nextCards = [...lesson.cards];
                            const [item] = nextCards.splice(idx, 1);
                            nextCards.splice(idx - 1, 0, item);
                            return { ...lesson, cards: nextCards };
                          }),
                        );
                      }}
                      disabled={index === 0}
                    >
                      Haut
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        setDraft((prev) =>
                          prev.map((lesson) => {
                            if (lesson.id !== activeLesson.id) return lesson;
                            const idx = lesson.cards.findIndex((c) => c.id === card.id);
                            if (idx < 0 || idx >= lesson.cards.length - 1) return lesson;
                            const nextCards = [...lesson.cards];
                            const [item] = nextCards.splice(idx, 1);
                            nextCards.splice(idx + 1, 0, item);
                            return { ...lesson, cards: nextCards };
                          }),
                        );
                      }}
                      disabled={index === activeLesson.cards.length - 1}
                    >
                      Bas
                    </button>
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        setDraft((prev) =>
                          prev.map((lesson) => {
                            if (lesson.id !== activeLesson.id) return lesson;
                            return {
                              ...lesson,
                              cards: lesson.cards.filter((c) => c.id !== card.id),
                            };
                          }),
                        );
                      }}
                      disabled={activeLesson.cards.length <= 1}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="card-grid">
                  <CardField
                    label="Hanzi"
                    value={card.hanzi}
                    onChange={(value) => {
                      patchCard(card.id, { hanzi: value });
                    }}
                  />
                  <label className="lesson-field checkbox-field">
                    <span>Afficher pinyin</span>
                    <input
                      type="checkbox"
                      checked={card.pinyinEnabled !== false}
                      onChange={(e) => patchCard(card.id, { pinyinEnabled: e.target.checked })}
                    />
                  </label>
                  <CardField
                    label="Pinyin"
                    value={card.pinyin}
                    onChange={(value) => {
                      patchCard(card.id, { pinyin: value }, 'pinyin');
                    }}
                  />
                  <CardField
                    label="Francais"
                    value={card.french}
                    onChange={(value) => {
                      patchCard(card.id, { french: value }, 'french');
                    }}
                  />
                  <CardField
                    label="Anglais"
                    value={card.english}
                    onChange={(value) => {
                      patchCard(card.id, { english: value }, 'english');
                    }}
                  />
                  <CardField
                    label="Example sentence"
                    value={card.exampleSentence || ''}
                    onChange={(value) => {
                      patchCard(card.id, { exampleSentence: value }, 'exampleSentence');
                    }}
                  />
                  <CardField
                    label="Liste vocabulaire (CSV)"
                    value={card.relatedVocabularyText || listToCsv(card.relatedVocabulary)}
                    onChange={(value) => {
                      patchCard(
                        card.id,
                        {
                          relatedVocabularyText: value,
                          relatedVocabulary: csvToList(value),
                        },
                        'relatedVocabulary',
                      );
                    }}
                  />
                  <CardField
                    label="Image URL"
                    value={card.imageUrl || ''}
                    placeholder="/images/chat.svg"
                    onChange={(value) => {
                      patchCard(card.id, { imageUrl: value || null });
                    }}
                  />
                  <CardField
                    label="Audio URL"
                    value={card.audioUrl || ''}
                    placeholder="/audio/mao.mp3"
                    onChange={(value) => {
                      patchCard(card.id, { audioUrl: value || null });
                    }}
                  />
                </div>

                {lookupCardId === card.id ? (
                  <DictionaryLookup
                    defaultQuery={card.hanzi || card.french || card.english || ''}
                    onPick={(entry) => {
                      setDraft((prev) =>
                        prev.map((lesson) => {
                          if (lesson.id !== activeLesson.id) return lesson;
                          return {
                            ...lesson,
                            cards: lesson.cards.map((c) =>
                              c.id === card.id
                                ? {
                                    ...c,
                                    hanzi: entry.hanzi,
                                    pinyin: entry.pinyin,
                                    french: entry.french || c.french,
                                    english: entry.english || c.english,
                                    manualOverrides: {
                                      ...(c.manualOverrides || {}),
                                      pinyin: true,
                                      french: true,
                                      english: true,
                                    },
                                  }
                                : c,
                            ),
                          };
                        }),
                      );
                    }}
                  />
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="audio-placeholder">Aucune lecon.</p>
      )}
    </section>
  );
}
