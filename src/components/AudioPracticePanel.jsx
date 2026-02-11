import { useEffect, useMemo, useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder.js';
import {
  addChildAttempt,
  getParentModel,
  listAllChildAttempts,
  listChildAttempts,
  saveParentModel,
  updateAttemptKept,
} from '../lib/audioStore.js';

function BlobPlayer({ blob }) {
  const src = useMemo(() => {
    if (!blob) return '';
    return URL.createObjectURL(blob);
  }, [blob]);

  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src);
    };
  }, [src]);

  if (!src) return null;
  return <audio controls src={src} preload="metadata" />;
}

function formatTime(iso) {
  const date = new Date(iso);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms = 0) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const sec = (total % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function validateAttempt(parentDurationMs, childDurationMs) {
  if (!parentDurationMs || !childDurationMs) {
    return { score: null, note: 'Validation indisponible.' };
  }

  const ratio = childDurationMs / parentDurationMs;
  const distance = Math.abs(1 - ratio);
  const score = Math.max(0, 1 - distance);

  if (score >= 0.85) return { score, note: 'Rythme proche du modele.' };
  if (score >= 0.65) return { score, note: 'Pas mal, encore un essai.' };
  return { score, note: 'Essaie de parler plus proche du modele.' };
}

function WaveformBars({ samples, active }) {
  const bars = samples.length > 0 ? samples : [0.08, 0.1, 0.07, 0.11, 0.09, 0.06, 0.1, 0.08];
  return (
    <div className={`waveform ${active ? 'active' : ''}`} aria-hidden="true">
      {bars.map((level, index) => (
        <span
          key={`${index}-${level}`}
          className="wave-bar"
          style={{ height: `${Math.max(8, Math.min(100, level * 100))}%` }}
        />
      ))}
    </div>
  );
}

function getDateThreshold(range) {
  const now = new Date();
  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  if (range === '7d') {
    return now.getTime() - 7 * 24 * 60 * 60 * 1000;
  }
  if (range === '30d') {
    return now.getTime() - 30 * 24 * 60 * 60 * 1000;
  }
  return null;
}

export default function AudioPracticePanel({ cardKey, mode }) {
  const isParentMode = mode === 'parent';
  const [parentModel, setParentModel] = useState(null);
  const [cardAttempts, setCardAttempts] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [panelError, setPanelError] = useState('');
  const [confirmReplaceModel, setConfirmReplaceModel] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState('all');
  const [historyCardFilter, setHistoryCardFilter] = useState('current');
  const [parentWaveSamples, setParentWaveSamples] = useState([]);
  const [childWaveSamples, setChildWaveSamples] = useState([]);

  const parentRecorder = useAudioRecorder();
  const childRecorder = useAudioRecorder();

  const loadAudioData = async () => {
    setPanelError('');
    try {
      const [model, attemptsForCard, attemptsGlobal] = await Promise.all([
        getParentModel(cardKey),
        listChildAttempts(cardKey),
        listAllChildAttempts(),
      ]);
      setParentModel(model);
      setCardAttempts(attemptsForCard);
      setAllAttempts(attemptsGlobal);
    } catch {
      setPanelError('Impossible de lire les enregistrements locaux.');
    }
  };

  useEffect(() => {
    setSaveStatus('');
    setConfirmReplaceModel(false);
    setHistoryDateFilter('all');
    setHistoryCardFilter('current');
    setParentWaveSamples([]);
    setChildWaveSamples([]);
    parentRecorder.clear();
    childRecorder.clear();
    loadAudioData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey]);

  useEffect(() => {
    if (!parentRecorder.isRecording) return undefined;
    const timer = setInterval(() => {
      setParentWaveSamples((prev) => [...prev.slice(-39), parentRecorder.audioLevel]);
    }, 80);
    return () => clearInterval(timer);
  }, [parentRecorder.audioLevel, parentRecorder.isRecording]);

  useEffect(() => {
    if (!childRecorder.isRecording) return undefined;
    const timer = setInterval(() => {
      setChildWaveSamples((prev) => [...prev.slice(-39), childRecorder.audioLevel]);
    }, 80);
    return () => clearInterval(timer);
  }, [childRecorder.audioLevel, childRecorder.isRecording]);

  const childValidation = validateAttempt(parentModel?.durationMs, childRecorder.durationMs);

  const saveParentRecording = async () => {
    if (!parentRecorder.recordedBlob) return;

    if (parentModel?.blob && !confirmReplaceModel) {
      setConfirmReplaceModel(true);
      setSaveStatus('Confirme le remplacement du modele parent.');
      return;
    }

    try {
      await saveParentModel({
        cardKey,
        blob: parentRecorder.recordedBlob,
        mimeType: parentRecorder.recordedBlob.type || parentRecorder.mimeType || 'audio/webm',
        durationMs: parentRecorder.durationMs,
      });
      setSaveStatus('Modele parent enregistre.');
      setConfirmReplaceModel(false);
      await loadAudioData();
    } catch {
      setPanelError('Echec de sauvegarde du modele parent.');
    }
  };

  const saveChildAttempt = async () => {
    if (!childRecorder.recordedBlob) return;

    try {
      const inserted = await addChildAttempt({
        cardKey,
        blob: childRecorder.recordedBlob,
        mimeType: childRecorder.recordedBlob.type || childRecorder.mimeType || 'audio/webm',
        durationMs: childRecorder.durationMs,
        score: childValidation.score,
        note: childValidation.note,
      });
      await updateAttemptKept(inserted.id, true);
      setSaveStatus('Tentative enregistree dans Mes enregistrements.');
      await loadAudioData();
    } catch {
      setPanelError('Echec de sauvegarde de la tentative enfant.');
    }
  };

  const filteredHistory = useMemo(() => {
    const source = historyCardFilter === 'all' ? allAttempts : cardAttempts;
    const keptOnly = source.filter((attempt) => attempt.kept);
    const threshold = getDateThreshold(historyDateFilter);
    if (!threshold) return keptOnly;
    return keptOnly.filter((attempt) => new Date(attempt.createdAt).getTime() >= threshold);
  }, [allAttempts, cardAttempts, historyCardFilter, historyDateFilter]);

  return (
    <section className="audio-practice">
      <div className="audio-header">
        <h3>Atelier audio</h3>
        <span className="audio-mode-chip">{isParentMode ? 'Vue parent' : 'Vue enfant'}</span>
      </div>

      {panelError ? <p className="error-line">{panelError}</p> : null}
      {saveStatus ? <p className="ok-line">{saveStatus}</p> : null}

      {isParentMode ? (
        <div className="audio-section parent-view">
          <p className="audio-help">Enregistre et gere le modele de prononciation pour cette carte.</p>
          <div className="audio-actions">
            <button
              type="button"
              className="button secondary"
              onClick={parentRecorder.isRecording ? parentRecorder.stop : parentRecorder.start}
            >
              {parentRecorder.isRecording ? 'Arreter parent' : 'Enregistrer parent'}
            </button>
            <button
              type="button"
              className="button"
              onClick={saveParentRecording}
              disabled={!parentRecorder.recordedBlob}
            >
              {parentModel?.blob ? 'Remplacer modele' : 'Sauvegarder modele'}
            </button>
          </div>

          <div className="recording-meter">
            <span>Timer: {formatDuration(parentRecorder.isRecording ? parentRecorder.elapsedMs : parentRecorder.durationMs)}</span>
            <WaveformBars samples={parentWaveSamples} active={parentRecorder.isRecording} />
          </div>

          {confirmReplaceModel ? (
            <div className="confirm-box">
              <span>Confirmer remplacement du modele actuel ?</span>
              <div className="lesson-actions compact">
                <button type="button" className="button" onClick={saveParentRecording}>
                  Oui remplacer
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setConfirmReplaceModel(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          {parentRecorder.error ? <p className="error-line">{parentRecorder.error}</p> : null}
          {parentRecorder.recordedBlob ? (
            <div className="audio-preview">
              <span>Apercu parent:</span>
              <BlobPlayer blob={parentRecorder.recordedBlob} />
            </div>
          ) : null}
          {parentModel?.blob ? (
            <div className="audio-preview">
              <span>Modele sauvegarde:</span>
              <BlobPlayer blob={parentModel.blob} />
            </div>
          ) : (
            <p className="audio-placeholder">Pas encore de modele parent.</p>
          )}

          <div className="history">
            <h4>Historique enfant</h4>
            <div className="history-filters">
              <label>
                Date
                <select value={historyDateFilter} onChange={(e) => setHistoryDateFilter(e.target.value)}>
                  <option value="all">Toutes</option>
                  <option value="today">Aujourd hui</option>
                  <option value="7d">7 jours</option>
                  <option value="30d">30 jours</option>
                </select>
              </label>
              <label>
                Carte
                <select value={historyCardFilter} onChange={(e) => setHistoryCardFilter(e.target.value)}>
                  <option value="current">Cette carte</option>
                  <option value="all">Toutes cartes</option>
                </select>
              </label>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="audio-placeholder">Aucune version enfant sauvegardee.</p>
            ) : (
              <ul>
                {filteredHistory.map((attempt) => (
                  <li key={attempt.id}>
                    <span>{formatTime(attempt.createdAt)} | {attempt.cardKey}</span>
                    <BlobPlayer blob={attempt.blob} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="audio-section child-view">
          <p className="audio-help">Ecoute le modele puis enregistre ta voix. Tu peux recommencer avant de garder.</p>
          <div className="audio-compare">
            <div>
              <h4>Modele parent</h4>
              {parentModel?.blob ? (
                <BlobPlayer blob={parentModel.blob} />
              ) : (
                <p className="audio-placeholder">Le parent doit d abord enregistrer un modele.</p>
              )}
            </div>
            <div>
              <h4>Ma tentative</h4>
              {childRecorder.recordedBlob ? (
                <BlobPlayer blob={childRecorder.recordedBlob} />
              ) : (
                <p className="audio-placeholder">Enregistre d abord une tentative.</p>
              )}
            </div>
          </div>

          <div className="audio-actions">
            <button
              type="button"
              className="button secondary"
              onClick={childRecorder.isRecording ? childRecorder.stop : childRecorder.start}
            >
              {childRecorder.isRecording ? 'Arreter' : 'Enregistrer'}
            </button>
            <button type="button" className="button" onClick={saveChildAttempt} disabled={!childRecorder.recordedBlob}>
              Je garde cette version
            </button>
          </div>

          <div className="recording-meter">
            <span>Timer: {formatDuration(childRecorder.isRecording ? childRecorder.elapsedMs : childRecorder.durationMs)}</span>
            <WaveformBars samples={childWaveSamples} active={childRecorder.isRecording} />
          </div>

          {childRecorder.error ? <p className="error-line">{childRecorder.error}</p> : null}
          {childRecorder.recordedBlob ? (
            <p className="audio-note">
              Validation: {childValidation.note}
              {typeof childValidation.score === 'number' ? ` (score ${(childValidation.score * 100).toFixed(0)}%)` : ''}
            </p>
          ) : null}

          <div className="history">
            <h4>Mes enregistrements</h4>
            <div className="history-filters">
              <label>
                Date
                <select value={historyDateFilter} onChange={(e) => setHistoryDateFilter(e.target.value)}>
                  <option value="all">Toutes</option>
                  <option value="today">Aujourd hui</option>
                  <option value="7d">7 jours</option>
                  <option value="30d">30 jours</option>
                </select>
              </label>
              <label>
                Carte
                <select value={historyCardFilter} onChange={(e) => setHistoryCardFilter(e.target.value)}>
                  <option value="current">Cette carte</option>
                  <option value="all">Toutes cartes</option>
                </select>
              </label>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="audio-placeholder">Aucune version sauvegardee pour le filtre choisi.</p>
            ) : (
              <ul>
                {filteredHistory.map((attempt) => (
                  <li key={attempt.id}>
                    <span>{formatTime(attempt.createdAt)} | {attempt.cardKey}</span>
                    <BlobPlayer blob={attempt.blob} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
