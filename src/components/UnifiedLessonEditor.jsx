import { useEffect, useMemo, useState } from 'react';
import LessonEditorBeta from './LessonEditorBeta.jsx';
import TokenButton from './ui/TokenButton.jsx';
import { getLessonsByOrder } from '../utils/lessons/lessonOrder.js';

const VIEW_MODES = [
  { id: 'all', label: 'Tout' },
  { id: 'source', label: 'Texte' },
  { id: 'preview', label: 'Apercu' },
  { id: 'cards', label: 'Fiches' },
];

export default function UnifiedLessonEditor({
  lessons = [],
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  onDuplicateLesson,
  onSelectLesson,
}) {
  const orderedLessons = useMemo(() => getLessonsByOrder(lessons), [lessons]);
  const [activeLessonId, setActiveLessonId] = useState(orderedLessons[0]?.id || '');
  const [viewMode, setViewMode] = useState('all');

  useEffect(() => {
    if (!orderedLessons.length) {
      setActiveLessonId('');
      return;
    }
    if (!activeLessonId || !orderedLessons.some((lesson) => lesson.id === activeLessonId)) {
      setActiveLessonId(orderedLessons[0].id);
    }
  }, [orderedLessons, activeLessonId]);

  const selectLesson = (lessonId) => {
    if (!lessonId) return;
    setActiveLessonId(lessonId);
    onSelectLesson?.(lessonId);
  };

  const handleCreate = () => {
    const created = onCreateLesson?.({ title: 'Nouvelle lecon' });
    const createdId = created?.id || created;
    if (createdId) selectLesson(createdId);
  };

  const handleDuplicate = (lessonId) => {
    const duplicated = onDuplicateLesson?.(lessonId);
    const duplicatedId = duplicated?.id || duplicated;
    if (duplicatedId) selectLesson(duplicatedId);
  };

  const handleDelete = (lessonId) => {
    if (!lessonId) return;
    if (!window.confirm('Supprimer cette lecon ?')) return;
    onDeleteLesson?.(lessonId);
    const next = orderedLessons.filter((lesson) => lesson.id !== lessonId);
    if (next[0]?.id) selectLesson(next[0].id);
  };

  return (
    <section className="parent-panel unified-lesson-editor" aria-label="Editeur Lecon Unifie">
      <div className="parent-panel-head">
        <div>
          <h3>Editeur de lecons</h3>
          <p className="parent-panel-subtitle">Gestion + edition dans une seule interface.</p>
        </div>
        <div className="parent-list-actions">
          <TokenButton variant="secondary" className="ui-pressable" onClick={handleCreate}>
            + Nouvelle lecon
          </TokenButton>
        </div>
      </div>

      <div className="lesson-editor-shell">
        <aside className="lesson-editor-list">
          <div className="lesson-editor-list-head">
            <strong>Lecons ({orderedLessons.length})</strong>
          </div>
          <div className="lesson-editor-list-body">
            {orderedLessons.length ? (
              orderedLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  className={`lesson-editor-item ui-pressable ${lesson.id === activeLessonId ? 'active' : ''}`}
                  onClick={() => selectLesson(lesson.id)}
                >
                  <div>
                    <strong>{lesson.order}. {lesson.title}</strong>
                    <small>{lesson.cards?.length || 0} fiches</small>
                  </div>
                  <div className="lesson-editor-item-actions">
                    <TokenButton
                      variant="ghost"
                      className="wm-btn-compact ui-pressable"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDuplicate(lesson.id);
                      }}
                    >
                      Dupliquer
                    </TokenButton>
                    <TokenButton
                      className="wm-btn-compact parent-danger-btn ui-pressable"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(lesson.id);
                      }}
                    >
                      Supprimer
                    </TokenButton>
                  </div>
                </button>
              ))
            ) : (
              <p className="parent-empty">Aucune lecon disponible.</p>
            )}
          </div>
        </aside>

        <div className="lesson-editor-main">
          <div className="lesson-editor-tabs" role="tablist" aria-label="Sections editeur">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`lesson-editor-tab ui-pressable ${viewMode === mode.id ? 'active' : ''}`}
                onClick={() => setViewMode(mode.id)}
                role="tab"
                aria-selected={viewMode === mode.id}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <LessonEditorBeta
            initialLessonId={activeLessonId}
            viewMode={viewMode}
            onSelectLesson={(lessonId) => {
              if (lessonId) selectLesson(lessonId);
            }}
          />
        </div>
      </div>
    </section>
  );
}
