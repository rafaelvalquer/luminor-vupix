export default function FriendlyEmptyState({
  title,
  description,
  action,
  emoji = "\u2728",
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{emoji}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
