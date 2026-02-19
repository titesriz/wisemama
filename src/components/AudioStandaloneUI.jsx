import ModuleFrame from './ModuleFrame.jsx';
import AudioPracticePanel from './AudioPracticePanel.jsx';

export default function AudioStandaloneUI({
  profile,
  lessonTitle,
  card,
  cardIndex,
  totalCards,
  mode,
  cardKey,
  onPrev,
  onNext,
  onOpenLessonPicker,
  onSwitchModule,
  onBack,
}) {
  if (!card) {
    return <p className="empty">Aucune carte disponible pour cette lecon.</p>;
  }

  return (
    <ModuleFrame
      profile={profile}
      lessonTitle={lessonTitle}
      card={card}
      cardIndex={cardIndex}
      totalCards={totalCards}
      activeModule="audio"
      onBack={onBack}
      onOpenLessonPicker={onOpenLessonPicker}
      onPrev={onPrev}
      onNext={onNext}
      onSwitchModule={onSwitchModule}
    >
      <div className="module-audio-center wm-enter-fade">
        <AudioPracticePanel cardKey={cardKey} mode={mode} />
      </div>
    </ModuleFrame>
  );
}
