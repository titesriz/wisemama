import { useState } from 'react';
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
  onOpenLessonTextUi,
  onOpenFlashcardsUi,
  onOpenAudioUi,
  onOpenWritingUi,
}) {
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const sortedLessons = getLessonsByOrder(lessons);
  const childProfile = profiles.find((profile) => profile.role === 'child') || profiles[0] || null;
  const parentProfile = profiles.find((profile) => profile.role === 'parent') || profiles[0] || null;
  const lessonCompletedCount = activeLesson
    ? activeLesson.cards.filter((card) => (lessonProgressMap[`${activeLesson.id}:${card.id}`] || 0) > 0).length
    : 0;
  const lessonStars = activeLesson
    ? activeLesson.cards.reduce((sum, card) => sum + Number(lessonProgressMap[`${activeLesson.id}:${card.id}`] || 0), 0)
    : 0;
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
            </div>
          </div>
          {activeLesson ? (
            <div className="current-lesson-card">
              <div className="lesson-header">
                {activeLesson.coverImage ? (
                  <img src={activeLesson.coverImage} alt={activeLesson.title} className="lesson-cover" />
                ) : (
                  <div className="lesson-cover-placeholder">
                    <span className="lesson-icon">📚</span>
                  </div>
                )}
                <div className="lesson-info">
                  <h3 className="lesson-title">{activeLesson.title}</h3>
                  {activeLesson.description ? (
                    <p className="lesson-description">{activeLesson.description}</p>
                  ) : null}
                </div>
              </div>
              <div className="lesson-stats">
                <div className="stat">
                  <span className="stat-icon">🃏</span>
                  <span className="stat-value">{activeLesson.cards.length}</span>
                  <span className="stat-label">cartes</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-value">{lessonStars}</span>
                  <span className="stat-label">etoiles</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">✓</span>
                  <span className="stat-value">
                    {lessonCompletedCount}/{activeLesson.cards.length}
                  </span>
                  <span className="stat-label">complete</span>
                </div>
              </div>
              <div className="lesson-actions">
                <button
                  type="button"
                  className="change-lesson-btn ui-pressable"
                  onClick={() => setShowLessonPicker((prev) => !prev)}
                >
                  🔄 Changer de lecon
                </button>
              </div>
              {showLessonPicker ? (
                <div className="lesson-picker-dropdown">
                  {sortedLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      className={`lesson-option ui-pressable ${lesson.id === activeLessonId ? 'active' : ''}`}
                      onClick={() => {
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
            </div>
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
      </div>
    </section>
  );
}
