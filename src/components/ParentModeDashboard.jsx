import { useMemo, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import LayoutShell from './LayoutShell.jsx';
import LessonEditorBeta from './LessonEditorBeta.jsx';
import OcrLessonBuilder from './OcrLessonBuilder.jsx';
import SuccessBurst from './SuccessBurst.jsx';
import TokenButton from './ui/TokenButton.jsx';
import AvatarEditor from './AvatarEditor.jsx';
import { buildWiseMamaLocalExportPayload, downloadJsonFile } from '../lib/localDataExport.js';
import '../styles/parent-mode.css';

const MODULE_IDS = {
  DASHBOARD: 'dashboard',
  LESSONS: 'lessons',
  LESSONS_CREATOR: 'lessons-creator',
  AUDIO: 'audio',
  PROGRESS: 'progress',
  FAMILY: 'family',
  SETTINGS: 'settings',
};

const MODULE_LABELS = {
  [MODULE_IDS.LESSONS]: 'Lecons',
  [MODULE_IDS.LESSONS_CREATOR]: 'Lesson Creator Pro',
  [MODULE_IDS.AUDIO]: 'Gestion Audio',
  [MODULE_IDS.PROGRESS]: 'Progres Enfant',
  [MODULE_IDS.FAMILY]: 'Contenu Famille',
  [MODULE_IDS.SETTINGS]: 'Parametres',
};

function LessonsModule({
  lessons = [],
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  onDuplicateLesson,
  onOpenFullEditor,
}) {
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('success');
  const [statusTick, setStatusTick] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [showOcrBuilder, setShowOcrBuilder] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [templateLessonId, setTemplateLessonId] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');
  const [removingId, setRemovingId] = useState('');

  const parseCardsFromJson = (raw) => {
    const text = String(raw || '').trim();
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.cards)) return parsed.cards;
    if (Array.isArray(parsed?.data?.lessons) && parsed.data.lessons[0]?.cards) return parsed.data.lessons[0].cards;
    if (Array.isArray(parsed?.lessons) && parsed.lessons[0]?.cards) return parsed.lessons[0].cards;
    throw new Error('invalid_json');
  };

  const openCreate = () => {
    setEditingId('');
    setTitle('');
    setDescription('');
    setFormError('');
    setTemplateLessonId('');
    setJsonText('');
    setShowEditor(true);
  };

  const openEdit = (lesson) => {
    setEditingId(lesson.id);
    setTitle(lesson.title || '');
    setDescription(lesson.description || '');
    setFormError('');
    setTemplateLessonId('');
    setJsonText('');
    setShowEditor(true);
  };

  const applyStatus = (message, type = 'success') => {
    setStatus(message);
    setStatusType(type);
    setStatusTick((prev) => prev + 1);
  };

  const createOrUpdate = () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    let importedCards = null;

    if (!cleanTitle) {
      setFormError('Le titre est obligatoire.');
      applyStatus('Erreur: titre obligatoire.', 'error');
      return;
    }
    setFormError('');

    try {
      importedCards = parseCardsFromJson(jsonText);
    } catch {
      applyStatus('JSON invalide. Utilise un tableau de cartes ou un objet lesson.', 'error');
      return;
    }

    if (editingId) {
      const lesson = lessons.find((item) => item.id === editingId);
      if (!lesson) return;
      const patch = { title: cleanTitle, description: cleanDescription };
      if (importedCards) patch.cards = importedCards;
      onUpdateLesson?.(editingId, patch);
      setShowEditor(false);
      applyStatus('Lecon mise a jour.', 'success');
      return;
    }

    const template = lessons.find((item) => item.id === templateLessonId);
    const sourceCards = importedCards || template?.cards || [
      {
        id: `card-${Date.now()}-0`,
        hanzi: '',
        pinyin: '',
        french: '',
        english: '',
        imageUrl: null,
        audioUrl: null,
      },
    ];
    onCreateLesson?.({
      title: cleanTitle,
      description: cleanDescription,
      cards: sourceCards,
    });
    setShowEditor(false);
    applyStatus('Lecon creee.', 'success');
  };

  const duplicate = (lessonId) => {
    onDuplicateLesson?.(lessonId);
    applyStatus('Lecon dupliquee.', 'success');
  };

  const openFullEditor = (lesson) => {
    const firstCardId = lesson?.cards?.[0]?.id || '';
    onOpenFullEditor?.(lesson?.id, firstCardId);
  };

  const requestDelete = (lessonId) => {
    setConfirmDeleteId(lessonId);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    setRemovingId(confirmDeleteId);
    window.setTimeout(() => {
      onDeleteLesson?.(confirmDeleteId);
      setRemovingId('');
      setConfirmDeleteId('');
      applyStatus('Lecon supprimee.', 'success');
    }, 220);
  };

  const formatEdited = (iso) => {
    if (!iso) return 'Jamais';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Jamais';
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="parent-panel" aria-label="Gestion Lecons">
      <div className="parent-panel-head">
        <h3>Gestion Lecons</h3>
        <div className="parent-list-actions">
          <TokenButton variant="secondary" className="ui-pressable" onClick={() => setShowOcrBuilder(true)}>
            OCR {'->'} Lecon
          </TokenButton>
          <TokenButton variant="secondary" className="ui-pressable" onClick={openCreate}>
            + Nouvelle Lecon
          </TokenButton>
        </div>
      </div>
      <p className="parent-panel-subtitle">Creer, editer, importer et organiser les cartes.</p>

      {status ? (
        <p
          className={
            statusType === 'error'
              ? 'error-line'
              : 'ok-line wm-ok-line wm-success-pulse'
          }
        >
          {status}
          {statusType === 'success' ? <SuccessBurst trigger={statusTick} /> : null}
        </p>
      ) : null}

      <div className="parent-lesson-list">
        {lessons.length ? (
          lessons.map((lesson) => (
            <article
              key={lesson.id}
              className={`parent-list-item lesson-row ${removingId === lesson.id ? 'is-removing' : ''}`}
            >
              <div className="lesson-main">
                <strong>{lesson.title}</strong>
                <p>{lesson.cards?.length || 0} fiches · Modifie: {formatEdited(lesson.updatedAt)}</p>
                {lesson.description ? <small>{lesson.description}</small> : null}
              </div>
              <div className="parent-list-actions">
                <TokenButton variant="secondary" className="wm-btn-compact ui-pressable" onClick={() => openFullEditor(lesson)}>
                  Editeur complet
                </TokenButton>
                <TokenButton variant="secondary" className="wm-btn-compact ui-pressable" onClick={() => openEdit(lesson)}>
                  Editer
                </TokenButton>
                <TokenButton variant="ghost" className="wm-btn-compact ui-pressable" onClick={() => duplicate(lesson.id)}>
                  Dupliquer
                </TokenButton>
                <TokenButton className="wm-btn-compact parent-danger-btn ui-pressable" onClick={() => requestDelete(lesson.id)}>
                  Supprimer
                </TokenButton>
              </div>
            </article>
          ))
        ) : (
          <p className="parent-empty">Aucune lecon disponible.</p>
        )}
      </div>

      {showOcrBuilder ? (
        <div className="parent-modal-overlay" role="dialog" aria-modal="true" aria-label="OCR vers lecon">
          <div className="parent-modal-card parent-modal-wide">
            <OcrLessonBuilder
              lessons={lessons}
              onCreateLesson={onCreateLesson}
              onUpdateLesson={onUpdateLesson}
              onClose={() => setShowOcrBuilder(false)}
              onSuccess={() => applyStatus('Generation terminee.', 'success')}
            />
          </div>
        </div>
      ) : null}

      {showEditor ? (
        <div className="parent-modal-overlay" role="dialog" aria-modal="true" aria-label="Editeur lecon">
          <div className="parent-modal-card">
            <div className="parent-panel-head">
              <h3>{editingId ? 'Editer Lecon' : 'Nouvelle Lecon'}</h3>
              <TokenButton variant="ghost" className="ui-pressable" onClick={() => setShowEditor(false)}>
                Annuler
              </TokenButton>
            </div>

            <label className="lesson-field">
              <span>Titre</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Lecon 5" />
            </label>
            {formError ? <p className="error-line">{formError}</p> : null}
            <label className="lesson-field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description courte de la lecon"
              />
            </label>

            {!editingId ? (
              <label className="lesson-field">
                <span>Template (optionnel)</span>
                <select value={templateLessonId} onChange={(e) => setTemplateLessonId(e.target.value)}>
                  <option value="">Aucun template</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="lesson-field">
              <span>Import JSON (optionnel)</span>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='[{"hanzi":"你","pinyin":"ni3","french":"tu","english":"you"}]'
              />
            </label>

            <div className="parent-list-actions">
              <TokenButton variant="secondary" className="ui-pressable" onClick={() => setShowEditor(false)}>
                Cancel
              </TokenButton>
              <TokenButton className="ui-pressable" onClick={createOrUpdate}>
                Save
              </TokenButton>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDeleteId ? (
        <div className="parent-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirmer suppression">
          <div className="parent-modal-card">
            <h3>Supprimer cette lecon ?</h3>
            <p className="parent-panel-subtitle">Cette action est irreversible.</p>
            <div className="parent-list-actions">
              <TokenButton variant="secondary" className="ui-pressable" onClick={() => setConfirmDeleteId('')}>
                Annuler
              </TokenButton>
              <TokenButton className="parent-danger-btn ui-pressable" onClick={confirmDelete}>
                Confirmer
              </TokenButton>
            </div>
          </div>
        </div>
      ) : null}
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

function SettingsModule({
  profiles = [],
  onResetFtueAndTutorial,
  onRestartTutorial,
  onResetAllData,
}) {
  return (
    <section className="parent-panel" aria-label="Parametres">
      <div className="parent-panel-head">
        <h3>Parametres</h3>
      </div>
      <p className="parent-panel-subtitle">Configuration app, securite, sauvegarde et maintenance.</p>

      <div className="parent-list">
        {profiles.map((profile) => (
          <article key={profile.id} className="parent-list-item">
            <div>
              <strong>{profile.name}</strong>
              <p>Role: {profile.role === 'parent' ? 'Parent' : 'Kid'}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="parent-settings-avatar">
        <h4>Profils et avatars</h4>
        <AvatarEditor />
      </section>

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
        <div className="parent-list-actions">
          <TokenButton variant="secondary" onClick={onResetFtueAndTutorial}>Reset FTUE + Tutoriel</TokenButton>
          <TokenButton variant="secondary" onClick={onRestartTutorial}>Relancer tutoriel</TokenButton>
          <TokenButton className="parent-danger-btn" onClick={onResetAllData}>Reinitialiser donnees</TokenButton>
        </div>
      </div>
    </section>
  );
}

function DashboardHub({ onOpenModule }) {
  const cards = [
    { id: MODULE_IDS.LESSONS, title: 'Lecons', subtitle: 'Creer et editer le contenu', badge: '5 packs' },
    { id: MODULE_IDS.LESSONS_CREATOR, title: 'Lesson Creator Pro', subtitle: 'Texte source et generation cartes', badge: 'Pro' },
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

export default function ParentModeDashboard({
  lessons = [],
  profiles = [],
  onBack,
  onSave,
  onSelectLesson,
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  onDuplicateLesson,
  onResetFtueAndTutorial,
  onRestartTutorial,
  onResetAllData,
}) {
  const [activeModule, setActiveModule] = useState(MODULE_IDS.DASHBOARD);
  const [editorContext, setEditorContext] = useState({ lessonId: '', cardId: '' });
  const [exportStatus, setExportStatus] = useState('');
  const [exportTick, setExportTick] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const parentProfile = useMemo(
    () => profiles.find((profile) => profile.role === 'parent') || profiles[0] || null,
    [profiles],
  );

  const subtitle = activeModule === MODULE_IDS.DASHBOARD
    ? 'Tableau de bord'
    : `Section active: ${MODULE_LABELS[activeModule]}`;

  const exportAllLocalData = async () => {
    setIsExporting(true);
    setExportStatus('');
    try {
      const payload = await buildWiseMamaLocalExportPayload();
      const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-');
      downloadJsonFile(payload, `wisemama-local-export-${stamp}.json`);
      setExportStatus('Export local termine.');
      setExportTick((prev) => prev + 1);
    } catch {
      setExportStatus('Export local impossible.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderModule = () => {
    if (activeModule === MODULE_IDS.DASHBOARD) {
      return <DashboardHub onOpenModule={setActiveModule} />;
    }
    if (activeModule === MODULE_IDS.LESSONS) {
      return (
        <LessonsModule
          lessons={lessons}
          onCreateLesson={onCreateLesson}
          onUpdateLesson={onUpdateLesson}
          onDeleteLesson={onDeleteLesson}
          onDuplicateLesson={onDuplicateLesson}
          onOpenFullEditor={(lessonId, cardId) => {
            setEditorContext({ lessonId, cardId });
            setActiveModule(MODULE_IDS.LESSONS_CREATOR);
          }}
        />
      );
    }
    if (activeModule === MODULE_IDS.LESSONS_CREATOR) {
      return (
        <section className="parent-panel" aria-label="Lesson Creator Pro">
          <div className="parent-panel-head">
            <h3>Lesson Creator Pro</h3>
            <TokenButton variant="secondary" className="ui-pressable" onClick={() => setActiveModule(MODULE_IDS.LESSONS)}>
              Retour CRUD
            </TokenButton>
          </div>
          <p className="parent-panel-subtitle">Edition texte source, generation cartes, enrichissement et correction.</p>
          <LessonEditorBeta
            onSelectLesson={(lessonId) => {
              setEditorContext((prev) => ({ ...prev, lessonId }));
              onSelectLesson?.(lessonId);
            }}
          />
        </section>
      );
    }
    if (activeModule === MODULE_IDS.AUDIO) return <AudioModule lessons={lessons} />;
    if (activeModule === MODULE_IDS.PROGRESS) return <ProgressModule />;
    if (activeModule === MODULE_IDS.FAMILY) return <FamilyModule profiles={profiles} />;
    return (
      <SettingsModule
        profiles={profiles}
        onResetFtueAndTutorial={onResetFtueAndTutorial}
        onRestartTutorial={onRestartTutorial}
        onResetAllData={onResetAllData}
      />
    );
  };

  return (
    <div className="parent-mode-dashboard" data-mode-tone="neutral">
      <LayoutShell
        headerLeft={
          activeModule === MODULE_IDS.DASHBOARD ? (
            <button type="button" className="home-hanzi-btn ui-pressable" onClick={onBack} aria-label="Retour Landing">
              文
            </button>
          ) : activeModule === MODULE_IDS.LESSONS_CREATOR ? (
            <TokenButton variant="ghost" onClick={() => setActiveModule(MODULE_IDS.LESSONS)}>Back to Lecons</TokenButton>
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
        actionCenter={(
          exportStatus ? (
            <span className="parent-action-text wm-ok-line">
              {exportStatus}
              {exportStatus.includes('termine') ? <SuccessBurst trigger={exportTick} /> : null}
            </span>
          ) : (
            <span className="parent-action-text">Gestion familiale WiseMama</span>
          )
        )}
        actionRight={(
          <div className="parent-list-actions">
            <TokenButton variant="secondary" onClick={exportAllLocalData} disabled={isExporting}>
              {isExporting ? 'Export...' : 'Exporter donnees locales'}
            </TokenButton>
            <TokenButton onClick={onSave}>Sauvegarder</TokenButton>
          </div>
        )}
      >
        <div className="parent-layout-grid">
          <div className="parent-layout-content">{renderModule()}</div>
        </div>
      </LayoutShell>
    </div>
  );
}
