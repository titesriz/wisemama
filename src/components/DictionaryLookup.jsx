import { useMemo, useState } from 'react';
import {
  getDictionaryHskLevels,
  getDictionarySize,
  searchDictionary,
} from '../lib/dictionarySearch.js';

export default function DictionaryLookup({ defaultQuery = '', onPick }) {
  const [query, setQuery] = useState(defaultQuery);
  const [hskLevel, setHskLevel] = useState('all');
  const [status, setStatus] = useState('');
  const hskLevels = useMemo(() => getDictionaryHskLevels(), []);

  const results = useMemo(
    () => searchDictionary(query, { limit: 10, hskLevel }),
    [query, hskLevel],
  );

  const applyEntry = (entry) => {
    onPick?.(entry);
    setStatus(`Carte remplie avec ${entry.hanzi}.`);
  };

  return (
    <div className="dictionary-lookup">
      <div className="dictionary-head">
        <strong>Dictionnaire local</strong>
        <span>{getDictionarySize()} mots</span>
      </div>
      <label className="lesson-field">
        <span>Filtre HSK</span>
        <select value={hskLevel} onChange={(e) => setHskLevel(e.target.value)}>
          <option value="all">Tous</option>
          {hskLevels.map((level) => (
            <option key={level} value={String(level)}>
              HSK {level}
            </option>
          ))}
        </select>
      </label>
      <input
        value={query}
        placeholder="Recherche: 汉字, pinyin, francais, anglais"
        onChange={(e) => setQuery(e.target.value)}
      />
      {status ? <p className="ok-line">{status}</p> : null}
      <div className="dictionary-results">
        {results.length === 0 ? (
          <p className="audio-placeholder">Aucun resultat.</p>
        ) : (
          results.map((entry) => (
            <button key={entry.id} type="button" className="dictionary-item" onClick={() => applyEntry(entry)}>
              <span className="dict-hanzi">{entry.hanzi}</span>
              <span className="dict-pinyin">{entry.pinyin}</span>
              {entry.hsk ? <span className="dict-hsk">HSK {entry.hsk}</span> : null}
              <span className="dict-meaning">FR: {entry.french} | EN: {entry.english}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
