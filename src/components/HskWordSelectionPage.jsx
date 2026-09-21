import { useMemo, useState } from 'react';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import '../styles/hsk-deck.css';

function matchesSearch(word, needle) {
  if (!needle) return true;
  const haystack = [word.hanzi, word.pinyin, word.french, word.english]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

export default function HskWordSelectionPage({ words = [], activeWordId = '', onSelectWord, onBack }) {
  const [search, setSearch] = useState('');

  const filteredWords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return words
      .map((word, index) => ({ word, index }))
      .filter(({ word }) => matchesSearch(word, needle));
  }, [words, search]);

  return (
    <section className="hsk-select-page">
      <div className="hsk-select-shell">
        <header className="hsk-select-head">
          <button type="button" className="hsk-select-back ui-pressable" onClick={onBack}>
            ← Retour
          </button>
          <h1>Choisir un mot</h1>
          <span className="hsk-select-count">{words.length} mots</span>
        </header>

        <input
          type="text"
          className="hsk-select-search"
          placeholder="Rechercher (hanzi, pinyin, francais, anglais)..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="hsk-select-list">
          {filteredWords.map(({ word, index }) => (
            <button
              key={word.id}
              type="button"
              className={`hsk-select-card ui-pressable ${activeWordId === word.id ? 'active' : ''}`}
              onClick={() => onSelectWord?.(index)}
            >
              <span className="hsk-select-hanzi">{word.hanzi}</span>
              <span className="hsk-select-info">
                <strong>{formatPinyinDisplay(word.pinyin || '')}</strong>
                <small>{word.french || word.english}</small>
              </span>
            </button>
          ))}
          {!filteredWords.length ? <p className="hsk-select-empty">Aucun mot trouve.</p> : null}
        </div>
      </div>
    </section>
  );
}
