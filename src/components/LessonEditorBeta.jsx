import { useMemo, useState } from 'react';
import { createWorker } from 'tesseract.js';
import SuccessBurst from './SuccessBurst.jsx';
import { useLessons } from '../context/LessonsContext.jsx';
import { generateLessonFlashcards, normalizeLessonInput } from '../lib/flashcardGeneration.js';
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

export default function LessonEditorBeta({ onBack }) {
  const { lessons, createLesson, updateLesson } = useLessons();
  const sounds = useUiSounds();
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [rawOcrText, setRawOcrText] = useState('');
  const [generationMode, setGenerationMode] = useState('characters');
  const [cardsDraft, setCardsDraft] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('success');
  const [statusTick, setStatusTick] = useState(0);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) || null,
    [lessons, selectedLessonId],
  );

  const applyStatus = (message, type = 'success') => {
    setStatus(message);
    setStatusType(type);
    setStatusTick((prev) => prev + 1);
    if (type === 'success') sounds.playSuccess();
    else sounds.playError();
  };

  const loadLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
    if (!lessonId) {
      setTitle('');
      setDescription('');
      setSourceText('');
      setCardsDraft([]);
      return;
    }
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) return;
    setTitle(lesson.title || '');
    setDescription(lesson.description || '');
    setSourceText(lesson.sourceText || lesson.cards.map((card) => card.hanzi).join(' '));
    setRawOcrText('');
    setCardsDraft(lesson.cards || []);
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
      applyStatus('Lecon mise a jour.');
      return;
    }

    const created = createLesson(payload);
    setSelectedLessonId(created.id);
    applyStatus('Lecon creee.');
  };

  return (
    <section className="lesson-beta-page">
      <header className="lesson-beta-top">
        <button type="button" className="home-hanzi-btn ui-pressable" onClick={onBack} aria-label="Retour landing">
          文
        </button>
        <div>
          <h2>Lesson Creator Beta</h2>
          <p>OCR / copy-paste {'->'} generation {'->'} edition {'->'} sauvegarde</p>
        </div>
      </header>

      <section className="lesson-beta-card">
        <div className="lesson-beta-grid">
          <label className="lesson-field">
            <span>Lecon existante (optionnel)</span>
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
            <span>Mode extraction</span>
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
            {isScanning ? 'OCR en cours...' : 'Importer image(s) pour OCR'}
          </label>
          <button
            type="button"
            className="button secondary ui-pressable"
            onClick={() => {
              setRawOcrText('');
              setSourceText('');
            }}
            disabled={isScanning}
          >
            Vider texte OCR
          </button>
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
          <span>Texte chinois brut (OCR ou copier-coller)</span>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Colle ici 50-100 caracteres chinois..."
          />
        </label>

        <div className="lesson-beta-actions">
          <button type="button" className="button secondary ui-pressable" onClick={regenerate}>
            Regenerer depuis texte
          </button>
          <button type="button" className="button ui-pressable" onClick={saveLesson}>
            Save
          </button>
        </div>

        {status ? (
          <p className={statusType === 'error' ? 'error-line' : 'ok-line wm-ok-line wm-success-pulse'}>
            {status}
            {statusType === 'success' ? <SuccessBurst trigger={statusTick} /> : null}
          </p>
        ) : null}
      </section>

      <section className="lesson-beta-card">
        <div className="parent-panel-head">
          <h3>Flashcards ({cardsDraft.length})</h3>
          <button
            type="button"
            className="button secondary ui-pressable"
            onClick={() => setCardsDraft([])}
            disabled={!cardsDraft.length}
          >
            Cancel
          </button>
        </div>

        <div className="cards-edit-list">
          {cardsDraft.map((card, index) => (
            <article key={card.id} className="card-edit-item">
              <div className="card-edit-head">
                <strong>#{index + 1} {card.hanzi}</strong>
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
                    onChange={(e) =>
                      {
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
                      }
                    }
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
