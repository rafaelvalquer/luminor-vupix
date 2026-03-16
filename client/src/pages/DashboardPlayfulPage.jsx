import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  RefreshCcw,
  Send,
  Users,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import PageHero from "../components/ui/PageHero.jsx";
import FriendlyEmptyState from "../components/ui/FriendlyEmptyState.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import { getDashboardSummary } from "../services/dashboard.service.js";
import { runRemindersNow } from "../services/reminders.service.js";
import { extractApiError } from "../app/api.js";
import { formatBRLFromCents } from "../utils/currency.js";
import { formatDateTime } from "../utils/date.js";
import { getChargeStatusMeta, getDispatchStatusMeta } from "../utils/status.js";

function buildKpiItems(kpis = {}) {
  return [
    {
      key: "pending",
      title: "Pendentes",
      value: kpis.pendingCharges ?? 0,
      icon: Clock3,
      description: "Ainda tem cobranca pedindo carinho",
      tone: "warning",
    },
    {
      key: "overdue",
      title: "Vencidas",
      value: kpis.overdueCharges ?? 0,
      icon: AlertTriangle,
      description: "Essas merecem prioridade",
      tone: "danger",
    },
    {
      key: "paid",
      title: "Pagas",
      value: kpis.paidCharges ?? 0,
      icon: CheckCircle2,
      description: "Dinheiro que ja sorriu de volta",
      tone: "success",
    },
    {
      key: "sent",
      title: "Mensagens hoje",
      value: kpis.messagesSentToday ?? 0,
      icon: MessageSquareText,
      description: "Conversas que ja decolaram",
      tone: "success",
    },
    {
      key: "failed",
      title: "Falhas hoje",
      value: kpis.messagesFailedToday ?? 0,
      icon: AlertTriangle,
      description: "Pedem revisao cuidadosa",
      tone: "danger",
    },
    {
      key: "customers",
      title: "Clientes",
      value: kpis.customersCount ?? 0,
      icon: Users,
      description: kpis.gatewayOnline ? "Gateway online e animado" : "Gateway offline no momento",
      tone: kpis.gatewayOnline ? "success" : "warning",
    },
  ];
}

