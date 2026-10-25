import { useEffect, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import { isDevMode } from '../config.js';
import '../styles/landing-hub.css';

const HUB_BUTTONS = [
  { key: 'lessons', label: 'Leçons' },
  { key: 'vocabulary', label: 'Fiche' },
  { key: 'writing', label: 'Écriture' },
  { key: 'test', label: 'Évaluation' },
];

const GREETING_SEQUENCE = ['greet', 'reply', 'ask'];
const GREETING_SESSION_KEY = 'wisemama-greeting-shown';

function hasShownGreetingThisSession() {
  try {
    return sessionStorage.getItem(GREETING_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markGreetingShown() {
  try {
    sessionStorage.setItem(GREETING_SESSION_KEY, '1');
  } catch {
    // no-op
  }
}

export default function LandingPage({
  profiles,
  onStartProfile,
  onOpenAvatarEditor,
  onOpenParentSpace,
  onRefreshLessons,
  onOpenLessonEditorUi,
  onOpenLessonsHubUi,
  onOpenVocabularyHubUi,
  onOpenWritingHubUi,
  onOpenTestHubUi,
  onResumeLastLesson,
  lastActivity,
}) {
  const [refreshStatus, setRefreshStatus] = useState('');
  // 3-step dialogue: Maman greets, the child replies, Maman asks what to
  // do - each step can be tapped through immediately, but also advances on
  // its own after a short pause. The choice grid is visible from the start
  // regardless of the dialogue's progress. Played once per session only -
  // a returning visit (sessionStorage still set) opens straight on 'ask'.
  const [greetingPhase, setGreetingPhase] = useState(() => (hasShownGreetingThisSession() ? 'ask' : 'greet'));
  const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0] || null;
  const parentProfile = profiles.find((profile) => profile.role === 'parent') || profiles[0] || null;

  const advanceGreeting = () => {
    setGreetingPhase((prev) => {
      const index = GREETING_SEQUENCE.indexOf(prev);
      return GREETING_SEQUENCE[Math.min(index + 1, GREETING_SEQUENCE.length - 1)];
    });
  };

  useEffect(() => {
    if (greetingPhase === 'ask') {
      markGreetingShown();
      return undefined;
    }
    const timeout = window.setTimeout(advanceGreeting, 1400);
    return () => window.clearTimeout(timeout);
  }, [greetingPhase]);

  useEffect(() => {
    if (!refreshStatus) return undefined;
    const timeout = window.setTimeout(() => setRefreshStatus(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [refreshStatus]);

  // iOS Safari's 100dvh does not reliably match the actually-visible area
  // the moment the page paints (it can settle on the address bar's
  // expanded-height value even once the bar has shrunk), and since the
  // landing page blocks scrolling (overflow: hidden) there's no scroll
  // event left to force Safari to recompute it - the symptom is a solid
  // block of dead white space between the page's real content and the
  // browser chrome. Measure the actually-visible height in JS instead and
  // feed it in as a CSS variable the stylesheet can rely on.
  useEffect(() => {
    const setRealViewportHeight = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--landing-vh', `${height}px`);
    };
    setRealViewportHeight();
    window.addEventListener('resize', setRealViewportHeight);
    window.addEventListener('orientationchange', setRealViewportHeight);
    window.visualViewport?.addEventListener('resize', setRealViewportHeight);
    return () => {
      window.removeEventListener('resize', setRealViewportHeight);
      window.removeEventListener('orientationchange', setRealViewportHeight);
      window.visualViewport?.removeEventListener('resize', setRealViewportHeight);
    };
  }, []);

  const hubHandlers = {
    lessons: onOpenLessonsHubUi,
    vocabulary: onOpenVocabularyHubUi,
    writing: onOpenWritingHubUi,
    test: onOpenTestHubUi,
  };

  return (
    <section className="landing" aria-label="Page d accueil">
      <div className="landing-new-shell">
        <div className="logo-area">
          <button
            type="button"
            className="app-logo ui-pressable"
            aria-label="Retour landing"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            文
          </button>
          <div className="logo-copy">
            <div className="app-subtitle">Apprenons le chinois ensemble</div>
          </div>
        </div>

        <button
          type="button"
          className="profile-card-kid hero-chat-card hero-chat-card-btn ui-pressable"
          onClick={advanceGreeting}
          aria-label="Continuer la conversation"
          disabled={greetingPhase === 'ask'}
        >
          <div className="hero-chat-row hero-chat-row-parent">
            {parentProfile ? (
              <span
                role="button"
                tabIndex={0}
                className="hero-chat-avatar-btn ui-pressable"
                aria-label="Espace parent"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenParentSpace?.();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenParentSpace?.();
                  }
                }}
              >
                <AvatarRenderer
                  config={parentProfile.avatar}
                  size={72}
                  className="landing-avatar-circle hero-chat-avatar"
                  alt={`Avatar ${parentProfile.name || 'Maman'}`}
                  loading="eager"
                />
              </span>
            ) : null}
            <div className="hero-speech-bubble hero-speech-bubble-parent">
              {greetingPhase === 'ask' ? (
                <span className="hero-prompt-text">Que veux-tu faire aujourd'hui ?</span>
              ) : (
                <span className="hero-prompt-text">Bonjour {childProfile?.name || 'Eli'}</span>
              )}
            </div>
          </div>

          <div className="hero-chat-row hero-chat-row-child">
            {greetingPhase === 'reply' ? (
              <div className="hero-speech-bubble hero-speech-bubble-child">
                <span className="hero-prompt-text">Bonjour {parentProfile?.name || 'Maman'}</span>
              </div>
            ) : null}
            {greetingPhase === 'ask' ? (
              <div className="hero-speech-bubble hero-speech-bubble-child">
                <span className="hero-thinking-dots" aria-label="...">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ) : null}
            {childProfile ? (
              <span
                role="button"
                tabIndex={0}
                className="hero-chat-avatar-btn ui-pressable"
                aria-label="Modifier l'avatar de l'enfant"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenAvatarEditor?.();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenAvatarEditor?.();
                  }
                }}
              >
                <AvatarRenderer
                  config={childProfile.avatar}
                  size={72}
                  className="landing-avatar-circle hero-chat-avatar"
                  alt={`Avatar ${childProfile.name || 'Enfant'}`}
                />
              </span>
            ) : null}
          </div>
        </button>

        <div className="hub-grid-2x2 visible">
          {HUB_BUTTONS.map((button) => (
            <button
              key={button.key}
              type="button"
              className="hub-pentagon-btn ui-pressable"
              onClick={() => hubHandlers[button.key]?.()}
            >
              {button.label}
            </button>
          ))}
        </div>

        <article className="profile-card-parent">
          <button
            type="button"
            className="resume-card-btn ui-pressable"
            onClick={() => onResumeLastLesson?.()}
          >
            <span className="resume-card-icon">↻</span>
            <span className="resume-card-text">
              <span className="resume-card-label">Reprendre</span>
              {lastActivity ? (
                <span className="resume-card-detail">
                  {lastActivity.contentLabel}
                  {lastActivity.modeLabel ? ` · ${lastActivity.modeLabel}` : ''}
                </span>
              ) : null}
            </span>
          </button>
          {isDevMode ? (
            <button
              type="button"
              className="manage-button manage-button-sm"
              onClick={() => parentProfile && onStartProfile(parentProfile.id)}
              disabled={!parentProfile}
            >
              Gérer
            </button>
          ) : null}
        </article>
      </div>

      <div className="landing-footer">
        <button
          type="button"
          className="landing-refresh-link"
          onClick={() => {
            const ok = onRefreshLessons?.();
            setRefreshStatus(ok ? 'Leçons mises à jour.' : 'Mise à jour indisponible.');
          }}
        >
          Mettre à jour les leçons
        </button>
        {refreshStatus ? <span className="landing-refresh-status">{refreshStatus}</span> : null}
        {isDevMode && onOpenLessonEditorUi ? (
          <button
            type="button"
            className="landing-refresh-link"
            onClick={() => onOpenLessonEditorUi()}
          >
            Éditer une leçon
          </button>
        ) : null}
      </div>
    </section>
  );
}
