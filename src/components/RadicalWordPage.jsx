import ModuleFrame from './ModuleFrame.jsx';
import radicalsWords from '../data/radicals-words.json';
import '../styles/colors-deck.css';

function renderIcon(currentWord) {
  if (!currentWord?.iconUrl) return null;
  return (
    <div className="clothing-icon-wrap">
      <img src={currentWord.iconUrl} alt={currentWord.french || currentWord.english || currentWord.hanzi} />
    </div>
  );
}

export default function RadicalWordPage({
  profile,
  words,
  word,
  onBack,
  onGoHome,
  onSwitchModule,
  shellHeader = false,
}) {
  const deck = words || radicalsWords;

  if (!word) {
    return <p className="empty">Aucun radical disponible.</p>;
  }

  return (
    <ModuleFrame
      profile={profile}
      lessonTitle="Radicaux"
      words={deck}
      selectedId={word.id}
      singleLabel="Radical"
      beforeHanzi={renderIcon}
      activeModule="flashcards"
      modes={['flashcards', 'writing', 'quiz']}
      onBack={onBack}
      onGoHome={onGoHome}
      onSwitchModule={onSwitchModule}
      shellHeader={shellHeader}
    />
  );
}
