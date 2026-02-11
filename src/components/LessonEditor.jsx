import { useEffect, useRef, useState } from 'react';
import DictionaryLookup from './DictionaryLookup.jsx';
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

function makeLessonId() {
  return `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeCardId() {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function defaultCard() {
  return {
    id: makeCardId(),
    hanzi: '',
    pinyin: '',
    french: '',
    english: '',
    imageUrl: null,
    audioUrl: null,
  };
}

export default function LessonEditor({ activeLessonId, onSelectLesson }) {
  const { lessons, replaceLessons } = useLessons();

  const [draftLessons, setDraftLessons] = useState(() => cloneLessons(lessons));
  const [selectedLessonId, setSelectedLessonId] = useState(activeLessonId || lessons[0]?.id || '');
  const [status, setStatus] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [lookupCardId, setLookupCardId] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (isDirty) return;
    setDraftLessons(cloneLessons(lessons));
    if (!selectedLessonId || !lessons.some((l) => l.id === selectedLessonId)) {
      setSelectedLessonId(activeLessonId || lessons[0]?.id || '');
    }
  }, [activeLessonId, isDirty, lessons, selectedLessonId]);

  const setDraft = (updater) => {
    setDraftLessons((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
    setIsDirty(true);
    setStatus('');
  };

  const activeLesson = draftLessons.find((lesson) => lesson.id === selectedLessonId) || draftLessons[0] || null;

  const handleAddLesson = () => {
    const newLesson = {
      id: makeLessonId(),
      title: 'Nouvelle lecon',
      cards: [defaultCard()],
    };
    setDraft((prev) => [...prev, newLesson]);
    setSelectedLessonId(newLesson.id);
    setStatus('Nouvelle lecon en brouillon. Sauvegarde pour appliquer.');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(draftLessons, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'wisemama-lessons.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Lecons exportees.');
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('invalid');
      }
      setDraft(cloneLessons(parsed));
      setSelectedLessonId(parsed[0]?.id || '');
      setStatus('Lecons importees en brouillon. Sauvegarde pour appliquer.');
    } catch {
      setStatus('Import invalide. Verifie le JSON.');
    } finally {
      event.target.value = '';
    }
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
              <article key={card.id} className="card-edit-item">
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
                      setDraft((prev) =>
                        prev.map((lesson) => {
                          if (lesson.id !== activeLesson.id) return lesson;
                          return {
                            ...lesson,
                            cards: lesson.cards.map((c) => (c.id === card.id ? { ...c, hanzi: value } : c)),
                          };
                        }),
                      );
                    }}
                  />
                  <CardField
                    label="Pinyin"
                    value={card.pinyin}
                    onChange={(value) => {
                      setDraft((prev) =>
                        prev.map((lesson) => {
                          if (lesson.id !== activeLesson.id) return lesson;
                          return {
                            ...lesson,
                            cards: lesson.cards.map((c) => (c.id === card.id ? { ...c, pinyin: value } : c)),
                          };
                        }),
                      );
                    }}
                  />
                  <CardField
                    label="Francais"
                    value={card.french}
                    onChange={(value) => {
                      setDraft((prev) =>
                        prev.map((lesson) => {
                          if (lesson.id !== activeLesson.id) return lesson;
                          return {
                            ...lesson,
                            cards: lesson.cards.map((c) => (c.id === card.id ? { ...c, french: value } : c)),
                          };
                        }),
                      );
                    }}
                  />
                  <CardField
                    label="Anglais"
                    value={card.english}
                    onChange={(value) => {
                      setDraft((prev) =>
                        prev.map((lesson) => {
                          if (lesson.id !== activeLesson.id) return lesson;
                          return {
                            ...lesson,
                            cards: lesson.cards.map((c) => (c.id === card.id ? { ...c, english: value } : c)),
                          };
                        }),
                      );
                    }}
                  />
                  <CardField
                    label="Image URL"
                    value={card.imageUrl || ''}
                    placeholder="/images/chat.svg"
                    onChange={(value) => {
                      setDraft((prev) =>
                        prev.map((lesson) => {
                          if (lesson.id !== activeLesson.id) return lesson;
                          return {
                            ...lesson,
                            cards: lesson.cards.map((c) =>
                              c.id === card.id ? { ...c, imageUrl: value || null } : c,
                            ),
                          };
                        }),
                      );
                    }}
                  />
                  <CardField
                    label="Audio URL"
                    value={card.audioUrl || ''}
                    placeholder="/audio/mao.mp3"
                    onChange={(value) => {
                      setDraft((prev) =>
                        prev.map((lesson) => {
                          if (lesson.id !== activeLesson.id) return lesson;
                          return {
                            ...lesson,
                            cards: lesson.cards.map((c) =>
                              c.id === card.id ? { ...c, audioUrl: value || null } : c,
                            ),
                          };
                        }),
                      );
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
