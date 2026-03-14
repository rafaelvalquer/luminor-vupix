import { useEffect, useState } from "react";
import { QrCode, RefreshCcw, RotateCcw, ShieldCheck, Smartphone } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import { extractApiError } from "../app/api.js";
import { getWhatsAppStatus, restartWhatsApp } from "../services/integrations.service.js";
import { formatDateTime } from "../utils/date.js";

export default function IntegrationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function load() {
    try {
      setLoading(true);
      const result = await getWhatsAppStatus();
      setData(result);
      setFeedback("");
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao consultar integração."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 20000);
    return () => clearInterval(timer);
  }, []);

  async function handleRestart() {
    try {
      setRestarting(true);
      const result = await restartWhatsApp();
      setFeedback(`Restart solicitado: ${result.status || "RESTARTING"}`);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao reiniciar integração."));
    } finally {
      setRestarting(false);
    }
  }

  const status = data?.status;
  const health = data?.health;
  const isReady = Boolean(status?.ready);

  return (
    <div className="page-stack">
      <Card>
        <CardHeader
          title="Gateway WhatsApp"
          subtitle="Visão técnica da conexão, QR, sessão e últimas ocorrências."
          action={
            <div className="actions-row">
              <Button variant="ghost" icon={RefreshCcw} onClick={load} loading={loading}>Atualizar</Button>
              <Button icon={RotateCcw} onClick={handleRestart} loading={restarting}>Restart</Button>
            </div>
          }
        />
        <CardBody>
          {feedback ? <div className="alert alert--info">{feedback}</div> : null}

          <div className="status-hero">
            <div className="status-hero__icon"><Smartphone size={26} /></div>
            <div>
              <div className="status-hero__title">Status atual do gateway</div>
              <div className="status-hero__meta">{status?.status || "—"} · Health {health?.ready ? "ready" : "not ready"}</div>
            </div>
            <Badge tone={isReady ? "success" : "danger"}>{isReady ? "READY" : status?.status || "OFFLINE"}</Badge>
          </div>

          <div className="grid-two-equal">
            <Card className="nested-card">
              <CardHeader title="Conectividade" />
              <CardBody>
                <div className="detail-grid">
                  <div className="detail-item"><span className="detail-item__label">Health</span><strong>{health?.service || "wa-gateway"}</strong></div>
                  <div className="detail-item"><span className="detail-item__label">Ready</span><strong>{String(status?.ready ?? false)}</strong></div>
                  <div className="detail-item"><span className="detail-item__label">Número conectado</span><strong>{status?.connectedNumber || "—"}</strong></div>
                  <div className="detail-item"><span className="detail-item__label">Nome conectado</span><strong>{status?.connectedName || "—"}</strong></div>
                  <div className="detail-item"><span className="detail-item__label">Tentativa de reconexão</span><strong>{status?.reconnectAttempt ?? 0}</strong></div>
                  <div className="detail-item"><span className="detail-item__label">Uptime</span><strong>{health?.uptimeSeconds ?? 0}s</strong></div>
                </div>
              </CardBody>
            </Card>

            <Card className="nested-card">
              <CardHeader title="QR e sessão" action={<QrCode size={18} />} />
              <CardBody>
                <div className="detail-grid">
                  <div className="detail-item"><span className="detail-item__label">QR disponível</span><strong>{String(status?.qrAvailable ?? false)}</strong></div>
                  <div className="detail-item"><span className="detail-item__label">Último QR</span><strong>{formatDateTime(status?.qrUpdatedAt)}</strong></div>
                  <div className="detail-item"><span className="detail-item__label">Restart count</span><strong>{status?.restartCount ?? 0}</strong></div>
                  <div className="detail-item"><span className="detail-item__label">Último restart</span><strong>{formatDateTime(status?.lastRestartAt)}</strong></div>
                </div>

                {data?.qrUrl ? (
                  <a className="btn btn--secondary btn--md" href={data.qrUrl} target="_blank" rel="noreferrer">
                    <ShieldCheck size={16} />
                    <span>Abrir QR do gateway</span>
                  </a>
                ) : (
                  <div className="info-inline">O backend não retornou URL de QR no momento.</div>
                )}
              </CardBody>
            </Card>
          </div>

          <Card className="nested-card">
            <CardHeader title="Último erro técnico" />
            <CardBody>
              <pre className="code-block">{status?.lastError ? JSON.stringify(status.lastError, null, 2) : "Sem erro técnico recente."}</pre>
            </CardBody>
          </Card>
        </CardBody>
      </Card>
    </div>
  );
}
