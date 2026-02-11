import { useEffect, useMemo, useState } from 'react';
import { useAvatar } from '../context/AvatarContext.jsx';
import AvatarRenderer from './AvatarRenderer.jsx';
import {
  getAvatarTraitsByStyle,
  randomAvatarConfig,
  sanitizeAvatarConfig,
} from '../lib/avatarConfig.js';

const categories = [
  { key: 'skinColor', label: 'Skin color' },
  { key: 'hair', label: 'Hair' },
  { key: 'hairColor', label: 'Hair color' },
  { key: 'beard', label: 'Beard' },
  { key: 'eyes', label: 'Eye' },
  { key: 'eyebrows', label: 'Eyebrows' },
  { key: 'mouth', label: 'Mouth' },
  { key: 'clothes', label: 'Clothes' },
  { key: 'clothesColor', label: 'Clothes color' },
];
const topCategories = [
  { key: 'backgroundColor', label: 'Background color' },
];
const probabilityCategories = new Set();
const HAIR_PAIR_SEPARATOR = '__';
const excludedHairPairs = new Set([
  `none${HAIR_PAIR_SEPARATOR}longStraight`,
  `none${HAIR_PAIR_SEPARATOR}longWavy`,
  `none${HAIR_PAIR_SEPARATOR}neckHigh`,
  `none${HAIR_PAIR_SEPARATOR}shoulderHigh`,
  `undercut${HAIR_PAIR_SEPARATOR}longStraight`,
  `undercut${HAIR_PAIR_SEPARATOR}longWavy`,
  `undercut${HAIR_PAIR_SEPARATOR}neckHigh`,
  `undercut${HAIR_PAIR_SEPARATOR}shoulderHigh`,
  `spiky${HAIR_PAIR_SEPARATOR}longStraight`,
  `spiky${HAIR_PAIR_SEPARATOR}longWavy`,
  `spiky${HAIR_PAIR_SEPARATOR}neckHigh`,
  `spiky${HAIR_PAIR_SEPARATOR}shoulderHigh`,
]);

function formatOptionLabel(value, activeCategory) {
  if (activeCategory === 'hair' && String(value).includes(HAIR_PAIR_SEPARATOR)) {
    const [frontHair, rearHair] = String(value).split(HAIR_PAIR_SEPARATOR);
    return `${frontHair} + ${rearHair}`;
  }
  return String(value);
}

function OptionChip({ value, selected, onSelect, activeCategory, previewConfig }) {
  const isColorCategory =
    activeCategory === 'skinColor' ||
    activeCategory === 'clothesColor' ||
    activeCategory === 'hairColor' ||
    activeCategory === 'backgroundColor';
  const isHexColor = /^[0-9a-f]{6}$/i.test(String(value));
  const isColor = isColorCategory && isHexColor;

  return (
    <button
      type="button"
      className={`option-chip ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(value)}
    >
      {isColor ? (
        <span className="option-chip-swatch" style={{ backgroundColor: `#${value}` }} aria-hidden="true" />
      ) : (
        <AvatarRenderer
          config={previewConfig}
          size={34}
          className="option-chip-avatar"
          alt={`Apercu ${activeCategory} ${formatOptionLabel(value, activeCategory)}`}
          loading="eager"
        />
      )}
      {formatOptionLabel(value, activeCategory)}
    </button>
  );
}

