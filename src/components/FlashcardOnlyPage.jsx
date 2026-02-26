import FlashcardStandaloneUI from './FlashcardStandaloneUI.jsx';

export default function FlashcardOnlyPage({
  profile,
  activeLesson,
  cardIndex,
  earnedStars,
  onPrev,
  onNext,
  onBack,
  onOpenLessonText,
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
        lessonTitle={activeLesson.title}
        card={currentCard}
        cardIndex={cardIndex}
        totalCards={totalCards}
        earnedStars={earnedStars}
        onPrev={onPrev}
        onNext={onNext}
        onOpenLessonText={onOpenLessonText}
        onSwitchModule={onSwitchModule}
        onBack={onBack}
      />
    </section>
  );
}
