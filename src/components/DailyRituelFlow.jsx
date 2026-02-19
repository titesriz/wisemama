import { useMemo, useState } from 'react';
import LayoutShell from './LayoutShell.jsx';
import TokenButton from './ui/TokenButton.jsx';
import TokenCard from './ui/TokenCard.jsx';
import '../styles/rituel-flow.css';

const companions = [
  {
    id: 'parent',
    label: 'Parent',
    subtitle: 'On apprend ensemble',
    avatar: '🧑',
  },
  {
    id: 'other',
    label: 'Autre',
    subtitle: 'Avec un referent',
    avatar: '🧑‍🏫',
  },
  {
    id: 'alone',
    label: 'Seul',
    subtitle: 'Je continue en autonomie',
    avatar: '🌟',
  },
];

function StepProgress({ step, total }) {
  return (
    <div className="rituel-progress" aria-label={`Etape ${step + 1} sur ${total}`}>
      <span>
        Etape {step + 1}/{total}
      </span>
      <div className="rituel-progress-dots">
        {Array.from({ length: total }).map((_, index) => (
          <i key={index} className={index <= step ? 'active' : ''} />
        ))}
      </div>
    </div>
  );
}

export default function DailyRituelFlow({
  childName = 'Eli',
  childAvatar = '🦊',
  parentAvatar = '🧑',
  onBackHome,
  onStartLesson,
}) {
  const [step, setStep] = useState(0);
  const [selectedCompanion, setSelectedCompanion] = useState(null);

  const totalSteps = 4;
  const canContinue = step !== 1 || Boolean(selectedCompanion);

  const selectedCompanionData = useMemo(
    () => companions.find((item) => item.id === selectedCompanion) || companions[0],
    [selectedCompanion],
  );

  const next = () => {
    if (!canContinue) return;
    if (step >= totalSteps - 1) {
      onStartLesson?.({
        childName,
        childAvatar,
        companion: selectedCompanionData?.id || 'parent',
      });
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prev = () => setStep((prev) => Math.max(0, prev - 1));

  const headerLeft = (
    <TokenButton variant="ghost" onClick={onBackHome} aria-label="Retour accueil">
      文
    </TokenButton>
  );

  const headerRight = (
    <div className="rituel-header-avatar" aria-hidden="true">
      {childAvatar}
    </div>
  );

  const actionRightLabel = step >= totalSteps - 1 ? 'Commencer la lecon' : 'Continuer';

  return (
    <LayoutShell
      headerLeft={headerLeft}
      headerTitle="Rituel du jour"
      headerSubtitle={`Bonjour ${childName}`}
      headerRight={headerRight}
      actionLeft={
        <TokenButton variant="secondary" onClick={prev} disabled={step === 0}>
          Retour
        </TokenButton>
      }
      actionCenter={<StepProgress step={step} total={totalSteps} />}
      actionRight={
        <TokenButton variant="primary" onClick={next} disabled={!canContinue}>
          {actionRightLabel}
        </TokenButton>
      }
    >
      <section className="rituel-flow">
        {step === 0 ? (
          <TokenCard kind="kid" className="rituel-screen">
            <h2>Bonjour {childName} !</h2>
            <p>On commence ton rituel chinois en douceur.</p>
            <div className="rituel-hero-avatar glow">{childAvatar}</div>
            <p className="rituel-feedback">Pret ? Appuie sur Continuer.</p>
          </TokenCard>
        ) : null}

        {step === 1 ? (
          <TokenCard kind="neutral" className="rituel-screen">
            <h2>Avec qui apprends-tu ?</h2>
            <p>Choisis une option pour le rituel d aujourd hui.</p>
            <div className="rituel-choice-grid">
              {companions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`rituel-choice ${selectedCompanion === option.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCompanion(option.id)}
                >
                  <span className="rituel-choice-avatar">
                    {option.id === 'parent' ? parentAvatar : option.avatar}
                  </span>
                  <strong>{option.label}</strong>
                  <small>{option.subtitle}</small>
                </button>
              ))}
            </div>
            <p className="rituel-feedback">
              {selectedCompanion ? 'Super choix ! On continue.' : 'Selectionne une option pour continuer.'}
            </p>
          </TokenCard>
        ) : null}

        {step === 2 ? (
          <TokenCard kind="parent" className="rituel-screen">
            <h2>Duo confirme</h2>
            <p>Votre equipe du jour est prete.</p>
            <div className="rituel-duo-wrap">
              <div className="rituel-duo-avatar">{childAvatar}</div>
              <span className="rituel-duo-plus">+</span>
              <div className="rituel-duo-avatar">
                {selectedCompanion === 'parent' ? parentAvatar : selectedCompanionData.avatar}
              </div>
            </div>
            <div className="rituel-stars" aria-hidden="true">
              <span>⭐</span>
              <span>✨</span>
              <span>⭐</span>
            </div>
            <p className="rituel-feedback">Excellent ! Passe a l etape suivante.</p>
          </TokenCard>
        ) : null}

        {step === 3 ? (
          <TokenCard kind="kid" className="rituel-screen">
            <h2>Lecon du jour</h2>
            <p>Ecoute, parle, ecris... puis continue.</p>
            <div className="rituel-hero-avatar confetti">{childAvatar}</div>
            <p className="rituel-feedback">Appuie sur Commencer la lecon.</p>
          </TokenCard>
        ) : null}
      </section>
    </LayoutShell>
  );
}

