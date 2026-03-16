export default function PageHero({
  eyebrow,
  title,
  description,
  actions = null,
  badge = "",
  emoji = "",
  aside = null,
  className = "",
}) {
  return (
    <section className={`page-hero ${className}`.trim()}>
      <div className="page-hero__main">
        {eyebrow ? <div className="page-hero__eyebrow">{eyebrow}</div> : null}
        <div className="page-hero__headline">
          {emoji ? <span className="page-hero__emoji">{emoji}</span> : null}
          <h2>{title}</h2>
        </div>
        <p>{description}</p>

        <div className="page-hero__footer">
          {badge ? <span className="page-hero__badge">{badge}</span> : null}
          {actions ? <div className="page-hero__actions">{actions}</div> : null}
        </div>
      </div>

      {aside ? <div className="page-hero__aside">{aside}</div> : null}
    </section>
  );
}
