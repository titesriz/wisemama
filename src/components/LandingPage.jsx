import AvatarRenderer from './AvatarRenderer.jsx';

export default function LandingPage({
  profiles,
  onStartProfile,
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
          Choisis un profil. Le role du profil decide l acces: enfant ou parent.
        </p>
        <div className="landing-actions">
          <button type="button" className="button secondary" onClick={onToggleAvatarEditor}>
            {showAvatarEditor ? 'Fermer editeur avatar' : 'Gerer profils et avatars'}
          </button>
        </div>

        <div className="landing-choices">
          {profiles.map((profile) => (
            <article key={profile.id} className={`landing-card ${profile.role === 'parent' ? 'parent' : 'child'}`}>
              <AvatarRenderer
                config={profile.avatar}
                size={78}
                className="landing-avatar"
                alt={`Avatar ${profile.name}`}
              />
              <h2>{profile.name || (profile.role === 'parent' ? 'Parent' : 'Enfant')}</h2>
              <p>{profile.role === 'parent' ? 'Acces Parent' : 'Acces Enfant'}</p>
              <button type="button" className="button" onClick={() => onStartProfile(profile.id)}>
                Entrer avec ce profil
              </button>
            </article>
          ))}
        </div>

        {showAvatarEditor ? <div className="landing-avatar-editor">{avatarEditorContent}</div> : null}
      </div>
    </section>
  );
}
