import { useMemo, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import LayoutShell from './LayoutShell.jsx';
import TokenButton from './ui/TokenButton.jsx';
import '../styles/parent-mode.css';

const SECTION_IDS = {
  LESSONS: 'lessons',
  AUDIO: 'audio',
  PROGRESS: 'progress',
  FAMILY: 'family',
  SETTINGS: 'settings',
};

function SectionNav({ activeSection, onChange }) {
  const items = [
    { id: SECTION_IDS.LESSONS, label: '1. Gestion Lecons' },
    { id: SECTION_IDS.AUDIO, label: '2. Gestion Audio' },
    { id: SECTION_IDS.PROGRESS, label: '3. Progres Enfant' },
    { id: SECTION_IDS.FAMILY, label: 'Contenu famille' },
    { id: SECTION_IDS.SETTINGS, label: '5. Parametres' },
  ];

  return (
    <nav className="parent-nav" aria-label="Sections parent">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`parent-nav-item ${activeSection === item.id ? 'active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function LessonsSection({ lessons = [] }) {
  return (
    <section className="parent-panel" aria-label="Gestion Lecons">
      <div className="parent-panel-head">
        <h3>1. Gestion Lecons</h3>
        <TokenButton variant="secondary">Nouvelle lecon</TokenButton>
      </div>
      <p className="parent-panel-subtitle">Gerer les packs, importer et organiser les cartes.</p>

      <div className="parent-list">
        {lessons.length ? (
          lessons.map((lesson) => (
            <article key={lesson.id} className="parent-list-item">
              <div>
                <strong>{lesson.title}</strong>
                <p>{lesson.cards?.length || 0} fiches</p>
              </div>
              <div className="parent-list-actions">
                <TokenButton variant="ghost" className="wm-btn-compact">Dupliquer</TokenButton>
                <TokenButton variant="secondary" className="wm-btn-compact">Editer</TokenButton>
              </div>
            </article>
          ))
        ) : (
          <p className="parent-empty">Aucune lecon disponible.</p>
        )}
      </div>
    </section>
  );
}

function AudioBulkSection({ lessons = [] }) {
  const rows = lessons.flatMap((lesson) =>
    (lesson.cards || []).map((card) => ({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      cardId: card.id,
      hanzi: card.hanzi,
      hasAudio: Boolean(card.audioUrl),
    })),
  );

  return (
    <section className="parent-panel" aria-label="Gestion Audio">
      <div className="parent-panel-head">
        <h3>2. Gestion Audio (bulk)</h3>
        <div className="parent-list-actions">
          <TokenButton variant="secondary" className="wm-btn-compact">Record all</TokenButton>
          <TokenButton variant="secondary" className="wm-btn-compact">Importer lot</TokenButton>
        </div>
      </div>
      <p className="parent-panel-subtitle">
        Enregistrer ou remplacer les modeles audio pour plusieurs cartes d un coup.
      </p>

      <div className="parent-audio-table" role="table" aria-label="Bulk audio cards">
        <div className="parent-audio-row parent-audio-head" role="row">
          <span role="columnheader">Lecon</span>
          <span role="columnheader">Carte</span>
          <span role="columnheader">Audio modele</span>
          <span role="columnheader">Actions</span>
        </div>
        {rows.length ? (
          rows.slice(0, 12).map((row) => (
            <div className="parent-audio-row" role="row" key={`${row.lessonId}-${row.cardId}`}>
              <span role="cell">{row.lessonTitle}</span>
              <span role="cell">{row.hanzi} ({row.cardId})</span>
              <span role="cell" className={row.hasAudio ? 'status-ok' : 'status-missing'}>
                {row.hasAudio ? 'Present' : 'Manquant'}
              </span>
              <span role="cell" className="parent-list-actions">
                <TokenButton variant="ghost" className="wm-btn-compact">Record</TokenButton>
                <TokenButton variant="secondary" className="wm-btn-compact">Replace</TokenButton>
              </span>
            </div>
          ))
        ) : (
          <p className="parent-empty">Aucune carte disponible pour la gestion audio.</p>
        )}
      </div>
    </section>
  );
}

function ProgressSection({ progress = [] }) {
  return (
    <section className="parent-panel" aria-label="Progres Enfant">
      <div className="parent-panel-head">
        <h3>3. Progres Enfant</h3>
        <TokenButton variant="secondary">Exporter rapport</TokenButton>
      </div>
      <p className="parent-panel-subtitle">Vue rapide de l avancement par enfant et par module.</p>

      <div className="parent-grid">
        {progress.map((item) => (
          <article key={item.id} className="parent-stat-card">
            <strong>{item.label}</strong>
            <p>{item.value}%</p>
            <div className="parent-progress-track" aria-hidden="true">
              <span style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FamilySection({ profiles = [] }) {
  return (
    <section className="parent-panel" aria-label="Contenu famille">
      <div className="parent-panel-head">
        <h3>4. Contenu famille</h3>
        <TokenButton variant="secondary">Ajouter profil</TokenButton>
      </div>
      <p className="parent-panel-subtitle">Associer les lecons et droits selon le role Parent ou Kid.</p>

      <div className="parent-list">
        {profiles.map((profile) => (
          <article key={profile.id} className="parent-list-item">
            <div>
              <strong>{profile.name}</strong>
              <p>Role: {profile.role === 'parent' ? 'Parent' : 'Kid'}</p>
            </div>
            <div className="parent-list-actions">
              <TokenButton variant="ghost" className="wm-btn-compact">Avatar</TokenButton>
              <TokenButton variant="secondary" className="wm-btn-compact">Permissions</TokenButton>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsSection() {
  return (
    <section className="parent-panel" aria-label="Parametres">
      <div className="parent-panel-head">
        <h3>5. Parametres</h3>
      </div>
      <p className="parent-panel-subtitle">Reglages globaux, sauvegarde et securite de l app.</p>

      <div className="parent-settings-list">
        <label className="parent-toggle">
          <span>Mode securise parent</span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="parent-toggle">
          <span>Audio auto dans les fiches</span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="parent-toggle">
          <span>Sauvegarde locale avancee</span>
          <input type="checkbox" defaultChecked />
        </label>
      </div>

      <div className="parent-danger-zone">
        <h4>Zone sensible</h4>
        <TokenButton className="parent-danger-btn">Reinitialiser donnees</TokenButton>
      </div>
    </section>
  );
}

export default function ParentModeDashboard({
  lessons = [],
  profiles = [],
  onBack,
  onSave,
}) {
  const [activeSection, setActiveSection] = useState(SECTION_IDS.LESSONS);
  const parentProfile = profiles.find((profile) => profile.role === 'parent') || profiles[0] || null;

  const progressMock = useMemo(
    () => [
      { id: 'flashcards', label: 'Flashcards', value: 78 },
      { id: 'audio', label: 'Audio', value: 61 },
      { id: 'writing', label: 'Ecriture', value: 44 },
    ],
    [],
  );

  const sectionTitle = {
    [SECTION_IDS.LESSONS]: 'Gestion Lecons',
    [SECTION_IDS.AUDIO]: 'Gestion Audio',
    [SECTION_IDS.PROGRESS]: 'Progres Enfant',
    [SECTION_IDS.FAMILY]: 'Contenu famille',
    [SECTION_IDS.SETTINGS]: 'Parametres',
  }[activeSection];

  return (
    <div className="parent-mode-dashboard" data-mode-tone="neutral">
      <LayoutShell
        headerLeft={(
          <button type="button" className="home-hanzi-btn ui-pressable" onClick={onBack} aria-label="Retour">
            文
          </button>
        )}
        headerTitle="Espace Parent"
        headerSubtitle={`Section active: ${sectionTitle}`}
        headerRight={(
          <div className="parent-top-right">
            {parentProfile ? (
              <AvatarRenderer
                config={parentProfile.avatar}
                size={40}
                alt={`Avatar ${parentProfile.name || 'Maman'}`}
                className="parent-top-avatar"
              />
            ) : null}
            <span className="parent-header-chip">{parentProfile?.name || 'Maman'}</span>
          </div>
        )}
        actionLeft={<TokenButton variant="secondary" onClick={onBack}>Accueil</TokenButton>}
        actionCenter={<span className="parent-action-text">Gestion familiale WiseMama</span>}
        actionRight={<TokenButton onClick={onSave}>Sauvegarder</TokenButton>}
      >
        <div className="parent-layout-grid">
          <SectionNav activeSection={activeSection} onChange={setActiveSection} />

          <div className="parent-layout-content">
            {activeSection === SECTION_IDS.LESSONS ? <LessonsSection lessons={lessons} /> : null}
            {activeSection === SECTION_IDS.AUDIO ? <AudioBulkSection lessons={lessons} /> : null}
            {activeSection === SECTION_IDS.PROGRESS ? <ProgressSection progress={progressMock} /> : null}
            {activeSection === SECTION_IDS.FAMILY ? <FamilySection profiles={profiles} /> : null}
            {activeSection === SECTION_IDS.SETTINGS ? <SettingsSection /> : null}
          </div>
        </div>
      </LayoutShell>
    </div>
  );
}
