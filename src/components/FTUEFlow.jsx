import { useMemo, useState } from 'react';

const childChoices = ['🦊', '🐯', '🐰', '🐨', '🐶', '🐱'];
const companionChoices = ['🐼', '🦉', '🐸', '🐻', '🦄', '🐧'];

function StepTitle({ title, subtitle }) {
  return (
    <div className="ftue-head">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

export default function FTUEFlow({
  initialName = '',
  initialChildAvatar = childChoices[0],
  initialCompanion = companionChoices[0],
  onComplete,
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [childAvatar, setChildAvatar] = useState(initialChildAvatar);
  const [companion, setCompanion] = useState(initialCompanion);

  const canContinue = useMemo(() => {
    if (step === 1) return name.trim().length > 0;
    return true;
  }, [name, step]);

  const next = () => {
    if (!canContinue) return;
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const prev = () => setStep((prev) => Math.max(prev - 1, 0));

  const finish = () => {
    onComplete?.({
      childName: name.trim(),
      childAvatarPlaceholder: childAvatar,
      companionPlaceholder: companion,
    });
  };

  return (
    <section className="ftue-shell" aria-label="Onboarding WiseMama">
      <div className="ftue-card">
        <div className="ftue-progress">
          <span>Etape {step + 1}/5</span>
        </div>

        <div className="ftue-stage">
          {step === 0 ? (
            <div className="ftue-screen in">
              <StepTitle
                title="Bonjour !"
                subtitle="Bienvenue dans WiseMama. On prepare ton duo d apprentissage."
              />
              <div className="ftue-hero">文</div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="ftue-screen in">
              <StepTitle
                title="Ton prenom"
                subtitle="Ecris ton prenom pour personnaliser ton parcours."
              />
              <input
                className="ftue-input"
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 24))}
                placeholder="Ex: Eli"
                autoFocus
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="ftue-screen in">
              <StepTitle
                title="Avatar enfant"
                subtitle="Choisis ton avatar. C est toi."
              />
              <div className="ftue-choice-grid">
                {childChoices.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`ftue-choice ${childAvatar === item ? 'active' : ''}`}
                    onClick={() => setChildAvatar(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="ftue-screen in">
              <StepTitle
                title="Avatar referent"
                subtitle="Choisis ton compagnon de progression."
              />
              <div className="ftue-choice-grid">
                {companionChoices.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`ftue-choice ${companion === item ? 'active' : ''}`}
                    onClick={() => setCompanion(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="ftue-screen in">
              <StepTitle
                title="Duo pret !"
                subtitle="Super. Ton espace est configure. On commence ?"
              />
              <div className="ftue-duo">
                <div className="ftue-duo-item">
                  <span className="ftue-duo-avatar">{childAvatar}</span>
                  <strong>{name.trim() || 'Enfant'}</strong>
                </div>
                <div className="ftue-duo-link">+</div>
                <div className="ftue-duo-item">
                  <span className="ftue-duo-avatar">{companion}</span>
                  <strong>Referent</strong>
                </div>
              </div>
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

          {step < 4 ? (
            <button
              type="button"
              className="wm-btn wm-btn-primary"
              onClick={next}
              disabled={!canContinue}
            >
              Continuer
            </button>
          ) : (
            <button type="button" className="wm-btn wm-btn-primary" onClick={finish}>
              C est moi
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

