import { useEffect, useMemo, useRef, useState } from 'react';
import AudioPracticePanel from './AudioPracticePanel.jsx';
import LayoutShell from './LayoutShell.jsx';
import WritingPractice from './WritingPractice.jsx';
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
  cardIndex = 0,
  onPrevCard,
  onNextCard,
  onBackHome,
  onWritingSuccess,
  onSwitchModule,
  initialStepIndex = 0,
  onStepIndexChange,
  journeyMode = false,
  journeyPosition = 0,
  journeyTotal = 0,
}) {
  const [stepIndex, setStepIndex] = useState(initialStepIndex);
  const card = lesson?.cards?.[cardIndex] || null;
  const totalCards = lesson?.cards?.length || 0;

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

  const headerLeft = (
    <button type="button" className="wm-btn wm-btn-ghost" onClick={onBackHome}>
      文
    </button>
  );

  const headerRight = (
    <div className="learning-header-avatar" aria-hidden="true">
      {profile?.name ? profile.name.slice(0, 1).toUpperCase() : 'K'}
    </div>
  );

  if (!lesson || !card) {
    return (
      <LayoutShell
        headerLeft={headerLeft}
        headerTitle="Learning Flow"
        headerSubtitle="Aucune carte disponible"
        headerRight={headerRight}
        actionRight={<button type="button" className="wm-btn wm-btn-primary" onClick={onBackHome}>Retour</button>}
      >
        <p className="empty">Aucune carte disponible pour cette lecon.</p>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell
      headerLeft={headerLeft}
      headerTitle={lesson.title}
      headerSubtitle={inJourney ? `Caractere ${displayIndex}/${displayTotal}` : `Carte ${displayIndex}/${displayTotal}`}
      headerRight={headerRight}
      actionLeft={
        <button
          type="button"
          className="wm-btn wm-btn-secondary ui-pressable"
          onClick={() => {
            if (canGoPrevStep) {
              setStepIndex((prev) => prev - 1);
              return;
            }
            onPrevCard?.();
          }}
        >
          Retour
        </button>
      }
      actionCenter={<StepHeader index={stepIndex} />}
      actionRight={
        <button
          type="button"
          className="wm-btn wm-btn-primary ui-pressable"
          onClick={() => {
            if (!isLastStep) {
              setStepIndex((prev) => prev + 1);
              return;
            }
            onNextCard?.();
          }}
          data-coach="continue"
        >
          {isLastStep ? (inJourney ? 'Caractere suivant' : 'Carte suivante') : 'Continuer'}
        </button>
      }
    >
      <div className="learning-switch-row">
        <button type="button" className="writing-mode-btn ui-pressable active" disabled>
          Parcours
        </button>
        <button type="button" className="writing-mode-btn ui-pressable" onClick={() => onSwitchModule?.('flashcards')}>
          Mot
        </button>
        <button type="button" className="writing-mode-btn ui-pressable" onClick={() => onSwitchModule?.('audio')}>
          Son
        </button>
        <button type="button" className="writing-mode-btn ui-pressable" onClick={() => onSwitchModule?.('writing')}>
          Ecriture
        </button>
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
    </LayoutShell>
  );
}
