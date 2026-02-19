export default function TokenCard({
  kind = 'neutral',
  className = '',
  children,
}) {
  const kindClass =
    kind === 'kid'
      ? 'token-card token-card-kid'
      : kind === 'parent'
        ? 'token-card token-card-parent'
        : 'token-card token-card-neutral';

  return <article className={`${kindClass} ${className}`.trim()}>{children}</article>;
}

