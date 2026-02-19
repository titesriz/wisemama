import tokens from './design-core.json';

export function TokenButton({ variant = 'primary', children, ...props }) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  return (
    <button
      {...props}
      style={{
        background: isPrimary ? 'var(--wm-color-primary)' : isSecondary ? '#fff' : 'transparent',
        color: isPrimary ? '#fff' : isSecondary ? 'var(--wm-color-text-main)' : 'var(--wm-color-text-soft)',
        border: isSecondary ? '2px solid var(--wm-color-accent)' : 'none',
        borderRadius: 'var(--wm-radius-md)',
        boxShadow: isPrimary ? 'var(--wm-shadow-button-primary)' : 'var(--wm-shadow-button)',
        transition: `all var(--wm-motion-fast) var(--wm-ease-standard)`
      }}
      title={`primary token=${tokens.color.primary}`}
    >
      {children}
    </button>
  );
}

export function TokenCard({ title, children }) {
  return (
    <article
      style={{
        background: 'var(--wm-color-surface)',
        borderRadius: 'var(--wm-radius-lg)',
        boxShadow: 'var(--wm-shadow-card)',
        padding: 24,
      }}
    >
      <h3>{title}</h3>
      {children}
    </article>
  );
}

export function TokenInput(props) {
  return (
    <input
      {...props}
      style={{
        border: '1px solid var(--wm-color-border)',
        borderRadius: 'var(--wm-radius-sm)',
        padding: '10px 12px',
      }}
    />
  );
}
