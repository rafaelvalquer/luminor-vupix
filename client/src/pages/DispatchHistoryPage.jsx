import { useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { Input, Textarea } from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import Badge from "../components/ui/Badge.jsx";
import Table from "../components/ui/Table.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Modal from "../components/ui/Modal.jsx";
import { extractApiError } from "../app/api.js";
import { listCustomers } from "../services/customers.service.js";
import { listDispatches, retryDispatch } from "../services/dispatches.service.js";
import { formatDateTime } from "../utils/date.js";
import { dispatchTypeMap, getDispatchStatusMeta } from "../utils/status.js";

export default function DispatchHistoryPage() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    customerId: "",
    dateFrom: "",
    dateTo: "",
    dispatchType: "",
  });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [selected, setSelected] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const [dispatchItems, customerItems] = await Promise.all([
        listDispatches(filters),
        listCustomers(),
      ]);
      setItems(dispatchItems);
      setCustomers(customerItems);
      setFeedback("");
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao carregar histórico."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { key: "when", label: "Criado em" },
      { key: "customer", label: "Cliente" },
      { key: "type", label: "Tipo" },
      { key: "status", label: "Status" },
      { key: "message", label: "Mensagem" },
      { key: "actions", label: "Ações" },
    ],
    []
  );

  async function handleRetry(item) {
    const confirmed = window.confirm("Reenviar esta mensagem com falha?");
    if (!confirmed) return;

    try {
      await retryDispatch(item._id);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao reenviar mensagem."));
    }
  }

  return (
    <div className="page-stack">
      <Card>
        <CardHeader
          title="Histórico completo de mensagens"
          subtitle="Filtre por status, cliente, período ou tipo de disparo."
        />
        <CardBody>
          <div className="filters-grid">
            <Select label="Status" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">Todos</option>
              <option value="queued">queued</option>
              <option value="processing">processing</option>
              <option value="sent">sent</option>
              <option value="failed">failed</option>
              <option value="cancelled">cancelled</option>
            </Select>

            <Select label="Cliente" value={filters.customerId} onChange={(event) => setFilters((prev) => ({ ...prev, customerId: event.target.value }))}>
              <option value="">Todos</option>
              {customers.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </Select>

            <Select label="Tipo" value={filters.dispatchType} onChange={(event) => setFilters((prev) => ({ ...prev, dispatchType: event.target.value }))}>
              <option value="">Todos</option>
              <option value="manual">manual</option>
              <option value="automatic">automatic</option>
              <option value="retry">retry</option>
            </Select>

            <Input label="Data inicial" type="date" value={filters.dateFrom} onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))} />
            <Input label="Data final" type="date" value={filters.dateTo} onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))} />

            <div className="filters-row__actions">
              <Button variant="ghost" onClick={load} loading={loading}>Aplicar filtros</Button>
            </div>
          </div>

          {feedback ? <div className="alert alert--danger">{feedback}</div> : null}

          <Table
            columns={columns}
            data={items}
            empty={<EmptyState title="Nenhum dispatch encontrado" description="Ajuste seus filtros ou aguarde novos envios." />}
            renderRow={(item) => {
              const statusMeta = getDispatchStatusMeta(item.status);
              return (
                <tr key={item._id}>
                  <td><div className="table-strong">{formatDateTime(item.createdAt)}</div><div className="table-muted">Tentativas: {item.attemptsCount || 0}</div></td>
                  <td><div className="table-strong">{item.customerId?.name || "Cliente"}</div><div className="table-muted">{item.phone}</div></td>
                  <td>{dispatchTypeMap[item.dispatchType] || item.dispatchType}</td>
                  <td><Badge tone={statusMeta.tone}>{statusMeta.label}</Badge></td>
                  <td><div className="clamp-2">{item.renderedMessage}</div></td>
                  <td>
                    <div className="table-actions">
                      <button className="action-link" onClick={() => setSelected(item)}>Ver detalhe</button>
                      {item.status === "failed" ? <button className="action-link" onClick={() => handleRetry(item)}>Reenviar</button> : null}
                    </div>
                  </td>
                </tr>
              );
            }}
          />
        </CardBody>
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Detalhe do dispatch" subtitle="Payload final, resposta do gateway e erro técnico." width="860px">
        {selected ? (
          <div className="form-grid">
            <div className="grid-two">
              <div className="info-inline"><strong>Cliente:</strong> {selected.customerId?.name || "Cliente"}</div>
              <div className="info-inline"><strong>Status:</strong> {selected.status}</div>
            </div>

            <div className="grid-two">
              <div className="info-inline"><strong>Tipo:</strong> {dispatchTypeMap[selected.dispatchType] || selected.dispatchType}</div>
              <div className="info-inline"><strong>Provider ID:</strong> {selected.providerMessageId || "—"}</div>
            </div>

            <Textarea label="Mensagem renderizada" value={selected.renderedMessage || ""} readOnly rows={8} />
            <Textarea label="Erro" value={selected.error ? JSON.stringify(selected.error, null, 2) : "Sem erro"} readOnly rows={6} />
            <Textarea label="Resposta do gateway" value={selected.gatewayResponse ? JSON.stringify(selected.gatewayResponse, null, 2) : "Sem payload"} readOnly rows={8} />

            {selected.status === "failed" ? (
              <div className="alert alert--warning">
                <AlertCircle size={16} />
                Esta mensagem falhou e pode ser reenviada pelo botão de retry.
              </div>
            ) : null}

            <div className="modal__footer">
              {selected.status === "failed" ? (
                <Button icon={RefreshCcw} onClick={() => handleRetry(selected)}>Reenviar falha</Button>
              ) : <span />}
              <Button variant="ghost" onClick={() => setSelected(null)}>Fechar</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
