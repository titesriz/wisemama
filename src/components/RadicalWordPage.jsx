import ModuleFrame from './ModuleFrame.jsx';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import '../styles/colors-deck.css';

export default function RadicalWordPage({
  profile,
  word,
  wordIndex,
  totalWords,
  onPrev,
  onNext,
  onBack,
  onSwitchModule,
}) {
  if (!word) {
    return <p className="empty">Aucun radical disponible.</p>;
  }

  return (
    <ModuleFrame
      profile={profile}
      lessonTitle="Radicaux"
      card={word}
      cardIndex={wordIndex}
      totalCards={totalWords}
      activeModule="flashcards"
      modes={['flashcards', 'writing', 'quiz']}
      onBack={onBack}
      onPrev={onPrev}
      onNext={onNext}
      onSwitchModule={onSwitchModule}
    >
      <div className="module-card-center wm-enter-fade">
        {word.iconUrl ? (
          <div className="clothing-icon-wrap">
            <img src={word.iconUrl} alt={word.french || word.english || word.hanzi} />
          </div>
        ) : null}
        <div className="module-hanzi-large">{word.hanzi}</div>
        <div className="module-pinyin-large">{formatPinyinDisplay(word.pinyin || '')}</div>

        <div className="module-translation-panels">
          <article>
            <strong>Francais</strong>
            <span>{word.french}</span>
          </article>
          <article>
            <strong>Anglais</strong>
            <span>{word.english}</span>
          </article>
        </div>
      </div>
    </ModuleFrame>
  );
}
