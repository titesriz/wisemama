import { useMemo, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import LayoutShell from './LayoutShell.jsx';
import TokenButton from './ui/TokenButton.jsx';
import '../styles/parent-mode.css';

const MODULE_IDS = {
  DASHBOARD: 'dashboard',
  LESSONS: 'lessons',
  AUDIO: 'audio',
  PROGRESS: 'progress',
  FAMILY: 'family',
  SETTINGS: 'settings',
};

const MODULE_LABELS = {
  [MODULE_IDS.LESSONS]: 'Lecons',
  [MODULE_IDS.AUDIO]: 'Gestion Audio',
  [MODULE_IDS.PROGRESS]: 'Progres Enfant',
  [MODULE_IDS.FAMILY]: 'Contenu Famille',
  [MODULE_IDS.SETTINGS]: 'Parametres',
};

function LessonsModule({ lessons = [] }) {
  return (
    <section className="parent-panel" aria-label="Gestion Lecons">
      <div className="parent-panel-head">
        <h3>Gestion Lecons</h3>
        <TokenButton variant="secondary">Nouvelle lecon</TokenButton>
      </div>
      <p className="parent-panel-subtitle">Creer, editer, importer et organiser les cartes.</p>

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

function AudioModule({ lessons = [] }) {
  const rows = lessons.flatMap((lesson) =>
    (lesson.cards || []).map((card) => ({
      id: `${lesson.id}-${card.id}`,
      lessonTitle: lesson.title,
      cardId: card.id,
      hanzi: card.hanzi,
      hasAudio: Boolean(card.audioUrl),
    })),
  );

  return (
    <section className="parent-panel" aria-label="Gestion Audio">
      <div className="parent-panel-head">
        <h3>Gestion Audio</h3>
        <div className="parent-list-actions">
          <TokenButton variant="secondary" className="wm-btn-compact">Record all</TokenButton>
          <TokenButton variant="secondary" className="wm-btn-compact">Import lot</TokenButton>
        </div>
      </div>
      <p className="parent-panel-subtitle">Enregistrement bulk des modeles parent pour toutes les cartes.</p>

      <div className="parent-audio-table" role="table" aria-label="Table bulk audio">
        <div className="parent-audio-row parent-audio-head" role="row">
          <span role="columnheader">Lecon</span>
          <span role="columnheader">Carte</span>
          <span role="columnheader">Audio</span>
          <span role="columnheader">Actions</span>
        </div>
        {rows.length ? (
          rows.slice(0, 20).map((row) => (
            <div className="parent-audio-row" role="row" key={row.id}>
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

function ProgressModule() {
  const progress = [
    { id: 'flashcards', label: 'Flashcards', value: 78 },
    { id: 'audio', label: 'Audio', value: 61 },
    { id: 'writing', label: 'Ecriture', value: 44 },
  ];

  return (
    <section className="parent-panel" aria-label="Progres Enfant">
      <div className="parent-panel-head">
        <h3>Progres Enfant</h3>
        <TokenButton variant="secondary">Exporter rapport</TokenButton>
      </div>
      <p className="parent-panel-subtitle">Analyse des performances par module et tendance hebdomadaire.</p>

      <div className="parent-grid">
        {progress.map((item) => (
          <article key={item.id} className="parent-stat-card">
            <strong>{item.label}</strong>
            <p>{item.value}%</p>
            <div className="parent-progress-track" aria-hidden="true">
              <span style={{ width: `${item.value}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FamilyModule({ profiles = [] }) {
  return (
    <section className="parent-panel" aria-label="Contenu Famille">
      <div className="parent-panel-head">
        <h3>Contenu Famille</h3>
        <TokenButton variant="secondary">Ajouter profil</TokenButton>
      </div>
      <p className="parent-panel-subtitle">Bibliotheque partagee, attribution des contenus et role parent/enfant.</p>

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

function SettingsModule() {
  return (
    <section className="parent-panel" aria-label="Parametres">
      <div className="parent-panel-head">
        <h3>Parametres</h3>
      </div>
      <p className="parent-panel-subtitle">Configuration app, securite, sauvegarde et maintenance.</p>

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

function DashboardHub({ onOpenModule }) {
  const cards = [
    { id: MODULE_IDS.LESSONS, title: 'Lecons', subtitle: 'Creer et editer le contenu', badge: '5 packs' },
    { id: MODULE_IDS.AUDIO, title: 'Gestion Audio', subtitle: 'Enregistrement bulk des modeles', badge: 'Bulk' },
    { id: MODULE_IDS.PROGRESS, title: 'Progres Enfant', subtitle: 'Analytics et visualisation', badge: 'Live' },
    { id: MODULE_IDS.FAMILY, title: 'Contenu Famille', subtitle: 'Bibliotheque partagee', badge: 'Partage' },
    { id: MODULE_IDS.SETTINGS, title: 'Parametres', subtitle: 'Configuration de l app', badge: 'Config' },
  ];

  return (
    <section className="parent-panel" aria-label="Hub Parent">
      <div className="parent-panel-head">
        <h3>Modules Parent</h3>
      </div>
      <p className="parent-panel-subtitle">Choisis un module pour gerer l apprentissage de ta famille.</p>

      <div className="parent-hub-grid">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className="parent-hub-card ui-pressable"
            onClick={() => onOpenModule(card.id)}
          >
            <span className="parent-hub-badge">{card.badge}</span>
            <strong>{card.title}</strong>
            <p>{card.subtitle}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function ParentModeDashboard({ lessons = [], profiles = [], onBack, onSave }) {
  const [activeModule, setActiveModule] = useState(MODULE_IDS.DASHBOARD);
  const parentProfile = useMemo(
    () => profiles.find((profile) => profile.role === 'parent') || profiles[0] || null,
    [profiles],
  );

  const subtitle = activeModule === MODULE_IDS.DASHBOARD
    ? 'Tableau de bord'
    : `Section active: ${MODULE_LABELS[activeModule]}`;

  const renderModule = () => {
    if (activeModule === MODULE_IDS.DASHBOARD) {
      return <DashboardHub onOpenModule={setActiveModule} />;
    }
    if (activeModule === MODULE_IDS.LESSONS) return <LessonsModule lessons={lessons} />;
    if (activeModule === MODULE_IDS.AUDIO) return <AudioModule lessons={lessons} />;
    if (activeModule === MODULE_IDS.PROGRESS) return <ProgressModule />;
    if (activeModule === MODULE_IDS.FAMILY) return <FamilyModule profiles={profiles} />;
    return <SettingsModule />;
  };

  return (
    <div className="parent-mode-dashboard" data-mode-tone="neutral">
      <LayoutShell
        headerLeft={
          activeModule === MODULE_IDS.DASHBOARD ? (
            <button type="button" className="home-hanzi-btn ui-pressable" onClick={onBack} aria-label="Retour Landing">
              文
            </button>
          ) : (
            <TokenButton variant="ghost" onClick={() => setActiveModule(MODULE_IDS.DASHBOARD)}>Back to Dashboard</TokenButton>
          )
        }
        headerTitle="Espace Parent"
        headerSubtitle={subtitle}
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
          <div className="parent-layout-content">{renderModule()}</div>
        </div>
      </LayoutShell>
    </div>
  );
}
