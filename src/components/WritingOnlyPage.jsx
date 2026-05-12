import { useState } from 'react';
import WritingPractice from './WritingPractice.jsx';

export default function WritingOnlyPage({
  profile,
  parentProfile,
  activeLesson,
  lessons = [],
  cardIndex,
  writingDifficulty = 1,
  journeyMode = false,
  journeyQueue = [],
  journeyPosition = 0,
  onPrev,
  onNext,
  onBack,
  onOpenLessonText,
  onSelectLesson,
  onSwitchModule,
  onOpenRadical,
  onSuccess,
  onJourneyRestart,
}) {
  const [showEndScreen, setShowEndScreen] = useState(false);

  const effectiveIndex = journeyMode && journeyQueue.length
    ? journeyQueue[journeyPosition] ?? journeyQueue[0] ?? 0
    : cardIndex;
  const currentCard = activeLesson?.cards?.[effectiveIndex] || null;
  const totalCards = journeyMode && journeyQueue.length ? journeyQueue.length : activeLesson?.cards?.length || 0;
  const displayIndex = journeyMode && journeyQueue.length ? journeyPosition : cardIndex;

  const isLastJourneyCard = journeyMode && journeyQueue.length > 0 && journeyPosition >= journeyQueue.length - 1;

  const handleNext = () => {
    if (isLastJourneyCard) {
      setShowEndScreen(true);
    } else {
      onNext?.();
    }
  };

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

  if (showEndScreen) {
    return (
      <section className="writing-only-page writing-end-screen">
        <div className="writing-end-actions">
          <button
            type="button"
            className="button"
            onClick={() => {
              setShowEndScreen(false);
              onJourneyRestart?.();
            }}
          >
            Recommencer
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={onBack}
          >
            Retour à la leçon
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="writing-only-page">
      <WritingPractice
        hanzi={currentCard.hanzi}
        card={currentCard}
        lessonId={activeLesson.id}
        lessonTitle={activeLesson.title}
        lessons={lessons}
        profile={profile}
        parentProfile={parentProfile}
        writingDifficulty={writingDifficulty}
        cardIndex={displayIndex}
        totalCards={totalCards}
        onPrev={onPrev}
        onNext={handleNext}
        onOpenLessonText={onOpenLessonText}
        onSelectLesson={onSelectLesson}
        onSwitchModule={onSwitchModule}
        onOpenRadical={onOpenRadical}
        onBack={onBack}
        standalone
        onSuccess={onSuccess}
      />
    </section>
  );
}
