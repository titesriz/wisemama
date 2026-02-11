import { useAvatar } from '../context/AvatarContext.jsx';
import AvatarRenderer from './AvatarRenderer.jsx';

export default function ModeAvatar({ onClick }) {
  const { activeProfile } = useAvatar();

  if (!activeProfile) return null;

  const label = activeProfile.role === 'parent' ? 'Parent' : 'Enfant';

  return (
    <button
      type="button"
      className={`mode-avatar ${activeProfile.role}`}
      aria-label={`Profil actif ${label}. Ouvrir editeur avatar`}
      onClick={onClick}
    >
      <AvatarRenderer
        config={activeProfile.avatar}
        size={38}
        alt="Avatar profil actif"
        className="mode-avatar-img"
        loading="eager"
      />
      <span className="avatar-text">{activeProfile.name || label}</span>
      <span className="avatar-hint">{label}</span>
    </button>
  );
}
