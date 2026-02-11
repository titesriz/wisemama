import { useEffect, useMemo, useState } from 'react';
import { useAvatar } from '../context/AvatarContext.jsx';
import AvatarRenderer from './AvatarRenderer.jsx';
import {
  getAvatarStyles,
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
const styleLabelMap = {
  'toon-head': 'Toon Head',
  adventurer: 'Adventurer',
  personas: 'Personas',
};

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
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    getProfileById,
    createProfile,
    setProfileAvatar,
    setProfileName,
    setProfileRole,
  } = useAvatar();

  const [targetProfileId, setTargetProfileId] = useState(activeProfileId || profiles[0]?.id || '');
  const [draft, setDraft] = useState(() => sanitizeAvatarConfig(profiles[0]?.avatar, profiles[0]?.role || 'child'));
  const [profileName, setProfileNameDraft] = useState(() => profiles[0]?.name || '');
  const [targetRole, setTargetRole] = useState(() => profiles[0]?.role || 'child');
  const [activeCategory, setActiveCategory] = useState('skinColor');
  const [savedMsg, setSavedMsg] = useState('');
  const [showStylePicker, setShowStylePicker] = useState(false);

  const targetProfile = useMemo(
    () => getProfileById(targetProfileId) || profiles[0] || null,
    [getProfileById, targetProfileId, profiles],
  );

  useEffect(() => {
    if (!activeProfileId) return;
    setTargetProfileId(activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    if (!targetProfile) return;
    setDraft(sanitizeAvatarConfig(targetProfile.avatar, targetProfile.role));
    setProfileNameDraft(targetProfile.name || '');
    setTargetRole(targetProfile.role || 'child');
  }, [targetProfile]);

  const styleTraits = useMemo(() => getAvatarTraitsByStyle(draft.style), [draft.style]);
  const styleOptions = useMemo(() => getAvatarStyles(), []);
  const isProbabilityCategory = probabilityCategories.has(activeCategory);

  const optionsForCategory = useMemo(() => {
    if (isProbabilityCategory) return [];
    if (activeCategory === 'hair') {
      const hairOptions = styleTraits?.hair || [];
      const rearHairOptions = styleTraits?.rearHair || [];
      if (rearHairOptions.length <= 1) return hairOptions;
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
    setDraft((prev) => sanitizeAvatarConfig({ ...prev, ...patch }, targetRole));
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
    const next = randomAvatarConfig(targetRole, draft.style);
    setDraft(next);
    setSavedMsg('Avatar randomise. Pense a sauvegarder.');
  };

  const setAvatarStyle = (nextStyle) => {
    if (!nextStyle || nextStyle === draft.style) {
      setShowStylePicker(false);
      return;
    }
    const nextDraft = randomAvatarConfig(targetRole, nextStyle);
    setDraft(sanitizeAvatarConfig(nextDraft, targetRole));
    setSavedMsg(`Style change: ${styleLabelMap[nextStyle] || nextStyle}.`);
    setShowStylePicker(false);
  };

  const save = () => {
    if (!targetProfile) return;
    setProfileRole(targetProfile.id, targetRole);
    setProfileAvatar(targetProfile.id, draft);
    setProfileName(targetProfile.id, profileName.trim());
    setSavedMsg('Profil sauvegarde.');
  };

  const addProfile = () => {
    const newId = createProfile({ role: 'child', name: 'Nouveau profil' });
    setTargetProfileId(newId);
    setActiveProfileId(newId);
    setSavedMsg('Nouveau profil cree.');
  };

  const currentValue = (() => {
    if (activeCategory !== 'hair') return draft[activeCategory];
    const rearHairOptions = styleTraits?.rearHair || [];
    if (rearHairOptions.length <= 1) return draft.hair;
    return `${draft.hair}${HAIR_PAIR_SEPARATOR}${draft.rearHair}`;
  })();

  const buildPreviewConfig = (value) => {
    if (activeCategory === 'hair' && String(value).includes(HAIR_PAIR_SEPARATOR)) {
      const [frontHair, rearHair] = String(value).split(HAIR_PAIR_SEPARATOR);
      return sanitizeAvatarConfig({ ...draft, hair: frontHair, rearHair }, targetRole);
    }
    return sanitizeAvatarConfig({ ...draft, [activeCategory]: value }, targetRole);
  };

  return (
    <section className="avatar-editor avatar-editor-v2">
      <div className="avatar-editor-head">
        <h3>Creation avatar</h3>
        <button type="button" className="button secondary button-sm" onClick={addProfile}>
          Nouveau profil
        </button>
      </div>

      <div className="avatar-family-strip" aria-label="Profils existants">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            className={`avatar-family-item ${targetProfile?.id === profile.id ? 'active' : ''}`}
            onClick={() => {
              setTargetProfileId(profile.id);
              setActiveProfileId(profile.id);
              setSavedMsg('');
            }}
          >
            <AvatarRenderer
              config={profile.avatar}
              size={40}
              className="avatar-family-preview"
              alt={`Avatar ${profile.name}`}
            />
            <span>{profile.name || (profile.role === 'parent' ? 'Parent' : 'Enfant')}</span>
            <span className="profile-role-chip">{profile.role === 'parent' ? 'Parent' : 'Kid'}</span>
          </button>
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
            <div className="avatar-mode-tabs" role="tablist" aria-label="Statut profil">
              <button
                type="button"
                className={`pill ${targetRole === 'child' ? 'active' : ''}`}
                onClick={() => setTargetRole('child')}
              >
                <span className="person-icon small" aria-hidden="true" />
                Kid
              </button>
              <button
                type="button"
                className={`pill ${targetRole === 'parent' ? 'active' : ''}`}
                onClick={() => setTargetRole('parent')}
              >
                <span className="person-icon big" aria-hidden="true" />
                Parent
              </button>
            </div>
            <input
              type="text"
              className="avatar-name-input"
              value={profileName}
              onChange={(event) => setProfileNameDraft(event.target.value)}
              placeholder={targetRole === 'child' ? 'Prenom enfant' : 'Nom parent'}
              aria-label="Nom profil"
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
        <div className="style-picker-wrap">
          <button
            type="button"
            className="button secondary button-sm"
            onClick={() => setShowStylePicker((prev) => !prev)}
          >
            Style: {styleLabelMap[draft.style] || draft.style}
          </button>
          {showStylePicker ? (
            <div className="style-picker-popover">
              {styleOptions.map((styleKey) => (
                <button
                  key={styleKey}
                  type="button"
                  className={`pill ${draft.style === styleKey ? 'active' : ''}`}
                  onClick={() => setAvatarStyle(styleKey)}
                >
                  {styleLabelMap[styleKey] || styleKey}
                </button>
              ))}
            </div>
          ) : null}
        </div>
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
