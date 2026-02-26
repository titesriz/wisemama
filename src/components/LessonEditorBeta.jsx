import { useEffect, useMemo, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { pinyin as pinyinFromText } from 'pinyin-pro';
import SuccessBurst from './SuccessBurst.jsx';
import { useLessons } from '../context/LessonsContext.jsx';
import { generateLessonFlashcards } from '../lib/flashcardGeneration.js';
import { buildLessonsSyncEnvelope, extractLessonsFromPayload, isSyncEnvelope } from '../lib/lessonSyncFormat.js';
import { useUiSounds } from '../hooks/useUiSounds.js';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';

function makeDraftCardId() {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const CJK_CHAR_RE = /[\u3400-\u9fff\uf900-\ufaff]/u;
const PUNCTUATION_RE = /[，。！？；：、,.!?;:()（）《》〈〉「」『』“”"'\-—…]/u;

function keepChinesePunctuationAndLines(raw = '') {
  const text = String(raw || '').replace(/\r\n?/g, '\n');
  let out = '';
  for (const char of text) {
    if (char === '\n') {
      out += '\n';
      continue;
    }
    if (CJK_CHAR_RE.test(char) || PUNCTUATION_RE.test(char) || /\s/.test(char)) {
      out += char;
    }
  }
  return out;
}

function normalizeSourceByLine(raw = '') {
  return keepChinesePunctuationAndLines(raw)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanPunctuation(raw = '') {
  return String(raw || '')
    .replace(/[,;]/g, '，')
    .replace(/[.]/g, '。')
    .replace(/[!]/g, '！')
    .replace(/[?]/g, '？');
}

function splitSentencesPreserveLines(raw = '') {
  const lines = String(raw || '').split('\n').filter((line) => line.trim());
  const out = [];
  lines.forEach((line) => {
    const chunks = line.match(/[^。！？!?]+[。！？!?]?/g) || [line];
    chunks.map((item) => item.trim()).filter(Boolean).forEach((sentence) => out.push(sentence));
  });
  return out;
}

function extractUniqueChars(raw = '') {
  const seen = new Set();
  const ordered = [];
  for (const char of Array.from(String(raw || ''))) {
    if (!/[\u3400-\u9fff\uf900-\ufaff]/u.test(char)) continue;
    if (seen.has(char)) continue;
    seen.add(char);
    ordered.push(char);
  }
  return ordered;
}

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
    .filter(Boolean)
    .slice(0, 5);
}

function cardCompleteness(card) {
  if (!card) return 0;
  let score = 0;
  if (card.hanzi) score += 15;
  if (card.pinyin) score += 20;
  if (card.french || card.translation?.fr) score += 30;
  if (card.english || card.translation?.en) score += 15;
  if (card.audioUrl) score += 15;
  if (card.imageUrl) score += 5;
  return score;
}

function isChineseChar(char) {
  return /[\u3400-\u9fff\uf900-\ufaff]/u.test(char);
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image_load_failed'));
    };
    image.src = url;
  });
}

