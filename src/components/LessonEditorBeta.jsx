import { useMemo, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import SuccessBurst from './SuccessBurst.jsx';
import { useLessons } from '../context/LessonsContext.jsx';
import { generateLessonFlashcards, normalizeLessonInput } from '../lib/flashcardGeneration.js';
import { buildLessonsSyncEnvelope, extractLessonsFromPayload, isSyncEnvelope } from '../lib/lessonSyncFormat.js';
import { useUiSounds } from '../hooks/useUiSounds.js';

function listToCsv(input) {
  if (!Array.isArray(input)) return '';
  if (input.length && typeof input[0] === 'object') {
    return input.map((item) => item?.hanzi).filter(Boolean).join(', ');
  }
  return input.join(', ');
}

function csvToRelatedWords(input) {
  return String(input || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function LessonEditorBeta({ onBack, onSelectLesson }) {
  const { lessons, createLesson, updateLesson, duplicateLesson, removeLesson, replaceLessons } = useLessons();
  const sounds = useUiSounds();
  const importRef = useRef(null);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [rawOcrText, setRawOcrText] = useState('');
  const [generationMode, setGenerationMode] = useState('characters');
  const [cardsDraft, setCardsDraft] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [bulkAudioPrefix, setBulkAudioPrefix] = useState('/audio/');
  const [bulkAudioSuffix, setBulkAudioSuffix] = useState('.mp3');
  const [bulkImagePrefix, setBulkImagePrefix] = useState('/images/');
  const [bulkImageSuffix, setBulkImageSuffix] = useState('.svg');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('success');
  const [statusTick, setStatusTick] = useState(0);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) || null,
    [lessons, selectedLessonId],
  );

  const previewCard = cardsDraft[previewIndex] || cardsDraft[0] || null;

  const applyStatus = (message, type = 'success') => {
    setStatus(message);
    setStatusType(type);
    setStatusTick((prev) => prev + 1);
    if (type === 'success') sounds.playSuccess();
    else sounds.playError();
  };

  const loadLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
    onSelectLesson?.(lessonId);
    if (!lessonId) {
      setTitle('');
      setDescription('');
      setSourceText('');
      setCardsDraft([]);
      setPreviewIndex(0);
      return;
    }
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) return;
    setTitle(lesson.title || '');
    setDescription(lesson.description || '');
    setSourceText(lesson.sourceText || lesson.cards.map((card) => card.hanzi).join(' '));
    setRawOcrText('');
    setCardsDraft(lesson.cards || []);
    setPreviewIndex(0);
  };

  const runOcrFromFiles = async (files) => {
    if (!files?.length) return;
    setIsScanning(true);
    setStatus('');
    setStatusType('success');

    const worker = await createWorker('chi_sim+chi_tra+eng');
    try {
      let mergedText = '';
      for (const file of files) {
        const { data } = await worker.recognize(file);
        mergedText += `\n${data?.text || ''}`;
      }
      const cleanRaw = String(mergedText || '').trim();
      const normalized = normalizeLessonInput(cleanRaw);
      setRawOcrText(cleanRaw);
      setSourceText(normalized);
      applyStatus('OCR termine. Verifie le texte puis regenere les fiches.');
    } catch {
      applyStatus('OCR impossible. Essaie une image plus nette.', 'error');
    } finally {
      await worker.terminate();
      setIsScanning(false);
    }
  };

  const onPickOcrFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    await runOcrFromFiles(files);
  };

  const regenerate = () => {
    const normalized = normalizeLessonInput(sourceText);
    if (!title.trim()) {
      applyStatus('Titre obligatoire.', 'error');
      return;
    }
    if (!normalized) {
      applyStatus('Texte chinois vide.', 'error');
      return;
    }
    const pinyinToggles = selectedLesson?.pinyinToggles || {};
    const nextCards = generateLessonFlashcards({
      lessonId: selectedLessonId,
      sourceText: normalized,
      pinyinToggles,
      previousCards: cardsDraft.length ? cardsDraft : selectedLesson?.cards || [],
      generationMode,
    });
    if (!nextCards.length) {
      applyStatus('Aucune fiche generee depuis ce texte.', 'error');
      return;
    }
    setSourceText(normalized);
    setCardsDraft(nextCards);
    setPreviewIndex(0);
    applyStatus(`Generation OK: ${nextCards.length} fiches.`);
  };

  const patchCard = (cardId, patch = {}, manualKey = '') => {
    setCardsDraft((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card;
        const nextManual = { ...(card.manualOverrides || {}) };
        if (manualKey) nextManual[manualKey] = true;
        const nextCard = { ...card, ...patch, manualOverrides: nextManual };
        if (Object.prototype.hasOwnProperty.call(patch, 'french')) {
          nextCard.translation = { ...(card.translation || {}), fr: patch.french };
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'english')) {
          nextCard.translation = { ...(nextCard.translation || card.translation || {}), en: patch.english };
        }
        return nextCard;
      }),
    );
  };

  const saveLesson = () => {
    if (!title.trim()) {
      applyStatus('Titre obligatoire.', 'error');
      return;
    }
    if (!cardsDraft.length) {
      applyStatus('Genere d abord des fiches.', 'error');
      return;
    }

    const pinyinToggles = Object.fromEntries(
      cardsDraft.map((card) => [card.hanzi, card.pinyinEnabled !== false]),
    );
    const payload = {
      title: title.trim(),
      description: description.trim(),
      sourceText: normalizeLessonInput(sourceText),
      notes: selectedLesson?.notes || '',
      pinyinToggles,
      autoGenerated: true,
      cards: cardsDraft.map((card) => {
        const fr = card.french || card.translation?.fr || '';
        const en = card.english || card.translation?.en || '';
        return {
          ...card,
          french: fr,
          english: en,
          translation: {
            ...(card.translation || {}),
            fr,
            en,
          },
        };
      }),
    };

    if (selectedLessonId) {
      updateLesson(selectedLessonId, payload);
      onSelectLesson?.(selectedLessonId);
      applyStatus('Lecon mise a jour.');
      return;
    }

    const created = createLesson(payload);
    setSelectedLessonId(created.id);
    onSelectLesson?.(created.id);
    applyStatus('Lecon creee.');
  };

  const handleDuplicateLesson = () => {
    if (!selectedLessonId) {
      applyStatus('Selectionne une lecon a dupliquer.', 'error');
      return;
    }
    const copy = duplicateLesson(selectedLessonId);
    if (!copy) {
      applyStatus('Duplication impossible.', 'error');
      return;
    }
    loadLesson(copy.id);
    applyStatus('Lecon dupliquee.');
  };

  const handleDeleteLesson = () => {
    if (!selectedLessonId) {
      applyStatus('Selectionne une lecon a supprimer.', 'error');
      return;
    }
    const ok = window.confirm('Supprimer cette lecon ?');
    if (!ok) return;
    removeLesson(selectedLessonId);
    setSelectedLessonId('');
    setTitle('');
    setDescription('');
    setSourceText('');
    setCardsDraft([]);
    onSelectLesson?.('');
    applyStatus('Lecon supprimee.');
  };

  const applyBulkAudio = () => {
    if (!cardsDraft.length) return;
    setCardsDraft((prev) =>
      prev.map((card) => {
        if (card.audioUrl) return card;
        const slug = encodeURIComponent(card.hanzi || card.id || 'card');
        return { ...card, audioUrl: `${bulkAudioPrefix}${slug}${bulkAudioSuffix}` };
      }),
    );
    applyStatus('Audio bulk applique sur les cartes sans audio.');
  };

  const applyBulkImages = () => {
    if (!cardsDraft.length) return;
    setCardsDraft((prev) =>
      prev.map((card) => {
        if (card.imageUrl) return card;
        const slug = encodeURIComponent(card.hanzi || card.id || 'card');
        return { ...card, imageUrl: `${bulkImagePrefix}${slug}${bulkImageSuffix}` };
      }),
    );
    applyStatus('Images bulk appliquees sur les cartes sans image.');
  };

  const exportCurrentLesson = () => {
    if (!title.trim()) {
      applyStatus('Aucune lecon a exporter.', 'error');
      return;
    }
    const payload = {
      id: selectedLessonId || 'draft-lesson',
      title: title.trim(),
      description: description.trim(),
      sourceText: normalizeLessonInput(sourceText),
      cards: cardsDraft,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `wisemama-lesson-${payload.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    applyStatus('Lecon exportee.');
  };

  const exportAllLessons = () => {
    const payload = buildLessonsSyncEnvelope(lessons);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'wisemama-lessons-sync.json';
    anchor.click();
    URL.revokeObjectURL(url);
    applyStatus('Toutes les lecons exportees.');
  };

  const importLessonsFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const importedLessons = extractLessonsFromPayload(parsed);
      if (!Array.isArray(importedLessons) || importedLessons.length === 0) {
        throw new Error('invalid');
      }
      replaceLessons(importedLessons);
      loadLesson(importedLessons[0]?.id || '');
      applyStatus(
        isSyncEnvelope(parsed)
          ? 'Import sync termine.'
          : 'Import termine (format brut).',
      );
    } catch {
      applyStatus('Import invalide. Verifie le JSON.', 'error');
    }
  };

  return (
    <section className="lesson-beta-page">
      <header className="lesson-beta-top">
        {onBack ? (
          <button type="button" className="home-hanzi-btn ui-pressable" onClick={onBack} aria-label="Retour landing">
            文
          </button>
        ) : null}
        <div>
          <h2>Lesson Creator Pro</h2>
          <p>Texte source, generation, edition cartes, audio/images bulk, preview, import/export.</p>
        </div>
      </header>

      <section className="lesson-beta-card">
        <div className="lesson-beta-grid">
          <label className="lesson-field">
            <span>Lecon</span>
            <select value={selectedLessonId} onChange={(e) => loadLesson(e.target.value)}>
              <option value="">Nouvelle lecon</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </label>
          <label className="lesson-field">
            <span>Mode generation</span>
            <select value={generationMode} onChange={(e) => setGenerationMode(e.target.value)}>
              <option value="characters">Caracteres uniques (debutant)</option>
              <option value="words">Mots/expressions</option>
            </select>
          </label>
        </div>

        <div className="lesson-beta-grid">
          <label className="lesson-field">
            <span>Titre *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Lecon manuel 3" />
          </label>
          <label className="lesson-field">
            <span>Description</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contexte de lecon" />
          </label>
        </div>

        <div className="lesson-beta-actions">
          <label className="ocr-upload-btn ui-pressable">
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={isScanning}
              onChange={onPickOcrFiles}
            />
            {isScanning ? 'OCR en cours...' : 'Importer image(s) OCR'}
          </label>
          <button type="button" className="button secondary ui-pressable" onClick={regenerate}>
            Generer / Regenerer fiches
          </button>
          <button type="button" className="button ui-pressable" onClick={saveLesson}>
            Sauvegarder lecon
          </button>
          <button type="button" className="button secondary ui-pressable" onClick={handleDuplicateLesson}>
            Dupliquer
          </button>
          <button type="button" className="button secondary ui-pressable" onClick={handleDeleteLesson}>
            Supprimer
          </button>
          <button type="button" className="button secondary ui-pressable" onClick={exportCurrentLesson}>
            Export lecon
          </button>
          <button type="button" className="button secondary ui-pressable" onClick={exportAllLessons}>
            Export tout
          </button>
          <button type="button" className="button secondary ui-pressable" onClick={() => importRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={importLessonsFile}
          />
        </div>

        <label className="lesson-field">
          <span>Texte OCR brut</span>
          <textarea
            value={rawOcrText}
            readOnly
            placeholder="Le texte OCR brut apparait ici apres import image."
          />
        </label>

        <label className="lesson-field">
          <span>Texte source (sourceText)</span>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Colle ici 50-100 caracteres chinois..."
          />
        </label>

        {status ? (
          <p className={statusType === 'error' ? 'error-line' : 'ok-line wm-ok-line wm-success-pulse'}>
            {status}
            {statusType === 'success' ? <SuccessBurst trigger={statusTick} /> : null}
          </p>
        ) : null}
      </section>

      <section className="lesson-beta-card">
        <div className="parent-panel-head">
          <h3>Gestion audio / images bulk</h3>
        </div>
        <div className="lesson-beta-grid">
          <label className="lesson-field">
            <span>Audio prefix</span>
            <input value={bulkAudioPrefix} onChange={(e) => setBulkAudioPrefix(e.target.value)} placeholder="/audio/" />
          </label>
          <label className="lesson-field">
            <span>Audio suffix</span>
            <input value={bulkAudioSuffix} onChange={(e) => setBulkAudioSuffix(e.target.value)} placeholder=".mp3" />
          </label>
        </div>
        <div className="lesson-beta-grid">
          <label className="lesson-field">
            <span>Image prefix</span>
            <input value={bulkImagePrefix} onChange={(e) => setBulkImagePrefix(e.target.value)} placeholder="/images/" />
          </label>
          <label className="lesson-field">
            <span>Image suffix</span>
            <input value={bulkImageSuffix} onChange={(e) => setBulkImageSuffix(e.target.value)} placeholder=".svg" />
          </label>
        </div>
        <div className="lesson-beta-actions">
          <button type="button" className="button secondary ui-pressable" onClick={applyBulkAudio}>
            Appliquer audio bulk
          </button>
          <button type="button" className="button secondary ui-pressable" onClick={applyBulkImages}>
            Appliquer images bulk
          </button>
        </div>
      </section>

      <section className="lesson-beta-card">
        <div className="parent-panel-head">
          <h3>Previsualisation temps reel</h3>
          <div className="lesson-beta-actions">
            <button
              type="button"
              className="button secondary ui-pressable"
              onClick={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
              disabled={previewIndex <= 0}
            >
              ◄
            </button>
            <span>{cardsDraft.length ? `${previewIndex + 1}/${cardsDraft.length}` : '0/0'}</span>
            <button
              type="button"
              className="button secondary ui-pressable"
              onClick={() => setPreviewIndex((prev) => Math.min(cardsDraft.length - 1, prev + 1))}
              disabled={previewIndex >= cardsDraft.length - 1}
            >
              ►
            </button>
          </div>
        </div>
        {previewCard ? (
          <div className="module-card-center wm-enter-fade">
            <div className="module-hanzi-large">{previewCard.hanzi}</div>
            <div className="module-pinyin-large">{previewCard.pinyinEnabled === false ? '' : (previewCard.pinyin || '')}</div>
            <div className="module-translation-panels">
              <article>
                <strong>Francais</strong>
                <span>{previewCard.french || ''}</span>
              </article>
              <article>
                <strong>Anglais</strong>
                <span>{previewCard.english || ''}</span>
              </article>
            </div>
            {previewCard.imageUrl ? (
              <div className="module-image-wrap">
                <img src={previewCard.imageUrl} alt={previewCard.hanzi} />
              </div>
            ) : null}
          </div>
        ) : (
          <p className="parent-empty">Aucune carte a previsualiser.</p>
        )}
      </section>

      <section className="lesson-beta-card">
        <div className="parent-panel-head">
          <h3>Edition cartes inline ({cardsDraft.length})</h3>
        </div>
        <div className="cards-edit-list">
          {cardsDraft.map((card, index) => (
            <article key={card.id} className="card-edit-item">
              <div className="card-edit-head">
                <strong>#{index + 1} {card.hanzi || 'Carte'}</strong>
                <span className={`beta-dict-badge ${card?.meta?.dictFound === false ? 'incomplete' : 'ok'}`}>
                  {card?.meta?.dictFound === false ? 'auto / incomplete' : 'auto / complete'}
                </span>
              </div>
              <div className="card-grid">
                <label className="lesson-field checkbox-field">
                  <span>Pinyin ON/OFF</span>
                  <input
                    type="checkbox"
                    checked={card.pinyinEnabled !== false}
                    onChange={(e) => patchCard(card.id, { pinyinEnabled: e.target.checked })}
                  />
                </label>
                <label className="lesson-field">
                  <span>Hanzi</span>
                  <input value={card.hanzi || ''} onChange={(e) => patchCard(card.id, { hanzi: e.target.value })} />
                </label>
                <label className="lesson-field">
                  <span>Pinyin</span>
                  <input
                    value={card.pinyin || ''}
                    onChange={(e) => patchCard(card.id, { pinyin: e.target.value }, 'pinyin')}
                  />
                </label>
                <label className="lesson-field">
                  <span>Francais</span>
                  <input
                    value={card.french || card.translation?.fr || ''}
                    onChange={(e) => patchCard(card.id, { french: e.target.value }, 'french')}
                  />
                </label>
                <label className="lesson-field">
                  <span>Anglais</span>
                  <input
                    value={card.english || card.translation?.en || ''}
                    onChange={(e) => patchCard(card.id, { english: e.target.value }, 'english')}
                  />
                </label>
                <label className="lesson-field">
                  <span>Vocabulaire lie (CSV, max 5)</span>
                  <input
                    value={card.relatedVocabularyText || listToCsv(card.relatedWords || card.relatedVocabulary)}
                    onChange={(e) => {
                      const words = csvToRelatedWords(e.target.value).slice(0, 5);
                      const relatedWords = words.map((hanzi) => ({ hanzi, pinyin: '', en: '' }));
                      patchCard(
                        card.id,
                        {
                          relatedVocabularyText: e.target.value,
                          relatedVocabulary: words,
                          relatedWords,
                        },
                        'relatedVocabulary',
                      );
                    }}
                  />
                </label>
                <label className="lesson-field">
                  <span>Image URL</span>
                  <input
                    value={card.imageUrl || ''}
                    onChange={(e) => patchCard(card.id, { imageUrl: e.target.value || null })}
                  />
                </label>
                <label className="lesson-field">
                  <span>Audio URL</span>
                  <input
                    value={card.audioUrl || ''}
                    onChange={(e) => patchCard(card.id, { audioUrl: e.target.value || null })}
                  />
                </label>
              </div>
            </article>
          ))}
          {!cardsDraft.length ? <p className="parent-empty">Aucune flashcard generee.</p> : null}
        </div>
      </section>
    </section>
  );
}
