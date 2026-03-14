import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../ui/Card.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Badge from "../ui/Badge.jsx";
import { formatDateTime } from "../../utils/date.js";
import { getDispatchStatusMeta } from "../../utils/status.js";

export default function RecentDispatchList({ items = [] }) {
  return (
    <Card>
      <CardHeader
        title="Últimas mensagens"
        subtitle="Últimos disparos registrados na operação."
        action={<Link className="text-link" to="/dispatches">Ver histórico</Link>}
      />
      <CardBody>
        {!items.length ? (
          <EmptyState
            title="Sem mensagens ainda"
            description="Os envios aparecerão aqui assim que a operação começar."
          />
        ) : (
          <div className="stack-list">
            {items.map((item) => {
              const statusMeta = getDispatchStatusMeta(item.status);
              return (
                <div key={item._id} className="list-row">
                  <div className="list-row__content">
                    <div className="list-row__title">
                      {item.customerId?.name || "Cliente"} · {item.templateUsed?.name || "Mensagem"}
                    </div>
                    <div className="list-row__meta">
                      {formatDateTime(item.createdAt)} · {item.phone}
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