function preprocessImageCanvas(image, { contrast = 1.4, threshold = 170 } = {}) {
  const maxWidth = 1800;
  const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
  const width = Math.max(1, Math.floor(image.width * ratio));
  const height = Math.max(1, Math.floor(image.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const contrasted = (gray - 128) * contrast + 128;
    const bw = contrasted < threshold ? 0 : 255;
    data[i] = bw;
    data[i + 1] = bw;
    data[i + 2] = bw;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function copyImageToCanvas(image) {
  const maxWidth = 1800;
  const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
  const width = Math.max(1, Math.floor(image.width * ratio));
  const height = Math.max(1, Math.floor(image.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

function splitCanvasIntoLineBlocks(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const rowInk = new Array(height).fill(0);

  for (let y = 0; y < height; y += 1) {
    let count = 0;
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      if (data[idx] < 200) count += 1;
    }
    rowInk[y] = count;
  }

  const minInk = Math.max(4, Math.floor(width * 0.006));
  const ranges = [];
  let start = -1;
  for (let y = 0; y < height; y += 1) {
    if (rowInk[y] >= minInk && start < 0) start = y;
    if (rowInk[y] < minInk && start >= 0) {
      ranges.push([start, y - 1]);
      start = -1;
    }
  }
  if (start >= 0) ranges.push([start, height - 1]);

  const merged = [];
  const gapMax = 10;
  const minBlockHeight = 18;
  ranges.forEach((range) => {
    if (!merged.length) {
      merged.push(range);
      return;
    }
    const prev = merged[merged.length - 1];
    if (range[0] - prev[1] <= gapMax) {
      prev[1] = range[1];
    } else {
      merged.push(range);
    }
  });

  const blocks = merged
    .filter(([y1, y2]) => y2 - y1 + 1 >= minBlockHeight)
    .map(([y1, y2]) => {
      const margin = 12;
      const top = Math.max(0, y1 - margin);
      const bottom = Math.min(height, y2 + margin);
      const h = Math.max(1, bottom - top);
      const block = document.createElement('canvas');
      block.width = width;
      block.height = h;
      const bctx = block.getContext('2d');
      if (bctx) bctx.drawImage(canvas, 0, top, width, h, 0, 0, width, h);
      return block;
    });

  return blocks.slice(0, 24);
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
  const [cardsDraft, setCardsDraft] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrPsm, setOcrPsm] = useState('6');
  const [ocrUsePreprocess, setOcrUsePreprocess] = useState(true);
  const [ocrUseLineBlocks, setOcrUseLineBlocks] = useState(true);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAllPinyin, setShowAllPinyin] = useState(false);
  const [showNewCharsOnly, setShowNewCharsOnly] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('success');
  const [statusTick, setStatusTick] = useState(0);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) || null,
    [lessons, selectedLessonId],
  );

  const uniqueChars = useMemo(() => extractUniqueChars(sourceText), [sourceText]);
  const sentenceList = useMemo(() => splitSentencesPreserveLines(sourceText), [sourceText]);

  const cardsByHanzi = useMemo(() => {
    const map = new Map();
    cardsDraft.forEach((card, idx) => {
      if (!card?.hanzi) return;
      if (!map.has(card.hanzi)) map.set(card.hanzi, { card, idx });
      Array.from(card.hanzi).forEach((char) => {
        if (!map.has(char)) map.set(char, { card, idx });
      });
    });
    return map;
  }, [cardsDraft]);

  const currentCard = cardsDraft[currentCardIndex] || null;

  useEffect(() => {
    setCurrentCardIndex((prev) => {
      if (!cardsDraft.length) return 0;
      if (prev < 0) return 0;
      if (prev > cardsDraft.length - 1) return cardsDraft.length - 1;
      return prev;
    });
  }, [cardsDraft.length]);

  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || event.target?.isContentEditable) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentCardIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentCardIndex((prev) => Math.min(cardsDraft.length - 1, prev + 1));
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveLesson();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        regenerateCards();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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
      setRawOcrText('');
      setCardsDraft([]);
      setCurrentCardIndex(0);
      return;
    }

    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) return;

    setTitle(lesson.title || '');
    setDescription(lesson.description || '');
    setSourceText(lesson.sourceText || '');
    setRawOcrText('');
    setCardsDraft(lesson.cards || []);
    setCurrentCardIndex(0);
  };

  const runOcrFromFiles = async (files) => {
    if (!files?.length) return;
    setIsScanning(true);
    setStatus('');
    setOcrProgress(0);

    const worker = await createWorker('chi_sim', 1, {
      logger: (msg) => {
        if (msg?.status === 'recognizing text' && typeof msg.progress === 'number') {
          setOcrProgress(Math.round(msg.progress * 100));
        }
      },
    });
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: ocrPsm,
        preserve_interword_spaces: '1',
      });

      let mergedText = '';
      for (const file of files) {
        const image = await loadImageElement(file);
        const processed = ocrUsePreprocess ? preprocessImageCanvas(image) : copyImageToCanvas(image);
        const blocks = ocrUseLineBlocks ? splitCanvasIntoLineBlocks(processed) : [];
        const ocrTargets = blocks.length ? blocks : [processed];
        let fileText = '';

        for (const target of ocrTargets) {
          const { data } = await worker.recognize(target);
          fileText += `${fileText ? '\n' : ''}${data?.text || ''}`;
        }

        mergedText += `${mergedText ? '\n' : ''}${fileText}`;
      }
      const cleanRaw = String(mergedText || '').trim();
      setRawOcrText(cleanRaw);
      setSourceText(normalizeSourceByLine(cleanRaw));
      applyStatus('OCR termine. Verifie puis genere les fiches.');
    } catch {
      applyStatus('OCR impossible. Essaie une image plus nette.', 'error');
    } finally {
      await worker.terminate();
      setIsScanning(false);
      setOcrProgress(0);
    }
  };

  const onPickOcrFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    await runOcrFromFiles(files);
  };

  const regenerateCards = () => {
    if (!title.trim()) {
      applyStatus('Titre obligatoire.', 'error');
      return;
    }
    if (!sourceText.trim()) {
      applyStatus('Texte source vide.', 'error');
      return;
    }

    const pinyinToggles = selectedLesson?.pinyinToggles || {};
    const nextCards = generateLessonFlashcards({
      lessonId: selectedLessonId,
      sourceText,
      pinyinToggles,
      previousCards: cardsDraft.length ? cardsDraft : selectedLesson?.cards || [],
      generationMode: 'characters',
    });

    if (!nextCards.length) {
      applyStatus('Aucune fiche generee depuis ce texte.', 'error');
      return;
    }

    setCardsDraft(nextCards);
    setCurrentCardIndex(0);
    applyStatus(`Generation OK: ${nextCards.length} fiches.`);
  };

  const regenerateCardsKeepEdits = () => {
    regenerateCards();
    setStatus('Regeneration terminee (edits manuels conserves si possible).');
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
    if (!sourceText.trim()) {
      applyStatus('Texte source obligatoire.', 'error');
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
      sourceText,
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
          relatedVocabularyText: listToCsv(card.relatedVocabulary || []),
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
    if (!window.confirm('Supprimer cette lecon ?')) return;
    removeLesson(selectedLessonId);
    loadLesson('');
    applyStatus('Lecon supprimee.');
  };

  const duplicateCurrentCard = () => {
    if (!currentCard) return;
    setCardsDraft((prev) => {
      const copy = { ...currentCard, id: makeDraftCardId() };
      const next = [...prev];
      next.splice(currentCardIndex + 1, 0, copy);
      return next;
    });
    setCurrentCardIndex((prev) => prev + 1);
    applyStatus('Fiche dupliquee.');
  };

  const deleteCurrentCard = () => {
    if (!currentCard) return;
    if (!window.confirm('Supprimer cette fiche ?')) return;
    setCardsDraft((prev) => prev.filter((card) => card.id !== currentCard.id));
    setCurrentCardIndex((prev) => Math.max(0, prev - 1));
    applyStatus('Fiche supprimee.');
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
      sourceText,
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
      applyStatus(isSyncEnvelope(parsed) ? 'Import sync termine.' : 'Import termine (format brut).');
    } catch {
      applyStatus('Import invalide. Verifie le JSON.', 'error');
    }
  };

  const autoFillPinyinCurrentCard = () => {
    if (!currentCard?.hanzi) return;
    const p = pinyinFromText(currentCard.hanzi, { type: 'num', toneType: 'num' }) || '';
    patchCard(currentCard.id, { pinyin: p }, 'pinyin');
  };

  return (
    <section className="lesson-beta-page lesson-pro-page">
      <header className="lesson-beta-top lesson-pro-header">
        {onBack ? (
          <button type="button" className="home-hanzi-btn ui-pressable" onClick={onBack} aria-label="Retour landing">
            文
          </button>
        ) : null}
        <div>
          <h2>Lesson Creator Pro</h2>
          <p>Texte source, apercu enfant, edition fiche par fiche.</p>
        </div>
        <div className="lesson-pro-header-actions">
          <button type="button" className="button ui-pressable" onClick={saveLesson}>💾 Sauvegarder</button>
          <button type="button" className="button secondary ui-pressable" onClick={exportCurrentLesson}>📤 Export JSON</button>
          {onBack ? <button type="button" className="button secondary ui-pressable" onClick={onBack}>Fermer</button> : null}
        </div>
      </header>

      <div className="lesson-pro-columns">
        <section className="lesson-beta-card lesson-pro-col source-col">
          <div className="lesson-beta-grid">
            <label className="lesson-field">
              <span>Lecon</span>
              <select value={selectedLessonId} onChange={(e) => loadLesson(e.target.value)}>
                <option value="">Nouvelle lecon</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                ))}
              </select>
            </label>
            <label className="lesson-field">
              <span>Titre *</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Lecon manuel 3" />
            </label>
          </div>

          <label className="lesson-field">
            <span>Description</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contexte de lecon" />
          </label>

          <div className="lesson-beta-actions">
            <label className="ocr-upload-btn ui-pressable">
              <input type="file" accept="image/*" multiple disabled={isScanning} onChange={onPickOcrFiles} />
              {isScanning ? 'OCR en cours...' : 'Importer image(s) OCR'}
            </label>
            <div className="ocr-mode-chip">OCR: chinois simplifie</div>
            <label className="lesson-field lesson-field-inline">
              <span>PSM</span>
              <select value={ocrPsm} onChange={(e) => setOcrPsm(e.target.value)} disabled={isScanning}>
                <option value="6">6 (bloc uniforme)</option>
                <option value="7">7 (ligne unique)</option>
                <option value="11">11 (texte epars)</option>
              </select>
            </label>
            <label className="lesson-field checkbox-field lesson-field-inline">
              <span>Pre-traitement</span>
              <input type="checkbox" checked={ocrUsePreprocess} onChange={(e) => setOcrUsePreprocess(e.target.checked)} disabled={isScanning} />
            </label>
            <label className="lesson-field checkbox-field lesson-field-inline">
              <span>OCR par lignes</span>
              <input type="checkbox" checked={ocrUseLineBlocks} onChange={(e) => setOcrUseLineBlocks(e.target.checked)} disabled={isScanning} />
            </label>
            <button type="button" className="button secondary ui-pressable" onClick={() => setSourceText(normalizeSourceByLine(sourceText))}>
              🔄 Normaliser
            </button>
            <button type="button" className="button secondary ui-pressable" onClick={() => setSourceText(cleanPunctuation(sourceText))}>
              ✂️ Nettoyer
            </button>
          </div>

          {isScanning ? <div className="ocr-progress-line">OCR: {ocrProgress}%</div> : null}

          <label className="lesson-field">
            <span>Texte OCR brut</span>
            <textarea value={rawOcrText} readOnly placeholder="Le texte OCR brut apparait ici apres import image." />
          </label>

          <label className="lesson-field">
            <span>Texte source (sourceText)</span>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="source-textarea"
              placeholder={'老师您早!\n您早!\n老师您好!'}
            />
          </label>

          <div className="text-stats">📊 {uniqueChars.length} caracteres uniques • {sentenceList.length} phrases</div>

          <div className="lesson-beta-actions">
            <button type="button" className="button secondary ui-pressable" onClick={regenerateCards}>
              ✨ {cardsDraft.length ? 'Regenerer' : 'Generer'} fiches ({uniqueChars.length})
            </button>
            <button type="button" className="button secondary ui-pressable" onClick={regenerateCardsKeepEdits}>
              🔄 Regenerer (garder edits)
            </button>
          </div>

          <div className="lesson-beta-actions">
            <button type="button" className="button secondary ui-pressable" onClick={handleDuplicateLesson}>Dupliquer lecon</button>
            <button type="button" className="button secondary ui-pressable" onClick={handleDeleteLesson}>Supprimer lecon</button>
            <button type="button" className="button secondary ui-pressable" onClick={exportAllLessons}>Export tout</button>
            <button type="button" className="button secondary ui-pressable" onClick={() => importRef.current?.click()}>Import JSON</button>
            <input ref={importRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importLessonsFile} />
          </div>
        </section>

        <section className="lesson-beta-card lesson-pro-col preview-col">
          <div className="parent-panel-head">
            <h3>👁 Apercu (vue enfant)</h3>
            <div className="lesson-beta-actions">
              <button
                type="button"
                className={`button secondary ui-pressable ${showAllPinyin ? 'active' : ''}`}
                onClick={() => setShowAllPinyin((prev) => !prev)}
              >
                Tous les pinyin
              </button>
              <button
                type="button"
                className={`button secondary ui-pressable ${showNewCharsOnly ? 'active' : ''}`}
                onClick={() => setShowNewCharsOnly((prev) => !prev)}
              >
                Nouveaux
              </button>
            </div>
          </div>

          <div className="lesson-preview-surface">
            {sentenceList.length ? sentenceList.map((sentence, sentenceIndex) => (
              <p key={`${sentence}-${sentenceIndex}`} className="lesson-preview-line">
                <button type="button" className="lesson-text-audio ui-pressable" aria-label={`Lire phrase ${sentenceIndex + 1}`}>🔊</button>
                <span className="lesson-preview-phrase">
                  {Array.from(sentence).map((char, charIndex) => {
                    if (!isChineseChar(char)) {
                      return <span key={`${sentenceIndex}-${charIndex}`}>{char}</span>;
                    }
                    const cardEntry = cardsByHanzi.get(char);
                    const card = cardEntry?.card;
                    const incomplete = !(card?.french || card?.english);
                    const hideThis = showNewCharsOnly && !incomplete;
                    return (
                      <span
                        key={`${sentenceIndex}-${charIndex}`}
                        className={`lesson-preview-char ${incomplete ? 'new' : 'learned'} ${hideThis ? 'muted' : ''}`}
                        title={[card?.french, card?.english].filter(Boolean).join(' · ') || 'Traduction non disponible'}
                        onClick={() => {
                          if (typeof cardEntry?.idx === 'number') setCurrentCardIndex(cardEntry.idx);
                        }}
                      >
                        {showAllPinyin ? <span className="lesson-preview-pinyin">{formatPinyinDisplay(card?.pinyin || '')}</span> : null}
                        <span>{char}</span>
                      </span>
                    );
                  })}
                </span>
              </p>
            )) : <p className="parent-empty">Aucun texte source.</p>}
          </div>

          <div className="lesson-preview-vocab">
            <h4>Vocabulaire ({cardsDraft.length})</h4>
            <div className="lesson-preview-vocab-list">
              {cardsDraft.map((card, idx) => (
                <button
                  key={card.id}
                  type="button"
                  className={`lesson-text-vocab-chip ui-pressable ${idx === currentCardIndex ? 'active' : ''}`}
                  onClick={() => setCurrentCardIndex(idx)}
                >
                  {card.hanzi}
                </button>
              ))}
            </div>
          </div>

          <p className="preview-note">💡 Meme structure que la vue enfant "Lire la lecon".</p>
        </section>

        <section className="lesson-beta-card lesson-pro-col editor-col">
          <div className="parent-panel-head">
            <h3>✏️ Fiche {cardsDraft.length ? currentCardIndex + 1 : 0}/{cardsDraft.length}</h3>
            <div className="lesson-beta-actions">
              <button
                type="button"
                className="button secondary ui-pressable"
                onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentCardIndex <= 0}
              >
                ◄ Prec
              </button>
              <button
                type="button"
                className="button secondary ui-pressable"
                onClick={() => setCurrentCardIndex((prev) => Math.min(cardsDraft.length - 1, prev + 1))}
                disabled={currentCardIndex >= cardsDraft.length - 1}
              >
                Suiv ►
              </button>
            </div>
          </div>

          {currentCard ? (
            <article className="card-edit-item card-edit-focus">
              <div className="card-edit-head">
                <strong>{currentCard.hanzi || 'Carte'}</strong>
                <span className={`beta-dict-badge ${currentCard?.meta?.dictFound === false ? 'incomplete' : 'ok'}`}>
                  {currentCard?.meta?.dictFound === false ? 'auto / incomplete' : 'auto / complete'}
                </span>
              </div>

              <div className="card-edit-display">
                <div className="hanzi-display">{currentCard.hanzi || '字'}</div>
                <div className="pinyin-display">{formatPinyinDisplay(currentCard.pinyin || '')}</div>
              </div>

              <div className="card-grid">
                <label className="lesson-field checkbox-field">
                  <span>Pinyin ON/OFF</span>
                  <input
                    type="checkbox"
                    checked={currentCard.pinyinEnabled !== false}
                    onChange={(e) => patchCard(currentCard.id, { pinyinEnabled: e.target.checked })}
                  />
                </label>

                <label className="lesson-field">
                  <span>Pinyin</span>
                  <div className="input-inline-action">
                    <input value={currentCard.pinyin || ''} onChange={(e) => patchCard(currentCard.id, { pinyin: e.target.value }, 'pinyin')} />
                    <button type="button" className="button secondary button-sm ui-pressable" onClick={autoFillPinyinCurrentCard}>🔄 Auto</button>
                  </div>
                </label>

                <label className="lesson-field">
                  <span>Francais</span>
                  <input value={currentCard.french || currentCard.translation?.fr || ''} onChange={(e) => patchCard(currentCard.id, { french: e.target.value }, 'french')} />
                </label>

                <label className="lesson-field">
                  <span>Anglais</span>
                  <input value={currentCard.english || currentCard.translation?.en || ''} onChange={(e) => patchCard(currentCard.id, { english: e.target.value }, 'english')} />
                </label>

                <label className="lesson-field">
                  <span>Audio URL</span>
                  <input value={currentCard.audioUrl || ''} onChange={(e) => patchCard(currentCard.id, { audioUrl: e.target.value || null })} />
                </label>

                <label className="lesson-field">
                  <span>Image URL</span>
                  <input value={currentCard.imageUrl || ''} onChange={(e) => patchCard(currentCard.id, { imageUrl: e.target.value || null })} />
                </label>

                <label className="lesson-field">
                  <span>Vocabulaire lie (CSV, max 5)</span>
                  <input
                    value={currentCard.relatedVocabularyText || listToCsv(currentCard.relatedWords || currentCard.relatedVocabulary)}
                    onChange={(e) => {
                      const words = csvToRelatedWords(e.target.value);
                      const relatedWords = words.map((hanzi) => ({ hanzi, pinyin: '', en: '' }));
                      patchCard(currentCard.id, {
                        relatedVocabularyText: e.target.value,
                        relatedVocabulary: words,
                        relatedWords,
                      }, 'relatedVocabulary');
                    }}
                  />
                </label>
              </div>

              <div className="card-completeness">
                <div className="completeness-label">Completude: {cardCompleteness(currentCard)}%</div>
                <div className="completeness-bar"><div className="completeness-fill" style={{ width: `${cardCompleteness(currentCard)}%` }} /></div>
              </div>

              <div className="lesson-beta-actions">
                <button type="button" className="button secondary ui-pressable" onClick={duplicateCurrentCard}>📋 Dupliquer fiche</button>
                <button type="button" className="button secondary ui-pressable" onClick={deleteCurrentCard}>🗑️ Supprimer fiche</button>
              </div>
            </article>
          ) : (
            <p className="parent-empty">Aucune fiche a editer.</p>
          )}
        </section>
      </div>

      {status ? (
        <p className={statusType === 'error' ? 'error-line' : 'ok-line wm-ok-line wm-success-pulse'}>
          {status}
          {statusType === 'success' ? <SuccessBurst trigger={statusTick} /> : null}
        </p>
      ) : null}
    </section>
  );
}
