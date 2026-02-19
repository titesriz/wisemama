import { useMemo, useState } from 'react';
import AvatarRenderer from './AvatarRenderer.jsx';
import TokenButton from './ui/TokenButton.jsx';
import '../styles/emotional-duo.css';

const REACTIONS = {
  idle: { child: '🙂', parent: '🙂', label: 'Pretes pour apprendre' },
  listen: { child: '👂', parent: '👏', label: 'Super ecoute' },
  speak: { child: '🗣️', parent: '💬', label: 'Parle clairement' },
  write: { child: '✍️', parent: '👀', label: 'Trace doucement' },
  success: { child: '🤩', parent: '🥳', label: 'Excellent duo' },
  retry: { child: '💪', parent: '❤️', label: 'Encore un essai' },
};

const ENCOURAGEMENTS = [
  'Bravo, on avance ensemble.',
  'Ton effort est incroyable.',
  'On essaie encore, tu peux le faire.',
  'Chaque trait compte, continue.',
  'Je suis fiere de toi.',
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function ProgressRing({ value = 0, label }) {
  const pct = clamp(Math.round(value), 0, 100);
  const degrees = Math.round((pct / 100) * 360);

  return (
    <div className="duo-ring" aria-label={`${label}: ${pct}%`}>
      <div className="duo-ring-track" style={{ '--duo-progress': `${degrees}deg` }}>
        <div className="duo-ring-center">
          <strong>{pct}%</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

function AvatarReactionCard({ title, profile, emoji, mood }) {
  return (
    <article className={`duo-avatar-card mood-${mood}`}>
      <div className="duo-avatar-header">
        <span>{title}</span>
        <small>{emoji}</small>
      </div>
      <AvatarRenderer
        config={profile?.avatar}
        size={96}
        alt={`Avatar ${profile?.name || title}`}
        className="duo-avatar-render"
      />
      <strong>{profile?.name || title}</strong>
    </article>
  );
}

export default function EmotionalDuoSystem({
  childProfile,
  parentProfile,
  lessonProgress = 0,
  weeklyStreak = 0,
  parentMessages = ENCOURAGEMENTS,
  onAction,
}) {
  const [reactionKey, setReactionKey] = useState('idle');
  const [streak, setStreak] = useState(weeklyStreak);
  const [messageIndex, setMessageIndex] = useState(0);

  const reaction = REACTIONS[reactionKey] || REACTIONS.idle;
  const activeMessage = useMemo(() => {
    const list = parentMessages.length ? parentMessages : ENCOURAGEMENTS;
    return list[messageIndex % list.length];
  }, [messageIndex, parentMessages]);

  const trigger = (type) => {
    setReactionKey(type);
    if (type === 'success') {
      setStreak((prev) => prev + 1);
    }
    if (type === 'retry') {
      setStreak((prev) => Math.max(0, prev - 1));
    }
    setMessageIndex((prev) => prev + 1);
    onAction?.(type);
  };

  return (
    <section className="duo-emotion-shell wm-enter-fade" aria-label="Systeme emotionnel duo">
      <header className="duo-head">
        <h3>Duo Enfant + Parent</h3>
        <span className="duo-chip">{reaction.label}</span>
      </header>

      <div className="duo-stage">
        <AvatarReactionCard
          title="Enfant"
          profile={childProfile}
          emoji={reaction.child}
          mood={reactionKey}
        />
        <div className="duo-bridge">
          <span className="duo-heart" aria-hidden="true">💖</span>
          <p className="duo-message">{activeMessage}</p>
          <span className="duo-streak">Serie: {streak} jours</span>
        </div>
        <AvatarReactionCard
          title="Parent"
          profile={parentProfile}
          emoji={reaction.parent}
          mood={reactionKey}
        />
      </div>

      <div className="duo-metrics">
        <ProgressRing value={lessonProgress} label="Lecon" />
        <ProgressRing value={clamp(streak * 10, 0, 100)} label="Serie" />
      </div>

      <div className="duo-actions" role="group" aria-label="Actions duo">
        <TokenButton variant="secondary" className="ui-pressable" onClick={() => trigger('listen')}>
          Ecoute
        </TokenButton>
        <TokenButton variant="secondary" className="ui-pressable" onClick={() => trigger('speak')}>
          Parle
        </TokenButton>
        <TokenButton variant="secondary" className="ui-pressable" onClick={() => trigger('write')}>
          Ecris
        </TokenButton>
        <TokenButton className="ui-pressable" onClick={() => trigger('success')}>
          Reussite
        </TokenButton>
        <TokenButton variant="ghost" className="ui-pressable" onClick={() => trigger('retry')}>
          Encourager
        </TokenButton>
      </div>
    </section>
  );
}
