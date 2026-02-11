import { useRef } from 'react';
import WritingPractice from './WritingPractice.jsx';

export default function Flashcard({ card, onWritingSuccess, earnedStars = 0 }) {
  const audioRef = useRef(null);

  const playAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  return (
    <section className="flashcard">
      <div className="flashcard-main">
        <div className="hanzi" aria-label="Caractere chinois">
          {card.hanzi}
        </div>
        <div className="pinyin">{card.pinyin}</div>
      </div>

      <div className="translations">
        <div>
          <span className="label">Francais :</span>
          <span className="value">{card.french}</span>
        </div>
        <div>
          <span className="label">Anglais :</span>
          <span className="value">{card.english}</span>
        </div>
      </div>

      <div className="reward-chip" aria-live="polite">
        Etoiles gagnees pour cette carte: {'⭐'.repeat(Math.max(earnedStars, 0)) || '0'}
      </div>

      {card.imageUrl ? (
        <div className="image-wrap">
          <img src={card.imageUrl} alt={card.french} />
        </div>
      ) : null}

      <div className="audio-row">
        <button className="button" type="button" onClick={playAudio}>
          Ecouter
        </button>
        {card.audioUrl ? (
          <audio ref={audioRef} src={card.audioUrl} preload="auto" />
        ) : (
          <span className="audio-placeholder">Ajoute un audio pour ecouter la prononciation.</span>
        )}
      </div>

      <WritingPractice hanzi={card.hanzi} onSuccess={onWritingSuccess} />
    </section>
  );
}
