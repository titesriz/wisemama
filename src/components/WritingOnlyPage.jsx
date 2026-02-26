import WritingPractice from './WritingPractice.jsx';

export default function WritingOnlyPage({
  profile,
  activeLesson,
  cardIndex,
  onPrev,
  onNext,
  onBack,
  onOpenLessonText,
  onSwitchModule,
  onSuccess,
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
      <WritingPractice
        hanzi={currentCard.hanzi}
        card={currentCard}
        lessonTitle={activeLesson.title}
        profile={profile}
        cardIndex={cardIndex}
        totalCards={totalCards}
        onPrev={onPrev}
        onNext={onNext}
        onOpenLessonText={onOpenLessonText}
        onSwitchModule={onSwitchModule}
        onBack={onBack}
        standalone
        onSuccess={onSuccess}
      />
    </section>
  );
}
