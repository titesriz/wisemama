import { useMemo, useState } from 'react';

const FONT_OPTIONS = [
  { id: 'wm-hanzi', label: 'Token actuel', family: 'var(--wm-font-hanzi)' },
  { id: 'noto', label: 'Noto Sans SC', family: "'Noto Sans SC', sans-serif" },
  { id: 'pingfang', label: 'PingFang SC', family: "'PingFang SC', sans-serif" },
  { id: 'yahei', label: 'Microsoft YaHei', family: "'Microsoft YaHei', sans-serif" },
  { id: 'stheiti', label: 'STHeiti', family: "'STHeiti', sans-serif" },
  { id: 'songti', label: 'Songti SC', family: "'Songti SC', serif" },
  { id: 'kaiti', label: 'Kaiti SC', family: "'Kaiti SC', serif" },
];

const SAMPLE_LINES = [
  '老师您好！今天我们学习中文。',
  '你好，我叫天一。我爱我的家。',
  '请听：猫、狗、鸟、鱼。',
  '数字：一 二 三 四 五 六 七 八 九 十',
];

export default function ChineseFontTestPage({ onBack }) {
  const [selectedId, setSelectedId] = useState(FONT_OPTIONS[0].id);
  const selected = useMemo(
    () => FONT_OPTIONS.find((item) => item.id === selectedId) || FONT_OPTIONS[0],
    [selectedId],
  );

  return (
    <section className="font-test-page" aria-label="Test polices chinoises">
      <div className="font-test-shell">
        <header className="font-test-head">
          <button type="button" className="writing-logo ui-pressable" onClick={onBack}>
            文
          </button>
          <div>
            <h1>Test Font Chinois</h1>
            <p>Compare et choisis la police la plus lisible pour l apprentissage.</p>
          </div>
        </header>

        <main className="font-test-layout">
          <aside className="font-test-list">
            {FONT_OPTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`font-test-item ui-pressable ${item.id === selected.id ? 'active' : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <strong>{item.label}</strong>
                <small>{item.family}</small>
              </button>
            ))}
          </aside>

          <section className="font-test-preview">
            <h2>{selected.label}</h2>
            <div className="font-test-sample-card" style={{ fontFamily: selected.family }}>
              {SAMPLE_LINES.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className="font-test-meta">
              Font-family active: <code>{selected.family}</code>
            </p>
          </section>
        </main>
      </div>
    </section>
  );
}

