import AudioStandaloneUI from './AudioStandaloneUI.jsx';

export default function AudioOnlyPage({
  profile,
  mode,
  activeLesson,
  lessons = [],
  cardIndex,
  cardKey,
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
      <AudioStandaloneUI
        profile={profile}
        lessonId={activeLesson.id}
        lessonTitle={activeLesson.title}
        lessons={lessons}
        card={currentCard}
        cardIndex={cardIndex}
        totalCards={totalCards}
        mode={mode}
        cardKey={cardKey}
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
