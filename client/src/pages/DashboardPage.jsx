import { useEffect, useState } from "react";
import { Activity, RefreshCcw, Send } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import KPIGrid from "../components/dashboard/KPIGrid.jsx";
import ReminderList from "../components/dashboard/ReminderList.jsx";
import RecentDispatchList from "../components/dashboard/RecentDispatchList.jsx";
import { getDashboardSummary } from "../services/dashboard.service.js";
import { runRemindersNow } from "../services/reminders.service.js";
import { extractApiError } from "../app/api.js";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function load() {
    try {
      setLoading(true);
      const result = await getDashboardSummary();
      setData(result);
      setFeedback("");
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao carregar dashboard."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRunNow() {
    try {
      setRunning(true);
      const result = await runRemindersNow();
      setFeedback(
        `Job executado: ${result.sent} enviados, ${result.failed} falharam, ${result.skipped} ignorados.`
      );
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao executar lembretes."));
    } finally {
      setRunning(false);
    }
  }

  const gatewayReady = Boolean(data?.gateway?.status?.ready);

  return (
    <div className="page-stack">
      <div className="hero-banner">
        <div>
          <div className="eyebrow">Visão operacional em tempo real</div>
          <h2>Central de cobrança, histórico e gateway em um único fluxo.</h2>
          <p>
            Acompanhe o que vence, o que falhou e execute novos ciclos sem sair do dashboard.
          </p>
        </div>
        <div className="hero-banner__actions">
          <Button variant="ghost" icon={RefreshCcw} onClick={load} loading={loading}>
            Atualizar
          </Button>
          <Button icon={Send} onClick={handleRunNow} loading={running}>
            Rodar lembretes agora
          </Button>
        </div>
      </div>

      {feedback ? <div className="alert alert--info">{feedback}</div> : null}

      <KPIGrid kpis={data?.kpis} />

      <div className="grid-two-equal">
        <Card>
          <CardHeader
            title="Saúde do gateway"
            subtitle="Conectividade e disponibilidade do WhatsApp."
            action={
              <Badge tone={gatewayReady ? "success" : "danger"}>
                {gatewayReady ? "Online" : "Offline"}
              </Badge>
            }
          />
          <CardBody>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-item__label">Status</span>
                <strong>{data?.gateway?.status?.status || "—"}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Número conectado</span>
                <strong>{data?.gateway?.status?.connectedNumber || "—"}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Último QR</span>
                <strong>{data?.gateway?.status?.qrUpdatedAt || "—"}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Último erro</span>
                <strong>{data?.gateway?.status?.lastError?.message || "Sem erro recente"}</strong>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Resumo rápido"
            subtitle="Pontos de atenção da operação atual."
          />
          <CardBody>
            <div className="stack-list">
              <div className="list-row">
                <div className="list-row__icon">
                  <Activity size={18} />
                </div>
                <div className="list-row__content">
                  <div className="list-row__title">Cobranças pendentes e vencidas</div>
                  <div className="list-row__meta">
                    {(data?.kpis?.pendingCharges || 0) + (data?.kpis?.overdueCharges || 0)} exigem acompanhamento
                  </div>
                </div>
              </div>

              <div className="list-row">
                <div className="list-row__icon">
                  <Activity size={18} />
                </div>
                <div className="list-row__content">
                  <div className="list-row__title">Mensagens com falha hoje</div>
                  <div className="list-row__meta">
                    {data?.kpis?.messagesFailedToday || 0} falhas já podem ser reprocessadas
                  </div>
                </div>
              </div>

              <div className="list-row">
                <div className="list-row__icon">
                  <Activity size={18} />
                </div>
                <div className="list-row__content">
                  <div className="list-row__title">Base de clientes</div>
                  <div className="list-row__meta">
                    {data?.kpis?.customersCount || 0} clientes cadastrados na plataforma
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid-two-equal">
        <ReminderList items={data?.upcomingReminders || []} />
        <RecentDispatchList items={data?.recentDispatches || []} />
      </div>
    </div>
  );
}
