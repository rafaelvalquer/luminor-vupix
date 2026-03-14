export default function Select({ label, children, className = "", ...props }) {
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field__label">{label}</span> : null}
      <select className="field__control" {...props}>
        {children}
      </select>
    </label>
  );
}
