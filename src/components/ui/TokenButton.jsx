export default function TokenButton({
  variant = 'primary',
  children,
  className = '',
  ...props
}) {
  const variantClass =
    variant === 'secondary'
      ? 'wm-btn wm-btn-secondary'
      : variant === 'ghost'
        ? 'wm-btn wm-btn-ghost'
        : 'wm-btn wm-btn-primary';

  return (
    <button type="button" className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

