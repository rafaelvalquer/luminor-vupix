import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Pencil, Plus, Search, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { Input, Textarea } from "../components/ui/Input.jsx";
import Modal from "../components/ui/Modal.jsx";
import Select from "../components/ui/Select.jsx";
import Badge from "../components/ui/Badge.jsx";
import Table from "../components/ui/Table.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ManualDispatchModal from "../components/dispatch/ManualDispatchModal.jsx";
import { extractApiError } from "../app/api.js";
import {
  createCharge,
  listCharges,
  markChargePaid,
  updateCharge,
} from "../services/charges.service.js";
import { listCustomers } from "../services/customers.service.js";
import { listTemplates } from "../services/templates.service.js";
import { formatBRLFromCents, parseMoneyToCents } from "../utils/currency.js";
import { formatDate, toDateInputValue } from "../utils/date.js";
import { getChargeStatusMeta } from "../utils/status.js";

const initialForm = {
  customerId: "",
  description: "",
  amount: "",
  dueDate: "",
  notes: "",
  autoReminderEnabled: true,
};

export default function ChargesPage() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dispatchCharge, setDispatchCharge] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [chargeItems, customerItems, templateItems] = await Promise.all([
        listCharges({ search, status }),
        listCustomers(),
        listTemplates(),
      ]);
      setItems(chargeItems);
      setCustomers(customerItems);
      setTemplates(templateItems);
      setFeedback("");
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao carregar cobranças."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { key: "charge", label: "Cobrança" },
      { key: "amount", label: "Valor" },
      { key: "dueDate", label: "Vencimento" },
      { key: "status", label: "Status" },
      { key: "nextReminderAt", label: "Próximo lembrete" },
      { key: "actions", label: "Ações" },
    ],
    []
  );

  function openCreate() {
    setEditing(null);
    setForm(initialForm);
    setOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      customerId: item.customerId?._id || item.customerId || "",
      description: item.description || "",
      amount: ((item.amountCents || 0) / 100).toFixed(2).replace(".", ","),
      dueDate: toDateInputValue(item.dueDate),
      notes: item.notes || "",
      autoReminderEnabled: item.autoReminderEnabled !== false,
    });
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = {
        customerId: form.customerId,
        description: form.description,
        amountCents: parseMoneyToCents(form.amount),
        dueDate: form.dueDate,
        notes: form.notes,
        autoReminderEnabled: form.autoReminderEnabled,
      };

      if (editing?._id) {
        await updateCharge(editing._id, payload);
      } else {
        await createCharge(payload);
      }

      setOpen(false);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao salvar cobrança."));
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(item) {
    const confirmed = window.confirm(`Marcar a cobrança "${item.description}" como paga?`);
    if (!confirmed) return;

    try {
      await markChargePaid(item._id);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao marcar cobrança como paga."));
    }
  }

  return (
    <div className="page-stack">
      <Card>
        <CardHeader
          title="Cobranças"
          subtitle="Gerencie vencimentos, lembretes e ações operacionais."
          action={
            <Button icon={Plus} onClick={openCreate}>
              Nova cobrança
            </Button>
          }
        />
        <CardBody>
          <div className="filters-row">
            <Input
              label="Busca"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cliente, descrição ou observação"
            />
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="due_today">Vence hoje</option>
              <option value="overdue">Vencida</option>
              <option value="paid">Paga</option>
              <option value="cancelled">Cancelada</option>
            </Select>
            <div className="filters-row__actions">
              <Button variant="ghost" icon={Search} onClick={load} loading={loading}>
                Filtrar
              </Button>
            </div>
          </div>

          {feedback ? <div className="alert alert--danger">{feedback}</div> : null}

          <Table
            columns={columns}
            data={items}
            empty={
              <EmptyState
                title="Nenhuma cobrança encontrada"
                description="Crie uma cobrança ou ajuste seus filtros."
              />
            }
            renderRow={(item) => {
              const statusMeta = getChargeStatusMeta(item.status);
              return (
                <tr key={item._id}>
                  <td>
                    <div className="table-strong">{item.description}</div>
                    <div className="table-muted">
                      {item.customerId?.name || "Cliente"} · {item.notes || "Sem observações"}
                    </div>
                  </td>
                  <td>{formatBRLFromCents(item.amountCents)}</td>
                  <td>{formatDate(item.dueDate)}</td>
                  <td>
                    <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  </td>
                  <td>{formatDate(item.nextReminderAt)}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="action-icon" to={`/charges/${item._id}`}>
                        <Eye size={16} />
                      </Link>
                      <button className="action-icon" onClick={() => openEdit(item)}>
                        <Pencil size={16} />
                      </button>
                      <button className="action-icon" onClick={() => setDispatchCharge(item)}>
                        <Send size={16} />
                      </button>
                      <button className="action-icon action-icon--success" onClick={() => handleMarkPaid(item)}>
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }}
          />
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar cobrança" : "Nova cobrança"}
        subtitle="Crie a cobrança base para lembretes automáticos e disparos manuais."
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <Select
            label="Cliente"
            value={form.customerId}
            onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
            required
          >
            <option value="">Selecione...</option>
            {customers.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>

          <Input
            label="Descrição"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            required
          />

          <div className="grid-two">
            <Input
              label="Valor"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              placeholder="150,00"
              required
            />
            <Input
              label="Vencimento"
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              required
            />
          </div>

          <Textarea
            label="Observações"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />

          <Select
            label="Lembrete automático"
            value={String(form.autoReminderEnabled)}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                autoReminderEnabled: event.target.value === "true",
              }))
            }
          >
            <option value="true">Habilitado</option>
            <option value="false">Desabilitado</option>
          </Select>

          <div className="modal__footer">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Salvar cobrança
            </Button>
          </div>
        </form>
      </Modal>

      <ManualDispatchModal
        open={Boolean(dispatchCharge)}
        onClose={() => setDispatchCharge(null)}
        charge={dispatchCharge}
        templates={templates}
        onSuccess={load}
      />
    </div>
  );
}
