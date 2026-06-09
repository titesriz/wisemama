import { useMemo, useState } from 'react';

function StepTitle({ title, subtitle }) {
  return (
    <div className="ftue-head">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

export default function FTUEFlow({ initialName = '', onComplete }) {
  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState(initialName);
  const [parentName, setParentName] = useState('Maman');

  const canContinue = useMemo(() => {
    if (step === 0) return childName.trim().length > 0;
    return true;
  }, [step, childName]);

  const next = () => {
    if (!canContinue) return;
    if (step === 1) {
      onComplete?.({ childName: childName.trim(), parentName: parentName.trim() || 'Maman' });
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prev = () => setStep((prev) => Math.max(prev - 1, 0));

  return (
    <section className="ftue-shell" aria-label="Onboarding WiseMama">
      <div className="ftue-card">
        <div className="ftue-progress">
          <span>Etape {step + 1}/2</span>
        </div>

        <div className="ftue-stage">
          {step === 0 ? (
            <div className="ftue-screen in">
              <StepTitle
                title="Bonjour !"
                subtitle="Quel est ton prenom ?"
              />
              <div className="ftue-hero">文</div>
              <input
                className="ftue-input"
                value={childName}
                onChange={(event) => setChildName(event.target.value.slice(0, 24))}
                placeholder="Ton prenom"
                autoFocus
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="ftue-screen in">
              <StepTitle
                title="Et ton accompagnant ?"
                subtitle="Le prénom de la personne qui t'aide (laisse tel quel si c'est Maman)."
              />
              <input
                className="ftue-input"
                value={parentName}
                onChange={(event) => setParentName(event.target.value.slice(0, 24))}
                placeholder="Maman"
                autoFocus
              />
            </div>
          ) : null}
        </div>

        <div className="ftue-actions">
          <button
            type="button"
            className="wm-btn wm-btn-secondary"
            onClick={prev}
            disabled={step === 0}
          >
            Retour
          </button>
          <button
            type="button"
            className="wm-btn wm-btn-primary"
            onClick={next}
            disabled={!canContinue}
          >
            {step === 1 ? "C'est parti !" : 'Continuer'}
          </button>
        </div>
      </div>
    </section>
  );
}