export default function DashboardPlayfulPage() {
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
      setFeedback(extractApiError(error, "Nao foi possivel carregar o painel agora."));
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
        `Rodada feita: ${result.sent} enviados, ${result.failed} com falha e ${result.skipped} pulados.`
      );
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Nao foi possivel rodar os lembretes agora."));
    } finally {
      setRunning(false);
    }
  }

  const gatewayReady = Boolean(data?.gateway?.status?.ready);
  const kpiItems = useMemo(() => buildKpiItems(data?.kpis), [data?.kpis]);

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="ritmo da cobranca"
        emoji={"\u{1F31F}"}
        title="Tudo o que importa na cobranca aparece aqui, sem cara de planilha cinza."
        description="Veja o que vence, o que falhou e o que ja foi resolvido num painel colorido, amigavel e facil de navegar no dia a dia."
        badge={gatewayReady ? "Gateway online e pronto" : "Gateway pedindo atencao"}
        actions={
          <>
            <Button variant="ghost" icon={RefreshCcw} onClick={load} loading={loading}>
              Atualizar o clima
            </Button>
            <Button icon={Send} onClick={handleRunNow} loading={running}>
              Rodar lembretes agora
            </Button>
          </>
        }
        aside={
          <div className="hero-aside-card">
            <strong>{"\u{1F973}"} radar rapido</strong>
            <p>
              {gatewayReady
                ? "Gateway conectado, pronto para mandar recados simpaticos."
                : "Gateway offline. Vale conferir o QR e o status tecnico."}
            </p>
            <div className="hero-aside-card__row">
              <span>ultimas falhas</span>
              <strong>{data?.kpis?.messagesFailedToday ?? 0}</strong>
            </div>
            <div className="hero-aside-card__row">
              <span>cobrancas em foco</span>
              <strong>
                {(data?.kpis?.pendingCharges || 0) + (data?.kpis?.overdueCharges || 0)}
              </strong>
            </div>
          </div>
        }
      />

      {feedback ? <div className="alert alert--info">{feedback}</div> : null}

      <div className="stats-grid">
        {kpiItems.map((item) => (
          <StatCard key={item.key} {...item} />
        ))}
      </div>

      <div className="grid-two-equal">
        <Card>
          <CardHeader
            title="Radar do gateway"
            subtitle="Tecnico o bastante para agir rapido, leve o bastante para nao cansar."
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
                <strong>{data?.gateway?.status?.status || "-"}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Numero conectado</span>
                <strong>{data?.gateway?.status?.connectedNumber || "-"}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Ultimo QR</span>
                <strong>{data?.gateway?.status?.qrUpdatedAt || "-"}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Ultimo erro</span>
                <strong>{data?.gateway?.status?.lastError?.message || "Sem erro recente"}</strong>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Resumo do clima"
            subtitle="Um resumo rapido para saber onde vale colocar energia primeiro."
          />
          <CardBody>
            <div className="stack-list">
              <div className="list-row">
                <div className="list-row__icon">
                  <Activity size={18} />
                </div>
                <div className="list-row__content">
                  <div className="list-row__title">Pendentes e vencidas na fila</div>
                  <div className="list-row__meta">
                    {(data?.kpis?.pendingCharges || 0) + (data?.kpis?.overdueCharges || 0)} itens
                    merecem acompanhamento agora.
                  </div>
                </div>
              </div>

              <div className="list-row">
                <div className="list-row__icon">
                  <Activity size={18} />
                </div>
                <div className="list-row__content">
                  <div className="list-row__title">Falhas de hoje</div>
                  <div className="list-row__meta">
                    {data?.kpis?.messagesFailedToday || 0} mensagens pedem revisao ou retry.
                  </div>
                </div>
              </div>

              <div className="list-row">
                <div className="list-row__icon">
                  <Activity size={18} />
                </div>
                <div className="list-row__content">
                  <div className="list-row__title">Base em movimento</div>
                  <div className="list-row__meta">
                    {data?.kpis?.customersCount || 0} clientes cadastrados na plataforma.
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid-two-equal">
        <Card>
          <CardHeader
            title="Proximos lembretes"
            subtitle="A agenda que o backend ja deixou mastigadinha."
          />
          <CardBody>
            {!data?.upcomingReminders?.length ? (
              <FriendlyEmptyState
                title="Nenhum lembrete na pista"
                description="Quando houver uma rodada pronta para acontecer, ela aparece aqui."
                emoji={"\u{1F30A}"}
              />
            ) : (
              <div className="stack-list">
                {data.upcomingReminders.map((item) => {
                  const statusMeta = getChargeStatusMeta(item.status);
                  return (
                    <div key={item._id} className="list-row">
                      <div className="list-row__icon">
                        <Clock3 size={18} />
                      </div>
                      <div className="list-row__content">
                        <div className="list-row__title">
                          {item.customerId?.name || "Cliente"} - {item.description}
                        </div>
                        <div className="list-row__meta">
                          {formatBRLFromCents(item.amountCents)} - proximo envio em{" "}
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

        <Card>
          <CardHeader
            title="Mensagens mais recentes"
            subtitle="O que acabou de acontecer na operacao."
          />
          <CardBody>
            {!data?.recentDispatches?.length ? (
              <FriendlyEmptyState
                title="Ainda nao rolou nenhum envio"
                description="Assim que a operacao ganhar movimento, o historico comeca a sorrir aqui."
                emoji={"\u{1F4EC}"}
              />
            ) : (
              <div className="stack-list">
                {data.recentDispatches.map((item) => {
                  const statusMeta = getDispatchStatusMeta(item.status);
                  return (
                    <div key={item._id} className="list-row">
                      <div className="list-row__content">
                        <div className="list-row__title">
                          {item.customerId?.name || "Cliente"} -{" "}
                          {item.templateUsed?.name || "Mensagem"}
                        </div>
                        <div className="list-row__meta">
                          {formatDateTime(item.createdAt)} - {item.phone}
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
      </div>
    </div>
  );
}
