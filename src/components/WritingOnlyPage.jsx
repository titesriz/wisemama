import { useMemo, useState } from 'react';
import WritingPractice from './WritingPractice.jsx';

export default function WritingOnlyPage({
  profile,
  lessons,
  lessonId,
  onLessonChange,
  cardIndex,
  totalCards,
  onPrev,
  onNext,
  onBack,
  onSuccess,
}) {
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const activeLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === lessonId) || null,
    [lessonId, lessons],
  );
  const currentCard = activeLesson?.cards?.[cardIndex] || null;

  if (!activeLesson || !currentCard) {
    return (
      <section className="writing-only-page">
        <p className="empty">Aucune carte disponible.</p>
        <button type="button" className="button secondary" onClick={onBack}>
          Retour
        </button>
      </section>
    );
  }

  return (
    <section className="writing-only-page">
      {showLessonPicker ? (
        <div className="writing-only-lesson-pop">
          <label htmlFor="writing-only-lesson-select">Choisir une lecon</label>
          <select
            id="writing-only-lesson-select"
            value={lessonId}
            onChange={(event) => {
              onLessonChange(event.target.value);
              setShowLessonPicker(false);
            }}
          >
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="button secondary button-sm"
            onClick={() => setShowLessonPicker(false)}
          >
            Fermer
          </button>
        </div>
      ) : null}

      <WritingPractice
        hanzi={currentCard.hanzi}
        card={currentCard}
        lessonTitle={activeLesson.title}
        profile={profile}
        cardIndex={cardIndex}
        totalCards={totalCards}
        onPrev={onPrev}
        onNext={onNext}
        onOpenLessonPicker={() => setShowLessonPicker(true)}
        onSwitchModule={(module) => {
          if (module === 'flashcards') onBack?.();
        }}
        onBack={onBack}
        standalone
        onSuccess={onSuccess}
      />
    </section>
  );
}
