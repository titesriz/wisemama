import FlashcardStandaloneUI from './FlashcardStandaloneUI.jsx';

export default function FlashcardOnlyPage({
  profile,
  activeLesson,
  lessons = [],
  cardIndex,
  earnedStars,
  onPrev,
  onNext,
  onBack,
  onOpenLessonText,
  onSelectLesson,
  onSwitchModule,
}) {
  const currentCard = activeLesson?.cards?.[cardIndex] || null;
  const totalCards = activeLesson?.cards?.length || 0;

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
      <FlashcardStandaloneUI
        profile={profile}
        lessonId={activeLesson.id}
        lessonTitle={activeLesson.title}
        lessons={lessons}
        card={currentCard}
        cardIndex={cardIndex}
        totalCards={totalCards}
        earnedStars={earnedStars}
        onPrev={onPrev}
        onNext={onNext}
        onOpenLessonText={onOpenLessonText}
        onSelectLesson={onSelectLesson}
        onSwitchModule={onSwitchModule}
        onBack={onBack}
      />
    </section>
  );
}
