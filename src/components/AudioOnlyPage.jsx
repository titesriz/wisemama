import { useMemo, useState } from 'react';
import AudioStandaloneUI from './AudioStandaloneUI.jsx';

export default function AudioOnlyPage({
  profile,
  mode,
  lessons,
  lessonId,
  onLessonChange,
  cardIndex,
  totalCards,
  cardKey,
  onPrev,
  onNext,
  onBack,
  onOpenLessonText,
  onSwitchModule,
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
          <label htmlFor="audio-only-lesson-select">Choisir une lecon</label>
          <select
            id="audio-only-lesson-select"
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

      <AudioStandaloneUI
        profile={profile}
        lessonTitle={activeLesson.title}
        card={currentCard}
        cardIndex={cardIndex}
        totalCards={totalCards}
        mode={mode}
        cardKey={cardKey}
        onPrev={onPrev}
        onNext={onNext}
        onOpenLessonPicker={() => setShowLessonPicker(true)}
        onOpenLessonText={onOpenLessonText}
        onSwitchModule={onSwitchModule}
        onBack={onBack}
      />
    </section>
  );
}
