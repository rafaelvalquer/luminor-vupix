export function Card({ children, className = "" }) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={`card__header ${className}`.trim()}>
      <div>
        <h3 className="card__title">{title}</h3>
        {subtitle ? <p className="card__subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="card__action">{action}</div> : null}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`card__body ${className}`.trim()}>{children}</div>;
}

export default Card;
