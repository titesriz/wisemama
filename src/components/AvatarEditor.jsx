import { useEffect, useState } from 'react';
import { useAvatar } from '../context/AvatarContext.jsx';
import AvatarRenderer from './AvatarRenderer.jsx';
import { avatarTraits, randomAvatarConfig } from '../lib/avatarConfig.js';

const editableModes = ['child', 'parent'];

function OptionSelect({ label, value, onChange, options }) {
  return (
    <label className="avatar-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AvatarEditor() {
  const { getAvatarByMode, setAvatar } = useAvatar();
  const [targetMode, setTargetMode] = useState('child');
  const [draft, setDraft] = useState(() => getAvatarByMode('child'));
  const [savedMsg, setSavedMsg] = useState('');

  const currentSaved = getAvatarByMode(targetMode);

  useEffect(() => {
    setDraft(currentSaved);
  }, [targetMode, currentSaved]);

  const updateDraft = (patch) => {
    setSavedMsg('');
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const randomize = () => {
    const next = randomAvatarConfig(targetMode);
    setDraft(next);
    setSavedMsg('Avatar randomise. Pense a sauvegarder.');
  };

  const save = () => {
    setAvatar(targetMode, draft);
    setSavedMsg('Avatar sauvegarde.');
  };

  return (
    <section className="avatar-editor">
      <div className="avatar-editor-head">
        <h3>Creation avatar</h3>
        <div className="avatar-mode-tabs" role="tablist" aria-label="Edition mode">
          {editableModes.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`pill ${targetMode === mode ? 'active' : ''}`}
              onClick={() => {
                setTargetMode(mode);
                setDraft(getAvatarByMode(mode));
                setSavedMsg('');
              }}
            >
              {mode === 'child' ? 'Avatar Enfant' : 'Avatar Parent'}
            </button>
          ))}
        </div>
      </div>

      <div className="avatar-preview-wrap">
        <AvatarRenderer config={draft} size={120} className="avatar-preview" alt="Apercu avatar" />
      </div>

      <div className="avatar-grid">
        <OptionSelect
          label="Cheveux"
          value={draft.hair}
          onChange={(value) => updateDraft({ hair: value })}
          options={avatarTraits.hair}
        />
        <OptionSelect
          label="Yeux"
          value={draft.eyes}
          onChange={(value) => updateDraft({ eyes: value })}
          options={avatarTraits.eyes}
        />
        <OptionSelect
          label="Bouche"
          value={draft.mouth}
          onChange={(value) => updateDraft({ mouth: value })}
          options={avatarTraits.mouth}
        />
        <OptionSelect
          label="Accessoire"
          value={draft.accessories}
          onChange={(value) => updateDraft({ accessories: value })}
          options={avatarTraits.accessories}
        />
        <OptionSelect
          label="Couleur"
          value={draft.clothesColor}
          onChange={(value) => updateDraft({ clothesColor: value })}
          options={avatarTraits.clothesColor}
        />
      </div>

      <div className="avatar-actions">
        <button type="button" className="button secondary" onClick={randomize}>
          Randomiser
        </button>
        <button type="button" className="button" onClick={save}>
          Sauvegarder
        </button>
      </div>
      {savedMsg ? <p className="ok-line">{savedMsg}</p> : null}
    </section>
  );
}
