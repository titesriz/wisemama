import AvatarRenderer from './AvatarRenderer.jsx';

export default function LandingPage({
  profiles,
  activeLesson,
  onStartProfile,
  onOpenLessonSelection,
  onOpenDailyRituel,
  onOpenLessonTextUi,
  onOpenFlashcardsUi,
  onOpenAudioUi,
  onOpenWritingUi,
  onOpenLessonEditorBeta,
  onResetOnboarding,
  showAvatarEditor,
  onToggleAvatarEditor,
  avatarEditorContent,
}) {
  const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0] || null;
  const parentProfile = profiles.find((profile) => profile.role === 'parent') || profiles[0] || null;
  const kidActions = [
    {
      id: 'lesson',
      label: 'Lecon',
      subtitle: 'Lire le texte de lecon',
      iconSrc: '/assets/kid/new.png',
      fallback: '💡',
      onClick: onOpenLessonTextUi,
    },
    {
      id: 'read',
      label: 'Lire',
      subtitle: 'Pratique lecture',
      iconSrc: '/assets/kid/read.png',
      fallback: '📖',
      onClick: onOpenFlashcardsUi,
    },
    {
      id: 'speak',
      label: 'Parler',
      subtitle: 'Pratique orale',
      iconSrc: '/assets/kid/speak.png',
      fallback: '🎤',
      onClick: onOpenAudioUi,
    },
    {
      id: 'write',
      label: 'Ecrire',
      subtitle: 'Pratique ecriture',
      iconSrc: '/assets/kid/write.png',
      fallback: '✏️',
      onClick: onOpenWritingUi,
    },
  ];

  return (
    <section className="landing" aria-label="Page d accueil">
      <div className="landing-new-shell">
        <div className="logo-area">
          <div className="app-logo">文</div>
          <div className="logo-copy">
            <div className="app-subtitle">Apprenons le chinois ensemble</div>
          </div>
        </div>

        <article className="profile-card-kid">
          <div className="kid-header">
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
            <div className="kid-header-copy">
              <h2 className="profile-greeting">
                Bonjour {childProfile?.name || 'Enfant'}
              </h2>
              <div className="landing-active-lesson">
                {activeLesson ? (
                  <>
                    <span className="landing-active-lesson-title">📚 Lecon : {activeLesson.title}</span>
                    <button
                      type="button"
                      className="button secondary button-sm"
                      onClick={onOpenLessonSelection}
                    >
                      Changer
                    </button>
                  </>
                ) : (
                  <>
                    <span className="landing-active-lesson-title">Aucune lecon disponible</span>
                    <button
                      type="button"
                      className="button secondary button-sm"
                      onClick={onOpenLessonEditorBeta}
                    >
                      Creer une lecon
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="kid-module-grid" role="group" aria-label="Modules apprentissage enfant">
            {kidActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="kid-module-btn ui-pressable"
                onClick={action.onClick}
                disabled={!childProfile}
                aria-label={action.subtitle}
                title={action.subtitle}
              >
                <span className="kid-module-icon-wrap">
                  <img
                    src={action.iconSrc}
                    alt={action.label}
                    className="kid-module-icon"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                      event.currentTarget.nextElementSibling.style.display = 'grid';
                    }}
                  />
                  <span className="kid-module-icon-fallback" aria-hidden="true">
                    {action.fallback}
                  </span>
                </span>
                <span className="kid-module-label">{action.label}</span>
              </button>
            ))}
          </div>
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
            Gérer
          </button>
        </article>

        <button type="button" className="settings-link" onClick={onToggleAvatarEditor}>
          {showAvatarEditor ? 'Fermer les parametres' : 'Parametres profils et avatars'}
        </button>
        <button type="button" className="landing-beta-link" onClick={onOpenLessonEditorBeta}>
          Ouvrir Lesson Creator Pro
        </button>
        <button type="button" className="landing-reset-link" onClick={onResetOnboarding}>
          Reset FTUE + Tutoriel
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

      </div>
    </section>
  );
}
