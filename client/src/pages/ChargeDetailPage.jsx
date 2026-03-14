import { useEffect, useState } from "react";
import { ArrowLeft, Ban, CheckCircle2, Send } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Table from "../components/ui/Table.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ManualDispatchModal from "../components/dispatch/ManualDispatchModal.jsx";
import { extractApiError } from "../app/api.js";
import { cancelCharge, getCharge, markChargePaid } from "../services/charges.service.js";
import { listDispatches } from "../services/dispatches.service.js";
import { listTemplates } from "../services/templates.service.js";
import { formatBRLFromCents } from "../utils/currency.js";
import { formatDate, formatDateTime } from "../utils/date.js";
import { dispatchTypeMap, getChargeStatusMeta, getDispatchStatusMeta } from "../utils/status.js";

export default function ChargeDetailPage() {
  const { id } = useParams();
  const [charge, setCharge] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [dispatchOpen, setDispatchOpen] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [chargeItem, dispatchItems, templateItems] = await Promise.all([
        getCharge(id),
        listDispatches({ chargeId: id }),
        listTemplates(),
      ]);
      setCharge(chargeItem);
      setDispatches(dispatchItems);
      setTemplates(templateItems);
      setFeedback("");
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao carregar detalhes da cobrança."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleMarkPaid() {
    if (!charge?._id) return;
    if (!window.confirm("Marcar esta cobrança como paga?")) return;
    try {
      await markChargePaid(charge._id);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao marcar cobrança como paga."));
    }
  }

  async function handleCancel() {
    if (!charge?._id) return;
    if (!window.confirm("Cancelar esta cobrança?")) return;
    try {
      await cancelCharge(charge._id);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao cancelar cobrança."));
    }
  }

  const chargeStatus = getChargeStatusMeta(charge?.status);

  return (
    <div className="page-stack">
      <div className="page-inline-actions">
        <Link className="text-link" to="/charges">
          <ArrowLeft size={16} />
          Voltar para cobranças
        </Link>
      </div>

      {feedback ? <div className="alert alert--danger">{feedback}</div> : null}

      <div className="grid-two-equal">
        <Card>
          <CardHeader
            title={charge?.description || "Detalhe da cobrança"}
            subtitle={loading ? "Carregando..." : `${charge?.customerId?.name || "Cliente"} · ${charge?.customerId?.phone || ""}`}
            action={<Badge tone={chargeStatus.tone}>{chargeStatus.label}</Badge>}
          />
          <CardBody>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-item__label">Valor</span><strong>{formatBRLFromCents(charge?.amountCents)}</strong></div>
              <div className="detail-item"><span className="detail-item__label">Vencimento</span><strong>{formatDate(charge?.dueDate)}</strong></div>
              <div className="detail-item"><span className="detail-item__label">Último envio</span><strong>{formatDateTime(charge?.lastReminderAt)}</strong></div>
              <div className="detail-item"><span className="detail-item__label">Próximo envio</span><strong>{formatDateTime(charge?.nextReminderAt)}</strong></div>
              <div className="detail-item"><span className="detail-item__label">Lembretes enviados</span><strong>{charge?.remindersSentCount || 0}</strong></div>
              <div className="detail-item"><span className="detail-item__label">Automação</span><strong>{charge?.autoReminderEnabled ? "Ativa" : "Desabilitada"}</strong></div>
            </div>

            {charge?.notes ? <div className="info-inline">{charge.notes}</div> : null}

            <div className="actions-row">
              <Button icon={Send} onClick={() => setDispatchOpen(true)}>Disparo manual</Button>
              <Button variant="secondary" icon={CheckCircle2} onClick={handleMarkPaid}>Marcar como paga</Button>
              <Button variant="ghost" icon={Ban} onClick={handleCancel}>Cancelar cobrança</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Dados do cliente" subtitle="Informações da pessoa vinculada à cobrança." />
          <CardBody>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-item__label">Nome</span><strong>{charge?.customerId?.name || "—"}</strong></div>
              <div className="detail-item"><span className="detail-item__label">Telefone</span><strong>{charge?.customerId?.phone || "—"}</strong></div>
              <div className="detail-item"><span className="detail-item__label">E-mail</span><strong>{charge?.customerId?.email || "—"}</strong></div>
              <div className="detail-item"><span className="detail-item__label">Observações</span><strong>{charge?.customerId?.notes || "—"}</strong></div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Histórico desta cobrança" subtitle="Todos os dispatches vinculados, incluindo status e erros." />
        <CardBody>
          <Table
            columns={[
              { key: "when", label: "Quando" },
              { key: "type", label: "Tipo" },
              { key: "status", label: "Status" },
              { key: "template", label: "Template" },
              { key: "provider", label: "Provider ID" },
            ]}
            data={dispatches}
            empty={<EmptyState title="Sem histórico ainda" description="Os envios desta cobrança aparecerão aqui." />}
            renderRow={(item) => {
              const statusMeta = getDispatchStatusMeta(item.status);
              return (
                <tr key={item._id}>
                  <td><div className="table-strong">{formatDateTime(item.createdAt)}</div><div className="table-muted">{item.phone}</div></td>
                  <td>{dispatchTypeMap[item.dispatchType] || item.dispatchType}</td>
                  <td><Badge tone={statusMeta.tone}>{statusMeta.label}</Badge></td>
                  <td>{item.templateUsed?.name || "Mensagem customizada"}</td>
                  <td><div className="table-strong">{item.providerMessageId || "—"}</div><div className="table-muted">{item.error?.message || "Sem erro"}</div></td>
                </tr>
              );
            }}
          />
        </CardBody>
      </Card>

      <ManualDispatchModal
        open={dispatchOpen}
        onClose={() => setDispatchOpen(false)}
        charge={charge}
        templates={templates}
        onSuccess={load}
      />
    </div>
  );
}
