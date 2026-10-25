import { useMemo, useState } from 'react';
import UnifiedLessonEditor from './UnifiedLessonEditor.jsx';
import { HANZI_FONT_OPTIONS, getHanziFontPreference, applyHanziFontPreference } from '../lib/hanziFont.js';
import { useScriptMode } from '../context/ScriptModeContext.jsx';
import '../styles/choice-hub.css';
import '../styles/parent-mode.css';

function getCardKey(lessonId, cardId) {
  return `${lessonId}:${cardId}`;
}

export default function ParentSpacePage({
  profiles = [],
  lessons = [],
  progressMap = {},
  onClose,
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  onDuplicateLesson,
  onSelectLesson,
  packs = [],
  onSetPackEnabled,
  onExportPack,
}) {
  const [fontChoice, setFontChoice] = useState(getHanziFontPreference());
  const { mode: scriptMode, setMode: setScriptModeValue } = useScriptMode();
  const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0] || null;

  const lessonProgress = useMemo(
    () =>
      lessons.map((lesson) => {
        const total = lesson.cards?.length || 0;
        const mastered = (lesson.cards || []).filter(
          (card) => (progressMap[getCardKey(lesson.id, card.id)] ?? 0) > 0,
        ).length;
        const percent = total ? Math.round((mastered / total) * 100) : 0;
        return { id: lesson.id, title: lesson.title || 'Leçon', mastered, total, percent };
      }),
    [lessons, progressMap],
  );

  const handleFontChange = (event) => {
    const value = event.target.value;
    setFontChoice(value);
    applyHanziFontPreference(value);
  };

  return (
    <section className="hub-page">
      <header className="hub-header">
        <div className="hub-header-top-row">
          <button type="button" className="hub-logo-btn ui-pressable" onClick={onClose} aria-label="Retour">
            文
          </button>
          <button type="button" className="hub-back-btn ui-pressable" onClick={onClose}>
            ← Retour
          </button>
        </div>
        <div className="hub-header-text">
          <h1>Espace parent</h1>
          <p>Progrès de {childProfile?.name || 'l’enfant'} et réglages simples.</p>
        </div>
      </header>

      <UnifiedLessonEditor
        lessons={lessons}
        onCreateLesson={onCreateLesson}
        onUpdateLesson={onUpdateLesson}
        onDeleteLesson={onDeleteLesson}
        onDuplicateLesson={onDuplicateLesson}
        onSelectLesson={onSelectLesson}
      />

      <section className="parent-panel" aria-label="Packs de lecons">
        <div className="parent-panel-head">
          <h3>Packs de leçons</h3>
        </div>
        <p className="parent-panel-subtitle">
          Active ou désactive un pack pour le cacher partout dans l'app, ou exporte-le à part.
        </p>
        {packs.length ? (
          <div className="parent-list">
            {packs.map((pack) => (
              <article key={pack.id} className="parent-list-item">
                <div>
                  <strong>{pack.name}</strong>
                  <p>
                    {pack.lessonCount} leçon{pack.lessonCount !== 1 ? 's' : ''}
                    {pack.description ? ` · ${pack.description}` : ''}
                  </p>
                </div>
                <div className="parent-list-actions">
                  <button
                    type="button"
                    className="vocab-select-btn ui-pressable"
                    onClick={() => onExportPack?.(pack.id)}
                  >
                    Exporter
                  </button>
                  <label className="pack-toggle">
                    <input
                      type="checkbox"
                      checked={pack.enabled}
                      onChange={(event) => onSetPackEnabled?.(pack.id, event.target.checked)}
                    />
                    <span>{pack.enabled ? 'Actif' : 'Désactivé'}</span>
                  </label>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="parent-empty">Aucun pack disponible.</p>
        )}
      </section>

      <section className="parent-panel" aria-label="Progres par lecon">
        <div className="parent-panel-head">
          <h3>Progrès par leçon</h3>
        </div>
        {lessonProgress.length ? (
          <div className="parent-grid">
            {lessonProgress.map((item) => (
              <article key={item.id} className="parent-stat-card">
                <strong>{item.title}</strong>
                <p>{item.mastered}/{item.total} cartes</p>
                <div className="parent-progress-track" aria-hidden="true">
                  <span style={{ width: `${item.percent}%` }} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="parent-empty">Aucune leçon disponible.</p>
        )}
      </section>

      <section className="parent-panel" aria-label="Reglages">
        <div className="parent-panel-head">
          <h3>Réglages</h3>
        </div>
        <section className="parent-settings-font">
          <h4>Police chinoise</h4>
          <div className="parent-font-select">
            <label htmlFor="parent-space-hanzi-font">Police Hanzi</label>
            <select id="parent-space-hanzi-font" value={fontChoice} onChange={handleFontChange}>
              {HANZI_FONT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <p className="parent-font-preview">我们一起学中文。欢迎！</p>
        </section>

        <section className="parent-settings-font">
          <h4>Caractères simplifiés / traditionnels</h4>
          <div className="script-mode-switch">
            <button
              type="button"
              className={`script-mode-btn ui-pressable ${scriptMode === 'simplified' ? 'active' : ''}`}
              onClick={() => setScriptModeValue('simplified')}
            >
              简体 Simplifié
            </button>
            <button
              type="button"
              className={`script-mode-btn ui-pressable ${scriptMode === 'traditional' ? 'active' : ''}`}
              onClick={() => setScriptModeValue('traditional')}
            >
              繁體 Traditionnel
            </button>
          </div>
          <p className="parent-font-preview">
            {scriptMode === 'traditional' ? '我們一起學中文。歡迎！' : '我们一起学中文。欢迎！'}
          </p>
        </section>
      </section>
    </section>
  );
}
