import { Card, CardBody } from "./Card.jsx";
import Badge from "./Badge.jsx";

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  tone = "neutral",
}) {
  return (
    <Card className="stat-card">
      <CardBody className="stat-card__body">
        <div className="stat-card__header">
          <div>
            <div className="stat-card__title">{title}</div>
            <div className="stat-card__value">{value}</div>
          </div>
          <div className="stat-card__icon">
            {Icon ? <Icon size={20} /> : null}
          </div>
        </div>
        <Badge tone={tone}>{description}</Badge>
      </CardBody>
    </Card>
  );
}
