import { useRef } from 'react';
import ModuleFrame from './ModuleFrame.jsx';
import SuccessBurst from './SuccessBurst.jsx';
import { useUiSounds } from '../hooks/useUiSounds.js';

export default function FlashcardStandaloneUI({
  profile,
  lessonTitle,
  card,
  cardIndex,
  totalCards,
  earnedStars = 0,
  onPrev,
  onNext,
  onOpenLessonPicker,
  onSwitchModule,
  onBack,
}) {
  const audioRef = useRef(null);
  const sounds = useUiSounds();

  const playAudio = () => {
    sounds.playTap();
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

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
      activeModule="flashcards"
      onBack={onBack}
      onOpenLessonPicker={onOpenLessonPicker}
      onPrev={onPrev}
      onNext={onNext}
      onSwitchModule={onSwitchModule}
    >
      <div className="module-card-center wm-enter-fade">
        <div className="module-hanzi-large">{card.hanzi}</div>
        <div className="module-pinyin-large">{card.pinyinEnabled === false ? '' : card.pinyin}</div>

        <div className="module-translation-panels">
          <article>
            <strong>Francais</strong>
            <span>{card.french}</span>
          </article>
          <article>
            <strong>Anglais</strong>
            <span>{card.english}</span>
          </article>
        </div>

        <div className="module-stars wm-ok-line">
          Etoiles: {'⭐'.repeat(Math.max(earnedStars, 0)) || '0'}
          {earnedStars > 0 ? <SuccessBurst trigger={earnedStars} /> : null}
        </div>

        {Array.isArray(card.relatedVocabulary) && card.relatedVocabulary.length ? (
          <div className="module-note-line">
            <strong>Vocabulaire lie:</strong> {card.relatedVocabulary.join(', ')}
          </div>
        ) : null}

        {card.imageUrl ? (
          <div className="module-image-wrap">
            <img src={card.imageUrl} alt={card.french || card.english || card.hanzi} />
          </div>
        ) : null}

        <div className="module-primary-action-row">
          <button type="button" className="writing-sound-btn ui-pressable" onClick={playAudio}>
            Ecouter
          </button>
          {card.audioUrl ? <audio ref={audioRef} src={card.audioUrl} preload="auto" /> : null}
        </div>
      </div>
    </ModuleFrame>
  );
}
