export default function LessonSelectionPage({
  lessons = [],
  activeLessonId = '',
  onSelectLesson,
  onBack,
}) {
  return (
    <section className="lesson-select-page">
      <div className="lesson-select-shell">
        <header className="lesson-select-head">
          <button type="button" className="lesson-select-back ui-pressable" onClick={onBack}>
            ← Retour
          </button>
          <h1>Choisir une leçon</h1>
        </header>

        <div className="lesson-select-list">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              type="button"
              className={`lesson-select-card ui-pressable ${activeLessonId === lesson.id ? 'active' : ''}`}
              onClick={() => onSelectLesson?.(lesson.id)}
            >
              <strong>{lesson.title || 'Leçon sans titre'}</strong>
              <span>{lesson.cards?.length || 0} fiches</span>
              <small>{lesson.updatedAt ? `Mis à jour: ${new Date(lesson.updatedAt).toLocaleDateString('fr-FR')}` : 'Date non disponible'}</small>
            </button>
          ))}
          {!lessons.length ? <p className="parent-empty">Aucune leçon disponible.</p> : null}
        </div>
      </div>
    </section>
  );
}

