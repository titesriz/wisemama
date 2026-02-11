import AvatarRenderer from './AvatarRenderer.jsx';

export default function LandingPage({
  childAvatar,
  parentAvatar,
  onStartChild,
  onStartParent,
  showAvatarEditor,
  onToggleAvatarEditor,
  avatarEditorContent,
}) {
  return (
    <section className="landing" aria-label="Page d accueil">
      <div className="landing-shell">
        <p className="landing-kicker">WiseMama</p>
        <h1>Bienvenue dans ton atelier de chinois</h1>
        <p className="landing-subtitle">
          Choisis ton espace pour commencer. L enfant apprend, le parent prepare les lecons.
        </p>
        <div className="landing-actions">
          <button type="button" className="button secondary" onClick={onToggleAvatarEditor}>
            {showAvatarEditor ? 'Fermer editeur avatar' : 'Personnaliser avatars'}
          </button>
        </div>

        <div className="landing-choices">
          <article className="landing-card child">
            <AvatarRenderer config={childAvatar} size={78} className="landing-avatar" alt="Avatar enfant" />
            <h2>Mode Enfant</h2>
            <p>Flashcards, ecriture, audio et progression.</p>
            <button type="button" className="button" onClick={onStartChild}>
              Commencer
            </button>
          </article>

          <article className="landing-card parent">
            <AvatarRenderer config={parentAvatar} size={78} className="landing-avatar" alt="Avatar parent" />
            <h2>Mode Parent</h2>
            <p>Gestion des lecons, contenu et suivi.</p>
            <button type="button" className="button secondary" onClick={onStartParent}>
              Ouvrir l espace parent
            </button>
          </article>
        </div>

        {showAvatarEditor ? <div className="landing-avatar-editor">{avatarEditorContent}</div> : null}
      </div>
    </section>
  );
}
