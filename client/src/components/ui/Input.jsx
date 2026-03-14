export function Input({
  label,
  hint,
  error,
  className = "",
  ...props
}) {
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field__label">{label}</span> : null}
      <input className="field__control" {...props} />
      {hint ? <span className="field__hint">{hint}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}

export function Textarea({
  label,
  hint,
  error,
  className = "",
  rows = 5,
  ...props
}) {
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field__label">{label}</span> : null}
      <textarea className="field__control field__control--textarea" rows={rows} {...props} />
      {hint ? <span className="field__hint">{hint}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}
