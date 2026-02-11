import { useEffect, useMemo, useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder.js';
import {
  addChildAttempt,
  getParentModel,
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

export default function AudioPracticePanel({ cardKey }) {
  const [mode, setMode] = useState('child');
  const [parentModel, setParentModel] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [panelError, setPanelError] = useState('');

  const parentRecorder = useAudioRecorder();
  const childRecorder = useAudioRecorder();

  const loadAudioData = async () => {
    setPanelError('');
    try {
      const [model, childAttempts] = await Promise.all([
        getParentModel(cardKey),
        listChildAttempts(cardKey),
      ]);
      setParentModel(model);
      setAttempts(childAttempts);
    } catch {
      setPanelError('Impossible de lire les enregistrements locaux.');
    }
  };

  useEffect(() => {
    setSaveStatus('');
    parentRecorder.clear();
    childRecorder.clear();
    loadAudioData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey]);

  const keepHistory = attempts.filter((attempt) => attempt.kept);

  const childValidation = validateAttempt(parentModel?.durationMs, childRecorder.durationMs);

  const saveParentRecording = async () => {
    if (!parentRecorder.recordedBlob) return;

    try {
      await saveParentModel({
        cardKey,
        blob: parentRecorder.recordedBlob,
        mimeType: parentRecorder.recordedBlob.type || parentRecorder.mimeType || 'audio/webm',
        durationMs: parentRecorder.durationMs,
      });
      setSaveStatus('Modele parent enregistre.');
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

  return (
    <section className="audio-practice">
      <div className="audio-header">
        <h3>Atelier audio</h3>
        <div className="mode-toggle" role="tablist" aria-label="Mode audio">
          <button
            type="button"
            className={`pill ${mode === 'parent' ? 'active' : ''}`}
            onClick={() => setMode('parent')}
          >
            Mode Parent
          </button>
          <button
            type="button"
            className={`pill ${mode === 'child' ? 'active' : ''}`}
            onClick={() => setMode('child')}
          >
            Mode Enfant
          </button>
        </div>
      </div>

      {panelError ? <p className="error-line">{panelError}</p> : null}
      {saveStatus ? <p className="ok-line">{saveStatus}</p> : null}

      {mode === 'parent' ? (
        <div className="audio-section">
          <p className="audio-help">Enregistre une prononciation modele pour cette carte.</p>
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
              Sauvegarder modele
            </button>
          </div>
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
          ) : null}
        </div>
      ) : (
        <div className="audio-section">
          <p className="audio-help">Ecoute le modele puis enregistre ta voix. Tu peux recommencer avant de garder.</p>
          <div className="audio-compare">
            <div>
              <h4>Modele parent</h4>
              {parentModel?.blob ? <BlobPlayer blob={parentModel.blob} /> : <p className="audio-placeholder">Pas encore de modele parent.</p>}
            </div>
            <div>
              <h4>Ma tentative</h4>
              {childRecorder.recordedBlob ? <BlobPlayer blob={childRecorder.recordedBlob} /> : <p className="audio-placeholder">Enregistre d abord une tentative.</p>}
            </div>
          </div>

          <div className="audio-actions">
            <button
              type="button"
              className="button secondary"
              onClick={childRecorder.isRecording ? childRecorder.stop : childRecorder.start}
            >
              {childRecorder.isRecording ? 'Arreter enfant' : 'Enregistrer enfant'}
            </button>
            <button type="button" className="button" onClick={saveChildAttempt} disabled={!childRecorder.recordedBlob}>
              Je garde cette version
            </button>
          </div>

          {childRecorder.error ? <p className="error-line">{childRecorder.error}</p> : null}
          {childRecorder.recordedBlob ? (
            <p className="audio-note">
              Validation: {childValidation.note}
              {typeof childValidation.score === 'number'
                ? ` (score ${(childValidation.score * 100).toFixed(0)}%)`
                : ''}
            </p>
          ) : null}

          <div className="history">
            <h4>Mes enregistrements</h4>
            {keepHistory.length === 0 ? (
              <p className="audio-placeholder">Aucune version sauvegardee pour l instant.</p>
            ) : (
              <ul>
                {keepHistory.map((attempt) => (
                  <li key={attempt.id}>
                    <span>{formatTime(attempt.createdAt)}</span>
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
