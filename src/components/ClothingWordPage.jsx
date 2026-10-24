import ModuleFrame from './ModuleFrame.jsx';
import clothingWords from '../data/clothing-words.json';
import '../styles/colors-deck.css';

function renderIcon(currentWord) {
  if (!currentWord?.iconUrl) return null;
  return (
    <div className="clothing-icon-wrap">
      <img src={currentWord.iconUrl} alt={currentWord.french || currentWord.english || currentWord.hanzi} />
    </div>
  );
}

export default function ClothingWordPage({
  profile,
  words,
  word,
  onBack,
  onGoHome,
  onSwitchModule,
  shellHeader = false,
}) {
  const deck = words || clothingWords;

  if (!word) {
    return <p className="empty">Aucun vetement disponible.</p>;
  }

  return (
    <ModuleFrame
      profile={profile}
      lessonTitle="Vetements"
      words={deck}
      selectedId={word.id}
      singleLabel="Vêtement"
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
