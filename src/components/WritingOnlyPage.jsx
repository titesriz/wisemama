import { useState } from 'react';
import WritingPractice from './WritingPractice.jsx';

export default function WritingOnlyPage({
  profile,
  parentProfile,
  activeLesson,
  lessons = [],
  cardIndex,
  writingDifficulty = 1,
  writingMode = null,
  journeyMode = false,
  journeyQueue = [],
  journeyPosition = 0,
  onPrev,
  onNext,
  onBack,
  onGoHome,
  onOpenAvatarEditor,
  shellHeader = false,
  onOpenLessonText,
  onSelectLesson,
  onSwitchModule,
  onOpenRadical,
  onSuccess,
  onJourneyRestart,
  onSessionComplete,
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
      onSessionComplete?.();
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
        writingMode={writingMode}
        cardIndex={displayIndex}
        totalCards={totalCards}
        onPrev={onPrev}
        onNext={handleNext}
        onOpenLessonText={onOpenLessonText}
        onSelectLesson={onSelectLesson}
        onSwitchModule={onSwitchModule}
        onOpenRadical={onOpenRadical}
        onBack={onBack}
        onGoHome={onGoHome}
        onOpenAvatarEditor={onOpenAvatarEditor}
        shellHeader={shellHeader}
        standalone
        onSuccess={onSuccess}
      />
    </section>
  );
}
