import { useEffect, useRef, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import { getLessonsByOrder } from '../utils/lessons/lessonOrder.js';

export default function LandingPage({
  profiles,
  lessons = [],
  activeLessonId = '',
  activeLesson,
  lessonProgressMap = {},
  onStartProfile,
  onSelectLesson,
  onOpenDailyRituel,
  onOpenAvatarEditor,
  onRefreshLessons,
  onOpenLessonTextUi,
  onOpenFlashcardsUi,
  onOpenAudioUi,
  onOpenWritingUi,
}) {
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState('');
  const lessonPickerRef = useRef(null);
  const sortedLessons = getLessonsByOrder(lessons);
  const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0] || null;
  const parentProfile = profiles.find((profile) => profile.role === 'parent') || profiles[0] || null;
  useEffect(() => {
    if (!showLessonPicker) return undefined;

    const handlePointerDown = (event) => {
      if (!lessonPickerRef.current?.contains(event.target)) {
        setShowLessonPicker(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [showLessonPicker]);

  useEffect(() => {
    if (!refreshStatus) return undefined;
    const timeout = window.setTimeout(() => setRefreshStatus(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [refreshStatus]);

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

        <article ref={lessonPickerRef} className="profile-card-kid">
          {activeLesson ? (
            <>
              <h3 className="child-greeting">Bonjour {childProfile?.name || 'Eli'}</h3>
              <div className="child-avatar">
                {childProfile ? (
                  <AvatarRenderer
                    config={childProfile.avatar}
                    size={92}
                    className="landing-avatar-circle"
                    alt={`Avatar ${childProfile.name || 'Enfant'}`}
                    loading="eager"
                  />
                ) : null}
              </div>
              <div
                className="current-lesson-card child-lesson-card ui-pressable"
                onClick={onOpenLessonTextUi}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenLessonTextUi?.();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Ouvrir la lecon"
              >
                <div className="lesson-header child-lesson-header child-lesson-header-fixed">
                  <div className="child-lesson-main">
                    <div className="lesson-info child-lesson-info">
                      <h3 className="lesson-title child-lesson-title">{activeLesson.title}</h3>
                      {activeLesson.description ? (
                        <p className="lesson-description child-lesson-description">{activeLesson.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="lesson-actions child-lesson-actions">
                    <button
                      type="button"
                      className="change-lesson-btn icon-only ui-pressable"
                      onClick={(event) => {
                        event.stopPropagation();
                        setShowLessonPicker((prev) => !prev);
                      }}
                      aria-label="Changer de lecon"
                    >
                      🗂️
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="landing-active-lesson">
              <span className="landing-active-lesson-title">Aucune lecon disponible</span>
              <button
                type="button"
                className="button secondary button-sm"
                onClick={() => parentProfile && onStartProfile(parentProfile.id)}
              >
                Gerer pour creer une lecon
              </button>
            </div>
          )}
          {activeLesson && showLessonPicker ? (
            <div
              className="lesson-picker-dropdown"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {sortedLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  className={`lesson-option ui-pressable ${lesson.id === activeLessonId ? 'active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectLesson?.(lesson.id);
                    setShowLessonPicker(false);
                  }}
                >
                  <div className="option-preview">{lesson.coverImage ? <img src={lesson.coverImage} alt="" /> : <span>📘</span>}</div>
                  <div className="option-info">
                    <strong>{lesson.order ? `${lesson.order}. ` : ''}{lesson.title}</strong>
                    <span className="option-meta">{lesson.cards.length} cartes</span>
                  </div>
                  {lesson.id === activeLessonId ? <span className="checkmark">✓</span> : null}
                </button>
              ))}
            </div>
          ) : null}
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
          <div className="parent-tools-row">
            <button
              type="button"
              className="manage-button manage-button-secondary"
              onClick={() => {
                const ok = onRefreshLessons?.();
                setRefreshStatus(ok ? 'Leçons mises à jour.' : 'Mise à jour indisponible.');
              }}
            >
              Mettre à jour
            </button>
          </div>
          {refreshStatus ? <p className="parent-refresh-status">{refreshStatus}</p> : null}
        </article>
      </div>
    </section>
  );
}
