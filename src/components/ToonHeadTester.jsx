import { useMemo, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import {
  getAvatarTraitsByStyle,
  randomAvatarConfig,
  sanitizeAvatarConfig,
  avatarUrlFromConfig,
} from '../lib/avatarConfig.js';

const STYLE = 'toon-head';
const orderedCategories = [
  { key: 'backgroundColor', label: 'Background' },
  { key: 'skinColor', label: 'Skin' },
  { key: 'hair', label: 'Hair' },
  { key: 'rearHair', label: 'Rear hair' },
  { key: 'hairColor', label: 'Hair color' },
  { key: 'eyes', label: 'Eyes' },
  { key: 'eyebrows', label: 'Eyebrows' },
  { key: 'mouth', label: 'Mouth' },
  { key: 'beard', label: 'Beard' },
  { key: 'clothes', label: 'Clothes' },
  { key: 'clothesColor', label: 'Clothes color' },
];

function isHexColor(value) {
  return /^[0-9a-f]{6}$/i.test(String(value));
}

export default function ToonHeadTester() {
  const [config, setConfig] = useState(() => randomAvatarConfig('child', STYLE));
  const [activeCategory, setActiveCategory] = useState('skinColor');
  const traits = useMemo(() => getAvatarTraitsByStyle(STYLE), []);
  const safe = sanitizeAvatarConfig(config, 'child');
  const options = traits[activeCategory] || [];

  const update = (key, value) => {
    setConfig((prev) => sanitizeAvatarConfig({ ...prev, style: STYLE, [key]: value }, 'child'));
  };

  const currentUrl = avatarUrlFromConfig(safe);

  return (
    <section className="big-smile-tester module-pane">
      <div className="big-smile-head">
        <h3>Toon Head Tester</h3>
        <div className="big-smile-actions">
          <button
            type="button"
            className="button secondary button-sm"
            onClick={() => setConfig(randomAvatarConfig('child', STYLE))}
          >
            Randomiser
          </button>
          <button
            type="button"
            className="button secondary button-sm"
            onClick={() => setConfig(sanitizeAvatarConfig({ style: STYLE }, 'child'))}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="big-smile-main">
        <div className="big-smile-preview">
          <AvatarRenderer config={safe} size={220} alt="Apercu toon head" />
          <code className="big-smile-url">{currentUrl}</code>
        </div>

        <div className="big-smile-panel">
          <div className="avatar-category-bar" role="tablist" aria-label="Toon head categories">
            {orderedCategories.map((item) => (
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

          <div className="option-grid">
            {options.map((value) => {
              const selected = safe[activeCategory] === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`option-chip ${selected ? 'selected' : ''}`}
                  onClick={() => update(activeCategory, value)}
                >
                  {isHexColor(value) ? (
                    <span className="option-chip-swatch" style={{ backgroundColor: `#${value}` }} aria-hidden="true" />
                  ) : null}
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
