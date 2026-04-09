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
}) {
  const effectiveIndex = journeyMode && journeyQueue.length
    ? journeyQueue[journeyPosition] ?? journeyQueue[0] ?? 0
    : cardIndex;
  const currentCard = activeLesson?.cards?.[effectiveIndex] || null;
  const totalCards = journeyMode && journeyQueue.length ? journeyQueue.length : activeLesson?.cards?.length || 0;
  const displayIndex = journeyMode && journeyQueue.length ? journeyPosition : cardIndex;

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
        cardIndex={displayIndex}
        totalCards={totalCards}
        onPrev={onPrev}
        onNext={onNext}
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
