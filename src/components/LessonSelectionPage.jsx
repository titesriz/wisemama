import { useState } from 'react';
import { getLessonsByOrder } from '../utils/lessons/lessonOrder.js';
import '../styles/lesson-select.css';

export default function LessonSelectionPage({
  lessons = [],
  packs = [],
  activeLessonId = '',
  onSelectLesson,
  onBack,
  shellHeader = false,
}) {
  const [expandedPackIds, setExpandedPackIds] = useState([]);
  const sortedLessons = getLessonsByOrder(lessons);
  const resumeLesson = sortedLessons.find((lesson) => lesson.id === activeLessonId) || sortedLessons[0] || null;
  const otherLessons = sortedLessons.filter((lesson) => lesson.id !== resumeLesson?.id);

  // Only packs the account currently has switched on in Espace parent show up
  // here - a disabled pack's lessons stay reachable from the editor, just not
  // from this picker.
  const packGroups = packs
    .filter((pack) => pack.enabled)
    .map((pack) => ({
      id: pack.id,
      name: pack.name || pack.id,
      lessons: otherLessons.filter((lesson) => lesson.packId === pack.id),
    }))
    .filter((group) => group.lessons.length > 0);

  // Lessons with no packId (hand-created via the editor, never assigned to a
  // pack) aren't gated by the pack toggle - keep them reachable under their
  // own group instead of silently dropping them from the picker.
  const unpackedLessons = otherLessons.filter((lesson) => !lesson.packId);
  if (unpackedLessons.length) {
    packGroups.push({ id: '__unpacked', name: 'Autres leçons', lessons: unpackedLessons });
  }

  const togglePack = (packId) => {
    setExpandedPackIds((prev) => (
      prev.includes(packId) ? prev.filter((id) => id !== packId) : [...prev, packId]
    ));
  };

  return (
    <section className="lesson-select-page">
      <div className="lesson-select-shell">
        <header className="lesson-select-head">
          {shellHeader ? null : (
            <div className="hub-header-top-row">
              <button type="button" className="hub-logo-btn ui-pressable" onClick={onBack} aria-label="Retour">
                文
              </button>
              <button type="button" className="lesson-select-back ui-pressable" onClick={onBack}>
                ← Retour
              </button>
            </div>
          )}
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

        {packGroups.length ? (
          <div className="lesson-select-packs">
            {packGroups.map((group) => {
              const isExpanded = expandedPackIds.includes(group.id);
              return (
                <div key={group.id} className="lesson-select-pack">
                  <button
                    type="button"
                    className="lesson-select-pack-toggle ui-pressable"
                    onClick={() => togglePack(group.id)}
                    aria-expanded={isExpanded}
                  >
                    <span className="lesson-select-pack-name">{group.name}</span>
                    <span className="lesson-select-pack-count">{group.lessons.length} leçons</span>
                    <span className={`lesson-select-pack-chevron ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">
                      ▾
                    </span>
                  </button>
                  {isExpanded ? (
                    <div className="lesson-select-list">
                      {group.lessons.map((lesson) => (
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
              );
            })}
          </div>
        ) : null}

        {!sortedLessons.length ? <p className="parent-empty">Aucune leçon disponible.</p> : null}
      </div>
    </section>
  );
}
