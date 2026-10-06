import AvatarRenderer from './AvatarRenderer.jsx';
import AvatarEditor from './AvatarEditor.jsx';
import { SCREEN } from '../lib/screens.js';
import '../styles/app-shell.css';

const FOOTER_BUTTONS = [
  { key: 'lessons', label: 'Leçons' },
  { key: 'vocab', label: 'Vocabulaire' },
  { key: 'writing', label: 'Écriture' },
  { key: 'test', label: 'Évaluation' },
];

const FOOTER_TARGETS = {
  global: {
    lessons: { screen: SCREEN.HUB_LESSONS },
    vocab: { screen: SCREEN.HUB_VOCAB },
    writing: { screen: SCREEN.HUB_WRITING },
    test: { screen: SCREEN.HUB_TEST },
  },
  lesson: {
    lessons: { screen: SCREEN.LESSON_TEXT },
    vocab: { screen: SCREEN.LESSON_VOCAB },
    writing: { screen: SCREEN.LESSON_WRITING_SETUP },
    test: { screen: SCREEN.LESSON_QUIZ },
  },
};

export function AvatarEditorModal({ onClose }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Editeur avatar" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <strong>Editeur Avatar</strong>
          <button type="button" className="button secondary button-sm" onClick={onClose}>
            Fermer
          </button>
        </div>
        <AvatarEditor />
      </div>
    </div>
  );
}

export default function AppShell({
  crumbs = [],
  scope = { type: 'global' },
  activeHub = '',
  onNavigate,
  onGoHome,
  profile,
  onOpenAvatarEditor,
  avatarOpen = false,
  onCloseAvatarEditor,
  children,
}) {
  const footerTargets = FOOTER_TARGETS[scope.type === 'lesson' ? 'lesson' : 'global'];
  const lessonId = scope.type === 'lesson' ? scope.lessonId : '';
  const hasHiddenCrumbs = crumbs.length > 2;

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <button type="button" className="app-shell-logo ui-pressable" onClick={() => onGoHome?.()} aria-label="Retour à l'accueil">
          文
        </button>

        <nav className="app-shell-crumbs" aria-label="Fil d'Ariane">
          {hasHiddenCrumbs ? <span className="app-shell-crumb-ellipsis" aria-hidden="true">…</span> : null}
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            const isHiddenOnNarrow = hasHiddenCrumbs && index < crumbs.length - 2;
            const className = `app-shell-crumb ${isLast ? 'is-current' : ''} ${isHiddenOnNarrow ? 'is-hidden-narrow' : ''}`;
            return (
              <span key={`${crumb.label}-${index}`} className={className}>
                {index > 0 ? <span className="app-shell-sep" aria-hidden="true">›</span> : null}
                {isLast || !crumb.onClick ? (
                  <span aria-current={isLast ? 'page' : undefined}>{crumb.label}</span>
                ) : (
                  <button type="button" className="app-shell-crumb-link ui-pressable" onClick={crumb.onClick}>
                    {crumb.label}
                  </button>
                )}
              </span>
            );
          })}
        </nav>

        <button
          type="button"
          className="app-shell-avatar ui-pressable"
          onClick={() => onOpenAvatarEditor?.()}
          aria-label="Modifier l'avatar de l'enfant"
        >
          <AvatarRenderer config={profile?.avatar} size={40} alt={`Avatar ${profile?.name || 'Enfant'}`} loading="eager" />
        </button>
      </header>

      <main className="app-shell-main">{children}</main>

      <nav className="app-shell-footer" aria-label="Navigation principale">
        {FOOTER_BUTTONS.map((button) => {
          const isActive = activeHub === button.key;
          return (
            <button
              key={button.key}
              type="button"
              className={`app-shell-footer-btn app-shell-footer-${button.key} ui-pressable ${isActive ? 'is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                const target = footerTargets[button.key];
                if (target) onNavigate?.(target.screen, lessonId);
              }}
            >
              {button.label}
            </button>
          );
        })}
      </nav>

      {avatarOpen ? <AvatarEditorModal onClose={() => onCloseAvatarEditor?.()} /> : null}
    </div>
  );
}
