import { useEffect, useRef, useState } from 'react';
import { useUiSounds } from '../hooks/useUiSounds.js';

export default function Flashcard({ card, earnedStars = 0 }) {
  const audioRef = useRef(null);
  const [played, setPlayed] = useState(false);
  const sounds = useUiSounds();

  useEffect(() => {
    setPlayed(false);
  }, [card?.id]);

  const playAudio = () => {
    sounds.playTap();
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setPlayed(true);
    window.setTimeout(() => setPlayed(false), 680);
  };

  return (
    <section className="flashcard" aria-label="Module flashcard">
      <div className="flashcard-head">
        <h3>Flashcard</h3>
        <span className="flashcard-chip">Ecouter · Lire · Comprendre</span>
      </div>

      <div className="flashcard-main">
        <div className="flashcard-hanzi" aria-label="Caractere chinois">
          {card.hanzi}
        </div>
        <div className="flashcard-pinyin">{card.pinyin}</div>
      </div>

      <div className="flashcard-translations">
        <div className="translation-item">
          <span className="flashcard-label">Francais</span>
          <span className="flashcard-value">{card.french}</span>
        </div>
        <div className="translation-item">
          <span className="flashcard-label">Anglais</span>
          <span className="flashcard-value">{card.english}</span>
        </div>
      </div>

      <div className="flashcard-reward-chip" aria-live="polite">
        Etoiles gagnees pour cette carte: {'⭐'.repeat(Math.max(earnedStars, 0)) || '0'}
      </div>

      {card.imageUrl ? (
        <div className="flashcard-image-wrap">
          <img src={card.imageUrl} alt={card.french} />
        </div>
      ) : null}

      <div className="flashcard-audio-row">
        <button
          className={`button ui-pressable ${played ? 'is-played' : ''}`}
          type="button"
          onClick={playAudio}
          data-coach="listen"
        >
          Ecouter
        </button>
        {card.audioUrl ? (
          <audio ref={audioRef} src={card.audioUrl} preload="auto" />
        ) : (
          <span className="flashcard-audio-placeholder">Ajoute un audio fixe si besoin.</span>
        )}
      </div>
    </section>
  );
}
