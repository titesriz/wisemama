const HANZI_FONT_KEY = 'wisemama-hanzi-font';

export const HANZI_FONT_OPTIONS = [
  { id: 'wenkai', label: 'LXGW WenKai GB', family: 'WisemamaHanzi' },
  { id: 'ukai', label: 'AR PL UKai', family: 'WisemamaHanziUkai' },
];

export function getHanziFontPreference() {
  if (typeof localStorage === 'undefined') return 'wenkai';
  const saved = localStorage.getItem(HANZI_FONT_KEY);
  if (saved && HANZI_FONT_OPTIONS.some((opt) => opt.id === saved)) return saved;
  return 'wenkai';
}

export function applyHanziFontPreference(id) {
  const selected = HANZI_FONT_OPTIONS.find((opt) => opt.id === id) || HANZI_FONT_OPTIONS[0];
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--wm-font-hanzi', selected.family);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(HANZI_FONT_KEY, selected.id);
  }
  return selected;
}
