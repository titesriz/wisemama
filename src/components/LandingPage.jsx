import AvatarRenderer from './AvatarRenderer.jsx';

export default function LandingPage({
  profiles,
  onStartProfile,
  onOpenDailyRituel,
  onOpenUnifiedFlow,
  onOpenWritingUi,
  showAvatarEditor,
  onToggleAvatarEditor,
  avatarEditorContent,
}) {
  const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0] || null;
  const parentProfile = profiles.find((profile) => profile.role === 'parent') || profiles[0] || null;

  return (
    <section className="landing" aria-label="Page d accueil">
      <div className="landing-new-shell">
        <div className="logo-area">
          <div className="app-logo">文</div>
          <div className="app-title">WiseMama</div>
          <div className="app-subtitle">Apprendre le chinois en s amusant</div>
        </div>

        <article className="profile-card-kid">
          <h2 className="profile-greeting">
            Bonjour {childProfile?.name || 'Enfant'}
          </h2>
          <div className="profile-avatar-large">
            {childProfile ? (
              <AvatarRenderer
                config={childProfile.avatar}
                size={88}
                className="landing-avatar-circle"
                alt={`Avatar ${childProfile.name || 'Enfant'}`}
                loading="eager"
              />
            ) : null}
          </div>
          <div className="profile-stats">
            <span>Role: Kid</span>
            <span>Mode: Apprentissage</span>
          </div>
          <button
            type="button"
            className="start-button"
            onClick={() => childProfile && onStartProfile(childProfile.id)}
            disabled={!childProfile}
          >
            Commencer
          </button>
        </article>

        <article className="profile-card-parent">
          <h3 className="parent-title">Espace Parent</h3>
          <div className="parent-avatar">
            {parentProfile ? (
              <AvatarRenderer
                config={parentProfile.avatar}
                size={56}
                className="landing-avatar-circle"
                alt={`Avatar ${parentProfile.name || 'Parent'}`}
              />
            ) : null}
          </div>
          <button
            type="button"
            className="manage-button"
            onClick={() => parentProfile && onStartProfile(parentProfile.id)}
            disabled={!parentProfile}
          >
            Gerer les lecons
          </button>
        </article>

        <button type="button" className="settings-link" onClick={onToggleAvatarEditor}>
          {showAvatarEditor ? 'Fermer les parametres' : 'Parametres profils et avatars'}
        </button>

        {showAvatarEditor ? (
          <div className="landing-avatar-editor-overlay">
            <div className="landing-avatar-editor-head">
              <strong>Profils et Avatars</strong>
              <div className="landing-avatar-editor-actions">
                <button type="button" className="button secondary button-sm" onClick={onOpenWritingUi}>
                  Ouvrir UI ecriture
                </button>
                <button type="button" className="button secondary button-sm" onClick={onToggleAvatarEditor}>
                  Fermer
                </button>
              </div>
            </div>
            <div className="landing-avatar-editor">{avatarEditorContent}</div>
          </div>
        ) : null}

        {!showAvatarEditor ? (
          <div className="landing-shortcuts">
            <button type="button" className="landing-writing-shortcut button secondary button-sm" onClick={onOpenWritingUi}>
              Ouvrir UI ecriture
            </button>
            <button type="button" className="landing-writing-shortcut button secondary button-sm" onClick={onOpenDailyRituel}>
              Rituel quotidien (optionnel)
            </button>
            <button type="button" className="landing-writing-shortcut button secondary button-sm" onClick={onOpenUnifiedFlow}>
              Parcours complet (voir-ecouter-dire-ecrire)
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
