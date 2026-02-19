export default function SuccessBurst({ trigger = 0, className = '' }) {
  if (!trigger) return null;

  return (
    <div className={`success-burst ${className}`.trim()} aria-hidden="true" key={trigger}>
      {Array.from({ length: 10 }).map((_, index) => (
        <span
          key={index}
          className="success-burst-dot"
          style={{ '--i': index }}
        />
      ))}
    </div>
  );
}