export default function AvatarEditor() {
  const { getAvatarByMode, setAvatar, getNameByMode, setName } = useAvatar();
  const [targetMode, setTargetMode] = useState('child');
  const [draft, setDraft] = useState(() => getAvatarByMode('child'));
  const [profileName, setProfileName] = useState(() => getNameByMode('child'));
  const [activeCategory, setActiveCategory] = useState('skinColor');
  const [savedMsg, setSavedMsg] = useState('');

  const currentSaved = getAvatarByMode(targetMode);

  useEffect(() => {
    setDraft(currentSaved);
  }, [targetMode, currentSaved]);

  useEffect(() => {
    setProfileName(getNameByMode(targetMode));
  }, [targetMode, getNameByMode]);

  const styleTraits = useMemo(() => getAvatarTraitsByStyle(draft.style), [draft.style]);
  const isProbabilityCategory = probabilityCategories.has(activeCategory);

  const optionsForCategory = useMemo(() => {
    if (isProbabilityCategory) return [];
    if (activeCategory === 'hair') {
      const hairOptions = styleTraits?.hair || [];
      const rearHairOptions = styleTraits?.rearHair || [];
      return hairOptions
        .flatMap((frontHair) =>
          rearHairOptions.map((rearHair) => `${frontHair}${HAIR_PAIR_SEPARATOR}${rearHair}`),
        )
        .filter((pair) => !excludedHairPairs.has(pair));
    }
    return styleTraits?.[activeCategory] || [];
  }, [activeCategory, isProbabilityCategory, styleTraits]);

  const updateDraft = (patch) => {
    setSavedMsg('');
    setDraft((prev) => sanitizeAvatarConfig({ ...prev, ...patch }, targetMode));
  };

  const selectOption = (value) => {
    if (activeCategory === 'hair' && String(value).includes(HAIR_PAIR_SEPARATOR)) {
      const [frontHair, rearHair] = String(value).split(HAIR_PAIR_SEPARATOR);
      updateDraft({ hair: frontHair, rearHair });
      return;
    }
    updateDraft({ [activeCategory]: value });
  };

  const randomize = () => {
    const next = randomAvatarConfig(targetMode, draft.style);
    setDraft(next);
    setSavedMsg('Avatar randomise. Pense a sauvegarder.');
  };

  const save = () => {
    setAvatar(targetMode, draft);
    setName(targetMode, profileName.trim());
    setSavedMsg('Avatar sauvegarde.');
  };

  const currentValue =
    activeCategory === 'hair'
      ? `${draft.hair}${HAIR_PAIR_SEPARATOR}${draft.rearHair}`
      : draft[activeCategory];

  const buildPreviewConfig = (value) => {
    if (activeCategory === 'hair' && String(value).includes(HAIR_PAIR_SEPARATOR)) {
      const [frontHair, rearHair] = String(value).split(HAIR_PAIR_SEPARATOR);
      return sanitizeAvatarConfig({ ...draft, hair: frontHair, rearHair }, targetMode);
    }
    return sanitizeAvatarConfig({ ...draft, [activeCategory]: value }, targetMode);
  };

  return (
    <section className="avatar-editor avatar-editor-v2">
      <div className="avatar-editor-head">
        <h3>Creation avatar</h3>
      </div>

      <div className="avatar-family-strip" aria-label="Avatars existants">
        {['child', 'parent'].map((mode) => (
          <div key={mode} className={`avatar-family-item ${targetMode === mode ? 'active' : ''}`}>
            <AvatarRenderer
              config={getAvatarByMode(mode)}
              size={40}
              className="avatar-family-preview"
              alt={mode === 'child' ? 'Avatar enfant existant' : 'Avatar parent existant'}
            />
            <span>{getNameByMode(mode) || (mode === 'child' ? 'Enfant' : 'Parent')}</span>
          </div>
        ))}
      </div>

      <div className="avatar-studio-main">
        <div className="avatar-studio-left">
          <div className="avatar-display">
            <AvatarRenderer config={draft} size={190} className="avatar-preview" alt="Apercu avatar" />
          </div>
        </div>

        <div className="avatar-studio-right">
          <div className="avatar-editor-meta">
            <div className="avatar-mode-tabs" role="tablist" aria-label="Choix profil">
              <button
                type="button"
                className={`pill ${targetMode === 'child' ? 'active' : ''}`}
                onClick={() => {
                  setTargetMode('child');
                  setDraft(getAvatarByMode('child'));
                  setSavedMsg('');
                }}
              >
                <span className="person-icon small" aria-hidden="true" />
                Enfant
              </button>
              <button
                type="button"
                className={`pill ${targetMode === 'parent' ? 'active' : ''}`}
                onClick={() => {
                  setTargetMode('parent');
                  setDraft(getAvatarByMode('parent'));
                  setSavedMsg('');
                }}
              >
                <span className="person-icon big" aria-hidden="true" />
                Parent
              </button>
            </div>
            <input
              type="text"
              className="avatar-name-input"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              placeholder={targetMode === 'child' ? 'Prenom enfant' : 'Nom parent'}
              aria-label={targetMode === 'child' ? 'Prenom enfant' : 'Nom parent'}
            />
            <button type="button" className="button button-sm" onClick={save}>
              Sauvegarder
            </button>
          </div>

          <div className="avatar-top-controls" role="tablist" aria-label="Background color">
            {topCategories.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`pill ${activeCategory === item.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(item.key)}
                title="Background color"
                aria-label="Background color"
              >
                <span className="bg-color-icon" aria-hidden="true" />
                <span className="sr-only">{item.label}</span>
              </button>
            ))}
            {savedMsg ? <p className="ok-line">{savedMsg}</p> : null}
          </div>

          <div className="avatar-panel-head">
            <strong>
              {topCategories.find((item) => item.key === activeCategory)?.label ||
                categories.find((item) => item.key === activeCategory)?.label}
            </strong>
            <span>{isProbabilityCategory ? `${currentValue}%` : `${optionsForCategory.length} options`}</span>
          </div>

          {isProbabilityCategory ? (
            <div className="probability-control">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Number.isFinite(Number(currentValue)) ? Number(currentValue) : 0}
                onChange={(event) => selectOption(Number(event.target.value))}
              />
              <div className="probability-scale">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          ) : (
            <div className="option-grid">
              {optionsForCategory.map((value) => (
                <OptionChip
                  key={value}
                  value={value}
                  selected={currentValue === value}
                  onSelect={selectOption}
                  activeCategory={activeCategory}
                  previewConfig={buildPreviewConfig(value)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="avatar-category-bar" role="tablist" aria-label="Categories avatar">
        <button type="button" className="button secondary button-sm" onClick={randomize}>
          Randomiser
        </button>
        {categories.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`pill ${activeCategory === item.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
