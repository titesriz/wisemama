import { useEffect, useMemo, useRef, useState } from 'react';
import AudioPracticePanel from './AudioPracticePanel.jsx';
import AvatarRenderer from './AvatarRenderer.jsx';
import WritingPractice from './WritingPractice.jsx';
import { useUiSounds } from '../hooks/useUiSounds.js';
import '../styles/unified-learning-flow.css';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';

const STEP_ORDER = ['see', 'listen', 'speak', 'write'];

function getCardKey(lessonId, cardId) {
  return `${lessonId}:${cardId}`;
}

function StepHeader({ index }) {
  const labels = ['Voir', 'Ecouter', 'Dire', 'Ecrire'];
  return (
    <div className="learning-step-header">
      {labels.map((label, itemIndex) => (
        <div key={label} className={`learning-step-dot ${itemIndex <= index ? 'active' : ''}`}>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function SeeStep({ card }) {
  return (
    <section className="learning-step-card">
      <h3>Voir</h3>
      <div className="learning-hanzi">{card.hanzi}</div>
      <p className="learning-pinyin">{card.pinyinEnabled === false ? '' : formatPinyinDisplay(card.pinyin || '')}</p>
      <div className="learning-translation-grid">
        <article>
          <strong>Francais</strong>
          <span>{card.french}</span>
        </article>
        <article>
          <strong>Anglais</strong>
          <span>{card.english}</span>
        </article>
      </div>
      {card.imageUrl ? (
        <div className="learning-image">
          <img src={card.imageUrl} alt={card.french || card.english || card.hanzi} />
        </div>
      ) : null}
      {Array.isArray(card.relatedVocabulary) && card.relatedVocabulary.length ? (
        <p className="learning-feedback">Vocabulaire lie: {card.relatedVocabulary.join(', ')}</p>
      ) : null}
      <p className="learning-feedback">Observe calmement le mot avant de passer a l etape suivante.</p>
    </section>
  );
}

function ListenStep({ card }) {
  const audioRef = useRef(null);
  const [played, setPlayed] = useState(false);

  const play = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setPlayed(true);
  };

  return (
    <section className="learning-step-card">
      <h3>Ecouter</h3>
      <p className="learning-feedback">Ecoute le modele une ou deux fois, puis passe a Dire.</p>
      <div className="learning-listen-row">
        <button type="button" className="wm-btn wm-btn-primary" onClick={play}>
          Ecouter
        </button>
        {card.audioUrl ? <audio ref={audioRef} src={card.audioUrl} preload="auto" /> : null}
      </div>
      <p className={`learning-feedback ${played ? 'success' : ''}`}>
        {played ? 'Bien joue ! Tu peux maintenant dire le mot.' : 'Pret a ecouter ?'}
      </p>
    </section>
  );
}

function SpeakStep({ cardKey }) {
  return (
    <section className="learning-step-card">
      <h3>Dire</h3>
      <AudioPracticePanel cardKey={cardKey} mode="child" />
    </section>
  );
}

function WriteStep({
  card,
  profile,
  lessonTitle,
  cardIndex,
  totalCards,
  onWritingSuccess,
}) {
  return (
    <section className="learning-step-card">
      <h3>Ecrire</h3>
      <WritingPractice
        hanzi={card.hanzi}
        card={card}
        lessonTitle={lessonTitle}
        profile={profile}
        cardIndex={cardIndex}
        totalCards={totalCards}
        onPrev={() => {}}
        onNext={() => {}}
        onOpenLessonPicker={() => {}}
        onSwitchModule={() => {}}
        standalone
        embedded
        onSuccess={onWritingSuccess}
      />
    </section>
  );
}

export default function UnifiedLearningFlow({
  profile,
  lesson,
  lessons = [],
  cardIndex = 0,
  onPrevCard,
  onNextCard,
  onBackHome,
  onOpenLessonText,
  onSelectLesson,
  onWritingSuccess,
  onSwitchModule,
  initialStepIndex = 0,
  onStepIndexChange,
  journeyMode = false,
  journeyPosition = 0,
  journeyTotal = 0,
}) {
  const sounds = useUiSounds();
  const [stepIndex, setStepIndex] = useState(initialStepIndex);
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const card = lesson?.cards?.[cardIndex] || null;
  const totalCards = lesson?.cards?.length || 0;
  const audioRef = useRef(null);
  const availableLessons = lessons.length ? lessons : (lesson ? [lesson] : []);

  useEffect(() => {
    setStepIndex(0);
  }, [cardIndex]);

  useEffect(() => {
    setStepIndex(initialStepIndex);
  }, [initialStepIndex]);

  useEffect(() => {
    onStepIndexChange?.(stepIndex);
  }, [onStepIndexChange, stepIndex]);

  const stepId = STEP_ORDER[stepIndex];
  const cardKey = card ? getCardKey(lesson.id, card.id) : '';

  const canGoPrevStep = stepIndex > 0;
  const isLastStep = stepIndex === STEP_ORDER.length - 1;
  const inJourney = journeyMode && journeyTotal > 0;
  const displayIndex = inJourney ? journeyPosition + 1 : cardIndex + 1;
  const displayTotal = inJourney ? journeyTotal : totalCards;

  if (!lesson || !card) {
    return <p className="empty">Aucune carte disponible pour cette lecon.</p>;
  }

  const handlePrev = () => {
    sounds.playTap();
    if (canGoPrevStep) {
      setStepIndex((prev) => prev - 1);
      return;
    }
    if (inJourney && journeyPosition <= 0) {
      onBackHome?.();
      return;
    }
    onPrevCard?.();
  };

  const handleNext = () => {
    sounds.playTap();
    if (!isLastStep) {
      setStepIndex((prev) => prev + 1);
      return;
    }
    onNextCard?.();
  };

  const playCardAudio = () => {
    sounds.playTap();
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const openLessonFromPicker = (lessonId) => {
    if (!lessonId) return;
    sounds.playTap();
    setShowLessonPicker(false);
    onSelectLesson?.(lessonId);
  };

  return (
    <section className="writing-screen module-screen" aria-label="Parcours complet">
      <div className="writing-top-banner">
        <button type="button" className="writing-logo ui-pressable" onClick={onBackHome}>
          文
        </button>
        <div className="writing-profile-section">
          <div className="writing-avatar-tile">
            <AvatarRenderer config={profile?.avatar} size={52} alt="Avatar profil" loading="eager" />
          </div>
          <div className="writing-profile-name">
            <strong>{profile?.name || 'Profil'}</strong>
            <span>{profile?.role === 'parent' ? 'Parent' : 'Kid'}</span>
          </div>
        </div>
        <button
          type="button"
          className="writing-lesson-selector ui-pressable"
          onClick={() => setShowLessonPicker((prev) => !prev)}
        >
          {lesson.title}
        </button>
        <button
          type="button"
          className="writing-read-lesson-btn ui-pressable"
          onClick={() => {
            sounds.playTap();
            onOpenLessonText?.(lesson.id);
          }}
          disabled={!onOpenLessonText}
        >
          Lire la lecon
        </button>
      </div>

      {showLessonPicker ? (
        <div className="writing-lesson-picker">
          {availableLessons.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`writing-lesson-picker-item ui-pressable ${item.id === lesson.id ? 'active' : ''}`}
              onClick={() => openLessonFromPicker(item.id)}
            >
              <strong>{item.title || 'Lecon'}</strong>
              <span>{item.cards?.length || 0} cartes</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="writing-card-info">
        <div className="writing-pinyin">{card.pinyinEnabled === false ? '' : formatPinyinDisplay(card.pinyin || '')}</div>
        <div className="writing-char-small">{Array.from(card.hanzi || '')[0] || ''}</div>
        <div className="writing-translation">
          <span>{card.french || ''}</span>
          <small>{card.english || ''}</small>
        </div>
        <button type="button" className="writing-sound-btn ui-pressable" onClick={playCardAudio} disabled={!card.audioUrl}>
          Son
        </button>
        {card.audioUrl ? <audio ref={audioRef} src={card.audioUrl} preload="auto" /> : null}
      </div>

      <div className="module-content-area">
        <div className="learning-switch-row">
          <StepHeader index={stepIndex} />
        </div>
        <div className="learning-flow-content" key={`${card.id}-${stepId}`}>
          {stepId === 'see' ? <SeeStep card={card} /> : null}
          {stepId === 'listen' ? <ListenStep card={card} /> : null}
          {stepId === 'speak' ? <SpeakStep cardKey={cardKey} /> : null}
          {stepId === 'write' ? (
            <WriteStep
              card={card}
              profile={profile}
              lessonTitle={lesson.title}
              cardIndex={cardIndex}
              totalCards={totalCards}
              onWritingSuccess={onWritingSuccess}
            />
          ) : null}
        </div>
      </div>

      <div className="writing-bottom-nav">
        <button type="button" className="writing-nav-btn ui-pressable" onClick={handlePrev}>
          ◄ Prec
        </button>
        <div className="writing-counter">
          {displayIndex}/{displayTotal}
        </div>
        <button type="button" className="writing-nav-btn ui-pressable" onClick={handleNext}>
          Suiv ►
        </button>
      </div>

      <div className="writing-mode-selector">
        <button type="button" className="writing-mode-btn ui-pressable active" disabled>
          Lire
        </button>
        <button type="button" className="writing-mode-btn ui-pressable" onClick={() => onSwitchModule?.('audio')}>
          Parler
        </button>
        <button type="button" className="writing-mode-btn ui-pressable" onClick={() => onSwitchModule?.('writing')}>
          Ecrire
        </button>
      </div>
    </section>
  );
}
