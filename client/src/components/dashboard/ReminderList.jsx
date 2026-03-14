import { Clock3 } from "lucide-react";
import { Card, CardBody, CardHeader } from "../ui/Card.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Badge from "../ui/Badge.jsx";
import { formatBRLFromCents } from "../../utils/currency.js";
import { formatDateTime } from "../../utils/date.js";
import { getChargeStatusMeta } from "../../utils/status.js";

export default function ReminderList({ items = [] }) {
  return (
    <Card>
      <CardHeader
        title="Próximos lembretes"
        subtitle="Cobranças com próximo envio calculado pelo backend."
      />
      <CardBody>
        {!items.length ? (
          <EmptyState
            title="Nenhum lembrete próximo"
            description="Quando houver cobranças elegíveis, elas aparecerão aqui."
          />
        ) : (
          <div className="stack-list">
            {items.map((item) => {
              const statusMeta = getChargeStatusMeta(item.status);
              return (
                <div key={item._id} className="list-row">
                  <div className="list-row__icon">
                    <Clock3 size={18} />
                  </div>
                  <div className="list-row__content">
                    <div className="list-row__title">
                      {item.customerId?.name || "Cliente"} — {item.description}
                    </div>
                    <div className="list-row__meta">
                      {formatBRLFromCents(item.amountCents)} · próximo envio em{" "}
                      {formatDateTime(item.nextReminderAt)}
                    </div>
                  </div>
                  <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
