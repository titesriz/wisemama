import { useEffect, useState } from 'react';
import WritingPractice from './WritingPractice.jsx';

export default function HskWritingPage({
  profile,
  word,
  onBack,
  onSwitchModule,
  onSuccess,
  onPrevWord,
  onNextWord,
}) {
  const [charPosition, setCharPosition] = useState(0);

  useEffect(() => {
    setCharPosition(0);
  }, [word?.id]);

  if (!word) {
    return (
      <section className="writing-only-page">
        <p className="empty">Aucun mot disponible.</p>
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
        lessonId="hsk1-deck"
        lessonTitle="HSK1"
        writingDifficulty={1}
        profile={profile}
        cardIndex={charPosition}
        totalCards={charQueue.length}
        onPrev={handlePrev}
        onNext={handleNext}
        onSwitchModule={onSwitchModule}
        onBack={onBack}
        standalone
        onSuccess={onSuccess}
      />
    </section>
  );
}
