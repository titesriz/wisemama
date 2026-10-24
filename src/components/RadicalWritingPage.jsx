import { useEffect, useState } from 'react';
import WritingPractice from './WritingPractice.jsx';

export default function RadicalWritingPage({
  profile,
  word,
  writingDifficulty = 1,
  onBack,
  onGoHome,
  onSwitchModule,
  onSuccess,
  onPrevWord,
  onNextWord,
  shellHeader = false,
}) {
  const [charPosition, setCharPosition] = useState(0);

  useEffect(() => {
    setCharPosition(0);
  }, [word?.id]);

  if (!word) {
    return (
      <section className="writing-only-page">
        <p className="empty">Aucun radical disponible.</p>
        <button type="button" className="button secondary" onClick={onBack}>
          Retour
        </button>
      </section>
    );
  }

  const charQueue = Array.from(word.hanzi || '');
  const targetChar = charQueue[charPosition] || charQueue[0] || '';
  const isLastChar = charPosition >= charQueue.length - 1;

  const handleNext = () => {
    if (isLastChar) {
      onNextWord?.();
    } else {
      setCharPosition((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (charPosition === 0) {
      onPrevWord?.();
    } else {
      setCharPosition((prev) => prev - 1);
    }
  };

  return (
    <section className="writing-only-page">
      <WritingPractice
        hanzi={targetChar}
        card={word}
        lessonId="radical-deck"
        lessonTitle="Radicaux"
        writingDifficulty={writingDifficulty}
        profile={profile}
        cardIndex={charPosition}
        totalCards={charQueue.length}
        onPrev={handlePrev}
        onNext={handleNext}
        onSwitchModule={onSwitchModule}
        onBack={onBack}
        onGoHome={onGoHome}
        shellHeader={shellHeader}
        standalone
        onSuccess={onSuccess}
      />
    </section>
  );
}
