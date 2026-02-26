import ModuleFrame from './ModuleFrame.jsx';
import AudioPracticePanel from './AudioPracticePanel.jsx';

export default function AudioStandaloneUI({
  profile,
  lessonId,
  lessonTitle,
  lessons = [],
  card,
  cardIndex,
  totalCards,
  mode,
  cardKey,
  onPrev,
  onNext,
  onOpenLessonText,
  onSelectLesson,
  onSwitchModule,
  onBack,
}) {
  if (!card) {
    return <p className="empty">Aucune carte disponible pour cette lecon.</p>;
  }

  return (
    <ModuleFrame
      profile={profile}
      lessonId={lessonId}
      lessonTitle={lessonTitle}
      lessons={lessons}
      card={card}
      cardIndex={cardIndex}
      totalCards={totalCards}
      activeModule="audio"
      onBack={onBack}
      onOpenLessonText={onOpenLessonText}
      onSelectLesson={onSelectLesson}
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
