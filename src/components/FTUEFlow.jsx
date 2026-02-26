import { useEffect, useMemo, useState } from 'react';
import AvatarEditor from './AvatarEditor.jsx';
import AvatarRenderer from './AvatarRenderer.jsx';
import { useAvatar } from '../context/AvatarContext.jsx';

function StepTitle({ title, subtitle }) {
  return (
    <div className="ftue-head">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function getDefaultKidAvatar() {
  return {
    style: 'big-smile',
    seed: 'default-kid',
  };
}

function getDefaultAdultAvatar() {
  return {
    style: 'big-smile',
    seed: 'default-adult',
  };
}

export default function FTUEFlow({
  initialName = '',
  initialChildAvatar = '🦊',
  initialCompanion = '🐼',
  onComplete,
}) {
  const { profiles, setActiveProfileId } = useAvatar();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);

  const childProfile = useMemo(
    () => profiles.find((profile) => profile.role === 'child') || profiles[0] || null,
    [profiles],
  );

  const parentProfile = useMemo(
    () => profiles.find((profile) => profile.role === 'parent') || profiles[0] || null,
    [profiles],
  );

  useEffect(() => {
    if (step === 2 && childProfile?.id) {
      setActiveProfileId(childProfile.id);
    }
    if (step === 3 && parentProfile?.id) {
      setActiveProfileId(parentProfile.id);
    }
  }, [step, childProfile?.id, parentProfile?.id, setActiveProfileId]);

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
      childAvatarConfig: childProfile?.avatar || getDefaultKidAvatar(),
      companionAvatarConfig: parentProfile?.avatar || getDefaultAdultAvatar(),
      childAvatarPlaceholder: initialChildAvatar,
      companionPlaceholder: initialCompanion,
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
                subtitle="Utilise la meme interface complete pour creer l avatar enfant."
              />
              <div className="ftue-avatar-editor-shell">
                <AvatarEditor />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="ftue-screen in">
              <StepTitle
                title="Avatar referent"
                subtitle="Utilise la meme interface complete pour creer l avatar adulte."
              />
              <div className="ftue-avatar-editor-shell">
                <AvatarEditor />
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
                  <AvatarRenderer
                    config={childProfile?.avatar || getDefaultKidAvatar()}
                    size={72}
                    className="ftue-duo-avatar-render"
                    alt="Avatar enfant FTUE"
                  />
                  <strong>{name.trim() || childProfile?.name || 'Enfant'}</strong>
                </div>
                <div className="ftue-duo-link">+</div>
                <div className="ftue-duo-item">
                  <AvatarRenderer
                    config={parentProfile?.avatar || getDefaultAdultAvatar()}
                    size={72}
                    className="ftue-duo-avatar-render"
                    alt="Avatar adulte FTUE"
                  />
                  <strong>{parentProfile?.name || 'Referent'}</strong>
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
