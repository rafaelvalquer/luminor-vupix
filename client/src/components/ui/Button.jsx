export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`.trim()}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="spinner spinner--button" /> : Icon ? <Icon size={16} /> : null}
      <span>{children}</span>
    </button>
  );
}
