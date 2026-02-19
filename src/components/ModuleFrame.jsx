import { useMemo, useRef } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import { useUiSounds } from '../hooks/useUiSounds.js';

export default function ModuleFrame({
  profile,
  lessonTitle,
  card,
  cardIndex = 0,
  totalCards = 0,
  activeModule = 'flashcards',
  onBack,
  onOpenLessonPicker,
  onPrev,
  onNext,
  onSwitchModule,
  children,
}) {
  const sounds = useUiSounds();
  const audioRef = useRef(null);
  const targetChar = useMemo(() => Array.from(card?.hanzi || '')[0] || '', [card?.hanzi]);
  const profileLabel = profile?.role === 'parent' ? 'Parent' : 'Kid';

  const playCardAudio = () => {
    sounds.playTap();
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  return (
    <section className="writing-screen module-screen" aria-label="Module harmonise">
      <div className="writing-top-banner">
        <button
          type="button"
          className="writing-logo ui-pressable"
          onClick={() => {
            sounds.playTap();
            onBack?.();
          }}
        >
          文
        </button>

        <div className="writing-profile-section">
          <div className="writing-avatar-tile">
            <AvatarRenderer config={profile?.avatar} size={52} alt="Avatar profil" loading="eager" />
          </div>
          <div className="writing-profile-name">
            <strong>{profile?.name || 'Profil'}</strong>
            <span>{profileLabel}</span>
          </div>
        </div>

        <button
          type="button"
          className="writing-lesson-selector ui-pressable"
          onClick={() => {
            sounds.playTap();
            onOpenLessonPicker?.();
          }}
        >
          {lessonTitle || 'Lecon'}
        </button>
      </div>

      <div className="writing-card-info">
        <div className="writing-pinyin">{card?.pinyin || ''}</div>
        <div className="writing-char-small">{targetChar}</div>
        <div className="writing-translation">
          <span>{card?.french || ''}</span>
          <small>{card?.english || ''}</small>
        </div>
        <button
          type="button"
          className="writing-sound-btn ui-pressable"
          onClick={playCardAudio}
          disabled={!card?.audioUrl}
        >
          Son
        </button>
        {card?.audioUrl ? <audio ref={audioRef} src={card.audioUrl} preload="auto" /> : null}
      </div>

      <div className="module-content-area">{children}</div>

      <div className="writing-bottom-nav">
        <button type="button" className="writing-nav-btn ui-pressable" onClick={() => { sounds.playTap(); onPrev?.(); }}>
          ◄ Prec
        </button>
        <div className="writing-counter">
          {Math.max(1, cardIndex + 1)}/{Math.max(1, totalCards)}
        </div>
        <button type="button" className="writing-nav-btn ui-pressable" onClick={() => { sounds.playTap(); onNext?.(); }}>
          Suiv ►
        </button>
      </div>

      <div className="writing-mode-selector">
        <button
          type="button"
          className={`writing-mode-btn ui-pressable ${activeModule === 'flashcards' ? 'active' : ''}`}
          onClick={() => {
            sounds.playTap();
            onSwitchModule?.('flashcards');
          }}
          disabled={activeModule === 'flashcards'}
        >
          Mot
        </button>
        <button
          type="button"
          className={`writing-mode-btn ui-pressable ${activeModule === 'audio' ? 'active' : ''}`}
          onClick={() => {
            sounds.playTap();
            onSwitchModule?.('audio');
          }}
          disabled={activeModule === 'audio'}
        >
          Son
        </button>
        <button
          type="button"
          className={`writing-mode-btn ui-pressable ${activeModule === 'writing' ? 'active' : ''}`}
          onClick={() => {
            sounds.playTap();
            onSwitchModule?.('writing');
          }}
          disabled={activeModule === 'writing'}
        >
          Ecriture
        </button>
      </div>
    </section>
  );
}
