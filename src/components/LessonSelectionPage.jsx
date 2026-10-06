import { useState } from 'react';
import { getLessonsByOrder } from '../utils/lessons/lessonOrder.js';
import '../styles/lesson-select.css';

export default function LessonSelectionPage({
  lessons = [],
  activeLessonId = '',
  onSelectLesson,
  onBack,
}) {
  const [showOtherLessons, setShowOtherLessons] = useState(true);
  const sortedLessons = getLessonsByOrder(lessons);
  const resumeLesson = sortedLessons.find((lesson) => lesson.id === activeLessonId) || sortedLessons[0] || null;
  const otherLessons = sortedLessons.filter((lesson) => lesson.id !== resumeLesson?.id);

  return (
    <section className="lesson-select-page">
      <div className="lesson-select-shell">
        <header className="lesson-select-head">
          <div className="hub-header-top-row">
            <button type="button" className="hub-logo-btn ui-pressable" onClick={onBack} aria-label="Retour">
              文
            </button>
            <button type="button" className="lesson-select-back ui-pressable" onClick={onBack}>
              ← Retour
            </button>
          </div>
          <h1>Choisir une leçon</h1>
        </header>

        {resumeLesson ? (
          <>
            <p className="lesson-select-resume-label">Reprendre</p>
            <button
              type="button"
              className="lesson-select-card lesson-select-resume-card ui-pressable"
              onClick={() => onSelectLesson?.(resumeLesson.id)}
            >
              <strong>{resumeLesson.order ? `${resumeLesson.order}. ` : ''}{resumeLesson.title || 'Leçon sans titre'}</strong>
              <span>{resumeLesson.cards?.length || 0} fiches</span>
            </button>
          </>
        ) : null}

        {otherLessons.length ? (
          <div className="lesson-select-other">
            <button
              type="button"
              className="lesson-select-toggle ui-pressable"
              onClick={() => setShowOtherLessons((prev) => !prev)}
              aria-expanded={showOtherLessons}
            >
              Choisir une autre leçon {showOtherLessons ? '▴' : '▾'}
            </button>
            {showOtherLessons ? (
              <div className="lesson-select-list">
                {otherLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    className={`lesson-select-card ui-pressable ${activeLessonId === lesson.id ? 'active' : ''}`}
                    onClick={() => onSelectLesson?.(lesson.id)}
                  >
                    <strong>{lesson.order ? `${lesson.order}. ` : ''}{lesson.title || 'Leçon sans titre'}</strong>
                    <span>{lesson.cards?.length || 0} fiches</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {!sortedLessons.length ? <p className="parent-empty">Aucune leçon disponible.</p> : null}
      </div>
    </section>
  );
}
